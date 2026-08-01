import { createHook, FatalError } from "workflow";

export async function generateEpisode(
  episodeId: string,
  reviewScript = false,
) {
  "use workflow";

  try {
    const text = await extractStep(episodeId);
    await scriptStep(episodeId, text);
    if (reviewScript) {
      // Suspend (free) until the user approves the script from the review UI.
      // The PATCH /script route saves any edits then resumes this token.
      await markScriptReady(episodeId);
      const hook = createHook<{ ok: boolean }>({
        token: `approve:${episodeId}`,
      });
      await hook;
    }
    await synthesizeStep(episodeId);
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err))
      .replace(/^(Fatal|Retryable)Error:\s*/, "")
      .slice(0, 300);
    await failStep(episodeId, message);
    throw err;
  }
}

async function markScriptReady(episodeId: string) {
  "use step";
  console.log(`[generate-episode:${episodeId}] awaiting script review`);
  const { getStore } = await import("@/lib/store");
  if (!(await getStore().patch(episodeId, { status: "script_ready" }))) {
    throw new FatalError("Episode was deleted");
  }
}

async function extractStep(episodeId: string): Promise<string> {
  "use step";
  console.log(`[generate-episode:${episodeId}] extracting text`);
  const { getStore } = await import("@/lib/store");
  const { extractPdfText } = await import("@/lib/pipeline/extract");

  const store = getStore();
  const episode = await store.patch(episodeId, { status: "extracting" });
  if (!episode) throw new FatalError("Episode was deleted");

  // New episodes store pre-extracted (possibly multi-PDF) text; fall back to
  // extracting a raw PDF for any legacy episode.
  let text: string;
  let totalPages: number;
  const storedText = await store.getSourceText(episodeId);
  if (storedText !== null) {
    text = storedText;
    totalPages = episode.totalPages ?? 0;
  } else {
    const source = await store.getSource(episodeId);
    if (!source) throw new FatalError("Source is missing");
    try {
      ({ text, totalPages } = await extractPdfText(source));
    } catch (err) {
      throw new FatalError(err instanceof Error ? err.message : String(err));
    }
  }
  await store.patch(episodeId, {
    totalPages,
    extractedChars: text.length,
  });
  return text;
}

async function scriptStep(episodeId: string, text: string): Promise<void> {
  "use step";
  console.log(`[generate-episode:${episodeId}] generating script`);
  const { getStore } = await import("@/lib/store");
  const { generatePodcastScript, verbatimScript, scriptProviderName } =
    await import("@/lib/pipeline/script");
  const { normalizeOptions, LENGTH_BUDGETS } = await import("@/lib/options");

  const store = getStore();
  const episode = await store.patch(episodeId, { status: "scripting" });
  if (!episode) throw new FatalError("Episode was deleted");

  const options = normalizeOptions(episode.options);
  const script =
    episode.mode === "reading"
      ? verbatimScript(
          text,
          episode.sourceFilename,
          LENGTH_BUDGETS[options.length].readChars,
        )
      : await generatePodcastScript(text, episode.sourceFilename, options);
  await store.patch(episodeId, {
    title: script.title,
    script,
    providers: {
      script: episode.mode === "reading" ? "verbatim" : scriptProviderName(),
      tts: "",
    },
  });
}

async function synthesizeStep(episodeId: string) {
  "use step";
  console.log(`[generate-episode:${episodeId}] synthesizing audio`);
  const { getStore } = await import("@/lib/store");
  const { synthesizeDialogue, ttsProviderName } = await import(
    "@/lib/pipeline/tts"
  );
  const { normalizeOptions } = await import("@/lib/options");

  const store = getStore();
  const episode = await store.patch(episodeId, { status: "synthesizing" });
  if (!episode) throw new FatalError("Episode was deleted");
  // The script in the DB may have been edited during review — it's the source
  // of truth, not whatever scriptStep originally produced.
  const script = episode.script;
  if (!script) throw new FatalError("Script is missing");

  const { audio, mimeType, durationSeconds } = await synthesizeDialogue(
    script,
    episode.mode ?? "conversation",
    normalizeOptions(episode.options),
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
