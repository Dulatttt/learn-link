import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  Send,
  ArrowLeft,
  Users,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mockParticipants = [
  { id: 1, name: "Alice M.", isSelf: false },
  { id: 2, name: "Bob K.", isSelf: false },
  { id: 3, name: "You", isSelf: true },
  { id: 4, name: "Dana R.", isSelf: false },
];

const mockChat = [
  { id: 1, user: "System", text: "Alice M. joined the room", isSystem: true },
  { id: 2, user: "Alice M.", text: "Hey everyone, ready to start?", isSystem: false },
  { id: 3, user: "Bob K.", text: "Let's go! Chapter 5 today?", isSystem: false },
];

const mockWaiting = [{ id: 10, name: "Charlie W." }];

export default function RoomDetail() {
  const { id } = useParams();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState(mockChat);
  const [newMsg, setNewMsg] = useState("");
  const [waiting, setWaiting] = useState(mockWaiting);

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    setMessages([...messages, { id: Date.now(), user: "You", text: newMsg, isSystem: false }]);
    setNewMsg("");
  };

  const approveUser = (userId: number) => {
    const user = waiting.find((w) => w.id === userId);
    setWaiting(waiting.filter((w) => w.id !== userId));
    if (user) {
      setMessages([...messages, { id: Date.now(), user: "System", text: `${user.name} joined the room`, isSystem: true }]);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-foreground/[0.03]">
      {/* Top bar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Link to="/rooms" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-sm font-semibold text-foreground">Calculus Study Group</h1>
          <span className="flex items-center gap-1.5 text-xs font-medium text-live">
            <span className="h-2 w-2 rounded-full bg-live animate-pulse-live" />
            Live
          </span>
        </div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary lg:hidden"
        >
          Chat
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className="flex flex-1 flex-col">
          {/* Waiting room notification */}
          {waiting.length > 0 && (
            <div className="m-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <p className="mb-2 text-sm font-medium text-foreground">Waiting Room</p>
              {waiting.map((w) => (
                <div key={w.id} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{w.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveUser(w.id)}
                      className="rounded-md bg-success px-3 py-1 text-xs font-medium text-success-foreground hover:bg-success/90"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setWaiting(waiting.filter((x) => x.id !== w.id))}
                      className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid flex-1 grid-cols-2 gap-3 p-4">
            {mockParticipants.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "relative flex items-center justify-center rounded-xl bg-foreground/5 border border-border",
                  p.isSelf && "ring-2 ring-primary/40"
                )}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-semibold text-primary">{p.name[0]}</span>
                </div>
                <span className="absolute bottom-3 left-3 rounded-md bg-foreground/70 px-2 py-0.5 text-xs font-medium text-background">
                  {p.name}
                </span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 border-t border-border bg-card p-3">
            <button
              onClick={() => setMicOn(!micOn)}
              className={cn(
                "rounded-full p-3 transition-colors",
                micOn ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-destructive text-destructive-foreground"
              )}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setCamOn(!camOn)}
              className={cn(
                "rounded-full p-3 transition-colors",
                camOn ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-destructive text-destructive-foreground"
              )}
            >
              {camOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
            <button className="rounded-full bg-secondary p-3 text-foreground hover:bg-secondary/80">
              <Monitor className="h-5 w-5" />
            </button>
            <Link
              to="/rooms"
              className="rounded-full bg-destructive p-3 text-destructive-foreground hover:bg-destructive/90"
            >
              <PhoneOff className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div
          className={cn(
            "flex w-80 flex-col border-l border-border bg-card transition-all",
            chatOpen ? "translate-x-0" : "translate-x-full hidden"
          )}
        >
          <div className="flex h-12 items-center border-b border-border px-4">
            <span className="text-sm font-semibold text-foreground">Chat</span>
          </div>
          <div className="flex-1 space-y-3 overflow-auto p-4">
            {messages.map((m) => (
              <div key={m.id}>
                {m.isSystem ? (
                  <p className="text-center text-xs text-muted-foreground italic">{m.text}</p>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-foreground">{m.user}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{m.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={sendMessage}
                className="rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
