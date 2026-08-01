import { getStore } from "@/lib/store";
import { isValidShareToken } from "@/lib/share";

// Public audio for a shared episode (no auth — the token is the grant).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidShareToken(token)) {
    return new Response("Not found", { status: 404 });
  }
  const store = getStore();
  const episode = await store.getByShareToken(token);
  if (!episode || episode.shareToken !== token || episode.status !== "ready") {
    return new Response("Not found", { status: 404 });
  }
  const audio = await store.openAudio(episode.id, request.headers.get("range"));
  if (!audio) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(
    audio.body instanceof Uint8Array ? Buffer.from(audio.body) : audio.body,
    { status: audio.status, headers: audio.headers },
  );
}
