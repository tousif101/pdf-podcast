import type {
  EpisodeAudience,
  EpisodeFormat,
  EpisodeLength,
  EpisodeMode,
  EpisodeOptions,
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
  };
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
