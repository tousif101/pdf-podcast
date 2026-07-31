import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const episode = await getStore().get(id);
  if (!episode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(episode);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getStore().delete(id);
  return NextResponse.json({ ok: true });
}
