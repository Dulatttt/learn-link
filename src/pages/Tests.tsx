import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Clock, BarChart3 } from "lucide-react";

const tests = [
  { id: 1, title: "Calculus Fundamentals", category: "Math", questions: 15, duration: "20 min", difficulty: "Medium" },
  { id: 2, title: "Python Data Structures", category: "IT", questions: 20, duration: "25 min", difficulty: "Easy" },
  { id: 3, title: "Newtonian Mechanics", category: "Physics", questions: 12, duration: "15 min", difficulty: "Hard" },
  { id: 4, title: "Linear Algebra Basics", category: "Math", questions: 10, duration: "15 min", difficulty: "Easy" },
  { id: 5, title: "React & TypeScript", category: "IT", questions: 18, duration: "30 min", difficulty: "Medium" },
  { id: 6, title: "Electromagnetism", category: "Physics", questions: 15, duration: "20 min", difficulty: "Hard" },
];

const difficultyColor: Record<string, string> = {
  Easy: "text-success bg-success/10",
  Medium: "text-warning bg-warning/10",
  Hard: "text-destructive bg-destructive/10",
};

export default function Tests() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tests & Quizzes</h1>
          <p className="text-sm text-muted-foreground">Challenge yourself and track your progress.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Link
              key={test.id}
              to={`/tests/${test.id}`}
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                {test.category}
              </span>
              <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                {test.title}
              </h3>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" /> {test.questions} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {test.duration}
                </span>
              </div>
              <div className="mt-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor[test.difficulty]}`}>
                  {test.difficulty}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
