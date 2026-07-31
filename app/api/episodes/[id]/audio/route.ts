import { getStore, isValidEpisodeId } from "@/lib/store";
import { canAccessEpisode, getSessionUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidEpisodeId(id)) {
    return new Response("Invalid id", { status: 400 });
  }
  const user = await getSessionUser();
  if (!user) {
    return new Response("Sign in required", { status: 401 });
  }
  const store = getStore();
  const episode = await store.get(id);
  if (!episode || !canAccessEpisode(user, episode.userId)) {
    return new Response("Not found", { status: 404 });
  }

  const audio = await store.openAudio(id, request.headers.get("range"));
  if (!audio) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(audio.body instanceof Uint8Array ? Buffer.from(audio.body) : audio.body, {
    status: audio.status,
    headers: audio.headers,
  });
}
