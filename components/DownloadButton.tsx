"use client";

import { useEffect, useState } from "react";
import Spinner from "./ui/Spinner";

const AUDIO_CACHE = "episode-audio";

type DownloadState =
  | "checking"
  | "unsupported"
  | "idle"
  | "downloading"
  | "downloaded"
  | "error";

interface DownloadButtonProps {
  episodeId: string;
  /** chip = paper surfaces (episode row menu); icon = dark full player. */
  variant?: "chip" | "icon";
  onStateChange?: (downloaded: boolean) => void;
}

export default function DownloadButton({
  episodeId,
  variant = "chip",
  onStateChange,
}: DownloadButtonProps) {
  const url = `/api/episodes/${episodeId}/audio`;
  const [state, setState] = useState<DownloadState>(() =>
    typeof window !== "undefined" && "caches" in window
      ? "checking"
      : "unsupported",
  );

  useEffect(() => {
    if (!("caches" in window)) return;
    let cancelled = false;
    caches
      .open(AUDIO_CACHE)
      .then((cache) => cache.match(url, { ignoreSearch: true }))
      .then((hit) => {
        if (!cancelled) setState(hit ? "downloaded" : "idle");
      })
      .catch(() => {
        if (!cancelled) setState("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    onStateChange?.(state === "downloaded");
  }, [state, onStateChange]);

  const download = async () => {
    setState("downloading");
    try {
      const cache = await caches.open(AUDIO_CACHE);
      const res = await fetch(url);
      if (res.ok) {
        await cache.put(url, res);
        setState("downloaded");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  const remove = async () => {
    try {
      const cache = await caches.open(AUDIO_CACHE);
      await cache.delete(url, { ignoreSearch: true });
      setState("idle");
    } catch {
      setState("downloaded");
    }
  };

  if (state === "unsupported" || state === "checking") return null;

  if (variant === "icon") {
    if (state === "downloading") {
      return <Spinner className="border-dark-2xt" />;
    }
    return (
      <button
        type="button"
        onClick={() => void (state === "downloaded" ? remove() : download())}
        aria-label={
          state === "downloaded"
            ? "Remove offline download"
            : state === "error"
              ? "Retry offline download"
              : "Download for offline listening"
        }
        className={`rounded-full p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
          state === "downloaded"
            ? "text-done"
            : "text-dark-2xt hover:text-dark-text"
        }`}
      >
        {state === "downloaded" ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
            aria-hidden="true"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M12 4v10m0 0 4-4m-4 4-4-4" />
            <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
          </svg>
        )}
      </button>
    );
  }

  if (state === "downloaded") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-done-tint px-[14px] py-2 text-[12.5px] font-medium text-done">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5"
            aria-hidden="true"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
          Saved offline
        </span>
        <button
          type="button"
          onClick={() => void remove()}
          aria-label="Remove offline download"
          className="rounded-full px-2 py-2 text-[12px] font-medium text-ink-4 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          Remove
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void download()}
      disabled={state === "downloading"}
      aria-label={
        state === "error"
          ? "Retry offline download"
          : "Download episode for offline listening"
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-[14px] py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
        state === "error"
          ? "bg-signal-tint text-signal-ink"
          : "bg-paper-2 text-ink-2 hover:bg-line"
      } ${state === "downloading" ? "opacity-60" : ""}`}
    >
      {state === "downloading" ? (
        <>
          <Spinner className="size-3 border-ink-4" />
          Downloading…
        </>
      ) : state === "error" ? (
        "Download failed — retry"
      ) : (
        "Download for offline"
      )}
    </button>
  );
}
