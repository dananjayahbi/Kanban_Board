import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { path } = await req.json();
  if (typeof path === "string") revalidatePath(path);
  return NextResponse.json({ ok: true });
}
