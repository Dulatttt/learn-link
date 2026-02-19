import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import {
    Award,
    Calendar,
    Camera,
    Check,
    CheckCircle2, Edit2,
    Eye,
    HelpCircle,
    Loader2,
    LogOut,
    Mail,
    MessageSquare,
    User,
    X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ questions: 0, answers: 0 });
  const [userQuestions, setUserQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');
  
  // Состояния для редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      // 1. Загружаем данные профиля
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      // 2. Загружаем вопросы пользователя
      const { data: qList } = await supabase
        .from('questions').select('*')
        .eq('author_id', user.id).order('created_at', { ascending: false });

      // 3. Загружаем ответы пользователя с заголовками вопросов
      const { data: aList } = await supabase
        .from('answers')
        .select('*, questions(id, title)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      const questions = qList || [];
      const answers = aList || [];

      setProfile({ ...profileData, email: user.email });
      setNewUsername(profileData?.username || "");
      setUserQuestions(questions);
      setUserAnswers(answers);
      setStats({ 
        questions: questions.length, 
        answers: answers.length 
      });

    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
    }
  }

  // Смена имени
  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername === profile.username) {
      setIsEditing(false);
      return;
    }
    setUpdating(true);
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', profile.id);
    if (!error) setProfile({ ...profile, username: newUsername });
    setIsEditing(false);
    setUpdating(false);
  };

  // Загрузка Аватара
  async function uploadAvatar(event: any) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (error: any) {
      alert("Ошибка загрузки: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getRank = (q: number, a: number) => {
    const points = (q * 5) + (a * 10);
    if (points >= 500) return { title: "Легенда", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (points >= 200) return { title: "Магистр", color: "text-purple-500", bg: "bg-purple-500/10" };
    if (points >= 50) return { title: "Знаток", color: "text-blue-500", bg: "bg-blue-500/10" };
    return { title: "Новичок", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  };

  const rank = getRank(stats.questions, stats.answers);

  if (loading) return <AppLayout><div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8 pb-10">
        
        {/* Шапка Профиля */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 md:p-10 shadow-sm">
          <div className="absolute right-0 top-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-primary/5 blur-[100px]" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Аватар с загрузкой */}
            <div className="group relative">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[2.5rem] bg-primary text-5xl font-black text-white shadow-2xl overflow-hidden uppercase">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="h-full w-full object-cover" alt="avatar" />
                ) : (
                  profile?.username?.charAt(0)
                )}
              </div>
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-[2.5rem] bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      value={newUsername} 
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-background border-2 border-primary rounded-xl px-3 py-1 text-xl font-bold outline-none"
                    />
                    <button onClick={handleUpdateUsername} className="p-2 bg-primary text-white rounded-lg"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setIsEditing(false)} className="p-2 bg-secondary rounded-lg"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-black text-foreground">{profile?.username}</h1>
                    <button onClick={() => setIsEditing(true)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                  </>
                )}
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${rank.bg} ${rank.color} border border-current/10`}>
                  <Award className="mr-1 h-3.5 w-3.5" /> {rank.title}
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-5 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary/60" /> {profile?.email}</div>
                <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary/60" /> С нами с {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '...'}</div>
              </div>
            </div>

            <button onClick={handleSignOut} className="flex items-center gap-2 rounded-xl bg-destructive/10 px-5 py-2.5 text-sm font-bold text-destructive hover:bg-destructive hover:text-white transition-all">
              <LogOut className="h-4 w-4" /> Выход
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <StatCard icon={<HelpCircle />} value={stats.questions} label="Вопросов" color="blue" />
          <StatCard icon={<MessageSquare />} value={stats.answers} label="Ответов" color="emerald" />
          <StatCard icon={<Award />} value={(stats.questions * 5) + (stats.answers * 10)} label="Рейтинг" color="amber" className="col-span-2 md:col-span-1" />
        </div>

        {/* Вкладки */}
        <div className="space-y-6">
          <div className="flex border-b border-border gap-8">
            <TabBtn active={activeTab === 'questions'} onClick={() => setActiveTab('questions')} label="Мои вопросы" />
            <TabBtn active={activeTab === 'answers'} onClick={() => setActiveTab('answers')} label="Мои ответы" />
          </div>

          <div className="grid gap-4">
            {activeTab === 'questions' ? (
              userQuestions.length > 0 ? (
                userQuestions.map((q) => <QuestionItem key={q.id} q={q} onClick={() => navigate(`/forum/${q.id}`)} />)
              ) : <EmptyState text="Вы еще не задавали вопросов" />
            ) : (
              userAnswers.length > 0 ? (
                userAnswers.map((a) => (
                  <div key={a.id} onClick={() => navigate(`/forum/${a.questions?.id}`)} className="group cursor-pointer rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-all">
                    <p className="text-sm text-foreground line-clamp-2 italic">«{a.body}»</p>
                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                      <span className="text-[10px] font-bold text-primary uppercase">К вопросу: {a.questions?.title || "Удален"}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : <EmptyState text="Вы еще не отвечали на вопросы" />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Мини-компоненты
function StatCard({ icon, value, label, color, className = "" }: any) {
  const colors: any = { blue: "bg-blue-500/10 text-blue-500", emerald: "bg-emerald-500/10 text-emerald-500", amber: "bg-amber-500/10 text-amber-500" };
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
      {label} {active && <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-primary" />}
    </button>
  );
}

function QuestionItem({ q, onClick }: any) {
  return (
    <div onClick={onClick} className="group cursor-pointer rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-all">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">{q.category}</span>
          <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{q.title}</h4>
        </div>
        {q.is_solved && <CheckCircle2 className="h-5 w-5 text-success" />}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase">
        <div className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {q.views_count || 0}</div>
        <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(q.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-16 text-center border-2 border-dashed border-border rounded-[2rem] bg-secondary/10">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background"><User className="h-6 w-6 text-muted-foreground" /></div>
      <p className="text-sm font-bold text-muted-foreground px-6">{text}</p>
    </div>
  );
}