import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ArrowLeft, CheckCircle2, ThumbsUp, Send } from "lucide-react";

const question = {
  id: 1,
  title: "How to solve partial differential equations?",
  body: "I'm struggling with solving PDEs, specifically the heat equation. Can someone explain the separation of variables method step by step? I've been reading through the textbook but the notation is confusing me.\n\nAny worked examples would be greatly appreciated!",
  author: "Alice M.",
  time: "2 hours ago",
  tags: ["Math", "Calculus"],
  views: 142,
};

const initialAnswers = [
  {
    id: 1,
    author: "Bob K.",
    body: "The separation of variables method works by assuming the solution can be written as a product of functions, each depending on only one variable. For the heat equation u_t = k·u_xx, assume u(x,t) = X(x)·T(t). Substituting gives you two ODEs that you can solve independently.",
    time: "1h ago",
    likes: 8,
    isSolution: true,
  },
  {
    id: 2,
    author: "Dana R.",
    body: "I'd recommend checking out 3Blue1Brown's video on differential equations — it gives great visual intuition before diving into the algebra.",
    time: "45m ago",
    likes: 3,
    isSolution: false,
  },
];

export default function ForumDetail() {
  const { id } = useParams();
  const [answers, setAnswers] = useState(initialAnswers);
  const [newAnswer, setNewAnswer] = useState("");

  const submitAnswer = () => {
    if (!newAnswer.trim()) return;
    setAnswers([
      ...answers,
      { id: Date.now(), author: "You", body: newAnswer, time: "Just now", likes: 0, isSolution: false },
    ]);
    setNewAnswer("");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/forum" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Forum
        </Link>

        {/* Question */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex flex-wrap gap-2 mb-3">
            {question.tags.map((t) => (
              <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{t}</span>
            ))}
          </div>
          <h1 className="text-xl font-bold text-foreground">{question.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{question.body}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{question.author}</span> · {question.time} · {question.views} views
          </div>
        </div>

        {/* Answers */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">{answers.length} Answers</h2>
          <div className="space-y-4">
            {answers.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border bg-card p-5 shadow-card ${a.isSolution ? "border-success/40 bg-success/5" : "border-border"}`}
              >
                {a.isSolution && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" /> Marked as Solution
                  </div>
                )}
                <p className="text-sm leading-relaxed text-foreground">{a.body}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{a.author}</span> · {a.time}
                  </div>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                    <ThumbsUp className="h-3.5 w-3.5" /> {a.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New answer */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Your Answer</h3>
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write your answer..."
            rows={4}
            className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <button
            onClick={submitAnswer}
            className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Send className="h-4 w-4" /> Post Answer
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
