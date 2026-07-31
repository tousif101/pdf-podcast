import { NextResponse } from "next/server";
import { getStore, isValidEpisodeId } from "@/lib/store";
import { canAccessEpisode, getSessionUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidEpisodeId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const episode = await getStore().get(id);
  if (!episode || !canAccessEpisode(user, episode.userId)) {
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
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const store = getStore();
  const episode = await store.get(id);
  if (!episode || !canAccessEpisode(user, episode.userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await store.delete(id);
  return NextResponse.json({ ok: true });
}
