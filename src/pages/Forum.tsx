import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Eye, MessageCircle, Search, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const questions = [
  { id: 1, title: "How to solve partial differential equations?", tags: ["Math", "Calculus"], views: 142, answers: 5, solved: true, author: "Alice M.", time: "2h ago" },
  { id: 2, title: "Best resources for learning Python in 2024?", tags: ["IT", "Python"], views: 89, answers: 12, solved: true, author: "Bob K.", time: "4h ago" },
  { id: 3, title: "Explain the Heisenberg uncertainty principle", tags: ["Physics", "Quantum"], views: 67, answers: 3, solved: false, author: "Charlie W.", time: "6h ago" },
  { id: 4, title: "Matrix multiplication intuition?", tags: ["Math", "Linear Algebra"], views: 201, answers: 8, solved: true, author: "Dana R.", time: "1d ago" },
  { id: 5, title: "React vs Vue for beginners", tags: ["IT", "Web Dev"], views: 312, answers: 15, solved: false, author: "Eve L.", time: "1d ago" },
];

export default function Forum() {
  const [search, setSearch] = useState("");
  const filtered = questions.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Forum</h1>
            <p className="text-sm text-muted-foreground">Ask questions and help others learn.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((q) => (
            <Link
              key={q.id}
              to={`/forum/${q.id}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="hidden sm:flex flex-col items-center gap-1 pt-1">
                <div className="flex flex-col items-center rounded-lg bg-secondary px-3 py-2">
                  <span className="text-lg font-bold text-foreground">{q.answers}</span>
                  <span className="text-[10px] text-muted-foreground">answers</span>
                </div>
                {q.solved && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {q.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {q.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {tag}
                    </span>
                  ))}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {q.views}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    by {q.author} · {q.time}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
