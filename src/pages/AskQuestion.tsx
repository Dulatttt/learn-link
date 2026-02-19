import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Категории на русском для удобства пользователей
const CATEGORIES = ["Математика", "Наука", "Программирование", "Языки", "Общее"];

export default function AskQuestion() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Общее");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пожалуйста, сначала войдите в систему");

      const { error } = await supabase.from('questions').insert({
        title,
        body,
        category,
        author_id: user.id
      });

      if (error) throw error;
      navigate("/forum");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/forum" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Вернуться на форум
        </Link>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-6">Задать публичный вопрос</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Заголовок</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Как решать квадратные уравнения?"
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Суть вопроса</label>
              <textarea
                required
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Опишите вашу проблему подробно..."
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              Опубликовать вопрос
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
