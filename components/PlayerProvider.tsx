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

/** Saved resume position for an episode, 0 when none. Safe on the server. */
export function getResumeSeconds(episodeId: string): number {
  if (typeof window === "undefined") return 0;
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

interface PendingSeek {
  episodeId: string;
  seconds: number;
  /** Resume seeks are skipped near the end; explicit seeks always apply. */
  fromResume: boolean;
}

export default function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const episodeRef = useRef<Episode | null>(null);
  const lastSavedRef = useRef(0);
  const restoredRef = useRef(true);
  const pendingSeekRef = useRef<PendingSeek | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [speed, setSpeed] = useState(() =>
    typeof window === "undefined" ? 1 : readSavedSpeed(),
  );
  const speedRef = useRef(speed);

  const persistPosition = useCallback(() => {
    const audio = audioRef.current;
    const current = episodeRef.current;
    if (
      audio &&
      current &&
      audio.currentTime > RESUME_MIN_S &&
      !audio.ended
    ) {
      writeResumePosition(current.id, audio.currentTime);
    }
  }, []);

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

  // Called from click handlers; audio.play() must run synchronously here so
  // strict autoplay policies (Safari) see it inside the user gesture.
  const play = useCallback(
    (next: Episode, atSeconds?: number) => {
      const audio = audioRef.current;
      const current = episodeRef.current;
      if (current?.id === next.id) {
        if (typeof atSeconds === "number") {
          seekTo(atSeconds);
          if (audio?.paused) audio.play().catch(() => {});
        } else {
          toggle();
        }
        return;
      }

      persistPosition();
      const target =
        typeof atSeconds === "number" ? atSeconds : getResumeSeconds(next.id);
      pendingSeekRef.current =
        target > 0
          ? {
              episodeId: next.id,
              seconds: target,
              fromResume: typeof atSeconds !== "number",
            }
          : null;
      restoredRef.current = pendingSeekRef.current === null;
      lastSavedRef.current = 0;
      episodeRef.current = next;
      setEpisode(next);
      setPlaying(false);
      setCurrentTime(target > 0 ? target : 0);
      setDuration(next.durationSeconds ?? 0);

      if (audio) {
        audio.src = `/api/episodes/${next.id}/audio`;
        audio.playbackRate = speedRef.current;
        audio.load();
        audio.play().catch(() => {
          // Playback can still be refused (e.g. network); UI stays paused so
          // the next tap retries inside a fresh gesture.
        });
      }
    },
    [persistPosition, seekTo, toggle],
  );

  const close = useCallback(() => {
    persistPosition();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    episodeRef.current = null;
    pendingSeekRef.current = null;
    setExpanded(false);
    setEpisode(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [persistPosition]);

  const cycleSpeed = useCallback(() => {
    setSpeed((current) => {
      const next = SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length];
      speedRef.current = next;
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

  // Persist the position when the tab is backgrounded or closed.
  useEffect(() => {
    window.addEventListener("pagehide", persistPosition);
    return () => window.removeEventListener("pagehide", persistPosition);
  }, [persistPosition]);

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
      {episode && <Player />}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          const pending = pendingSeekRef.current;
          if (pending && pending.episodeId === episodeRef.current?.id) {
            const applies =
              !pending.fromResume ||
              (Number.isFinite(audio.duration) &&
                pending.seconds < audio.duration - RESUME_END_MARGIN_S);
            if (applies) {
              audio.currentTime = pending.seconds;
              setCurrentTime(pending.seconds);
            }
          }
          pendingSeekRef.current = null;
          restoredRef.current = true;
        }}
        onPlay={(event) => {
          event.currentTarget.playbackRate = speedRef.current;
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
          const current = episodeRef.current;
          if (current) clearResumePosition(current.id);
        }}
        onTimeUpdate={(event) => {
          const time = event.currentTarget.currentTime;
          setCurrentTime(time);
          updatePositionState();
          const current = episodeRef.current;
          if (
            current &&
            restoredRef.current &&
            time > RESUME_MIN_S &&
            Math.abs(time - lastSavedRef.current) >= RESUME_SAVE_INTERVAL_S
          ) {
            lastSavedRef.current = time;
            writeResumePosition(current.id, time);
          }
        }}
        onDurationChange={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value)) setDuration(value);
          updatePositionState();
        }}
        onRateChange={updatePositionState}
      />
    </PlayerContext.Provider>
  );
}
