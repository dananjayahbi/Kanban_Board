import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import Link from "next/link";
import { snoozeTask, setTaskCompleted } from "@/app/boards/actions";

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
  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
  const soon = tasks.filter((t) => t.dueDate && new Date(t.dueDate) >= new Date());
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Overdue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdue.length === 0 && <div className="text-sm text-muted-foreground">Nothing overdue</div>}
          {overdue.map((t) => (
            <AlertRow key={t.id} task={t} kind="overdue" />
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
            <AlertRow key={t.id} task={t} kind="soon" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AlertRow({ task, kind }: { task: Awaited<ReturnType<typeof getAlertTasks>>[number]; kind: "overdue" | "soon" }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-md border p-3">
      <div>
        <div className="font-medium line-clamp-1">{task.title}</div>
        {due && (
          <div className="text-xs text-muted-foreground">Due {due.toLocaleDateString()}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={kind === "overdue" ? "destructive" : "secondary"}>
          {kind === "overdue" ? "Overdue" : "Soon"}
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
