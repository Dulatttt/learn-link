import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Users, Search } from "lucide-react";

const allRooms = [
  { id: 1, title: "Calculus Study Group", topic: "Math", participants: 5, isLive: true, description: "Working through integration techniques together." },
  { id: 2, title: "Python Basics", topic: "IT", participants: 3, isLive: true, description: "Beginner-friendly Python programming session." },
  { id: 3, title: "Quantum Mechanics", topic: "Physics", participants: 2, isLive: false, description: "Deep dive into quantum states and wavefunctions." },
  { id: 4, title: "Linear Algebra", topic: "Math", participants: 0, isLive: false, description: "Matrix operations and vector spaces." },
  { id: 5, title: "Web Development", topic: "IT", participants: 7, isLive: true, description: "Building modern web applications with React." },
  { id: 6, title: "Thermodynamics", topic: "Physics", participants: 1, isLive: false, description: "Heat transfer and energy conversion concepts." },
];

const topics = ["All", "Math", "Physics", "IT"];

export default function Rooms() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = allRooms.filter(
    (r) =>
      (filter === "All" || r.topic === filter) &&
      r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Rooms</h1>
          <p className="text-sm text-muted-foreground">Join a room or create your own study session.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
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
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{room.description}</p>
              <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {room.participants} participants
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
