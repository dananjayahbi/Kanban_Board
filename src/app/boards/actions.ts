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
          { title: "Backlog", order: 0, color: randomColor() },
          { title: "In Progress", order: 1, color: randomColor() },
          { title: "Review", order: 2, color: randomColor() },
          { title: "Done", order: 3, color: randomColor() },
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
  const color = String(formData.get("color") || "");
  const priorityId = String(formData.get("priorityId") || "");
  if (!title || !boardId || !columnId) return;
  const last = await prisma.task.findFirst({ where: { columnId }, orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;
  await prisma.task.create({
    data: {
      title,
      description,
      order,
      columnId,
      boardId,
      color: color || null,
      priorityId: priorityId || null,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
    },
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
  const color = String(formData.get("color") || "");
  const priorityId = String(formData.get("priorityId") || "");
  if (!id || !title) return;
  await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      color: color || null,
      priorityId: priorityId || null,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
    },
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

export async function snoozeTask(formData: FormData) {
  const id = String(formData.get("id"));
  const daysStr = String(formData.get("days") || "1");
  const boardId = String(formData.get("boardId") || "");
  const days = Number.isNaN(Number(daysStr)) ? 1 : Number(daysStr);
  if (!id) return;
  const t = await prisma.task.findUnique({ where: { id } });
  if (!t) return;
  const base = t.dueDate ? new Date(t.dueDate) : new Date();
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  await prisma.task.update({ where: { id }, data: { dueDate: next } });
  revalidatePath("/alerts");
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function setTaskCompleted(formData: FormData) {
  const id = String(formData.get("id"));
  const boardId = String(formData.get("boardId") || "");
  if (!id) return;
  await prisma.task.update({ where: { id }, data: { completed: true } });
  revalidatePath("/alerts");
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function createColumn(formData: FormData) {
  const boardId = String(formData.get("boardId"));
  const title = String(formData.get("title") || "").trim();
  const color = String(formData.get("color") || "");
  const wipStr = String(formData.get("wipLimit") || "");
  if (!boardId || !title) return;
  const last = await prisma.column.findFirst({ where: { boardId }, orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;
  await prisma.column.create({ data: { boardId, title, order, color: color || randomColor(), wipLimit: wipStr ? Number(wipStr) : null } });
  revalidatePath(`/boards/${boardId}`);
}

export async function updateColumn(formData: FormData) {
  const id = String(formData.get("id"));
  const boardId = String(formData.get("boardId"));
  const title = String(formData.get("title") || "").trim();
  const color = String(formData.get("color") || "");
  const wipStr = String(formData.get("wipLimit") || "");
  if (!id || !title) return;
  await prisma.column.update({ where: { id }, data: { title, color: color || undefined, wipLimit: wipStr ? Number(wipStr) : null } });
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

// Priority labels CRUD
export async function createPriority(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#6366f1");
  const levelStr = String(formData.get("level") || "0");
  if (!name) return;
  await prisma.priorityLabel.create({ data: { name, color, level: Number(levelStr) || 0 } });
  revalidatePath("/priorities");
}

export async function updatePriority(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#6366f1");
  const levelStr = String(formData.get("level") || "0");
  if (!id || !name) return;
  await prisma.priorityLabel.update({ where: { id }, data: { name, color, level: Number(levelStr) || 0 } });
  revalidatePath("/priorities");
}

export async function deletePriority(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.priorityLabel.delete({ where: { id } });
  revalidatePath("/priorities");
}

function randomColor() {
  const palette = ["#6366f1", "#22c55e", "#eab308", "#ef4444", "#06b6d4", "#a855f7", "#f97316"];
  return palette[Math.floor(Math.random() * palette.length)];
}
