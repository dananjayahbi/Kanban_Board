import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function getBoard(id: string) {
  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: { tasks: { orderBy: { order: "asc" } } },
      },
    },
  });
  return board;
}

async function addTask(formData: FormData) {
  "use server";
  const columnId = String(formData.get("columnId"));
  const boardId = String(formData.get("boardId"));
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDateStr = String(formData.get("dueDate") || "");
  if (!title) return;
  const last = await prisma.task.findFirst({ where: { columnId }, orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;
  await prisma.task.create({
    data: { title, description, order, columnId, boardId, dueDate: dueDateStr ? new Date(dueDateStr) : null },
  });
  revalidatePath(`/boards/${boardId}`);
}

async function toggleTask(formData: FormData) {
  "use server";
  const taskId = String(formData.get("taskId"));
  const boardId = String(formData.get("boardId"));
  const current = await prisma.task.findUnique({ where: { id: taskId } });
  if (!current) return;
  await prisma.task.update({ where: { id: taskId }, data: { completed: !current.completed } });
  revalidatePath(`/boards/${boardId}`);
}

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoard(id);
  if (!board) return notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: board.color ?? "#6366f1" }} />
          {board.title}
        </h1>
      </div>
      <div className="grid auto-cols-[280px] grid-flow-col gap-4 overflow-x-auto pb-2">
        {board.columns.map((col: NonNullable<Awaited<ReturnType<typeof getBoard>>>["columns"][number]) => (
          <Card key={col.id} className="min-w-[280px]">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                {col.title}
                <AddTaskDialog boardId={board.id} columnId={col.id} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {col.tasks.length === 0 && (
                <div className="text-sm text-muted-foreground">No tasks</div>
              )}
              {col.tasks.map((t: typeof col.tasks[number]) => (
                <div key={t.id} className="rounded-md border p-3 bg-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{t.title}</div>
                    <form action={toggleTask}>
                      <input type="hidden" name="taskId" value={t.id} />
                      <input type="hidden" name="boardId" value={board.id} />
                      <Button size="sm" variant={t.completed ? "secondary" : "outline"}>{t.completed ? "Done" : "Mark done"}</Button>
                    </form>
                  </div>
                  {t.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-3">{t.description}</div>}
                  {t.dueDate && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Due: {new Date(t.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddTaskDialog({ boardId, columnId }: { boardId: string; columnId: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form action={addTask} className="space-y-4">
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="columnId" value={columnId} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">Title</label>
            <Input id="title" name="title" required placeholder="Task title" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">Description</label>
            <Textarea id="description" name="description" placeholder="Optional details" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="dueDate">Due date</label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <DialogFooter>
            <Button type="submit">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
