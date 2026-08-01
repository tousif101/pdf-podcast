"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import type { PodcastScript } from "@/lib/types";
import { formatTime } from "./format";
import Mark from "./ui/Mark";
import Eyebrow from "./ui/Eyebrow";
import Spinner from "./ui/Spinner";
import { useEffect } from "react";

interface SharedData {
  title: string;
  durationSeconds: number | null;
  script: PodcastScript | null;
}

const PREVIEW_LINES = 3;

export default function SharedEpisode({ token }: { token: string }) {
  const [data, setData] = useState<SharedData | null | "missing">(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch(`/api/share/${token}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData("missing"));
  }, [token]);

  if (data === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper" role="status">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (data === "missing") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <p className="text-[13.5px] text-ink-2">
          This episode is no longer shared.
        </p>
        <Link
          href="/"
          className="text-[13px] font-medium text-signal-ink underline underline-offset-[3px]"
        >
          Make your own with Earshot →
        </Link>
      </div>
    );
  }

  const totalDuration = duration || data.durationSeconds || 0;
  const progressPercent =
    totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const lines = data.script?.lines ?? [];
  const previewLines = showFullTranscript
    ? lines
    : lines.slice(0, PREVIEW_LINES);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex w-full max-w-[640px] items-center gap-2.5 px-5 py-5">
        <Mark size={26} />
        <span className="font-display text-[19px] leading-none text-ink">
          Earshot
        </span>
        <Link
          href="/signin"
          className="ml-auto text-[13px] font-medium text-signal-ink transition-colors hover:text-signal-press"
        >
          Make your own
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[640px] px-5 pb-14">
        <Eyebrow>Shared with you</Eyebrow>
        <h1 className="mt-2 font-display text-3xl leading-[1.1] text-ink">
          {data.title}
        </h1>
        {typeof data.durationSeconds === "number" && (
          <p className="mt-2 font-mono text-[11.5px] text-ink-4">
            {formatTime(data.durationSeconds)}
            {lines.length > 0 && " · two hosts"}
          </p>
        )}

        <div className="mt-5 rounded-[18px] bg-dark p-[18px]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-signal transition-colors hover:bg-signal-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              {playing ? (
                <svg viewBox="0 0 16 16" className="size-[18px] fill-white" aria-hidden="true">
                  <rect x="3" y="2" width="3.5" height="12" rx="1" />
                  <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 16 16"
                  className="size-[18px] translate-x-[1px] fill-white"
                  aria-hidden="true"
                >
                  <path d="M4.5 2.7c0-.9 1-1.5 1.8-1L13 6.9c.8.5.8 1.7 0 2.2l-6.7 5.2c-.8.5-1.8-.1-1.8-1V2.7z" />
                </svg>
              )}
            </button>
            <span className="font-mono text-[11px] tabular-nums text-dark-3xt">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              className="seek-slider flex-1"
              style={{ "--seek-progress": `${progressPercent}%` } as CSSProperties}
              min={0}
              max={totalDuration > 0 ? totalDuration : 1}
              step="any"
              value={Math.min(currentTime, totalDuration > 0 ? totalDuration : 1)}
              disabled={!(totalDuration > 0)}
              onChange={(event) => {
                const audio = audioRef.current;
                if (audio) audio.currentTime = Number(event.target.value);
              }}
              aria-label="Seek"
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(totalDuration)}`}
            />
            <span className="font-mono text-[11px] tabular-nums text-dark-3xt">
              {formatTime(totalDuration)}
            </span>
          </div>
          <audio
            ref={audioRef}
            src={`/api/share/${token}/audio`}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onDurationChange={(e) => {
              const value = e.currentTarget.duration;
              if (Number.isFinite(value)) setDuration(value);
            }}
          />
        </div>

        {lines.length > 0 && (
          <div className="mt-5 rounded-2xl border border-line bg-card p-5">
            {previewLines.map((line, i) => (
              <p
                key={i}
                className={`text-[13.5px] leading-[1.65] text-ink-2 ${i > 0 ? "mt-3" : ""}`}
              >
                <span
                  className={`mr-2 font-mono text-[11px] uppercase tracking-[.05em] ${
                    line.speaker === "GUEST" ? "text-done" : "text-signal-ink"
                  }`}
                >
                  {line.speaker}
                </span>
                {line.text}
              </p>
            ))}
            {lines.length > PREVIEW_LINES && (
              <button
                type="button"
                onClick={() => setShowFullTranscript((v) => !v)}
                aria-expanded={showFullTranscript}
                className="mt-4 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
              >
                {showFullTranscript ? "Show less" : "Read full transcript"}
              </button>
            )}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-signal-tint p-5 text-center">
          <p className="font-display text-[20px] leading-[1.2] text-ink">
            Turn your own reading pile into episodes
          </p>
          <Link
            href="/signin"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-signal px-7 py-[13px] text-[15px] font-medium text-white transition-colors hover:bg-signal-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            Start free
          </Link>
        </div>
      </main>
    </div>
  );
}
