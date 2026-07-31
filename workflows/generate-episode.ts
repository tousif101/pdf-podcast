import { FatalError } from "workflow";
import type { Episode, PodcastScript } from "@/lib/types";

export async function generateEpisode(episodeId: string) {
  "use workflow";

  try {
    const { text } = await extractStep(episodeId);
    const script = await scriptStep(episodeId, text);
    await synthesizeStep(episodeId, script);
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)).replace(
      /^(Fatal|Retryable)Error:\s*/,
      "",
    );
    await failStep(episodeId, message);
    throw err;
  }
}

async function loadEpisode(episodeId: string): Promise<Episode> {
  const { getStore } = await import("@/lib/store");
  const episode = await getStore().get(episodeId);
  if (!episode) throw new FatalError(`Episode ${episodeId} not found`);
  return episode;
}

async function extractStep(episodeId: string) {
  "use step";
  const { getStore } = await import("@/lib/store");
  const { extractPdfText } = await import("@/lib/pipeline/extract");

  console.log(`[generate-episode:${episodeId}] extracting text`);
  const store = getStore();
  const episode = await loadEpisode(episodeId);
  await store.put({ ...episode, status: "extracting" });

  const source = await store.getSource(episodeId);
  if (!source) throw new FatalError("Source PDF is missing");

  try {
    const { text, totalPages } = await extractPdfText(source);
    await store.put({
      ...episode,
      status: "extracting",
      totalPages,
      extractedChars: text.length,
    });
    return { text, totalPages };
  } catch (err) {
    throw new FatalError(err instanceof Error ? err.message : String(err));
  }
}

async function scriptStep(episodeId: string, text: string) {
  "use step";
  const { getStore } = await import("@/lib/store");
  const { generatePodcastScript, scriptProviderName } = await import(
    "@/lib/pipeline/script"
  );

  console.log(`[generate-episode:${episodeId}] generating script`);
  const store = getStore();
  const episode = await loadEpisode(episodeId);
  await store.put({ ...episode, status: "scripting" });

  const script = await generatePodcastScript(text, episode.sourceFilename);
  await store.put({
    ...episode,
    status: "scripting",
    title: script.title,
    script,
    providers: {
      script: scriptProviderName(),
      tts: episode.providers?.tts ?? "",
    },
  });
  return script;
}

async function synthesizeStep(episodeId: string, script: PodcastScript) {
  "use step";
  const { getStore } = await import("@/lib/store");
  const { synthesizeDialogue, ttsProviderName } = await import(
    "@/lib/pipeline/tts"
  );

  console.log(`[generate-episode:${episodeId}] synthesizing audio`);
  const store = getStore();
  const episode = await loadEpisode(episodeId);
  await store.put({ ...episode, status: "synthesizing" });

  const { audio, mimeType, durationSeconds } = await synthesizeDialogue(script);
  const { url } = await store.saveAudio(episodeId, audio, mimeType);

  await store.put({
    ...(await loadEpisode(episodeId)),
    status: "ready",
    audioMimeType: mimeType,
    audioUrl: url,
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
  const { getStore } = await import("@/lib/store");
  const store = getStore();
  const episode = await store.get(episodeId);
  if (episode) {
    await store.put({ ...episode, status: "error", error: message });
  }
}
