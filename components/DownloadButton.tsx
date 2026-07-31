"use client";

import { useEffect, useState } from "react";

const AUDIO_CACHE = "episode-audio";

type DownloadState =
  | "checking"
  | "unsupported"
  | "idle"
  | "downloading"
  | "downloaded"
  | "error";

export default function DownloadButton({ episodeId }: { episodeId: string }) {
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

  if (state === "downloaded") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
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
          className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        state === "error"
          ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      } ${state === "downloading" ? "opacity-60" : ""}`}
    >
      {state === "downloading" ? (
        <>
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"
            aria-hidden="true"
          />
          Downloading…
        </>
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M12 4v10m0 0 4-4m-4 4-4-4" />
            <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
          </svg>
          {state === "error" ? "Download failed — retry" : "Download for offline"}
        </>
      )}
    </button>
  );
}
