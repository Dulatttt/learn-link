import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { BarChart3, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Цвета для уровней сложности
const difficultyColor: Record<string, string> = {
  Easy: "text-success bg-success/10",
  Medium: "text-warning bg-warning/10",
  Hard: "text-destructive bg-destructive/10",
};

export default function Tests() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      // Подтягиваем тесты из таблицы, которую создали в SQL
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (err) {
      console.error("Ошибка при загрузке тестов:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Тесты и Квизы</h1>
          <p className="text-sm text-muted-foreground">Проверь свои знания и отслеживай прогресс.</p>
        </div>

        {quizzes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">Тестов пока нет. Загляните позже!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((test) => (
              <Link
                key={test.id}
                to={`/tests/${test.id}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover hover:border-primary/30"
              >
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase text-foreground">
                  {test.category}
                </span>
                
                <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                  {test.title}
                </h3>
                
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {test.description}
                </p>

                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <BarChart3 className="h-3.5 w-3.5" /> 
                    {/* Тут можно сделать отдельный запрос count, но пока выведем время */}
                    Вопросы
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5" /> {test.time_limit} мин
                  </span>
                </div>

                <div className="mt-4">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                    difficultyColor[test.difficulty] || "bg-secondary text-foreground"
                  )}>
                    {test.difficulty}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}