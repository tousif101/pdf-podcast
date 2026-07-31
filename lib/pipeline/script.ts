import { z } from "zod";
import type { EpisodeFormat, EpisodeOptions, PodcastScript } from "../types";
import { isSingleVoiceFormat, LENGTH_BUDGETS } from "../options";

const MAX_SOURCE_CHARS = 200_000;

const scriptSchema = z.object({
  title: z
    .string()
    .describe("A short, catchy episode title based on the document"),
  lines: z
    .array(
      z.object({
        speaker: z.enum(["HOST", "GUEST"]),
        text: z.string(),
      }),
    )
    .describe("The dialogue, alternating naturally between speakers"),
});

const FORMAT_BRIEF: Record<EpisodeFormat, string> = {
  discussion:
    "a natural two-person conversation between HOST (curious, asks sharp questions) and GUEST (an expert who explains vividly with analogies). Short turns, real reactions, no lists.",
  brief:
    "a tight solo briefing delivered entirely by HOST — a single confident narrator summarizing the essentials. Every line uses speaker HOST. No second speaker.",
  debate:
    "a lively debate between HOST and GUEST who take opposing positions on the document's key claims, each making their strongest case and rebutting the other. Keep it sharp but fair.",
  lecture:
    "an in-depth expert lecture delivered entirely by HOST — a knowledgeable teacher walking through the material with rigor and structure, the depth of an 80,000 Hours briefing. Every line uses speaker HOST. No second speaker.",
};

function systemPrompt(options: EpisodeOptions): string {
  const budget = LENGTH_BUDGETS[options.length];
  const audience =
    options.audience === "expert"
      ? "Assume an expert listener; use precise terminology and go deep."
      : "Assume a curious newcomer; explain jargon in plain language.";
  return `You are a world-class podcast producer. Turn documents into ${FORMAT_BRIEF[options.format]}

Rules:
- Open by welcoming listeners and naming the topic in one or two sentences.
- Cover the document's most important ideas accurately; do not invent facts.
- ${audience}
- Close with the single biggest takeaway and a sign-off.
- Total spoken text must stay under ${budget.scriptChars} characters (about ${budget.approxMinutes} minutes).`;
}

let scriptFellBack = false;

export function scriptProviderName(): string {
  if (scriptFellBack) return "mock (gateway unavailable)";
  return hasScriptCredentials()
    ? (process.env.PODCAST_SCRIPT_MODEL ?? "anthropic/claude-sonnet-5")
    : "mock";
}

function hasScriptCredentials(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.VERCEL,
  );
}

export async function generatePodcastScript(
  sourceText: string,
  sourceFilename: string,
  options: EpisodeOptions,
): Promise<PodcastScript> {
  const text = sourceText.slice(0, MAX_SOURCE_CHARS);
  if (!hasScriptCredentials()) {
    return mockScript(text, sourceFilename, options);
  }

  try {
    const { generateText, Output } = await import("ai");
    const { output } = await generateText({
      model: scriptProviderName(),
      system: systemPrompt(options),
      output: Output.object({ schema: scriptSchema }),
      prompt: `Turn the following document ("${sourceFilename}") into a podcast script.\n\n<document>\n${text}\n</document>`,
    });
    const script = output as PodcastScript;
    // Single-voice formats must not contain a GUEST speaker.
    if (isSingleVoiceFormat(options.format)) {
      script.lines = script.lines.map((l) => ({ ...l, speaker: "HOST" }));
    }
    return script;
  } catch (err) {
    console.error(
      "Script generation via AI Gateway failed, falling back to mock:",
      err instanceof Error ? err.message : err,
    );
    scriptFellBack = true;
    return mockScript(text, sourceFilename, options);
  }
}

// "Read aloud" mode: no LLM, no summarizing — the extracted text becomes the
// script verbatim, chunked into narrator lines so TTS requests stay small and
// the transcript stays scrollable.
const READ_CHUNK_CHARS = 900;

export function verbatimScript(
  sourceText: string,
  sourceFilename: string,
  maxChars: number,
): PodcastScript {
  const title = sourceFilename.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  const text = sourceText.slice(0, maxChars);
  const sentences = text.split(/(?<=[.!?])\s+/);
  const lines: PodcastScript["lines"] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > READ_CHUNK_CHARS) {
      lines.push({ speaker: "HOST", text: current });
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) lines.push({ speaker: "HOST", text: current });
  return { title, lines };
}

function mockScript(
  text: string,
  sourceFilename: string,
  options: EpisodeOptions,
): PodcastScript {
  const single = isSingleVoiceFormat(options.format);
  const all = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
  const target = Math.max(
    8,
    Math.round(LENGTH_BUDGETS[options.length].scriptChars / 110),
  );
  const step = Math.max(1, Math.floor(all.length / target));
  const sentences = all.filter((_, i) => i % step === 0).slice(0, target);
  const title = sourceFilename.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  const lines: PodcastScript["lines"] = [
    {
      speaker: "HOST",
      text: `Welcome back to the show. Today we're digging into ${title}.`,
    },
  ];
  if (!single) {
    lines.push({
      speaker: "GUEST",
      text: "Thanks for having me. There's a lot in here.",
    });
  }
  sentences.forEach((sentence, i) => {
    lines.push({
      speaker: single || i % 2 === 1 ? "HOST" : "GUEST",
      text: sentence.trim(),
    });
  });
  lines.push({
    speaker: "HOST",
    text: "That's the big picture. Thanks for listening, and see you next time.",
  });
  return { title, lines };
}
