"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Episode, Speaker } from "@/lib/types";
import { isSingleVoiceFormat, normalizeOptions } from "@/lib/options";
import { formatTime } from "./format";
import { usePlayer } from "./PlayerProvider";
import Spinner from "./ui/Spinner";

export default function TranscriptView({ id }: { id: string }) {
  const player = usePlayer();
  const [episode, setEpisode] = useState<Episode | "missing" | null>(null);
  const [follow, setFollow] = useState(true);
  const rowRefs = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    fetch(`/api/episodes/${id}`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Episode>) : Promise.reject()))
      .then(setEpisode)
      .catch(() => setEpisode("missing"));
  }, [id]);

  const data = episode !== null && episode !== "missing" ? episode : null;
  const isCurrent = data !== null && player.episode?.id === data.id;
  const duration = isCurrent
    ? player.duration
    : (data?.durationSeconds ?? 0);

  // Line start times are estimated by character position across the episode —
  // close enough for TTS pacing to follow playback and seek by line.
  const lineTimes = useMemo(() => {
    const lines = data?.script?.lines ?? [];
    const totalChars = lines.reduce((n, l) => n + l.text.length, 0) || 1;
    const times: number[] = [];
    let elapsedChars = 0;
    for (const line of lines) {
      times.push((elapsedChars / totalChars) * duration);
      elapsedChars += line.text.length;
    }
    return times;
  }, [data, duration]);

  const currentIndex = useMemo(() => {
    if (!isCurrent) return -1;
    let index = -1;
    for (let i = 0; i < lineTimes.length; i++) {
      if (lineTimes[i] <= player.currentTime) index = i;
      else break;
    }
    return index;
  }, [isCurrent, lineTimes, player.currentTime]);

  // Auto-scroll follows playback until the user scrolls on their own.
  useEffect(() => {
    if (!follow || currentIndex < 0) return;
    rowRefs.current
      .get(currentIndex)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [follow, currentIndex]);

  useEffect(() => {
    const stopFollowing = () => setFollow(false);
    window.addEventListener("wheel", stopFollowing, { passive: true });
    window.addEventListener("touchmove", stopFollowing, { passive: true });
    return () => {
      window.removeEventListener("wheel", stopFollowing);
      window.removeEventListener("touchmove", stopFollowing);
    };
  }, []);

  if (episode === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper" role="status" aria-label="Loading">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!data || !data.script || data.script.lines.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <p className="text-[13.5px] text-ink-2">
          This transcript isn&apos;t available.
        </p>
        <Link
          href="/"
          className="text-[13px] font-medium text-signal-ink underline underline-offset-[3px]"
        >
          Back to your library
        </Link>
      </div>
    );
  }

  const options = normalizeOptions(data.options);
  const voiceName = (speaker: Speaker) =>
    speaker === "GUEST"
      ? options.guestVoice
      : data.mode === "reading"
        ? options.readerVoice
        : options.hostVoice;
  const singleVoice =
    data.mode === "reading" || isSingleVoiceFormat(options.format);

  return (
    <div className="min-h-dvh bg-paper pb-36 lg:pb-28">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[720px] items-center gap-3 px-5 py-3.5">
          <Link
            href="/"
            aria-label="Back to library"
            className="shrink-0 rounded-full p-1.5 text-ink-3 transition-colors hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4.5"
              aria-hidden="true"
            >
              <path d="M19 12H5m0 0 6 6m-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-ink">Transcript</p>
            <p className="truncate font-display text-[13px] text-ink-3">
              {data.title}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFollow((v) => !v)}
            aria-pressed={follow}
            className={`shrink-0 rounded-full px-[14px] py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
              follow
                ? "bg-signal-tint text-signal-ink"
                : "bg-paper-2 text-ink-2 hover:bg-line"
            }`}
          >
            Follow ▸
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-5 pt-5">
        <ol className="space-y-1">
          {data.script.lines.map((line, i) => {
            const current = i === currentIndex;
            return (
              <li key={i}>
                <button
                  type="button"
                  ref={(el) => {
                    if (el) rowRefs.current.set(i, el);
                    else rowRefs.current.delete(i);
                  }}
                  onClick={() => {
                    setFollow(true);
                    player.play(data, lineTimes[i]);
                  }}
                  className="grid w-full grid-cols-[44px_1fr] items-start gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  <span
                    className={`pt-2 font-mono text-[10.5px] tabular-nums ${
                      current ? "text-signal" : "text-ink-5"
                    }`}
                  >
                    {duration > 0 ? formatTime(lineTimes[i]) : "·"}
                  </span>
                  <span
                    className={`rounded-lg px-1.5 py-1.5 text-[14px] leading-[1.65] ${
                      current ? "bg-signal-tint text-ink" : "text-ink-4"
                    }`}
                  >
                    {!singleVoice && (
                      <span
                        className={`mr-2 font-mono text-[11px] uppercase tracking-[.05em] ${
                          line.speaker === "GUEST" ? "text-done" : "text-signal-ink"
                        }`}
                      >
                        {voiceName(line.speaker)}
                      </span>
                    )}
                    {line.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
