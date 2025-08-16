import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { taskId, toColumnId } = await req.json();
    if (!taskId || !toColumnId) return Response.json({ ok: false, error: "missing" }, { status: 400 });
    const last = await prisma.task.findFirst({ where: { columnId: toColumnId }, orderBy: { order: "desc" } });
    const order = (last?.order ?? 0) + 1;
    await prisma.task.update({ where: { id: taskId }, data: { columnId: toColumnId, order } });
    return Response.json({ ok: true, order });
  } catch (e) {
    return Response.json({ ok: false }, { status: 500 });
  }
}
