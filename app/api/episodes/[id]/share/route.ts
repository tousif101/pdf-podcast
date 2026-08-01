import { NextResponse } from "next/server";
import { getStore, isValidEpisodeId } from "@/lib/store";
import { canAccessEpisode, getSessionUser } from "@/lib/auth";
import { newShareToken } from "@/lib/share";

// Toggles a public share link for a ready episode.
export async function POST(
  request: Request,
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

  const body = (await request.json().catch(() => null)) as {
    enabled?: boolean;
  } | null;
  const enabled = body?.enabled === true;

  if (!enabled) {
    await store.setShareToken(id, null);
    return NextResponse.json({ url: null });
  }
  if (episode.status !== "ready") {
    return NextResponse.json(
      { error: "Only ready episodes can be shared" },
      { status: 409 },
    );
  }
  const token = episode.shareToken ?? newShareToken();
  if (!episode.shareToken) await store.setShareToken(id, token);
  const origin = new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/s/${token}` });
}
