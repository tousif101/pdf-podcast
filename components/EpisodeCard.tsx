"use client";

import type { Episode } from "@/lib/types";
import { STATUS_LABELS, formatDate, formatTime } from "./format";
import DownloadButton from "./DownloadButton";

interface EpisodeCardProps {
  episode: Episode;
  isCurrent: boolean;
  expanded: boolean;
  onPlay: () => void;
  onToggleExpand: () => void;
  onDelete: () => void;
}

export default function EpisodeCard({
  episode,
  isCurrent,
  expanded,
  onPlay,
  onToggleExpand,
  onDelete,
}: EpisodeCardProps) {
  const isReady = episode.status === "ready";
  const isError = episode.status === "error";
  const inProgress = !isReady && !isError;

  const meta = [formatDate(episode.createdAt)];
  if (isReady && typeof episode.durationSeconds === "number") {
    meta.push(formatTime(episode.durationSeconds));
  }

  const titleBlock = (
    <>
      <p className="truncate font-medium text-zinc-100">{episode.title}</p>
      <p className="mt-0.5 truncate text-xs text-zinc-400">
        {meta.filter(Boolean).join(" · ")}
      </p>
    </>
  );

  return (
    <li
      className={`overflow-hidden rounded-2xl border transition-colors ${
        isCurrent
          ? "border-violet-500/60 bg-violet-500/5"
          : "border-zinc-800 bg-zinc-900/60"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isError
              ? "bg-red-500/15 text-red-400"
              : "bg-violet-500/15 text-violet-300"
          }`}
        >
          {isReady ? (
            <button
              type="button"
              onClick={onPlay}
              aria-label={
                isCurrent
                  ? `Now playing ${episode.title}`
                  : `Play ${episode.title}`
              }
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-violet-500/25"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                {isCurrent ? (
                  <path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z" />
                ) : (
                  <path d="M8.5 5.5v13l10-6.5-10-6.5Z" />
                )}
              </svg>
            </button>
          ) : isError ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 7v6m0 4h.01" />
            </svg>
          ) : (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-transparent"
              aria-hidden="true"
            />
          )}
        </span>

        {isReady ? (
          <button
            type="button"
            onClick={onPlay}
            className="min-w-0 flex-1 text-left"
          >
            {titleBlock}
          </button>
        ) : (
          <div className="min-w-0 flex-1">{titleBlock}</div>
        )}

        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${episode.title}`}
          className="shrink-0 rounded-full p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5"
            aria-hidden="true"
          >
            <path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {inProgress && (
        <div
          className="flex items-center gap-2 px-4 pb-4 text-sm text-violet-300"
          role="status"
        >
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-violet-400"
            aria-hidden="true"
          />
          {STATUS_LABELS[episode.status]}
        </div>
      )}

      {isError && (
        <p className="px-4 pb-4 text-sm text-red-400">
          {episode.error || "Something went wrong generating this episode."}
        </p>
      )}

      {isReady && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
          <DownloadButton episodeId={episode.id} />
          {episode.script && episode.script.lines.length > 0 && (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={expanded}
              className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
            >
              {expanded ? "Hide transcript" : "Transcript"}
            </button>
          )}
        </div>
      )}

      {isReady && expanded && episode.script && (
        <div className="space-y-3 border-t border-zinc-800 px-4 py-4">
          {episode.script.lines.map((line, index) => (
            <div key={index} className="flex gap-3">
              <span
                className={`mt-0.5 h-fit shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                  line.speaker === "HOST"
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {line.speaker}
              </span>
              <p className="text-sm leading-relaxed text-zinc-300">
                {line.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
