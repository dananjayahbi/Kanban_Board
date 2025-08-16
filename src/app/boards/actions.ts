"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createBoard(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const color = String(formData.get("color") || "#6366f1");
  if (!title) return;
  await prisma.board.create({
    data: {
      title,
      description,
      color,
      columns: {
        create: [
          { title: "Backlog", order: 0 },
          { title: "In Progress", order: 1 },
          { title: "Review", order: 2 },
          { title: "Done", order: 3 },
        ],
      },
    },
  });
  revalidatePath("/boards");
}

export async function updateBoard(formData: FormData) {
  const id = String(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const color = String(formData.get("color") || "#6366f1");
  if (!id || !title) return;
  await prisma.board.update({ where: { id }, data: { title, description, color } });
  revalidatePath("/boards");
}

export async function deleteBoard(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  const columns = await prisma.column.findMany({ where: { boardId: id }, select: { id: true } });
  const columnIds = columns.map((c) => c.id);
  const tasks = await prisma.task.findMany({ where: { boardId: id }, select: { id: true } });
  const taskIds = tasks.map((t) => t.id);
  await prisma.subtask.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  await prisma.column.deleteMany({ where: { id: { in: columnIds } } });
  await prisma.board.delete({ where: { id } });
  revalidatePath("/boards");
}

export async function addTask(formData: FormData) {
  const columnId = String(formData.get("columnId"));
  const boardId = String(formData.get("boardId"));
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDateStr = String(formData.get("dueDate") || "");
  if (!title || !boardId || !columnId) return;
  const last = await prisma.task.findFirst({ where: { columnId }, orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;
  await prisma.task.create({
    data: { title, description, order, columnId, boardId, dueDate: dueDateStr ? new Date(dueDateStr) : null },
  });
  revalidatePath(`/boards/${boardId}`);
}

export async function toggleTask(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const boardId = String(formData.get("boardId"));
  const current = await prisma.task.findUnique({ where: { id: taskId } });
  if (!current) return;
  await prisma.task.update({ where: { id: taskId }, data: { completed: !current.completed } });
  revalidatePath(`/boards/${boardId}`);
}

export async function updateTask(formData: FormData) {
  const id = String(formData.get("id"));
  const boardId = String(formData.get("boardId"));
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDateStr = String(formData.get("dueDate") || "");
  if (!id || !title) return;
  await prisma.task.update({
    where: { id },
    data: { title, description, dueDate: dueDateStr ? new Date(dueDateStr) : null },
  });
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id"));
  const boardId = String(formData.get("boardId"));
  if (!id) return;
  await prisma.subtask.deleteMany({ where: { taskId: id } });
  await prisma.task.delete({ where: { id } });
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function moveTask(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const toColumnId = String(formData.get("toColumnId"));
  const boardId = String(formData.get("boardId"));
  if (!taskId || !toColumnId) return;
  const last = await prisma.task.findFirst({ where: { columnId: toColumnId }, orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;
  await prisma.task.update({ where: { id: taskId }, data: { columnId: toColumnId, order } });
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function createColumn(formData: FormData) {
  const boardId = String(formData.get("boardId"));
  const title = String(formData.get("title") || "").trim();
  if (!boardId || !title) return;
  const last = await prisma.column.findFirst({ where: { boardId }, orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;
  await prisma.column.create({ data: { boardId, title, order } });
  revalidatePath(`/boards/${boardId}`);
}

export async function updateColumn(formData: FormData) {
  const id = String(formData.get("id"));
  const boardId = String(formData.get("boardId"));
  const title = String(formData.get("title") || "").trim();
  if (!id || !title) return;
  await prisma.column.update({ where: { id }, data: { title } });
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function deleteColumn(formData: FormData) {
  const id = String(formData.get("id"));
  const boardId = String(formData.get("boardId"));
  if (!id) return;
  const tasks = await prisma.task.findMany({ where: { columnId: id }, select: { id: true } });
  const taskIds = tasks.map((t) => t.id);
  await prisma.subtask.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.task.deleteMany({ where: { columnId: id } });
  await prisma.column.delete({ where: { id } });
  if (boardId) revalidatePath(`/boards/${boardId}`);
}
