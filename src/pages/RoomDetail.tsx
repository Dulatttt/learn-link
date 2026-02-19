import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ArrowLeft, MessageSquare, Mic, MicOff, PhoneOff, Send, Users, Video as VideoIcon, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Компонент для удаленного видео (чтобы поток не "отваливался")
function RemoteVideo({ stream, name }: { stream: MediaStream, name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-[2.5rem] border-4 border-white bg-slate-900 shadow-2xl">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
      <div className="absolute bottom-6 left-6 rounded-2xl bg-black/40 backdrop-blur-md px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest">
        {name}
      </div>
    </div>
  );
}

export default function RoomDetail() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [myId, setMyId] = useState<string>("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{id: string, stream: MediaStream}[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<any>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  // Функция создания Peer-to-Peer соединения
  const createPeer = (targetUserId: string, stream: MediaStream, currentUserId: string) => {
    console.log("Инициализация P2P для:", targetUserId);
    const pc = new RTCPeerConnection(iceServers);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        if (prev.find(p => p.id === targetUserId)) return prev;
        return [...prev, { id: targetUserId, stream: event.streams[0] }];
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { target: targetUserId, from: currentUserId, candidate: event.candidate }
        });
      }
    };

    return pc;
  };

  const handleSignal = async (payload: any, stream: MediaStream, currentUserId: string) => {
    const { from, target, offer, answer, candidate } = payload;
    if (target !== currentUserId) return; // Сигнал не для меня

    try {
      if (offer) {
        const pc = createPeer(from, stream, currentUserId);
        peersRef.current[from] = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const sdp = await pc.createAnswer();
        await pc.setLocalDescription(sdp);
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { target: from, from: currentUserId, answer: sdp }
        });
      } else if (answer) {
        const pc = peersRef.current[from];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } else if (candidate) {
        const pc = peersRef.current[from];
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) {
      console.error("WebRTC Error:", e);
    }
  };

  useEffect(() => {
    let sRef: MediaStream;
    let currentUserId: string;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      currentUserId = user.id;
      setMyId(user.id);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        sRef = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const channel = supabase.channel(`room:${roomId}`, {
          config: { presence: { key: user.id } }
        });
        channelRef.current = channel;

        channel
          .on('presence', { event: 'join' }, ({ newPresences }) => {
            newPresences.forEach(async (p: any) => {
              if (p.user_id !== currentUserId) {
                // Мы инициируем звонок новому участнику
                const pc = createPeer(p.user_id, stream, currentUserId);
                peersRef.current[p.user_id] = pc;
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({
                  type: 'broadcast',
                  event: 'signal',
                  payload: { target: p.user_id, from: currentUserId, offer }
                });
              }
            });
          })
          .on('presence', { event: 'leave' }, ({ leftPresences }) => {
            leftPresences.forEach((p: any) => {
              if (peersRef.current[p.user_id]) {
                peersRef.current[p.user_id].close();
                delete peersRef.current[p.user_id];
              }
              setRemoteStreams(prev => prev.filter(s => s.id !== p.user_id));
            });
          })
          .on('broadcast', { event: 'signal' }, ({ payload }) => handleSignal(payload, stream, currentUserId))
          .on('broadcast', { event: 'chat' }, ({ payload }) => {
             setMessages(prev => [...prev, payload]);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await supabase.rpc('increment_participants', { room_id: roomId });
              await channel.track({ user_id: user.id });
            }
          });
      } catch (err) {
        console.error("Media Error:", err);
      }
    }
    init();

    return () => {
      supabase.rpc('decrement_participants', { room_id: roomId });
      sRef?.getTracks().forEach(t => t.stop());
      channelRef.current?.unsubscribe();
      Object.values(peersRef.current).forEach(pc => pc?.close());
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!newMsg.trim() || !channelRef.current) return;
    const msg = { 
      user: "Ученик", 
      text: newMsg, 
      from: myId, // Добавили отправителя
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
    setMessages(prev => [...prev, msg]);
    setNewMsg("");
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 z-[9999] overflow-hidden text-slate-900">
      <div className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/rooms')} className="rounded-full bg-slate-100 p-2"><ArrowLeft size={20}/></button>
          <h1 className="text-sm font-black uppercase italic tracking-tighter">Комната: {roomId?.slice(0,8)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black">
            <Users size={14} className="text-primary" /> {remoteStreams.length + 1} ONLINE
          </div>
          <button onClick={() => setChatOpen(!chatOpen)} className={cn("p-2 rounded-full", chatOpen ? "bg-primary text-white" : "bg-slate-100")}>
            <MessageSquare size={20}/>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="relative flex-1 p-6 bg-slate-50 overflow-y-auto">
          <div className={cn("grid h-full w-full gap-6", remoteStreams.length === 0 ? "max-w-4xl mx-auto grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
            <div className="relative aspect-video overflow-hidden rounded-[2.5rem] border-4 border-white bg-slate-200 shadow-2xl">
              <video ref={localVideoRef} autoPlay muted playsInline className={cn("h-full w-full object-cover", !camOn && "hidden")} />
              {!camOn && <div className="absolute inset-0 flex items-center justify-center bg-slate-300"><VideoOff size={64} className="text-slate-400" /></div>}
              <div className="absolute bottom-6 left-6 rounded-2xl bg-black/40 backdrop-blur-md px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest">Вы</div>
            </div>

            {remoteStreams.map((remote) => (
              <RemoteVideo key={remote.id} stream={remote.stream} name="Студент" />
            ))}
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-[2rem] bg-white/90 p-4 shadow-2xl backdrop-blur-xl border border-white z-50">
            <button onClick={() => { localStream?.getAudioTracks().forEach(t => t.enabled = !micOn); setMicOn(!micOn); }}
              className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-all", micOn ? "bg-slate-100" : "bg-red-500 text-white")}>
              {micOn ? <Mic size={24}/> : <MicOff size={24}/>}
            </button>
            <button onClick={() => { localStream?.getVideoTracks().forEach(t => t.enabled = !camOn); setCamOn(!camOn); }}
              className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-all", camOn ? "bg-slate-100" : "bg-red-500 text-white")}>
              {camOn ? <VideoIcon size={24}/> : <VideoOff size={24}/>}
            </button>
            <button onClick={() => navigate('/rooms')} className="flex h-14 px-8 items-center justify-center gap-3 rounded-2xl bg-red-600 text-white font-black uppercase text-xs tracking-widest">
              <PhoneOff size={20} /> Выйти
            </button>
          </div>
        </div>

        {chatOpen && (
          <div className="flex w-96 flex-col border-l bg-white shadow-2xl shrink-0">
            <div className="p-6 border-b font-black text-[10px] uppercase tracking-widest text-slate-400">Чат</div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col gap-2", m.from === myId ? "items-end" : "items-start")}>
                  <span className="text-[10px] font-black text-primary uppercase">{m.from === myId ? "Вы" : m.user}</span>
                  <p className={cn("rounded-3xl px-4 py-3 text-sm font-bold shadow-sm max-w-[80%]", 
                    m.from === myId ? "bg-primary text-white rounded-tr-none" : "bg-slate-100 text-slate-700 rounded-tl-none")}>
                    {m.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-6 border-t bg-slate-50">
              <div className="flex gap-2 bg-white rounded-2xl p-2 border">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Написать..." className="flex-1 bg-transparent px-3 text-sm font-bold outline-none" />
                <button onClick={sendMessage} className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg"><Send size={18}/></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
