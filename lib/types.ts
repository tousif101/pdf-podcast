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

export interface DialogueLine {
  speaker: Speaker;
  text: string;
}

export interface PodcastScript {
  title: string;
  lines: DialogueLine[];
}

export interface Episode {
  id: string;
  title: string;
  sourceFilename: string;
  mode?: EpisodeMode;
  status: EpisodeStatus;
  error?: string;
  createdAt: string;
  totalPages?: number;
  extractedChars?: number;
  script?: PodcastScript;
  audioMimeType?: string;
  /** Absolute URL when stored in Blob; undefined when served via the audio route. */
  audioUrl?: string;
  durationSeconds?: number;
  providers?: { script: string; tts: string };
}
