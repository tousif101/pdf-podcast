"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Episode, EpisodeStatus } from "@/lib/types";
import { STATUS_LABELS, formatDate, formatTime, styleLabel } from "./format";
import { usePlayer } from "./PlayerProvider";
import DownloadButton from "./DownloadButton";
import ShareButton from "./ShareButton";
import PlayButton from "./ui/PlayButton";
import Spinner from "./ui/Spinner";

interface EpisodeCardProps {
  episode: Episode;
  onDelete: () => void;
  onTryAnother: () => void;
}

// Stage index over the 4 in-progress statuses drives the thin progress bar.
const STAGE_INDEX: Partial<Record<EpisodeStatus, number>> = {
  pending: 1,
  extracting: 2,
  scripting: 3,
  synthesizing: 4,
};

function OverflowMenu({
  episode,
  onDelete,
  onDownloadedChange,
}: {
  episode: Episode;
  onDelete: () => void;
  onDownloadedChange: (downloaded: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const hasTranscript = Boolean(
    episode.script && episode.script.lines.length > 0,
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`More actions for ${episode.title}`}
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full text-ink-4 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 w-56 rounded-2xl border border-line bg-card p-2 shadow-[0_4px_16px_rgba(23,21,15,.09)]">
          {hasTranscript && (
            <Link
              href={`/e/${episode.id}/transcript`}
              className="block rounded-lg px-3 py-2 text-[13px] font-medium text-ink-2 hover:bg-paper-2 lg:hidden"
            >
              Transcript
            </Link>
          )}
          <div className="px-1 py-1.5 lg:hidden">
            <ShareButton
              episodeId={episode.id}
              initialShared={Boolean(episode.shareToken)}
            />
          </div>
          <div className="px-1 py-1.5">
            <DownloadButton
              episodeId={episode.id}
              onStateChange={onDownloadedChange}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-signal-ink underline-offset-[3px] hover:underline"
          >
            Delete episode
          </button>
        </div>
      )}
    </div>
  );
}

export default function EpisodeCard({
  episode,
  onDelete,
  onTryAnother,
}: EpisodeCardProps) {
  const player = usePlayer();
  const [downloaded, setDownloaded] = useState(false);
  const onDownloadedChange = useCallback(
    (value: boolean) => setDownloaded(value),
    [],
  );

  const isReady = episode.status === "ready";
  const isError = episode.status === "error";
  const needsReview = episode.status === "script_ready";
  const inProgress = !isReady && !isError && !needsReview;
  const isCurrent = player.episode?.id === episode.id;

  const shell = `rounded-2xl border transition-colors ${
    isCurrent ? "border-signal bg-[#FFF8F5]" : "border-line bg-card"
  }`;

  const title = (
    <p className="truncate font-display text-base leading-tight text-ink lg:text-[19px]">
      {episode.title}
    </p>
  );

  if (needsReview) {
    return (
      <li className={shell}>
        <Link
          href={`/e/${episode.id}/script`}
          className="flex items-center gap-3 p-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal lg:gap-4 lg:px-[18px] lg:py-[15px]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-signal-tint text-signal-ink lg:size-11">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4.5"
              aria-hidden="true"
            >
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            {title}
            <span className="mt-0.5 block truncate font-mono text-[11.5px] text-signal-ink">
              {STATUS_LABELS[episode.status]} · {formatDate(episode.createdAt)}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-signal-tint px-[14px] py-2 text-[12.5px] font-medium text-signal-ink">
            Review script
          </span>
        </Link>
      </li>
    );
  }

  if (inProgress) {
    const stage = STAGE_INDEX[episode.status] ?? 1;
    return (
      <li className={`${shell} p-[13px] lg:px-[18px] lg:py-[15px]`}>
        <div className="flex items-center gap-3 lg:gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-signal-tint lg:size-11">
            <Spinner />
          </span>
          <div className="min-w-0 flex-1">
            {title}
            <p
              role="status"
              className="mt-0.5 truncate font-mono text-[11.5px] text-signal"
            >
              {STATUS_LABELS[episode.status]}
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 px-1.5 py-2 text-[13px] font-medium text-ink-3 underline-offset-[3px] hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            Cancel
          </button>
        </div>
        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-line-2">
          <div
            className="h-full rounded-full bg-signal transition-[width] duration-700"
            style={{ width: `${(stage / 4) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-[11.5px] text-ink-4">
          Usually about 90 seconds. You can close the app — we&apos;ll keep
          going.
        </p>
      </li>
    );
  }

  if (isError) {
    return (
      <li className={`${shell} flex items-center gap-3 p-[13px] lg:gap-4 lg:px-[18px] lg:py-[15px]`}>
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-paper-2 font-mono text-[15px] font-medium text-signal-ink lg:size-11"
          aria-hidden="true"
        >
          !
        </span>
        <div className="min-w-0 flex-1">
          {title}
          <p className="mt-0.5 text-[12.5px] leading-snug text-signal-ink">
            {episode.error || "Something went wrong making this episode."}{" "}
            Credit refunded.
          </p>
        </div>
        <button
          type="button"
          onClick={onTryAnother}
          className="shrink-0 rounded-full border border-ink px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          Try another
        </button>
        <OverflowMenu
          episode={episode}
          onDelete={onDelete}
          onDownloadedChange={onDownloadedChange}
        />
      </li>
    );
  }

  const meta = [
    typeof episode.durationSeconds === "number"
      ? formatTime(episode.durationSeconds)
      : null,
    styleLabel(episode),
    formatDate(episode.createdAt),
    downloaded ? "downloaded" : null,
  ].filter(Boolean);

  return (
    <li className={`${shell} flex items-center gap-3 p-[13px] lg:gap-4 lg:px-[18px] lg:py-[15px]`}>
      <PlayButton
        size="sm"
        playing={isCurrent && player.playing}
        focal={isCurrent}
        onClick={() => player.play(episode)}
        aria-label={
          isCurrent
            ? player.playing
              ? `Pause ${episode.title}`
              : `Resume ${episode.title}`
            : `Play ${episode.title}`
        }
        className="lg:size-11"
      />
      <button
        type="button"
        onClick={() => player.play(episode)}
        className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        {title}
        <span className="mt-0.5 block truncate font-mono text-[11.5px] text-ink-4">
          {meta.join(" · ")}
        </span>
      </button>
      {episode.script && episode.script.lines.length > 0 && (
        <Link
          href={`/e/${episode.id}/transcript`}
          className="hidden shrink-0 rounded-full bg-paper-2 px-[14px] py-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal lg:inline-flex"
        >
          Transcript
        </Link>
      )}
      <span className="hidden shrink-0 lg:inline-flex">
        <ShareButton
          episodeId={episode.id}
          initialShared={Boolean(episode.shareToken)}
        />
      </span>
      <OverflowMenu
        episode={episode}
        onDelete={onDelete}
        onDownloadedChange={onDownloadedChange}
      />
    </li>
  );
}
