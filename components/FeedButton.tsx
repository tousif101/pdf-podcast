"use client";

import { useState } from "react";

export default function FeedButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openSheet = async () => {
    setOpen(true);
    if (url || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.url) throw new Error(body?.error ?? "Failed");
      setUrl(body.url);
    } catch {
      setError("Could not load your feed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; user can select manually
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void openSheet()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="h-4 w-4 text-violet-400"
          aria-hidden="true"
        >
          <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1.5" fill="currentColor" />
        </svg>
        Subscribe in a podcast app
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Podcast feed"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-zinc-800 bg-zinc-950 p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-50">
                Your private podcast feed
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
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
            <p className="mt-1 text-sm text-zinc-400">
              Add this URL in Apple Podcasts, Pocket Casts, or any app (Add a
              show by URL). New episodes appear automatically. Keep it private —
              anyone with the link can listen.
            </p>

            {busy ? (
              <p className="mt-5 text-sm text-zinc-500">Loading…</p>
            ) : error ? (
              <p className="mt-5 text-sm text-red-400">{error}</p>
            ) : (
              url && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
                    <span className="min-w-0 flex-1 truncate px-1 text-xs text-zinc-400">
                      {url}
                    </span>
                    <button
                      type="button"
                      onClick={() => void copy()}
                      className="shrink-0 rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-400"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}
