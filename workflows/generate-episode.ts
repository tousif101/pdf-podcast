import { FatalError } from "workflow";
import type { PodcastScript } from "@/lib/types";

export async function generateEpisode(episodeId: string) {
  "use workflow";

  try {
    const text = await extractStep(episodeId);
    const script = await scriptStep(episodeId, text);
    await synthesizeStep(episodeId, script);
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err))
      .replace(/^(Fatal|Retryable)Error:\s*/, "")
      .slice(0, 300);
    await failStep(episodeId, message);
    throw err;
  }
}

async function extractStep(episodeId: string): Promise<string> {
  "use step";
  console.log(`[generate-episode:${episodeId}] extracting text`);
  const { getStore } = await import("@/lib/store");
  const { extractPdfText } = await import("@/lib/pipeline/extract");

  const store = getStore();
  if (!(await store.patch(episodeId, { status: "extracting" }))) {
    throw new FatalError("Episode was deleted");
  }

  const source = await store.getSource(episodeId);
  if (!source) throw new FatalError("Source PDF is missing");

  let text: string;
  let totalPages: number;
  try {
    ({ text, totalPages } = await extractPdfText(source));
  } catch (err) {
    // Un-parseable/empty PDFs will never succeed on retry.
    throw new FatalError(err instanceof Error ? err.message : String(err));
  }
  await store.patch(episodeId, {
    totalPages,
    extractedChars: text.length,
  });
  return text;
}

async function scriptStep(
  episodeId: string,
  text: string,
): Promise<PodcastScript> {
  "use step";
  console.log(`[generate-episode:${episodeId}] generating script`);
  const { getStore } = await import("@/lib/store");
  const { generatePodcastScript, verbatimScript, scriptProviderName } =
    await import("@/lib/pipeline/script");

  const store = getStore();
  const episode = await store.patch(episodeId, { status: "scripting" });
  if (!episode) throw new FatalError("Episode was deleted");

  const script =
    episode.mode === "reading"
      ? verbatimScript(text, episode.sourceFilename)
      : await generatePodcastScript(text, episode.sourceFilename);
  await store.patch(episodeId, {
    title: script.title,
    script,
    providers: {
      script: episode.mode === "reading" ? "verbatim" : scriptProviderName(),
      tts: "",
    },
  });
  return script;
}

async function synthesizeStep(episodeId: string, script: PodcastScript) {
  "use step";
  console.log(`[generate-episode:${episodeId}] synthesizing audio`);
  const { getStore } = await import("@/lib/store");
  const { synthesizeDialogue, ttsProviderName } = await import(
    "@/lib/pipeline/tts"
  );

  const store = getStore();
  const episode = await store.patch(episodeId, { status: "synthesizing" });
  if (!episode) throw new FatalError("Episode was deleted");

  const { audio, mimeType, durationSeconds } = await synthesizeDialogue(
    script,
    episode.mode ?? "conversation",
  );
  await store.saveAudio(episodeId, audio, mimeType);

  await store.patch(episodeId, {
    status: "ready",
    audioMimeType: mimeType,
    durationSeconds: Math.round(durationSeconds),
    providers: {
      script: episode.providers?.script ?? "",
      tts: ttsProviderName(),
    },
  });
}

async function failStep(episodeId: string, message: string) {
  "use step";
  console.error(`[generate-episode:${episodeId}] failed: ${message}`);
  try {
    const { getStore } = await import("@/lib/store");
    const episode = await getStore().patch(episodeId, {
      status: "error",
      error: message,
    });
    if (episode?.userId) {
      const { refundEpisode } = await import("@/lib/credits");
      // No-op unless a spend row exists for this episode, so admin runs and
      // retries are safe.
      await refundEpisode(episode.userId, episodeId);
    }
  } catch (patchErr) {
    // Never mask the original workflow error with a bookkeeping failure.
    console.error(
      `[generate-episode:${episodeId}] could not record failure:`,
      patchErr,
    );
  }
}
