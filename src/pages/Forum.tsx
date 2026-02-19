import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Eye, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CATEGORIES = ["All", "Math", "Science", "Programming", "Languages", "General"];

export default function Forum() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [selectedCategory]);

const fetchQuestions = async () => {
  setLoading(true);
  try {
    let query = supabase
      .from('questions')
      .select(`
        *,
        profiles (
          username
        )
      `) // Убрали author_id из названия связи, оставили просто имя таблицы
      .order('created_at', { ascending: false });

    if (selectedCategory !== "All") {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      // Если всё еще ошибка, делаем "защищенный" запрос без профилей
      console.warn("Ошибка связей, грузим упрощенный список:", error.message);
      const { data: simpleData, error: simpleError } = await query.select('*');
      if (simpleError) throw simpleError;
      setQuestions(simpleData || []);
    } else {
      setQuestions(data || []);
    }
  } catch (err: any) {
    console.error("Критическая ошибка:", err.message);
  } finally {
    setLoading(false);
  }
};
  // Клиентский поиск по заголовку
  const filtered = questions.filter((q) =>
    (q.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Forum</h1>
            <p className="text-sm text-muted-foreground">Находите ответы и делитесь знаниями.</p>
          </div>
          <Link 
            to="/forum/ask" 
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" /> Ask Question
          </Link>
        </div>

        {/* Категории и Поиск */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                  selectedCategory === cat
                    ? "bg-primary border-primary text-white"
                    : "bg-card border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => (
              <Link
                key={q.id}
                to={`/forum/${q.id}`}
                className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4 sm:flex-col sm:gap-1 sm:min-w-[70px]">
                  <div className={`flex flex-col items-center justify-center rounded-lg px-2 py-1.5 w-full ${
                    q.is_solved ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
                  }`}>
                    <span className="text-lg font-bold">{q.answers_count || 0}</span>
                    <span className="text-[10px] uppercase font-bold">ans</span>
                  </div>
                  {q.is_solved && <CheckCircle2 className="h-4 w-4 text-success" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate">{q.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-bold text-primary bg-primary/5 px-2 py-0.5 rounded uppercase tracking-tighter">
                      {q.category || 'General'}
                    </span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {q.views_count || 0}</span>
                    <span>by <b>{q.profiles?.username || 'User'}</b></span>
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed rounded-2xl text-muted-foreground">
                <p>Ничего не найдено в категории "{selectedCategory}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}