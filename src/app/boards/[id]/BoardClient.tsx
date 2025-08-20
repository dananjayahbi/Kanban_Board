"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import {
  addTask,
  updateTask,
  deleteTask,
  createColumn,
  updateColumn,
  deleteColumn,
} from "@/app/boards/actions";
import { Badge } from "@/components/ui/badge";
import { useWS } from "@/hooks/use-ws";
import * as Lucide from "lucide-react";

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
  board: {
    id: string;
    title: string;
    color: string | null;
    isFavorite?: boolean;
    columns: Column[];
  };
  priorities?: { id: string; name: string; color: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [cols, setCols] = useState<Column[]>(
    () => JSON.parse(JSON.stringify(board.columns)) as Column[]
  );
  const { connected, send } = useWS();

  // Local queue for instant UI + eventual DB consistency
  const storageKey = useMemo(() => `pendingMoves:${board.id}`, [board.id]);
  const getQueue = useCallback((): any[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  }, [storageKey]);
  const setQueue = useCallback(
    (q: any[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(q));
      } catch {}
    },
    [storageKey]
  );
  const applyLocalMove = useCallback((taskId: string, toColumnId: string) => {
    setCols((prev) => {
      const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
      // Skip if already in target
      const already = next.some(
        (c) => c.id === toColumnId && c.tasks.some((t) => t.id === taskId)
      );
      if (already) return next;
      let moved: Task | null = null;
      for (const c of next) {
        const idx = c.tasks.findIndex((t) => t.id === taskId);
        if (idx >= 0) {
          moved = c.tasks.splice(idx, 1)[0] as any;
          break;
        }
      }
      if (moved) {
        const dest = next.find((c) => c.id === toColumnId);
        if (dest) dest.tasks.push(moved);
      }
      return next;
    });
  }, []);

  // Reconcile pending moves when page is visible/online
  useEffect(() => {
    const reconcile = () => {
      const q = getQueue();
      for (const mv of q) {
        if (mv?.taskId && mv?.toColumnId) {
          applyLocalMove(mv.taskId, mv.toColumnId);
          send({
            type: "task:move",
            taskId: mv.taskId,
            toColumnId: mv.toColumnId,
            boardId: board.id,
          });
        }
      }
    };
    reconcile();
    const onVis = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    const onOnline = () => reconcile();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [board.id, getQueue, applyLocalMove, send]);

  // Listen to WS events and update UI immediately for smoother UX
  useEffect(() => {
    const handler = (e: any) => {
      const msg = e.detail as { event: string; payload: any };
      if (!msg?.event) return;
      switch (msg.event) {
        case "task:moved": {
          const { taskId, toColumnId } = msg.payload || {};
          if (!taskId || !toColumnId) return;
          setCols((prev) => {
            const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
            let moved: Task | null = null;
            for (const c of next) {
              const idx = c.tasks.findIndex((t) => t.id === taskId);
              if (idx >= 0) {
                moved = c.tasks.splice(idx, 1)[0] as any;
                break;
              }
            }
            if (moved) {
              const dest = next.find((c) => c.id === toColumnId);
              if (dest) dest.tasks.push(moved);
            }
            return next;
          });
          // Ack: clear from local pending queue
          const rest = getQueue().filter(
            (x: any) => !(x.taskId === taskId && x.toColumnId === toColumnId)
          );
          setQueue(rest);
          break;
        }
        case "task:created": {
          const { columnId, task } = msg.payload || {};
          if (!columnId || !task) return;
          setCols((prev) => {
            const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
            const dest = next.find((c) => c.id === columnId);
            if (dest) dest.tasks.push(task as any);
            return next;
          });
          break;
        }
        case "task:updated": {
          const { task } = msg.payload || {};
          if (!task?.id) return;
          const updatedId = task.id as string;
          setCols((prev) => prev.map((c) => ({
            ...c,
            tasks: c.tasks.map((t) => (t.id === updatedId ? { ...t, ...task } as any : t)),
          })));
          break;
        }
        case "task:deleted": {
          const { taskId } = msg.payload || {};
          if (!taskId) return;
          setCols((prev) => prev.map((c) => ({
            ...c,
            tasks: c.tasks.filter((t) => t.id !== taskId),
          })));
          break;
        }
        case "column:created":
        case "column:updated":
        case "column:deleted": {
          // For simplicity, refresh on structural changes
          if (typeof window !== "undefined") window.location.reload();
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener("app:ws", handler as any);
    return () => window.removeEventListener("app:ws", handler as any);
  }, [connected]);

  const onDragStartTask = useCallback(
    (e: React.DragEvent, taskId: string, fromColumnId: string) => {
      e.dataTransfer.setData("text/taskId", taskId);
      e.dataTransfer.setData("text/fromColumnId", fromColumnId);
      e.dataTransfer.setData("text/boardId", board.id);
      e.dataTransfer.effectAllowed = "move";
      // Announce drag start (optional)
      send({ type: "drag:start", taskId, fromColumnId, boardId: board.id });
    },
    [board.id]
  );

  const onDropOnColumn = useCallback(
    (e: React.DragEvent, toColumnId: string) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/taskId");
      const boardId = e.dataTransfer.getData("text/boardId");
      if (!taskId || !boardId) return;
      // 1) Instant UI
      applyLocalMove(taskId, toColumnId);
      // 2) Queue for eventual persistence
      const q = getQueue();
      q.push({ taskId, toColumnId, ts: Date.now() });
      setQueue(q);
      // 3) Notify via WS (server will persist and broadcast)
      send({ type: "task:move", taskId, toColumnId, boardId });
      setDragOverColumn(null);
    },
    [applyLocalMove, getQueue, setQueue, send]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: board.color ?? "#6366f1" }}
          />
          {(() => {
            const P = (Lucide as any)[(board as any).icon];
            return P ? <P className="h-5 w-5" /> : null;
          })()}
          {board.title}
        </h1>
        <div className="flex items-center gap-2">
          {typeof board.isFavorite !== "undefined" && (
            <FavoriteSlot id={board.id} isFavorite={board.isFavorite} />
          )}
          <CreateColumnDialog boardId={board.id} />
        </div>
      </div>
      <div className="grid auto-cols-[320px] grid-flow-col gap-4 overflow-x-auto pb-4">
        {cols.map((col) => (
          <Card
            key={col.id}
            className={`min-w-[320px] ${
              dragOverColumn === col.id ? "ring-2 ring-primary" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(col.id);
            }}
            onDragLeave={() =>
              setDragOverColumn((c) => (c === col.id ? null : c))
            }
            onDrop={(e) => onDropOnColumn(e, col.id)}
          >
            <CardHeader className="relative">
              {col.color && (
                <div
                  className="absolute top-[-25px] left-0 right-0 h-2 rounded-t-lg"
                  style={{ backgroundColor: col.color }}
                />
              )}
              <CardTitle className="text-base mt-[-10px] flex items-center justify-between">
                <span className="font-medium">{col.title}</span>
                <div className="flex items-center gap-1">
                  <AddTaskDialog
                    boardId={board.id}
                    columnId={col.id}
                    priorities={priorities}
                  />
                  <ColumnMenu
                    boardId={board.id}
                    columnId={col.id}
                    title={col.title}
                    currentColor={col.color || ""}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {col.tasks.length === 0 && (
                <div className="text-sm text-muted-foreground">No tasks</div>
              )}
              {col.tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  boardId={board.id}
                  columnId={col.id}
                  onDragStart={onDragStartTask}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FavoriteSlot({
  id,
  isFavorite,
}: {
  id: string;
  isFavorite?: boolean;
}) {
  // Lazy import to avoid SSR issues
  const [ClientComp, setClientComp] = useState<any>(null);
  useEffect(() => {
    import("@/components/boards/FavoriteToggle").then((m) =>
      setClientComp(() => m.default)
    );
  }, []);
  if (!ClientComp) return null;
  return <ClientComp id={id} isFavorite={isFavorite} size="sm" />;
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
      <DialogContent className="max-h-[75vh] overflow-y-auto">
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
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Backlog"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="color">
              Color
            </label>
            <Input
              id="color"
              name="color"
              type="color"
              defaultValue="#6366f1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wipLimit">
              WIP limit
            </label>
            <Input
              id="wipLimit"
              name="wipLimit"
              type="number"
              min={0}
              placeholder="Optional"
            />
          </div>
          <DialogFooter>
            <SubmitButton>Create</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ColumnMenu({
  boardId,
  columnId,
  title,
  currentColor,
}: {
  boardId: string;
  columnId: string;
  title: string;
  currentColor: string;
}) {
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
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" /> Edit list
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="max-h-[75vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit List</DialogTitle>
            </DialogHeader>
            <form
              action={async (fd) => {
                await updateColumn(fd);
                setOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={columnId} />
              <input type="hidden" name="boardId" value={boardId} />
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`title-${columnId}`}
                >
                  Title
                </label>
                <Input
                  id={`title-${columnId}`}
                  name="title"
                  defaultValue={title}
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`color-${columnId}`}
                >
                  Color
                </label>
                <Input
                  id={`color-${columnId}`}
                  name="color"
                  type="color"
                  defaultValue={currentColor || "#6366f1"}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`wip-${columnId}`}
                >
                  WIP limit
                </label>
                <Input
                  id={`wip-${columnId}`}
                  name="wipLimit"
                  type="number"
                  min={0}
                  placeholder="Optional"
                />
              </div>
              <DialogFooter>
                <SubmitButton>Save</SubmitButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-red-600 gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete list
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this list?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the list "{title}" and all its tasks. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action={deleteColumn}>
                <input type="hidden" name="id" value={columnId} />
                <input type="hidden" name="boardId" value={boardId} />
                <AlertDialogAction asChild>
                  <SubmitButton variant="destructive">Delete</SubmitButton>
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddTaskDialog({
  boardId,
  columnId,
  priorities,
}: {
  boardId: string;
  columnId: string;
  priorities: { id: string; name: string; color: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[75vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await addTask(fd);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="columnId" value={columnId} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <Input id="title" name="title" required placeholder="Task title" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional details"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="dueDate">
              Due date
            </label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="taskColor">
              Color
            </label>
            <Input
              id="taskColor"
              name="color"
              type="color"
              defaultValue="#6366f1"
            />
          </div>
          {priorities.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="priorityId">
                Priority
              </label>
              <select
                id="priorityId"
                name="priorityId"
                className="w-full border rounded-md h-9 px-2 bg-background"
              >
                <option value="">None</option>
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <DialogFooter>
            <SubmitButton>Add Task</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskCard({
  task,
  boardId,
  columnId,
  onDragStart,
}: {
  task: Task;
  boardId: string;
  columnId: string;
  onDragStart: (
    e: React.DragEvent,
    taskId: string,
    fromColumnId: string
  ) => void;
}) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id, columnId)}
      className="rounded-md border p-3 bg-card shadow-sm hover:shadow transition relative"
    >
      {task.color && (
        <div
          className="absolute -top-[1px] left-0 right-0 h-1.5 rounded-t-lg"
          style={{ backgroundColor: task.color }}
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium line-clamp-1">{task.title}</div>
        <TaskMenu task={task} boardId={boardId} />
      </div>
      {task.description && (
        <div className="text-sm text-muted-foreground mt-1 line-clamp-3">
          {task.description}
        </div>
      )}
      {due && (
        <div className="mt-2 text-xs text-muted-foreground">
          Due: {due.toLocaleDateString()}
        </div>
      )}
      {"priority" in task && (task as any).priority && (
        <div className="mt-2">
          <Badge
            style={{ backgroundColor: (task as any).priority.color }}
            className="text-white"
          >
            {(task as any).priority.name}
          </Badge>
        </div>
      )}
    </div>
  );
}

function TaskMenu({
  task,
  boardId,
}: {
  task: Task & { priority?: { id: string; name: string; color: string } };
  boardId: string;
}) {
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
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" /> Edit
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form
              action={async (fd) => {
                await updateTask(fd);
                setOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="boardId" value={boardId} />
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`title-${task.id}`}
                >
                  Title
                </label>
                <Input
                  id={`title-${task.id}`}
                  name="title"
                  defaultValue={task.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`desc-${task.id}`}
                >
                  Description
                </label>
                <Textarea
                  id={`desc-${task.id}`}
                  name="description"
                  defaultValue={task.description ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`due-${task.id}`}
                >
                  Due date
                </label>
                <Input
                  id={`due-${task.id}`}
                  name="dueDate"
                  type="date"
                  defaultValue={
                    task.dueDate
                      ? new Date(task.dueDate).toISOString().slice(0, 10)
                      : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`tcolor-${task.id}`}
                >
                  Color
                </label>
                <Input
                  id={`tcolor-${task.id}`}
                  name="color"
                  type="color"
                  defaultValue={(task as any).color || "#6366f1"}
                />
              </div>
              {"priority" in task && (task as any).priority && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <div className="text-xs text-muted-foreground">
                    To change priority, edit via Quick Add dialog in this
                    version.
                  </div>
                </div>
              )}
              <DialogFooter>
                <SubmitButton>Save</SubmitButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-red-600 gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this task?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{task.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action={deleteTask}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="boardId" value={boardId} />
                <AlertDialogAction asChild>
                  <SubmitButton variant="destructive">Delete</SubmitButton>
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
