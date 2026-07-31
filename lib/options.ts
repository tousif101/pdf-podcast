import type {
  DialogueLine,
  EpisodeAudience,
  EpisodeFormat,
  EpisodeLength,
  EpisodeMode,
  EpisodeOptions,
  PodcastScript,
} from "./types";
import {
  DEFAULT_GUEST_VOICE,
  DEFAULT_HOST_VOICE,
  DEFAULT_READER_VOICE,
  normalizeVoice,
} from "./voices";

const LENGTHS: EpisodeLength[] = ["short", "standard", "deep"];
const FORMATS: EpisodeFormat[] = ["discussion", "brief", "debate", "lecture"];
const AUDIENCES: EpisodeAudience[] = ["beginner", "expert"];

// Single-voice conversation formats speak only in the host voice.
export const SINGLE_VOICE_FORMATS: EpisodeFormat[] = ["brief", "lecture"];

export interface LengthBudget {
  /** Max characters of dialogue an LLM script may produce. */
  scriptChars: number;
  /** Max source characters read verbatim in reading mode. */
  readChars: number;
  approxMinutes: number;
}

export const LENGTH_BUDGETS: Record<EpisodeLength, LengthBudget> = {
  short: { scriptChars: 2_000, readChars: 30_000, approxMinutes: 3 },
  standard: { scriptChars: 4_500, readChars: 100_000, approxMinutes: 7 },
  deep: { scriptChars: 9_000, readChars: 200_000, approxMinutes: 15 },
};

function pick<T>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Validates/normalizes untrusted option input into a complete EpisodeOptions. */
export function normalizeOptions(input: unknown): EpisodeOptions {
  const o = (input ?? {}) as Record<string, unknown>;
  return {
    length: pick(o.length, LENGTHS, "standard"),
    format: pick(o.format, FORMATS, "discussion"),
    audience: pick(o.audience, AUDIENCES, "beginner"),
    hostVoice: normalizeVoice(o.hostVoice, DEFAULT_HOST_VOICE),
    guestVoice: normalizeVoice(o.guestVoice, DEFAULT_GUEST_VOICE),
    readerVoice: normalizeVoice(o.readerVoice, DEFAULT_READER_VOICE),
    reviewScript: o.reviewScript === true,
  };
}

const MAX_SCRIPT_LINES = 600;
const MAX_LINE_CHARS = 5_000;

export interface ScriptValidation {
  ok: boolean;
  error?: string;
  script?: PodcastScript;
}

export function scriptChars(script: PodcastScript): number {
  return script.lines.reduce((n, l) => n + l.text.trim().length, 0);
}

/** How much a user may grow an edited script over the original they paid for:
 *  10% proportional headroom plus a small absolute allowance for a short add. */
export function editCharBudget(originalChars: number): number {
  return Math.round(originalChars * 1.1) + 200;
}

// Validates a user-edited script and caps total length so editing can't
// inflate TTS cost beyond the script the user already paid to generate.
export function validateEditedScript(
  input: unknown,
  maxChars: number,
): ScriptValidation {
  const raw = input as { title?: unknown; lines?: unknown } | null;
  if (!raw || !Array.isArray(raw.lines)) {
    return { ok: false, error: "Script must have a lines array" };
  }
  if (raw.lines.length === 0) {
    return { ok: false, error: "Script cannot be empty" };
  }
  if (raw.lines.length > MAX_SCRIPT_LINES) {
    return { ok: false, error: `Too many lines (max ${MAX_SCRIPT_LINES})` };
  }
  const lines: DialogueLine[] = [];
  let total = 0;
  for (const entry of raw.lines) {
    const line = entry as { speaker?: unknown; text?: unknown };
    if (line.speaker !== "HOST" && line.speaker !== "GUEST") {
      return { ok: false, error: "Each line needs speaker HOST or GUEST" };
    }
    if (typeof line.text !== "string") {
      return { ok: false, error: "Each line needs text" };
    }
    const text = line.text.trim();
    if (text.length === 0) continue;
    if (text.length > MAX_LINE_CHARS) {
      return { ok: false, error: "A line is too long" };
    }
    total += text.length;
    lines.push({ speaker: line.speaker, text });
  }
  if (lines.length === 0) {
    return { ok: false, error: "Script cannot be empty" };
  }
  if (total > maxChars) {
    return {
      ok: false,
      error: "Edited script is longer than the version you generated",
    };
  }
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim().slice(0, 200)
      : "Untitled episode";
  return { ok: true, script: { title, lines } };
}

export function isSingleVoiceFormat(format: EpisodeFormat): boolean {
  return SINGLE_VOICE_FORMATS.includes(format);
}

/** The character budget that drives credit cost for a given mode + length. */
export function readCharBudget(mode: EpisodeMode, length: EpisodeLength): number {
  return mode === "reading"
    ? LENGTH_BUDGETS[length].readChars
    : LENGTH_BUDGETS[length].scriptChars;
}
