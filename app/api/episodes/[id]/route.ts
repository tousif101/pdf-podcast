import { NextResponse } from "next/server";
import { getStore, isValidEpisodeId } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidEpisodeId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
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
  if (!isValidEpisodeId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await getStore().delete(id);
  return NextResponse.json({ ok: true });
}
