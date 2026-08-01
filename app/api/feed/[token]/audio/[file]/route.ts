import { getStore, isValidEpisodeId } from "@/lib/store";
import { isValidFeedToken, userIdForFeedToken } from "@/lib/feed";

// Token-gated audio for podcast apps (no session cookie). The feed token
// authorizes access only to its owner's episodes.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; file: string }> },
) {
  const { token, file } = await params;
  const id = file.replace(/\.mp3$/i, "");
  if (!isValidFeedToken(token) || !isValidEpisodeId(id)) {
    return new Response("Not found", { status: 404 });
  }
  const userId = await userIdForFeedToken(token);
  if (!userId) {
    return new Response("Not found", { status: 404 });
  }

  const store = getStore();
  const episode = await store.get(id);
  if (!episode || episode.userId !== userId || episode.status !== "ready") {
    return new Response("Not found", { status: 404 });
  }

  const audio = await store.openAudio(id, request.headers.get("range"));
  if (!audio) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(
    audio.body instanceof Uint8Array ? Buffer.from(audio.body) : audio.body,
    { status: audio.status, headers: audio.headers },
  );
}
