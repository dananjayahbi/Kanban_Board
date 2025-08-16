import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BoardClient from "./BoardClient";

export const dynamic = "force-dynamic";

async function getBoard(id: string) {
  const pb = (prisma as any).board;
  const board = await pb.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      color: true,
      isFavorite: true,
      columns: {
        orderBy: { order: "asc" },
        include: { tasks: { orderBy: { order: "asc" }, include: { priority: true } } },
      },
    },
  });
  return board;
}

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoard(id);
  if (!board) return notFound();
  const priorities = await prisma.priorityLabel.findMany({ orderBy: { level: "asc" } }).catch(() => []);
  return (
    <BoardClient
  board={{ id: board.id, title: board.title, color: board.color, isFavorite: (board as any).isFavorite, columns: board.columns as any }}
      priorities={priorities as any}
    />
  );
}
