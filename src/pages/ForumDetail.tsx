import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Award,
  CheckCircle2, Eye, Loader2, MessageSquare,
  Send, ThumbsUp,
  User as UserIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ForumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]); // ID ответов, лайкнутых юзером
  
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      init();
    }
  }, [id]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    await loadData(user?.id);
  }

  async function loadData(userId?: string) {
    try {
      // 1. Инкремент просмотров
      await supabase.rpc('increment_views', { question_id: id });

      // 2. Загрузка вопроса
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('*, profiles(username, avatar_url)')
        .eq('id', id)
        .maybeSingle();

      if (qError) throw qError;
      setQuestion(qData);

      // 3. Загрузка ответов (Сортировка: сначала решение, потом по дате)
      const { data: aData } = await supabase
        .from('answers')
        .select('*, profiles(username, avatar_url)')
        .eq('question_id', id)
        .order('is_solution', { ascending: false })
        .order('created_at', { ascending: true });

      setAnswers(aData || []);

      // 4. Загрузка лайков текущего пользователя
      if (userId) {
        const { data: likes } = await supabase
          .from('answer_likes')
          .select('answer_id')
          .eq('user_id', userId);
        if (likes) setUserLikes(likes.map(l => l.answer_id));
      }

    } catch (err: any) {
      console.error("Ошибка загрузки:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleLike = async (answerId: string) => {
    if (!currentUser) return alert("Войдите, чтобы ставить лайки");

    const isLiked = userLikes.includes(answerId);
    
    // Оптимистичное обновление стейта
    setUserLikes(prev => isLiked ? prev.filter(id => id !== answerId) : [...prev, answerId]);
    setAnswers(prev => prev.map(a => {
      if (a.id === answerId) {
        return { ...a, likes_count: isLiked ? (a.likes_count - 1) : (a.likes_count + 1) };
      }
      return a;
    }));

    if (isLiked) {
      await supabase.from('answer_likes').delete().eq('answer_id', answerId).eq('user_id', currentUser.id);
      // Синхронизируем счетчик в основной таблице
      await supabase.rpc('decrement_answer_likes', { row_id: answerId });
    } else {
      await supabase.from('answer_likes').insert({ answer_id: answerId, user_id: currentUser.id });
      await supabase.rpc('increment_answer_likes', { row_id: answerId });
    }
  };

  const toggleSolution = async (answerId: string) => {
    if (currentUser?.id !== question.author_id) return;
    
    setLoading(true);
    await supabase.from('answers').update({ is_solution: true }).eq('id', answerId);
    await supabase.from('questions').update({ is_solved: true }).eq('id', id);
    
    await loadData(currentUser.id);
  };

  const submitAnswer = async () => {
    if (!newAnswer.trim() || !currentUser) return;
    setSending(true);
    try {
      const { error } = await supabase.from('answers').insert({
        question_id: id,
        author_id: currentUser.id,
        body: newAnswer
      });
      
      if (error) throw error;
      setNewAnswer("");
      await loadData(currentUser.id);
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading && !question) return <AppLayout><div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div></AppLayout>;
  if (!question) return <AppLayout><div className="text-center py-20"><h1 className="text-2xl font-bold">Вопрос не найден</h1></div></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8 pb-20">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-widest">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        {/* ШАПКА ВОПРОСА */}
        <div className="overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl shadow-primary/5">
          <div className="bg-muted/30 px-8 py-5 border-b border-border/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary px-4 py-1 text-[10px] font-black text-white uppercase tracking-tighter">
                {question.category || "Общее"}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase">
                <Eye className="h-3.5 w-3.5" /> {question.views_count || 0}
              </div>
            </div>
            {question.is_solved && (
              <div className="flex items-center gap-1.5 text-[10px] font-black text-success uppercase">
                <CheckCircle2 className="h-4 w-4" /> Решено
              </div>
            )}
          </div>
          
          <div className="p-8 md:p-10">
            <h1 className="text-3xl md:text-4xl font-black text-foreground leading-[1.1] mb-6">{question.title}</h1>
            <p className="text-lg text-muted-foreground/90 leading-relaxed whitespace-pre-line">{question.body}</p>
            
            <div className="mt-10 flex items-center justify-between border-t border-border/50 pt-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight">{question.profiles?.username}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(question.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ОТВЕТЫ */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 px-4">
            <MessageSquare className="h-6 w-6 text-primary" />
            Ответы <span className="text-primary/40">{answers.length}</span>
          </h2>

          {answers.map((a) => (
            <div key={a.id} className={cn(
              "relative rounded-[2rem] border-2 p-6 md:p-8 transition-all duration-500",
              a.is_solution 
                ? "border-amber-400 bg-amber-50/30 shadow-xl shadow-amber-200/20 scale-[1.01]" 
                : "border-border bg-card"
            )}>
              {a.is_solution && (
                <div className="absolute -top-4 left-8 flex items-center gap-2 rounded-full bg-amber-400 px-5 py-1.5 text-[10px] font-black uppercase text-white shadow-lg">
                  <Award className="h-4 w-4" /> Лучший ответ
                </div>
              )}

              <p className={cn(
                "text-base leading-relaxed mb-8",
                a.is_solution ? "text-amber-950 font-medium" : "text-foreground/80"
              )}>
                {a.body}
              </p>
              
              <div className="flex items-center justify-between border-t border-border/40 pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center text-[10px] font-bold border border-border">
                    {a.profiles?.username?.[0]}
                  </div>
                  <span className="text-xs font-bold">{a.profiles?.username}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {currentUser?.id === question.author_id && !question.is_solved && (
                    <button 
                      onClick={() => toggleSolution(a.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-success hover:bg-success/10 px-4 py-2 rounded-xl transition-all border border-success/20"
                    >
                      Это решение
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleLike(a.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all shadow-sm",
                      userLikes.includes(a.id) 
                        ? "bg-primary text-white scale-105" 
                        : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <ThumbsUp className={cn("h-4 w-4", userLikes.includes(a.id) && "fill-current")} />
                    {a.likes_count || 0}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ФОРМА (Скрывается если вопрос решен) */}
        {!question.is_solved ? (
          <div className="rounded-[2.5rem] border-2 border-primary/20 bg-card p-3 shadow-2xl shadow-primary/10">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Напишите свой ответ здесь..."
              className="w-full bg-transparent p-6 text-base focus:outline-none resize-none min-h-[160px]"
            />
            <div className="bg-muted/50 rounded-[1.8rem] p-4 flex justify-end">
              <button
                onClick={submitAnswer}
                disabled={sending || !newAnswer.trim()}
                className="flex items-center gap-3 rounded-[1.2rem] bg-primary px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Отправить
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-success/5 border-2 border-dashed border-success/20 p-10 text-center">
             <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-4" />
             <p className="text-sm font-black uppercase tracking-widest text-success">Обсуждение закрыто: Решение найдено</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}