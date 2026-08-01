import { getStore } from "@/lib/store";
import { buildRssXml, isValidFeedToken, userIdForFeedToken } from "@/lib/feed";

// Public (token-authed) podcast feed. The token in the URL is the bearer
// secret, so any podcast app can subscribe without a login.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidFeedToken(token)) {
    return new Response("Not found", { status: 404 });
  }
  const userId = await userIdForFeedToken(token);
  if (!userId) {
    return new Response("Not found", { status: 404 });
  }

  const episodes = await getStore().list({ userId });
  const origin = new URL(request.url).origin;
  const xml = buildRssXml(episodes, {
    feedUrl: `${origin}/api/feed/${token}/rss.xml`,
    audioBase: `${origin}/api/feed/${token}/audio`,
    imageUrl: `${origin}/icons/icon-512.png`,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "private, max-age=60",
    },
  });
}
