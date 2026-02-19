import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { Loader2, Medal, Star, Target, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

const medalColor: Record<number, string> = {
  1: "text-yellow-500", 
  2: "text-slate-400",  
  3: "text-amber-600",  
};

interface Leader {
  id: string;
  rank: number;
  name: string;
  points: number;
  tests: number;
  answers: number;
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaders() {
      setLoading(true);
      
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || null;
      setCurrentUserId(userId);

      // Запрашиваем данные. Если ты переименовал в XP, 
      // используй 'points:xp' чтобы не менять остальной код
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, points, tests_done, answers_count')
        .order('points', { ascending: false })
        .limit(50);

      if (!error && data) {
        const formatted = data.map((u, index) => ({
          id: u.id,
          rank: index + 1,
          name: u.username || "Anonymous Student",
          points: u.points || 0,
          tests: u.tests_done || 0,
          answers: u.answers_count || 0
        }));
        setLeaders(formatted);
      }
      setLoading(false);
    }

    fetchLeaders();
  }, []);

  const myRank = leaders.find(u => u.id === currentUserId);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8 pb-10">
        {/* Заголовок */}
        <div className="flex items-end justify-between px-2">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground italic">Leaderboard</h1>
            <p className="text-muted-foreground font-medium">Стань лучшим в учебном рейтинге 2026</p>
          </div>
          <Trophy className="h-14 w-14 text-yellow-500/10" />
        </div>

        {/* Твой статус */}
        {myRank && (
          <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-primary/20 bg-primary/5 p-8 shadow-2xl shadow-primary/10 transition-all hover:scale-[1.01]">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-3xl font-black text-white shadow-xl shadow-primary/40 rotate-3">
                  #{myRank.rank}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-foreground">Твой прогресс</h3>
                  <p className="text-sm font-bold text-muted-foreground/80">
                    Вы опережаете {Math.max(0, 100 - Math.ceil((myRank.rank / (leaders.length || 1)) * 100))}% учеников
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-primary tracking-tighter">{myRank.points.toLocaleString()}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Очков опыта</div>
              </div>
            </div>
            <Star className="absolute -right-6 -bottom-6 h-32 w-32 text-primary/5 -rotate-12" />
          </div>
        )}

        {/* Список */}
        <div className="rounded-[2.5rem] border-2 border-border bg-card shadow-2xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ранг</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ученик</th>
                <th className="hidden px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:table-cell">Тесты</th>
                <th className="hidden px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:table-cell">Ответы</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Очки</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {leaders.map((u) => {
                const isMe = u.id === currentUserId;
                return (
                  <tr
                    key={u.id}
                    className={`group transition-all hover:bg-muted/30 ${isMe ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-8 py-6">
                      {u.rank <= 3 ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shadow-inner">
                           <Medal className={`h-6 w-6 ${medalColor[u.rank]}`} />
                        </div>
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center text-sm font-black text-muted-foreground/40">
                          {u.rank}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all group-hover:rotate-6 ${isMe ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-border bg-muted text-muted-foreground"}`}>
                          <span className="text-xs font-black uppercase">
                            {u.name[0]}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black ${isMe ? "text-primary" : "text-foreground"}`}>
                            {u.name}
                          </span>
                          {isMe && <span className="text-[10px] font-black uppercase tracking-tighter text-primary/60">Это вы</span>}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-8 py-6 text-right sm:table-cell">
                      <span className="text-xs font-bold text-muted-foreground/80 flex items-center justify-end gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary/40" /> {u.tests}
                      </span>
                    </td>
                    <td className="hidden px-8 py-6 text-right text-xs font-bold text-muted-foreground/80 sm:table-cell">
                      {u.answers}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-base font-black tracking-tight ${isMe ? "text-primary" : "text-foreground"}`}>
                        {u.points.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}