import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  ClipboardCheck,
  Loader2, Star,
  Trophy,
  Users,
  Video
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stats, setStats] = useState([
    { label: "Тестов пройдено", value: "0", icon: ClipboardCheck, color: "text-primary" },
    { label: "Твой ранг", value: "#-", icon: Trophy, color: "text-yellow-500" },
    { label: "Активных комнат", value: "0", icon: Video, color: "text-info" },
    { label: "Очки обучения", value: "0", icon: Star, color: "text-success" },
  ]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || null;
      setCurrentUserId(userId);

      if (!userId) return;

      // 1. Логика из Лидерборда: запрашиваем всех для расчета ранга
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, tests_done, points, answers_count')
        .order('points', { ascending: false });

      // 2. Получаем живые комнаты
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .order('participants_count', { ascending: false })
        .limit(3);

      if (allProfiles) {
        const myIndex = allProfiles.findIndex(p => p.id === userId);
        const myData = allProfiles[myIndex];
        const myRank = myIndex !== -1 ? myIndex + 1 : "-";

        setStats([
          { 
            label: "Тестов пройдено", 
            value: String(myData?.tests_done ?? 0), 
            icon: ClipboardCheck, 
            color: "text-primary" 
          },
          { 
            label: "Твой ранг", 
            value: `#${myRank}`, 
            icon: Trophy, 
            color: "text-yellow-500" 
          },
          { 
            label: "Активных комнат", 
            value: String(rooms?.length ?? 0), 
            icon: Video, 
            color: "text-info" 
          },
          { 
            label: "Очки обучения", 
            value: (myData?.points ?? 0).toLocaleString(), 
            icon: Star, 
            color: "text-success" 
          },
        ]);
      }
      setActiveRooms(rooms || []);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Подписка на изменения, чтобы цифры менялись без перезагрузки
    const subscription = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Заголовок в стиле твоего Лидерборда */}
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground italic">Панель управления</h1>
          <p className="text-sm font-medium text-muted-foreground">Твой личный прогресс и активные учебные сессии</p>
        </div>

        {/* Сетка статов (Карточки) */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-[2rem] border-2 border-border bg-card p-6 shadow-card transition-all hover:border-primary/20">
              <div className="flex flex-col gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary shadow-inner">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : s.value}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Секция комнат */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black uppercase tracking-tight italic text-foreground">Популярные комнаты</h2>
            <Link to="/rooms" className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:underline">
              Все комнаты <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-[2rem] bg-muted" />)
            ) : (
              activeRooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/rooms/${room.id}`}
                  className="group relative flex flex-col rounded-[2.5rem] border-2 border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover hover:border-primary/30"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-black uppercase text-foreground">
                      {room.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-live">
                      <span className="h-2 w-2 rounded-full bg-live animate-pulse" /> Live
                    </span>
                  </div>
                  
                  <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                    {room.name}
                  </h3>
                  
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-muted-foreground/70">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>{room.participants_count || 0} участников</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}