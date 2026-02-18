import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const quizQuestions = [
  { id: 1, question: "What is the derivative of sin(x)?", options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"], correct: 0 },
  { id: 2, question: "∫ 2x dx = ?", options: ["x²", "x² + C", "2x² + C", "x + C"], correct: 1 },
  { id: 3, question: "What is the limit of (1 + 1/n)^n as n→∞?", options: ["1", "π", "e", "∞"], correct: 2 },
  { id: 4, question: "The second derivative test determines:", options: ["Continuity", "Concavity", "Integrability", "Differentiability"], correct: 1 },
  { id: 5, question: "Which rule is used for f(g(x))?", options: ["Product rule", "Quotient rule", "Chain rule", "Power rule"], correct: 2 },
];

export default function TestTaking() {
  const { id } = useParams();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quizQuestions.length).fill(null));
  const [finished, setFinished] = useState(false);

  const selectAnswer = (optIdx: number) => {
    const next = [...answers];
    next[current] = optIdx;
    setAnswers(next);
  };

  const score = answers.filter((a, i) => a === quizQuestions[i].correct).length;
  const progress = ((current + 1) / quizQuestions.length) * 100;

  if (finished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Test Complete!</h1>
          <p className="text-4xl font-bold text-primary">{score}/{quizQuestions.length}</p>
          <p className="text-sm text-muted-foreground">
            You scored {Math.round((score / quizQuestions.length) * 100)}%
          </p>
          <Link
            to="/tests"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  const q = quizQuestions[current];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <Link to="/tests" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Exit
        </Link>
        <span className="text-sm font-medium text-foreground">
          Question {current + 1} of {quizQuestions.length}
        </span>
        <div className="w-16" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <h2 className="text-xl font-semibold text-foreground">{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`w-full rounded-xl border p-4 text-left text-sm font-medium transition-colors ${
                  answers[current] === i
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40"
            >
              Previous
            </button>
            {current < quizQuestions.length - 1 ? (
              <button
                onClick={() => setCurrent(current + 1)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => setFinished(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
