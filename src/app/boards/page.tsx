import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { revalidatePath } from "next/cache";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createBoard } from "./actions";
import BoardActions from "@/components/boards/BoardActions";
import CreateBoardDialog from "./CreateBoardDialog";
import FavoriteToggle from "@/components/boards/FavoriteToggle";
import * as Lucide from "lucide-react";

export const dynamic = "force-dynamic";

async function getBoards() {
  const pb = (prisma as any).board;
  return pb.findMany({
    include: {
      columns: {
        include: { tasks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// createBoard comes from server actions

type BoardWithCounts = Awaited<ReturnType<typeof getBoards>>[number];

export default async function BoardsPage() {
  const boards = await getBoards();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Boards</h1>
        <CreateBoardDialog />
      </div>
      {boards.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b: BoardWithCounts & { isFavorite?: boolean }) => {
            const taskCount = b.columns.reduce((sum: number, c: BoardWithCounts["columns"][number]) => sum + c.tasks.length, 0);
            const done = b.columns.find((c: BoardWithCounts["columns"][number]) => c.title.toLowerCase() === "done");
            const doneCount = done?.tasks.length ?? 0;
            return (
              <Link key={b.id} href={`/boards/${b.id}`} className="group">
                <Card className="transition shadow-sm hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: b.color ?? "#6366f1" }} />
                        <BoardIcon name={(b as any).icon} />
                        {b.title}
                      </span>
                      <div className="flex items-center gap-1">
                        <FavoriteToggle id={b.id} isFavorite={(b as any).isFavorite} />
                        <BoardActions board={b} />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground flex items-center gap-2">
                    <Badge variant="secondary">{b.columns.length} lists</Badge>
                    <Badge variant="secondary">{taskCount} tasks</Badge>
                    <Badge variant="outline">{doneCount} done</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BoardIcon({ name }: { name?: string | null }) {
  const P = (name && (Lucide as any)[name as keyof typeof Lucide]) as any;
  if (!P) return null;
  return <P className="h-4 w-4" />;
}

function EmptyState() {
  return (
    <div className="rounded-lg border p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <FolderKanban className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-medium">Create your first board</h2>
      <p className="text-sm text-muted-foreground mt-1">Organize tasks across lists with a personal Kanban.</p>
      <div className="mt-4 flex justify-center">
        <CreateBoardDialog />
      </div>
    </div>
  );
}

// CreateBoardDialog client component is in ./CreateBoardDialog

// BoardActions moved to a client component at src/components/boards/BoardActions.tsx
