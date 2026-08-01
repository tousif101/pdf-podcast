import type { EpisodeLength, EpisodeMode, EpisodeOptions } from "@/lib/types";

export type PresetId = "hosts" | "brief" | "verbatim";

export interface Preset {
  id: PresetId;
  title: string;
  glyph: string;
  hint: string;
  mode: EpisodeMode;
  length: EpisodeLength;
  options: Partial<EpisodeOptions>;
}

export const PRESETS: Preset[] = [
  {
    id: "hosts",
    title: "Two hosts talk it through",
    glyph: "◎",
    hint: "conversational",
    mode: "conversation",
    length: "standard",
    options: {
      length: "standard",
      format: "discussion",
      audience: "beginner",
      hostVoice: "Kore",
      guestVoice: "Puck",
    },
  },
  {
    id: "brief",
    title: "Just the brief",
    glyph: "≡",
    hint: "one voice",
    mode: "conversation",
    length: "short",
    options: {
      length: "short",
      format: "brief",
      audience: "beginner",
      hostVoice: "Charon",
    },
  },
  {
    id: "verbatim",
    title: "Read it to me, word for word",
    glyph: "“”",
    hint: "verbatim",
    mode: "reading",
    length: "standard",
    options: {
      length: "standard",
      readerVoice: "Enceladus",
    },
  },
];

/** Display-only estimates; the real price always comes from the quote API. */
export function presetEstimate(
  preset: Preset,
  quotedChars: number | null,
): { minutes: number; credits: number | null } {
  if (preset.mode === "reading") {
    if (quotedChars === null) return { minutes: 0, credits: null };
    return {
      minutes: Math.max(1, Math.round(quotedChars / 1_000)),
      credits: Math.max(1, Math.ceil(quotedChars / 25_000)),
    };
  }
  const minutes = preset.length === "short" ? 3 : 7;
  return { minutes, credits: 1 };
}
