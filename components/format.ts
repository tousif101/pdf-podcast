import type { EpisodeStatus } from "@/lib/types";

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

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
