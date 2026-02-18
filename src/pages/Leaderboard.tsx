import { AppLayout } from "@/components/AppLayout";
import { Trophy, Medal } from "lucide-react";

const users = [
  { rank: 1, name: "Alice M.", points: 1240, tests: 45, answers: 89 },
  { rank: 2, name: "Bob K.", points: 1105, tests: 38, answers: 72 },
  { rank: 3, name: "Dana R.", points: 980, tests: 35, answers: 60 },
  { rank: 4, name: "You", points: 870, tests: 28, answers: 45 },
  { rank: 5, name: "Charlie W.", points: 750, tests: 22, answers: 55 },
  { rank: 6, name: "Eve L.", points: 680, tests: 20, answers: 40 },
  { rank: 7, name: "Frank H.", points: 590, tests: 18, answers: 35 },
  { rank: 8, name: "Grace N.", points: 520, tests: 15, answers: 30 },
];

const medalColor: Record<number, string> = {
  1: "text-warning",
  2: "text-muted-foreground",
  3: "text-warning/60",
};

export default function Leaderboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Top learners ranked by activity points.</p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">Tests</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">Answers</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Points</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.rank}
                  className={`border-b border-border last:border-0 transition-colors hover:bg-secondary/30 ${u.name === "You" ? "bg-primary/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    {u.rank <= 3 ? (
                      <Medal className={`h-5 w-5 ${medalColor[u.rank]}`} />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">{u.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-semibold text-primary">{u.name[0]}</span>
                      </div>
                      <span className={`text-sm font-medium ${u.name === "You" ? "text-primary" : "text-foreground"}`}>
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm text-muted-foreground sm:table-cell">{u.tests}</td>
                  <td className="hidden px-4 py-3 text-right text-sm text-muted-foreground sm:table-cell">{u.answers}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{u.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
