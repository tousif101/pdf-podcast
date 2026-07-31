"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Episode } from "@/lib/types";
import { formatTime } from "./format";

interface PlayerProps {
  episode: Episode;
  onClose: () => void;
}

const SKIP_SECONDS = 15;
const HANDLED_ACTIONS: MediaSessionAction[] = [
  "play",
  "pause",
  "seekbackward",
  "seekforward",
  "seekto",
  "stop",
];

export default function Player({ episode, onClose }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.durationSeconds ?? 0);

  const src = `/api/episodes/${episode.id}/audio`;

  const seekTo = useCallback((time: number, useFastSeek = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    let target = Math.max(0, time);
    if (Number.isFinite(audio.duration)) {
      target = Math.min(target, audio.duration);
    }
    const maybeFast = audio as HTMLAudioElement & {
      fastSeek?: (time: number) => void;
    };
    if (useFastSeek && typeof maybeFast.fastSeek === "function") {
      maybeFast.fastSeek(target);
    } else {
      audio.currentTime = target;
    }
  }, []);

  const updatePositionState = useCallback(() => {
    if (!("mediaSession" in navigator)) return;
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    if (typeof navigator.mediaSession.setPositionState !== "function") return;
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: Math.min(audio.currentTime, audio.duration),
    });
  }, []);

  // The parent remounts this component per episode (key={episode.id}), so
  // playback starts once on mount.
  useEffect(() => {
    audioRef.current?.play().catch(() => {
      // Autoplay can be blocked; the user can press play manually.
    });
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: "PDF Podcast",
      album: episode.sourceFilename,
      artwork: [
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
    return () => {
      navigator.mediaSession.metadata = null;
    };
  }, [episode.title, episode.sourceFilename]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    session.setActionHandler("play", () => {
      audioRef.current?.play().catch(() => {});
    });
    session.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    session.setActionHandler("seekbackward", (details) => {
      const audio = audioRef.current;
      if (!audio) return;
      seekTo(audio.currentTime - (details.seekOffset ?? SKIP_SECONDS));
    });
    session.setActionHandler("seekforward", (details) => {
      const audio = audioRef.current;
      if (!audio) return;
      seekTo(audio.currentTime + (details.seekOffset ?? SKIP_SECONDS));
    });
    session.setActionHandler("seekto", (details) => {
      if (typeof details.seekTime === "number") {
        seekTo(details.seekTime, details.fastSeek === true);
      }
    });
    session.setActionHandler("stop", () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      session.playbackState = "none";
    });

    return () => {
      for (const action of HANDLED_ACTIONS) {
        session.setActionHandler(action, null);
      }
      session.playbackState = "none";
    };
  }, [seekTo]);

  const setSessionPlaybackState = (state: MediaSessionPlaybackState) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto w-full max-w-xl px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-zinc-100">
            {episode.title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
            className="shrink-0 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <input
          type="range"
          className="seek-slider mt-1 w-full"
          style={{ "--seek-progress": `${progressPercent}%` } as React.CSSProperties}
          min={0}
          max={duration > 0 ? duration : 1}
          step="any"
          value={Math.min(currentTime, duration > 0 ? duration : 1)}
          disabled={!(duration > 0)}
          onChange={(event) => seekTo(Number(event.target.value))}
          aria-label="Seek"
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        />

        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mt-1 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => {
              const audio = audioRef.current;
              if (audio) seekTo(audio.currentTime - SKIP_SECONDS);
            }}
            aria-label="Rewind 15 seconds"
            className="relative rounded-full p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M9.5 3.5 7 6l2.5 2.5" />
              <path d="M7 6h6.5a7 7 0 1 1-7 7" />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center pt-2.5 text-[8px] font-bold"
              aria-hidden="true"
            >
              15
            </span>
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7"
              aria-hidden="true"
            >
              {playing ? (
                <path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z" />
              ) : (
                <path d="M8.5 5.5v13l10-6.5-10-6.5Z" />
              )}
            </svg>
          </button>

          <button
            type="button"
            onClick={() => {
              const audio = audioRef.current;
              if (audio) seekTo(audio.currentTime + SKIP_SECONDS);
            }}
            aria-label="Forward 15 seconds"
            className="relative rounded-full p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="m14.5 3.5 2.5 2.5-2.5 2.5" />
              <path d="M17 6h-6.5a7 7 0 1 0 7 7" />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center pt-2.5 text-[8px] font-bold"
              aria-hidden="true"
            >
              15
            </span>
          </button>
        </div>

        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlay={() => {
            setPlaying(true);
            setSessionPlaybackState("playing");
          }}
          onPause={() => {
            setPlaying(false);
            setSessionPlaybackState("paused");
          }}
          onEnded={() => {
            setPlaying(false);
            setSessionPlaybackState("paused");
          }}
          onTimeUpdate={(event) => {
            setCurrentTime(event.currentTarget.currentTime);
            updatePositionState();
          }}
          onDurationChange={(event) => {
            const value = event.currentTarget.duration;
            if (Number.isFinite(value)) setDuration(value);
            updatePositionState();
          }}
          onRateChange={updatePositionState}
        />
      </div>
    </div>
  );
}
