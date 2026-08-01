"use client";

import { useState } from "react";
import Sheet from "./ui/Sheet";
import Spinner from "./ui/Spinner";

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
        className="block py-1 text-left text-[13px] font-medium text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        Subscribe in a podcast app
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        aria-label="Podcast feed"
      >
        <h2 className="font-display text-[26px] leading-[1.1] text-ink">
          Your private feed
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-2">
          Add this URL in Apple Podcasts, Pocket Casts, or any app (Add a show
          by URL). New episodes appear automatically. Keep it private — anyone
          with the link can listen.
        </p>

        {busy ? (
          <div className="mt-5 flex items-center gap-2 text-[13px] text-ink-3">
            <Spinner className="size-3.5" /> Loading…
          </div>
        ) : error ? (
          <p className="mt-5 text-[13px] text-signal-ink" role="alert">
            {error}
          </p>
        ) : (
          url && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-line bg-paper-3 p-2">
              <span className="min-w-0 flex-1 truncate px-2 font-mono text-[11px] text-ink-3">
                {url}
              </span>
              <button
                type="button"
                onClick={() => void copy()}
                className="shrink-0 rounded-full bg-paper-2 px-[14px] py-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )
        )}
      </Sheet>
    </>
  );
}
