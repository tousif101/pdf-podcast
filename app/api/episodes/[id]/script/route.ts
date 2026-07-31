import { NextResponse } from "next/server";
import { resumeHook } from "workflow/api";
import { getStore, isValidEpisodeId } from "@/lib/store";
import { canAccessEpisode, getSessionUser } from "@/lib/auth";
import { normalizeOptions, validateEditedScript } from "@/lib/options";

// Saves the user's edited script and resumes the paused workflow so audio
// generation continues. Only valid while the episode awaits review.
export async function PATCH(
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
  if (episode.status !== "script_ready") {
    return NextResponse.json(
      { error: "This episode is not awaiting review" },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const options = normalizeOptions(episode.options);
  const check = validateEditedScript(
    body,
    episode.mode ?? "conversation",
    options.length,
  );
  if (!check.ok || !check.script) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  await store.patch(id, { title: check.script.title, script: check.script });
  try {
    await resumeHook(`approve:${id}`, { ok: true });
  } catch (err) {
    console.error(`Failed to resume workflow for ${id}:`, err);
    return NextResponse.json(
      { error: "Could not resume generation" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
