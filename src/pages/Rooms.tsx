import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Hash, Loader2, Plus, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const topics = ["All", "Math", "Physics", "IT"];

export default function Rooms() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных из Supabase
  useEffect(() => {
    async function fetchRooms() {
      setLoading(true);
      try {
        let query = supabase.from('rooms').select('*');

        // Если выбран фильтр, отличный от "All", добавляем условие
        if (filter !== "All") {
          query = query.eq('category', filter);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setRooms(data || []);
      } catch (error: any) {
        console.error("Error fetching rooms:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, [filter]);

  // Фильтрация по поиску на стороне клиента
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8 pb-10">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic italic text-foreground">
              Study Rooms
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Присоединяйся к обсуждению или создай свою учебную сессию.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="h-5 w-5" /> Создать комнату
          </button>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all",
                  filter === t
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск комнат..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-border bg-muted/30 py-3 pl-11 pr-4 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-72 transition-all"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Загрузка комнат...</p>
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className="group relative flex flex-col rounded-[2.5rem] border-2 border-border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-lg bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-foreground">
                    {room.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-success">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Live
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Hash className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                    {room.name}
                  </h3>
                </div>

                <p className="mb-6 line-clamp-2 text-sm font-medium italic text-muted-foreground">
                  "{room.description || "Нет описания для этой комнаты."}"
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{room.participants_count || 0} участников</span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:rotate-90">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-border p-10 text-center">
            <p className="text-lg font-bold text-muted-foreground">Комнаты не найдены</p>
            <p className="text-sm text-muted-foreground/60">Попробуйте изменить фильтр или поисковый запрос.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}