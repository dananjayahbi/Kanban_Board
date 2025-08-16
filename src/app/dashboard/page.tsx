import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TasksPerBoardChart from "@/components/Charts/TasksPerBoardChart";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const boards = await prisma.board.findMany({ include: { columns: { include: { tasks: true } } } });
  type BoardType = typeof boards[number];
  type ColumnType = BoardType["columns"][number];
  type TaskType = ColumnType["tasks"][number];
  const totals = boards.map((b: BoardType) => ({
    name: b.title,
    tasks: b.columns.reduce((s: number, c: ColumnType) => s + c.tasks.length, 0),
    done: b.columns.find((c: ColumnType) => c.title.toLowerCase() === "done")?.tasks.length ?? 0,
  }));
  const allTasks: TaskType[] = boards.flatMap((b: BoardType) => b.columns.flatMap((c: ColumnType) => c.tasks));
  const overdue = allTasks.filter((t: TaskType) => !!t.dueDate && !t.completed && new Date(t.dueDate!) < new Date()).length;
  const upcoming = allTasks.filter((t: TaskType) => {
    if (!t.dueDate || t.completed) return false;
    const d = new Date(t.dueDate);
    const now = new Date();
    const in7 = new Date(now);
    in7.setDate(now.getDate() + 7);
    return d >= now && d <= in7;
  }).length;
  const completed = allTasks.filter((t) => t.completed).length;
  const totalTasks = allTasks.length;
  const recent = await prisma.task.findMany({ orderBy: { updatedAt: "desc" }, take: 6 });
  return { totals, overdue, upcoming, boardsCount: boards.length, completed, totalTasks, recent };
}

export default async function DashboardPage() {
  const { totals, overdue, upcoming, boardsCount, completed, totalTasks, recent } = await getStats();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Boards" value={boardsCount} />
        <StatCard title="Tasks (all)" value={totalTasks} />
        <StatCard title="Completed" value={completed} />
        <StatCard title="Overdue" value={overdue} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tasks per Board</CardTitle>
        </CardHeader>
        <CardContent>
          <TasksPerBoardChart data={totals} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recent.length === 0 && <div className="text-sm text-muted-foreground">No recent task updates</div>}
          {recent.map((t) => (
            <Link key={t.id} href={`/boards/${t.boardId}`} className="rounded-md border p-3 hover:bg-accent">
              <div className="font-medium line-clamp-1">{t.title}</div>
              <div className="text-xs text-muted-foreground">Updated {new Date(t.updatedAt).toLocaleString()}</div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  );
}
