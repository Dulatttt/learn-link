import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ClipboardCheck, Trophy, Video, Users, ArrowRight } from "lucide-react";

const stats = [
  { label: "Tests Completed", value: "12", icon: ClipboardCheck, color: "text-primary" },
  { label: "Ranking", value: "#4", icon: Trophy, color: "text-warning" },
  { label: "Rooms Joined", value: "8", icon: Video, color: "text-info" },
  { label: "Forum Answers", value: "23", icon: Users, color: "text-success" },
];

const activeRooms = [
  { id: 1, title: "Calculus Study Group", topic: "Math", participants: 5, isLive: true },
  { id: 2, title: "Python Basics", topic: "IT", participants: 3, isLive: true },
  { id: 3, title: "Quantum Mechanics", topic: "Physics", participants: 2, isLive: false },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's your learning overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Rooms */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Active Rooms</h2>
            <Link to="/rooms" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className="group rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {room.topic}
                  </span>
                  {room.isLive && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-live">
                      <span className="h-2 w-2 rounded-full bg-live animate-pulse-live" />
                      Live
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {room.title}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {room.participants} participants
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
