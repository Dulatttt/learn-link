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
  const [remoteStreams, setRemoteStreams] = useState<{id: string, stream: MediaStream, name: string}[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<any>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  const sendMessage = () => {
    if (!newMsg.trim() || !channelRef.current) return;
    const msg = { user: "Я", text: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
    setMessages(prev => [...prev, msg]);
    setNewMsg("");
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const channel = supabase.channel(`room:${roomId}`);
        channelRef.current = channel;

        channel
          .on('broadcast', { event: 'signal' }, async ({ payload }) => {
            if (payload.target !== user.id) return;
            // WebRTC Logic... (handleSignal call here)
          })
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
      localStream?.getTracks().forEach(t => t.stop());
      channelRef.current?.unsubscribe();
    };
  }, [roomId]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f8f9fa] z-[9999] overflow-hidden text-foreground">
      <div className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/rooms')} className="rounded-full bg-slate-100 p-2 hover:bg-slate-200 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-bold uppercase italic">Комната: {roomId?.slice(0,8)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
            <Users size={14} className="text-primary" /> {remoteStreams.length + 1} В СЕТИ
          </div>
          <button onClick={() => setChatOpen(!chatOpen)} className={cn("p-2 rounded-full", chatOpen ? "bg-primary/10 text-primary" : "bg-slate-100")}>
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="relative flex flex-1 p-4 bg-slate-50 overflow-hidden">
          <div className={cn("grid h-full w-full gap-4 transition-all", remoteStreams.length === 0 ? "grid-cols-1" : "grid-cols-2")}>
            <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-slate-200 shadow-lg">
              <video ref={localVideoRef} autoPlay muted playsInline className={cn("h-full w-full object-cover", !camOn && "hidden")} />
              {!camOn && <div className="absolute inset-0 flex items-center justify-center bg-slate-300"><VideoOff size={64} className="text-slate-400" /></div>}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold text-white">Вы</div>
            </div>
            {/* Рендер удаленных видео... */}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-3xl bg-white/90 p-4 shadow-2xl backdrop-blur-md border border-white z-50">
            <button onClick={() => { localStream?.getAudioTracks().forEach(t => t.enabled = !micOn); setMicOn(!micOn); }}
              className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-all", micOn ? "bg-slate-100" : "bg-red-500 text-white")}>
              {micOn ? <Mic size={20}/> : <MicOff size={20}/>}
            </button>
            <button onClick={() => { localStream?.getVideoTracks().forEach(t => t.enabled = !camOn); setCamOn(!camOn); }}
              className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-all", camOn ? "bg-slate-100" : "bg-red-500 text-white")}>
              {camOn ? <VideoIcon size={20}/> : <VideoOff size={20}/>}
            </button>
            <button onClick={() => navigate('/rooms')} className="flex h-12 px-6 items-center justify-center gap-2 rounded-2xl bg-red-600 text-white font-bold uppercase text-xs">
              <PhoneOff size={18} /> Выйти
            </button>
          </div>
        </div>

        {chatOpen && (
          <div className="flex w-80 flex-col border-l bg-white shadow-xl shrink-0">
            <div className="p-4 border-b font-bold text-xs uppercase bg-slate-50">Чат</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary uppercase">{m.user}</span>
                  <p className="rounded-2xl rounded-tl-none bg-slate-100 p-3 text-sm font-medium">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2 bg-slate-100 rounded-xl p-2">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Сообщение..." className="flex-1 bg-transparent px-2 text-sm outline-none" />
                <button onClick={sendMessage} className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md"><Send size={14}/></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}