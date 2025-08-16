import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TasksPerBoardChart from "@/components/Charts/TasksPerBoardChart";

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
  return { totals, overdue, upcoming, boardsCount: boards.length };
}

export default async function DashboardPage() {
  const { totals, overdue, upcoming, boardsCount } = await getStats();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Boards" value={boardsCount} />
  <StatCard title="Tasks (all)" value={totals.reduce((s: number, t: { name: string; tasks: number; done: number }) => s + t.tasks, 0)} />
  <StatCard title="Completed" value={totals.reduce((s: number, t: { name: string; tasks: number; done: number }) => s + t.done, 0)} />
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
