import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Loader2, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function TestTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizData();
  }, [id]);

  async function loadQuizData() {
    // Грузим инфу о тесте
    const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', id).single();
    // Грузим вопросы
    const { data: qData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', id);
    
    setQuiz(quizData);
    setQuestions(qData || []);
    setLoading(false);
  }

  const handleNext = () => {
    if (selectedOption === null) return;

    // Проверяем правильность
    if (selectedOption === questions[currentStep].correct_option_index) {
      setScore(prev => prev + 1);
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
    } else {
      finishQuiz();
    }
  };

  async function finishQuiz() {
    setIsFinished(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Сохраняем попытку в БД
    if (user) {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: id,
        score: Math.round((score / questions.length) * 100)
      });
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (isFinished) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-20 space-y-8 animate-in zoom-in duration-300">
          <div className="relative inline-block">
             <CheckCircle2 className="h-24 w-24 text-success mx-auto" />
             <div className="absolute inset-0 bg-success/20 blur-3xl rounded-full -z-10"></div>
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Результат</h1>
          <div className="p-8 rounded-[2.5rem] bg-card border-2 border-border shadow-2xl">
            <p className="text-6xl font-black text-primary mb-2">{Math.round((score / questions.length) * 100)}%</p>
            <p className="text-muted-foreground font-bold">Вы ответили правильно на {score} из {questions.length} вопросов</p>
          </div>
          <button onClick={() => navigate('/tests')} className="w-full bg-foreground text-background font-black py-5 rounded-2xl hover:scale-105 transition-all uppercase tracking-widest text-xs">
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
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Вопрос {currentStep + 1} / {questions.length}</span>
             <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Timer className="h-4 w-4" /> {quiz?.time_limit} мин
             </div>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Area */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold leading-tight text-foreground">{currentQ.question_text}</h2>
          
          <div className="grid gap-4">
            {currentQ.options.map((option: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={cn(
                  "group relative w-full text-left p-6 rounded-[1.5rem] border-2 transition-all duration-200 font-bold",
                  selectedOption === idx 
                    ? "border-primary bg-primary/5 text-primary ring-4 ring-primary/10" 
                    : "border-border bg-card hover:border-border-hover hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px]",
                     selectedOption === idx ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                   )}>
                     {idx + 1}
                   </div>
                   {option}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {currentStep === questions.length - 1 ? "Завершить" : "Следующий вопрос"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}