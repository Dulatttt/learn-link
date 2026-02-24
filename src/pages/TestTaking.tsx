import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ArrowRight, BrainCircuit, CheckCircle2, Loader2, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function TestTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Состояния теста
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Состояния ИИ и Прогресса
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  useEffect(() => {
    loadQuizData();
  }, [id]);

  async function loadQuizData() {
    const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', id).single();
    const { data: qData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', id);
    setQuiz(quizData);
    setQuestions(qData || []);
    setLoading(false);
  }

  const handleNext = () => {
    if (selectedOption === null) return;

    const currentQ = questions[currentStep];
    const isCorrect = selectedOption === currentQ.correct_option_index;
    
    // Собираем историю ответов для отправки в ChatGPT
    const newAnswer = {
      question: currentQ.question_text,
      userAnswer: currentQ.options[selectedOption],
      correctAnswer: currentQ.options[currentQ.correct_option_index],
      isCorrect: isCorrect
    };
    
    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (isCorrect) setScore(prev => prev + 1);

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
    } else {
      finishQuiz(updatedAnswers);
    }
  };

  async function finishQuiz(finalAnswers: any[]) {
    setIsFinished(true);
    setIsAnalyzing(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const finalScorePercent = Math.round((score / questions.length) * 100);
      const calculatedXp = 33 + Math.floor(finalScorePercent / 2);
      setXpGained(calculatedXp);

      // 1. Создаем запись о попытке (получаем ID, чтобы потом обновить её анализом ИИ)
      const { data: attemptData } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: id,
          score: finalScorePercent
        })
        .select()
        .single();

      // 2. Обновляем XP и счетчик тестов в профиле
      const { data: profile } = await supabase.from('profiles').select('xp, tests_completed').eq('id', user.id).single();
      if (profile) {
        await supabase.from('profiles').update({
          xp: (profile.xp || 0) + calculatedXp,
          tests_completed: (profile.tests_completed || 0) + 1
        }).eq('id', user.id);
      }

      // 3. Запрос к OpenAI (ChatGPT)
      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Ты — экспертный ИИ-ментор EduStream. Проанализируй ответы теста, объясни ошибки и дай советы по темам для изучения на русском языке. не используй эмодзи."
              },
              {
                role: "user",
                content: `Тест: ${quiz?.title}. Результат: ${finalScorePercent}%. Ответы пользователя: ${JSON.stringify(finalAnswers)}`
              }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const feedbackText = data.choices[0].message.content;
        setAiFeedback(feedbackText);

        // 4. Сохраняем анализ ИИ обратно в базу данных к этой попытке
        if (attemptData) {
          await supabase
            .from('quiz_attempts')
            .update({ ai_feedback: feedbackText })
            .eq('id', attemptData.id);
        }

      } catch (error: any) {
        console.error("AI Error:", error);
        setAiFeedback("🤖 Твой результат сохранен в системе! К сожалению, разбор от ИИ временно недоступен.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (isFinished) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Готово!</h1>
            <div className="flex justify-center gap-4">
                <div className="bg-card border-2 p-6 rounded-3xl min-w-[140px]">
                    <p className="text-4xl font-black text-primary">{Math.round((score / questions.length) * 100)}%</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Верно</p>
                </div>
                <div className="bg-primary text-primary-foreground p-6 rounded-3xl min-w-[140px] shadow-lg shadow-primary/30">
                    <p className="text-4xl font-black">+{xpGained}</p>
                    <p className="text-xs font-bold uppercase opacity-80">Опыт XP</p>
                </div>
            </div>
          </div>

          {/* Блок Анализа ChatGPT */}
          <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-primary/20 bg-card p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black text-foreground">Разбор от EduStream AI</h3>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-bold text-muted-foreground animate-pulse">Анализируем ваши ответы...</p>
              </div>
            ) : (
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-medium text-foreground/90 leading-relaxed italic">
                  {aiFeedback}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/tests')} className="w-full bg-foreground text-background font-black py-6 rounded-2xl hover:scale-[1.01] transition-all uppercase tracking-widest shadow-xl">
            К списку тестов
          </button>
        </div>
      </AppLayout>
    );
  }

  const currentQ = questions[currentStep];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Вопрос {currentStep + 1} / {questions.length}</span>
             <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border">
                <Timer className="h-3 w-3" /> {quiz?.time_limit} мин
             </div>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-700 ease-in-out" style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-3xl font-bold leading-tight">{currentQ?.question_text}</h2>
          <div className="grid gap-3">
            {currentQ?.options.map((option: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={cn(
                  "group relative w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 font-bold text-lg",
                  selectedOption === idx ? "border-primary bg-primary/5 text-primary shadow-md" : "border-border bg-card hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "h-8 w-8 rounded-lg border-2 flex items-center justify-center text-sm transition-all",
                     selectedOption === idx ? "border-primary bg-primary text-white" : "border-muted-foreground/20"
                   )}>
                     {String.fromCharCode(65 + idx)}
                   </div>
                   {option}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-6 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 hover:brightness-110 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            {currentStep === questions.length - 1 ? "Завершить тест" : "Далее"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
