import type { EpisodeFormat, EpisodeMode, EpisodeStatus } from "@/lib/types";

// Statuses that keep the client polling and hold a generation slot.
// script_ready waits on the user but still occupies a slot until resolved.
export const ACTIVE_STATUSES: EpisodeStatus[] = [
  "pending",
  "extracting",
  "scripting",
  "script_ready",
  "synthesizing",
];

export const STATUS_LABELS: Record<EpisodeStatus, string> = {
  pending: "Queued…",
  extracting: "Extracting text…",
  scripting: "Writing script…",
  script_ready: "Ready to review",
  synthesizing: "Generating audio…",
  ready: "Ready",
  error: "Failed",
};

export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const paddedSeconds = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

/** "two hosts", "brief", "debate", "lecture", or "read aloud" for meta lines. */
export function styleLabel(episode: {
  mode?: EpisodeMode;
  options?: { format?: EpisodeFormat };
}): string {
  if (episode.mode === "reading") return "read aloud";
  const format = episode.options?.format;
  if (format === "brief" || format === "debate" || format === "lecture") {
    return format;
  }
  return "two hosts";
}

/** "3h 44m" / "44m" for library totals. */
export function formatTotalDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/** Strips workflow-step prefixes and maps provider errors to plain English. */
export function friendlyErrorMessage(raw: string | undefined): string {
  const stripped = (raw ?? "")
    .replace(/^Step\s+"[^"]*"\s+failed(?:\s+after\s+\d+\s+retries)?:\s*/i, "")
    .trim();
  if (/429|rate limit|quota|resource.?exhausted/i.test(stripped)) {
    return "The voice service is at its daily limit right now — try again in a few hours.";
  }
  return stripped || "Something went wrong making this episode.";
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
