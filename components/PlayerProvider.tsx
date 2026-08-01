"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Episode } from "@/lib/types";
import Player from "./Player";

export const SKIP_SECONDS = 15;
const SPEEDS = [1, 1.25, 1.5, 2, 3, 0.75];
const SPEED_KEY = "playback-speed";
const RESUME_KEY_PREFIX = "resume:";
const RESUME_SAVE_INTERVAL_S = 3;
// Don't bother resuming right at the start, and restart finished episodes.
const RESUME_MIN_S = 10;
const RESUME_END_MARGIN_S = 5;

function readSavedSpeed(): number {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

function readResumePosition(episodeId: string): number {
  try {
    const raw = localStorage.getItem(RESUME_KEY_PREFIX + episodeId);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) && value > RESUME_MIN_S ? value : 0;
  } catch {
    return 0;
  }
}

function writeResumePosition(episodeId: string, seconds: number) {
  try {
    localStorage.setItem(RESUME_KEY_PREFIX + episodeId, String(seconds));
  } catch {
    // Storage full/blocked: resume is best-effort.
  }
}

function clearResumePosition(episodeId: string) {
  try {
    localStorage.removeItem(RESUME_KEY_PREFIX + episodeId);
  } catch {
    // ignore
  }
}

const HANDLED_ACTIONS: MediaSessionAction[] = [
  "play",
  "pause",
  "seekbackward",
  "seekforward",
  "seekto",
  "stop",
];

export interface PlayerContextValue {
  episode: Episode | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  expanded: boolean;
  /** Starts (or toggles, when already current) an episode; optionally seeks first. */
  play: (episode: Episode, atSeconds?: number) => void;
  close: () => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  skip: (delta: number) => void;
  cycleSpeed: () => void;
  setExpanded: (expanded: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer must be used within PlayerProvider");
  return value;
}

export default function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedRef = useRef(0);
  const restoredRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [speed, setSpeed] = useState(() =>
    typeof window === "undefined" ? 1 : readSavedSpeed(),
  );

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

  const skip = useCallback(
    (delta: number) => {
      const audio = audioRef.current;
      if (audio) seekTo(audio.currentTime + delta);
    },
    [seekTo],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const play = useCallback(
    (next: Episode, atSeconds?: number) => {
      setEpisode((current) => {
        if (current?.id === next.id) {
          if (typeof atSeconds === "number") seekTo(atSeconds);
          else toggle();
          return current;
        }
        pendingSeekRef.current = typeof atSeconds === "number" ? atSeconds : null;
        restoredRef.current = false;
        lastSavedRef.current = 0;
        setPlaying(false);
        setCurrentTime(typeof atSeconds === "number" ? atSeconds : 0);
        setDuration(next.durationSeconds ?? 0);
        return next;
      });
    },
    [seekTo, toggle],
  );

  const close = useCallback(() => {
    setExpanded(false);
    setEpisode(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((current) => {
      const next = SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      try {
        localStorage.setItem(SPEED_KEY, String(next));
      } catch {
        // best-effort
      }
      return next;
    });
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

  const episodeId = episode?.id ?? null;

  const speedRefValue = useRef(speed);
  useEffect(() => {
    speedRefValue.current = speed;
  }, [speed]);

  // The audio element remounts per episode (key={episode.id}), so playback
  // starts once per episode, continuing from a pending or saved position.
  useEffect(() => {
    if (!episodeId) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speedRefValue.current;
    const pending = pendingSeekRef.current;
    pendingSeekRef.current = null;
    const saved = pending ?? readResumePosition(episodeId);
    if (saved > 0) {
      // Seeking before metadata loads is unreliable; apply on both paths.
      const apply = () => {
        if (restoredRef.current) return;
        if (
          pending !== null ||
          (Number.isFinite(audio.duration) &&
            saved < audio.duration - RESUME_END_MARGIN_S)
        ) {
          audio.currentTime = saved;
          setCurrentTime(saved);
        }
        restoredRef.current = true;
      };
      if (audio.readyState >= 1) apply();
      else audio.addEventListener("loadedmetadata", apply, { once: true });
    } else {
      restoredRef.current = true;
    }
    audio.play().catch(() => {
      // Autoplay can be blocked; the user can press play manually.
    });
  }, [episodeId]);

  // Persist position when switching episodes or closing the player.
  useEffect(() => {
    if (!episodeId) return;
    const audio = audioRef.current;
    return () => {
      if (audio && audio.currentTime > RESUME_MIN_S && !audio.ended) {
        writeResumePosition(episodeId, audio.currentTime);
      }
    };
  }, [episodeId]);

  useEffect(() => {
    if (!episode || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: "Earshot",
      album: episode.sourceFilename,
      artwork: [
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
    return () => {
      navigator.mediaSession.metadata = null;
    };
  }, [episode]);

  const hasEpisode = episode !== null;

  useEffect(() => {
    if (!hasEpisode || !("mediaSession" in navigator)) return;
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
      try {
        // Calling with no arguments clears the lock-screen position UI;
        // not all browsers implement it.
        session.setPositionState?.();
      } catch {
        // Ignore: unsupported or partial implementations may throw.
      }
      session.playbackState = "none";
    };
  }, [hasEpisode, seekTo]);

  const setSessionPlaybackState = (state: MediaSessionPlaybackState) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  };

  const value = useMemo<PlayerContextValue>(
    () => ({
      episode,
      playing,
      currentTime,
      duration,
      speed,
      expanded,
      play,
      close,
      toggle,
      seekTo,
      skip,
      cycleSpeed,
      setExpanded,
    }),
    [
      episode,
      playing,
      currentTime,
      duration,
      speed,
      expanded,
      play,
      close,
      toggle,
      seekTo,
      skip,
      cycleSpeed,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {episode && (
        <>
          <Player />
          <audio
            key={episode.id}
            ref={audioRef}
            src={`/api/episodes/${episode.id}/audio`}
            preload="metadata"
            onPlay={(event) => {
              event.currentTarget.playbackRate = speed;
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
              clearResumePosition(episode.id);
            }}
            onTimeUpdate={(event) => {
              const time = event.currentTarget.currentTime;
              setCurrentTime(time);
              updatePositionState();
              if (
                restoredRef.current &&
                time > RESUME_MIN_S &&
                Math.abs(time - lastSavedRef.current) >= RESUME_SAVE_INTERVAL_S
              ) {
                lastSavedRef.current = time;
                writeResumePosition(episode.id, time);
              }
            }}
            onDurationChange={(event) => {
              const value = event.currentTarget.duration;
              if (Number.isFinite(value)) setDuration(value);
              updatePositionState();
            }}
            onRateChange={updatePositionState}
          />
        </>
      )}
    </PlayerContext.Provider>
  );
}
