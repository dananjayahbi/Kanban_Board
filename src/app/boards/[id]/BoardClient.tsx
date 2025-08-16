"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { addTask, updateTask, deleteTask, moveTask, createColumn, updateColumn, deleteColumn } from "@/app/boards/actions";
import { Badge } from "@/components/ui/badge";
import { useWS } from "@/hooks/use-ws";

type Column = {
  id: string;
  title: string;
  order: number;
  color?: string | null;
  tasks: Task[];
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | Date | null;
  order: number;
  color?: string | null;
};

export default function BoardClient({
  board,
  priorities = [],
}: {
  board: { id: string; title: string; color: string | null; columns: Column[] };
  priorities?: { id: string; name: string; color: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  useWS();

  const onDragStartTask = useCallback((e: React.DragEvent, taskId: string, fromColumnId: string) => {
    e.dataTransfer.setData("text/taskId", taskId);
    e.dataTransfer.setData("text/fromColumnId", fromColumnId);
    e.dataTransfer.setData("text/boardId", board.id);
    e.dataTransfer.effectAllowed = "move";
  }, [board.id]);

  const onDropOnColumn = useCallback((e: React.DragEvent, toColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/taskId");
    const boardId = e.dataTransfer.getData("text/boardId");
    if (!taskId || !boardId) return;
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("toColumnId", toColumnId);
    fd.set("boardId", boardId);
    startTransition(() => moveTask(fd));
    setDragOverColumn(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: board.color ?? "#6366f1" }} />
          {board.title}
        </h1>
        <CreateColumnDialog boardId={board.id} />
      </div>
      <div className="grid auto-cols-[320px] grid-flow-col gap-4 overflow-x-auto pb-2">
        {board.columns.map((col) => (
          <Card
            key={col.id}
            className={`min-w-[320px] ${dragOverColumn === col.id ? "ring-2 ring-primary" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(col.id);
            }}
            onDragLeave={() => setDragOverColumn((c) => (c === col.id ? null : c))}
            onDrop={(e) => onDropOnColumn(e, col.id)}
          >
            <CardHeader className="relative">
              {col.color && (
                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg" style={{ backgroundColor: col.color }} />
              )}
              <CardTitle className="text-base flex items-center justify-between">
                <span className="font-medium">{col.title}</span>
                <div className="flex items-center gap-1">
                  <AddTaskDialog boardId={board.id} columnId={col.id} priorities={priorities} />
                  <ColumnMenu boardId={board.id} columnId={col.id} title={col.title} currentColor={col.color || ""} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {col.tasks.length === 0 && (
                <div className="text-sm text-muted-foreground">No tasks</div>
              )}
              {col.tasks.map((t) => (
                <TaskCard key={t.id} task={t} boardId={board.id} columnId={col.id} onDragStart={onDragStartTask} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateColumnDialog({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add List
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New List</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await createColumn(fd);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="boardId" value={boardId} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">Title</label>
            <Input id="title" name="title" placeholder="e.g. Backlog" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="color">Color</label>
            <Input id="color" name="color" type="color" defaultValue="#6366f1" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wipLimit">WIP limit</label>
            <Input id="wipLimit" name="wipLimit" type="number" min={0} placeholder="Optional" />
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ColumnMenu({ boardId, columnId, title, currentColor }: { boardId: string; columnId: string; title: string; currentColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit list
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit List</DialogTitle>
            </DialogHeader>
            <form action={async (fd) => { await updateColumn(fd); setOpen(false); }} className="space-y-4">
              <input type="hidden" name="id" value={columnId} />
              <input type="hidden" name="boardId" value={boardId} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`title-${columnId}`}>Title</label>
                <Input id={`title-${columnId}`} name="title" defaultValue={title} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`color-${columnId}`}>Color</label>
                <Input id={`color-${columnId}`} name="color" type="color" defaultValue={currentColor || "#6366f1"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`wip-${columnId}`}>WIP limit</label>
                <Input id={`wip-${columnId}`} name="wipLimit" type="number" min={0} placeholder="Optional" />
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <form action={deleteColumn}>
          <input type="hidden" name="id" value={columnId} />
          <input type="hidden" name="boardId" value={boardId} />
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()} className="text-red-600">
            <button type="submit" className="w-full flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Delete list
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddTaskDialog({ boardId, columnId, priorities }: { boardId: string; columnId: string; priorities: { id: string; name: string; color: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form action={async (fd) => { await addTask(fd); setOpen(false); }} className="space-y-4">
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
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="taskColor">Color</label>
            <Input id="taskColor" name="color" type="color" defaultValue="#6366f1" />
          </div>
          {priorities.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="priorityId">Priority</label>
              <select id="priorityId" name="priorityId" className="w-full border rounded-md h-9 px-2 bg-background">
                <option value="">None</option>
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <DialogFooter>
            <Button type="submit">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskCard({ task, boardId, columnId, onDragStart }: {
  task: Task;
  boardId: string;
  columnId: string;
  onDragStart: (e: React.DragEvent, taskId: string, fromColumnId: string) => void;
}) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id, columnId)}
      className="rounded-md border p-3 bg-card shadow-sm hover:shadow transition relative"
    >
      {task.color && (
        <div className="absolute -top-[1px] left-0 right-0 h-1.5 rounded-t-lg" style={{ backgroundColor: task.color }} />
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium line-clamp-1">{task.title}</div>
        <TaskMenu task={task} boardId={boardId} />
      </div>
      {task.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-3">{task.description}</div>}
      {due && (
        <div className="mt-2 text-xs text-muted-foreground">Due: {due.toLocaleDateString()}</div>
      )}
      {"priority" in task && (task as any).priority && (
        <div className="mt-2">
          <Badge style={{ backgroundColor: (task as any).priority.color }} className="text-white">
            {(task as any).priority.name}
          </Badge>
        </div>
      )}
    </div>
  );
}

function TaskMenu({ task, boardId }: { task: Task & { priority?: { id: string; name: string; color: string } }; boardId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form action={async (fd) => { await updateTask(fd); setOpen(false); }} className="space-y-4">
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="boardId" value={boardId} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`title-${task.id}`}>Title</label>
                <Input id={`title-${task.id}`} name="title" defaultValue={task.title} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`desc-${task.id}`}>Description</label>
                <Textarea id={`desc-${task.id}`} name="description" defaultValue={task.description ?? ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`due-${task.id}`}>Due date</label>
                <Input id={`due-${task.id}`} name="dueDate" type="date" defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`tcolor-${task.id}`}>Color</label>
                <Input id={`tcolor-${task.id}`} name="color" type="color" defaultValue={(task as any).color || "#6366f1"} />
              </div>
              {"priority" in task && (task as any).priority && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <div className="text-xs text-muted-foreground">To change priority, edit via Quick Add dialog in this version.</div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <form action={deleteTask}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="boardId" value={boardId} />
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()} className="text-red-600">
            <button type="submit" className="w-full flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
