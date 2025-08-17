import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import Link from "next/link";
import { snoozeTask, setTaskCompleted } from "@/app/boards/actions";
import * as Lucide from "lucide-react";

export const dynamic = "force-dynamic";

async function getAlertTasks() {
  const now = new Date();
  const in7 = new Date();
  in7.setDate(now.getDate() + 7);
  const tasks = await prisma.task.findMany({
    where: {
      completed: false,
      OR: [
        { dueDate: { lt: now } },
        { dueDate: { gte: now, lte: in7 } },
      ],
    },
    orderBy: [{ dueDate: "asc" }],
  });
  return tasks;
}

export default async function AlertsPage() {
  const tasks = await getAlertTasks();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < startOfDay);
  const todayTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) >= startOfDay && new Date(t.dueDate) <= endOfDay);
  const soon = tasks.filter((t) => t.dueDate && new Date(t.dueDate) > endOfDay);
  const boardIds = Array.from(new Set(tasks.map((t) => t.boardId)));
  const boards = await prisma.board.findMany({
    where: { id: { in: boardIds } },
    select: { id: true, title: true, color: true, icon: true },
  });
  const boardMap = Object.fromEntries(boards.map((b) => [b.id, b]));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayTasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks due today</div>}
          {todayTasks.map((t) => (
            <AlertRow key={t.id} task={t} kind="today" board={boardMap[t.boardId]} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Overdue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdue.length === 0 && <div className="text-sm text-muted-foreground">Nothing overdue</div>}
          {overdue.map((t) => (
            <AlertRow key={t.id} task={t} kind="overdue" board={boardMap[t.boardId]} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Due Soon (7 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {soon.length === 0 && <div className="text-sm text-muted-foreground">No upcoming tasks</div>}
          {soon.map((t) => (
            <AlertRow key={t.id} task={t} kind="soon" board={boardMap[t.boardId]} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AlertRow({ task, kind, board }: { task: Awaited<ReturnType<typeof getAlertTasks>>[number]; kind: "overdue" | "soon" | "today"; board?: { id: string; title: string; color: string | null; icon: string | null } }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const Icon = board?.icon ? (Lucide as any)[board.icon] : null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-md border p-3">
      <div className="flex items-start gap-2">
        <div className="flex items-center gap-1 mt-0.5">
          {board?.color && (
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: board.color }} />
          )}
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </div>
        <div>
          <div className="font-medium line-clamp-1">{task.title}</div>
        {due && (
          <div className="text-xs text-muted-foreground">Due {due.toLocaleDateString()}</div>
        )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={kind === "overdue" ? "destructive" : kind === "today" ? "default" : "secondary"}>
          {kind === "overdue" ? "Overdue" : kind === "today" ? "Today" : "Soon"}
        </Badge>
        <form action={snoozeTask}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="days" value="3" />
          <SubmitButton size="sm" variant="outline">Snooze 3d</SubmitButton>
        </form>
        <form action={setTaskCompleted}>
          <input type="hidden" name="id" value={task.id} />
          <SubmitButton size="sm" variant="secondary">Mark done</SubmitButton>
        </form>
        <Link href={`/boards/${task.boardId}`}>
          <Button size="sm" variant="ghost">Open board</Button>
        </Link>
      </div>
    </div>
  );
}
