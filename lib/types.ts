export type EpisodeStatus =
  | "pending"
  | "extracting"
  | "scripting"
  | "synthesizing"
  | "ready"
  | "error";

export type Speaker = "HOST" | "GUEST";

/** conversation = two-host discussion; reading = one voice reads the text verbatim. */
export type EpisodeMode = "conversation" | "reading";

export type EpisodeLength = "short" | "standard" | "deep";
/** Conversation formats. brief & lecture are single-voice; discussion & debate are two-voice. */
export type EpisodeFormat = "discussion" | "brief" | "debate" | "lecture";
export type EpisodeAudience = "beginner" | "expert";

export interface EpisodeOptions {
  length: EpisodeLength;
  format: EpisodeFormat;
  audience: EpisodeAudience;
  hostVoice: string;
  guestVoice: string;
  readerVoice: string;
}

export interface DialogueLine {
  speaker: Speaker;
  text: string;
}

export interface PodcastScript {
  title: string;
  lines: DialogueLine[];
}

/** Response of POST /api/episodes/quote — the price shown before generating. */
export interface UploadQuote {
  pages: number;
  chars: number;
  cost: number;
  estMinutes: number;
  /** null when the account is admin (unlimited). */
  balance: number | null;
  isAdmin: boolean;
}

export interface Episode {
  id: string;
  /** Owner; undefined only on legacy pre-auth episodes. */
  userId?: string;
  title: string;
  sourceFilename: string;
  mode?: EpisodeMode;
  options?: EpisodeOptions;
  status: EpisodeStatus;
  error?: string;
  createdAt: string;
  totalPages?: number;
  extractedChars?: number;
  script?: PodcastScript;
  audioMimeType?: string;
  durationSeconds?: number;
  providers?: { script: string; tts: string };
}
