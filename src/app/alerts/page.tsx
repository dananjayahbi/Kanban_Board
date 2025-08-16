import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    orderBy: { dueDate: "asc" },
  });
  return tasks;
}

export default async function AlertsPage() {
  const tasks = await getAlertTasks();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming & Overdue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 && <div className="text-sm text-muted-foreground">No alerts</div>}
          {tasks.map((t: Awaited<ReturnType<typeof getAlertTasks>>[number]) => {
            const due = t.dueDate ? new Date(t.dueDate) : null;
            const overdue = due ? due < new Date() : false;
            return (
              <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{t.title}</div>
                  {due && (
                    <div className="text-xs text-muted-foreground">Due {due.toLocaleDateString()}</div>
                  )}
                </div>
                <div>
                  {overdue ? (
                    <Badge variant="destructive">Overdue</Badge>
                  ) : (
                    <Badge variant="secondary">Soon</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
