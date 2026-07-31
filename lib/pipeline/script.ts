import { z } from "zod";
import type { PodcastScript } from "../types";

// Keeps the combined dialogue within a single Gemini TTS call and a ~10 minute episode.
const MAX_SOURCE_CHARS = 60_000;
const MAX_SCRIPT_CHARS = 4_500;

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
    .describe("The full dialogue, alternating naturally between speakers"),
});

const SYSTEM_PROMPT = `You are a world-class podcast producer. You turn documents into engaging,
natural two-person podcast conversations between HOST (curious, guides the conversation,
asks sharp questions) and GUEST (an expert who explains the material vividly with analogies
and concrete examples).

Rules:
- Open with the HOST welcoming listeners and introducing the topic in one or two sentences.
- Cover the document's most important ideas accurately; do not invent facts.
- Keep it conversational: short turns, interruptions, reactions ("Right", "Wow, okay"), no lists.
- Close with the HOST summarizing the single biggest takeaway and signing off.
- Total dialogue length must stay under ${MAX_SCRIPT_CHARS} characters (roughly 6-8 spoken minutes).`;

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
): Promise<PodcastScript> {
  const text = sourceText.slice(0, MAX_SOURCE_CHARS);
  if (!hasScriptCredentials()) {
    return mockScript(text, sourceFilename);
  }

  try {
    const { generateText, Output } = await import("ai");
    const { output } = await generateText({
      model: scriptProviderName(),
      system: SYSTEM_PROMPT,
      output: Output.object({ schema: scriptSchema }),
      prompt: `Turn the following document ("${sourceFilename}") into a podcast script.\n\n<document>\n${text}\n</document>`,
    });
    return output as PodcastScript;
  } catch (err) {
    // Gateway not set up (no billing, expired OIDC, …) shouldn't kill the
    // episode; fall back to the deterministic script and say so in providers.
    console.error(
      "Script generation via AI Gateway failed, falling back to mock:",
      err instanceof Error ? err.message : err,
    );
    scriptFellBack = true;
    return mockScript(text, sourceFilename);
  }
}

function mockScript(text: string, sourceFilename: string): PodcastScript {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 20)
    .slice(0, 12);
  const title = sourceFilename.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  const lines: PodcastScript["lines"] = [
    {
      speaker: "HOST",
      text: `Welcome back to the show. Today we're digging into ${title}.`,
    },
    { speaker: "GUEST", text: "Thanks for having me. There's a lot in here." },
  ];
  sentences.forEach((sentence, i) => {
    lines.push({
      speaker: i % 2 === 0 ? "GUEST" : "HOST",
      text: sentence.trim(),
    });
  });
  lines.push({
    speaker: "HOST",
    text: "That's all the time we have. Thanks for listening, and see you next episode.",
  });
  return { title, lines };
}
