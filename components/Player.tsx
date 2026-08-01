"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { isSingleVoiceFormat, normalizeOptions } from "@/lib/options";
import type { Episode } from "@/lib/types";
import { formatTime } from "./format";
import { SKIP_SECONDS, usePlayer } from "./PlayerProvider";
import DownloadButton from "./DownloadButton";
import ShareButton from "./ShareButton";
import PlayButton from "./ui/PlayButton";
import Eyebrow from "./ui/Eyebrow";

const BAR_HEIGHTS = [30, 56, 88, 44, 72, 36, 60];

function voicesLine(episode: Episode): string {
  const options = normalizeOptions(episode.options);
  if (episode.mode === "reading") return `Read aloud · ${options.readerVoice}`;
  if (isSingleVoiceFormat(options.format)) {
    return `One voice · ${options.hostVoice}`;
  }
  return `Two hosts · ${options.hostVoice} & ${options.guestVoice}`;
}

function SkipButton({
  direction,
  onClick,
}: {
  direction: -1 | 1;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        direction === -1
          ? `Rewind ${SKIP_SECONDS} seconds`
          : `Forward ${SKIP_SECONDS} seconds`
      }
      className="relative rounded-full p-2 text-dark-text transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-8"
        aria-hidden="true"
      >
        {direction === -1 ? (
          <>
            <path d="M9.5 3.5 7 6l2.5 2.5" />
            <path d="M7 6h6.5a7 7 0 1 1-7 7" />
          </>
        ) : (
          <>
            <path d="m14.5 3.5 2.5 2.5-2.5 2.5" />
            <path d="M17 6h-6.5a7 7 0 1 0 7 7" />
          </>
        )}
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center pt-2.5 font-mono text-[8px] font-medium"
        aria-hidden="true"
      >
        {SKIP_SECONDS}
      </span>
    </button>
  );
}

function SeekSlider({ light = false }: { light?: boolean }) {
  const { currentTime, duration, seekTo } = usePlayer();
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <input
      type="range"
      className={`seek-slider ${light ? "seek-slider-light" : ""} w-full`}
      style={{ "--seek-progress": `${progressPercent}%` } as CSSProperties}
      min={0}
      max={duration > 0 ? duration : 1}
      step="any"
      value={Math.min(currentTime, duration > 0 ? duration : 1)}
      disabled={!(duration > 0)}
      onChange={(event) => seekTo(Number(event.target.value))}
      aria-label="Seek"
      aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
    />
  );
}

function CloseButton({ dark }: { dark?: boolean }) {
  const { close } = usePlayer();
  return (
    <button
      type="button"
      onClick={close}
      aria-label="Close player"
      className={`shrink-0 rounded-full p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
        dark ? "text-dark-3xt hover:text-dark-text" : "text-ink-4 hover:text-ink"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="size-4"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

function MiniPlayer() {
  const { episode, playing, currentTime, duration, speed, toggle, setExpanded } =
    usePlayer();
  if (!episode) return null;

  return (
    <>
      {/* Mobile: floating card, tap to open the full player. */}
      <div
        className="fixed inset-x-0 z-30 mx-3.5 lg:hidden"
        style={{ bottom: "calc(0.875rem + var(--mini-lift, 0px))" }}
      >
        <div className="flex items-center gap-3 rounded-[18px] border border-line bg-card px-3 py-2.5 shadow-[0_4px_16px_rgba(23,21,15,.09)]">
          <PlayButton
            size="xs"
            playing={playing}
            onClick={toggle}
            aria-label={playing ? `Pause ${episode.title}` : `Play ${episode.title}`}
          />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            aria-label={`Open player for ${episode.title}`}
          >
            <p className="truncate text-[12.5px] font-medium text-ink">
              {episode.title}
            </p>
            <p className="font-mono text-[10px] text-ink-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={`Playback speed ${speed}×`}
            className="shrink-0 font-mono text-[11px] text-ink-3"
          >
            {speed}×
          </button>
          <CloseButton />
        </div>
      </div>

      {/* Laptop: docked dark bar. */}
      <div className="fixed inset-x-0 bottom-0 z-30 hidden bg-dark px-[60px] py-3 lg:block">
        <div className="mx-auto flex max-w-[1140px] items-center gap-4">
          <PlayButton
            size="sm"
            focal
            playing={playing}
            onClick={toggle}
            aria-label={playing ? `Pause ${episode.title}` : `Play ${episode.title}`}
          />
          <span className="font-mono text-[11.5px] tabular-nums text-dark-2xt">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1">
            <SeekSlider />
          </div>
          <span className="font-mono text-[11.5px] tabular-nums text-dark-2xt">
            {formatTime(duration)}
          </span>
          <p className="max-w-[260px] truncate text-[13px] font-medium text-dark-text">
            {episode.title}
          </p>
          <SpeedButton dark />
          <CloseButton dark />
        </div>
      </div>
    </>
  );
}

function SpeedButton({ dark = false }: { dark?: boolean }) {
  const { speed, cycleSpeed } = usePlayer();
  return (
    <button
      type="button"
      onClick={cycleSpeed}
      aria-label={`Playback speed ${speed}×, tap to change`}
      className={`w-[38px] shrink-0 rounded-full py-1 text-center font-mono text-[13px] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
        dark ? "text-dark-2xt hover:text-dark-text" : "text-ink-3 hover:text-ink"
      }`}
    >
      {speed}×
    </button>
  );
}

function FullPlayer() {
  const {
    episode,
    playing,
    currentTime,
    duration,
    toggle,
    skip,
    setExpanded,
  } = usePlayer();
  if (!episode) return null;

  const remaining = Math.max(0, duration - currentTime);

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-dark"
      role="dialog"
      aria-modal="true"
      aria-label={`Now playing: ${episode.title}`}
    >
      <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Collapse player"
            className="rounded-full p-2 text-dark-2xt hover:text-dark-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="m5 9 7 7 7-7" />
            </svg>
          </button>
          <Eyebrow className="text-dark-3xt!">Now playing</Eyebrow>
          <span className="size-8" aria-hidden="true" />
        </div>

        <div className="mt-6 flex aspect-square items-end justify-center gap-[5px] rounded-[20px] bg-dark-2 p-10">
          {BAR_HEIGHTS.map((height, index) => (
            <span
              key={index}
              className={`w-full max-w-[34px] rounded-[5px] origin-bottom ${
                index === 2 || index === 3 ? "bg-signal" : "bg-dark-3"
              } ${playing ? "motion-safe:animate-[eq-bar_1.3s_ease-in-out_infinite]" : ""}`}
              style={{
                height: `${height}%`,
                animationDelay: `${index * 0.13}s`,
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        <h2 className="mt-6 font-display text-[26px] leading-[1.1] text-dark-text">
          {episode.title}
        </h2>
        <p className="mt-1 text-[12px] text-dark-3xt">{voicesLine(episode)}</p>

        <div className="mt-5">
          <SeekSlider />
          <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-dark-3xt">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remaining)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <SpeedButton dark />
          <SkipButton direction={-1} onClick={() => skip(-SKIP_SECONDS)} />
          <PlayButton
            size="xl"
            focal
            playing={playing}
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
          />
          <SkipButton direction={1} onClick={() => skip(SKIP_SECONDS)} />
          <span className="flex w-[38px] justify-center">
            <DownloadButton episodeId={episode.id} variant="icon" />
          </span>
        </div>

        <div className="mt-7 flex justify-center gap-2.5">
          {episode.script && episode.script.lines.length > 0 && (
            <Link
              href={`/e/${episode.id}/transcript`}
              onClick={() => setExpanded(false)}
              className="rounded-full bg-dark-2 px-[14px] py-2 text-[12.5px] font-medium text-dark-2xt transition-colors hover:text-dark-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Transcript
            </Link>
          )}
          <ShareButton
            episodeId={episode.id}
            initialShared={Boolean(episode.shareToken)}
            dark
          />
        </div>
      </div>
    </div>
  );
}

export default function Player() {
  const { expanded } = usePlayer();
  return expanded ? <FullPlayer /> : <MiniPlayer />;
}
