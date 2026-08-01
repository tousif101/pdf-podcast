import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isValidShareToken } from "@/lib/share";

// Public metadata for a shared episode (no auth — the token is the grant).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidShareToken(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const episode = await getStore().getByShareToken(token);
  if (!episode || episode.shareToken !== token || episode.status !== "ready") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    title: episode.title,
    durationSeconds: episode.durationSeconds ?? null,
    script: episode.script ?? null,
  });
}
