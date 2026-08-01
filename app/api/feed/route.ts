import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateFeedToken } from "@/lib/feed";

// Returns the caller's private podcast feed URL (creating a token on first use).
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const token = await getOrCreateFeedToken(user.id);
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    url: `${origin}/api/feed/${token}/rss.xml`,
  });
}
