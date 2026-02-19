import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ArrowLeft, MessageSquare, Mic, MicOff, PhoneOff, Send, Users, Video as VideoIcon, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

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

  // --- ЛОГИКА СИГНАЛИНГА ---

  const createPeer = (targetUserId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(iceServers);

    // Добавляем наши треки (видео/аудио) в соединение
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Когда получаем трек от другого человека
    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        if (prev.find(p => p.id === targetUserId)) return prev;
        return [...prev, { id: targetUserId, stream: event.streams[0] }];
      });
    };

    // Когда находим сетевой путь (ICE)
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { target: targetUserId, from: myId, candidate: event.candidate }
        });
      }
    };

    return pc;
  };

  const handleSignal = async (payload: any, stream: MediaStream) => {
    const { from, offer, answer, candidate } = payload;

    if (offer) {
      const pc = createPeer(from, stream);
      peersRef.current[from] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const sdp = await pc.createAnswer();
      await pc.setLocalDescription(sdp);
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { target: from, from: myId, answer: sdp }
      });
    }

    if (answer) {
      const pc = peersRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }

    if (candidate) {
      const pc = peersRef.current[from];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  useEffect(() => {
    let streamRef: MediaStream;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const channel = supabase.channel(`room:${roomId}`, {
          config: { presence: { key: user.id } }
        });
        channelRef.current = channel;

        channel
          .on('presence', { event: 'join' }, ({ newPresences }) => {
            // Если кто-то зашел, инициируем звонок (создаем Offer)
            newPresences.forEach(async (p: any) => {
              if (p.user_id === user.id) return;
              const pc = createPeer(p.user_id, stream);
              peersRef.current[p.user_id] = pc;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { target: p.user_id, from: user.id, offer }
              });
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
          .on('broadcast', { event: 'signal' }, (payload) => handleSignal(payload.payload, stream))
          .on('broadcast', { event: 'chat' }, ({ payload }) => setMessages(prev => [...prev, payload]))
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await supabase.rpc('increment_participants', { room_id: roomId });
              await channel.track({ user_id: user.id });
            }
          });
      } catch (err) { console.error(err); }
    }
    init();

    return () => {
      supabase.rpc('decrement_participants', { room_id: roomId });
      streamRef?.getTracks().forEach(t => t.stop());
      channelRef.current?.unsubscribe();
      Object.values(peersRef.current).forEach(pc => pc.close());
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!newMsg.trim() || !channelRef.current) return;
    const msg = { user: "Ученик", text: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
    setMessages(prev => [...prev, msg]);
    setNewMsg("");
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f8f9fa] z-[9999] overflow-hidden">
      <div className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/rooms')} className="rounded-full bg-slate-100 p-2"><ArrowLeft size={20} /></button>
          <h1 className="text-sm font-black italic uppercase">Комната: {roomId?.slice(0,8)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase">
            <Users size={14} className="text-primary" /> {remoteStreams.length + 1} ONLINE
          </div>
          <button onClick={() => setChatOpen(!chatOpen)} className={cn("p-2 rounded-full", chatOpen ? "bg-primary/10 text-primary" : "bg-slate-100")}><MessageSquare size={20}/></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="relative flex flex-1 p-4 bg-slate-50 gap-4 overflow-auto">
          <div className={cn("grid h-full w-full gap-4", remoteStreams.length > 0 ? "grid-cols-2" : "grid-cols-1")}>
            {/* МОЁ ВИДЕО */}
            <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-slate-200 shadow-xl">
              <video ref={localVideoRef} autoPlay muted playsInline className={cn("h-full w-full object-cover", !camOn && "hidden")} />
              {!camOn && <div className="absolute inset-0 flex items-center justify-center"><VideoOff size={48} className="text-slate-400" /></div>}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">Вы</div>
            </div>

            {/* ВИДЕО ДРУГИХ УЧАСТНИКОВ */}
            {remoteStreams.map((remote) => (
              <div key={remote.id} className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-slate-200 shadow-xl">
                <video autoPlay playsInline ref={(el) => { if (el) el.srcObject = remote.stream; }} className="h-full w-full object-cover" />
                <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">Ученик</div>
              </div>
            ))}
          </div>

          {/* КНОПКИ УПРАВЛЕНИЯ */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-3xl bg-white/90 p-4 shadow-2xl backdrop-blur-md border border-white z-50">
            <button onClick={() => { localStream?.getAudioTracks().forEach(t => t.enabled = !micOn); setMicOn(!micOn); }} className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-all", micOn ? "bg-slate-100" : "bg-red-500 text-white")}><Mic size={20}/></button>
            <button onClick={() => { localStream?.getVideoTracks().forEach(t => t.enabled = !camOn); setCamOn(!camOn); }} className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-all", camOn ? "bg-slate-100" : "bg-red-500 text-white")}><VideoIcon size={20}/></button>
            <button onClick={() => navigate('/rooms')} className="flex h-12 px-6 items-center justify-center gap-2 rounded-2xl bg-red-600 text-white font-black uppercase text-xs tracking-widest"><PhoneOff size={18} /> Выйти</button>
          </div>
        </div>

        {chatOpen && (
          <div className="flex w-80 flex-col border-l bg-white shadow-xl shrink-0">
            <div className="p-4 border-b font-black text-[10px] uppercase tracking-widest bg-slate-50">Чат комнаты</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-primary uppercase">{m.user}</span>
                  <p className="rounded-2xl rounded-tl-none bg-slate-100 p-3 text-sm font-bold leading-tight">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2 bg-slate-100 rounded-xl p-2">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Написать..." className="flex-1 bg-transparent px-2 text-sm font-bold outline-none" />
                <button onClick={sendMessage} className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white"><Send size={14}/></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
