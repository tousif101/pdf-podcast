"use client";

import { useState } from "react";

interface ShareButtonProps {
  episodeId: string;
  initialShared: boolean;
  /** Dark chip styling for the full player. */
  dark?: boolean;
}

export default function ShareButton({
  episodeId,
  initialShared,
  dark = false,
}: ShareButtonProps) {
  const [shared, setShared] = useState(initialShared);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const chipClass = dark
    ? "rounded-full bg-dark-2 px-[14px] py-2 text-[12.5px] font-medium text-dark-2xt transition-colors hover:text-dark-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-40"
    : "rounded-full bg-paper-2 px-[14px] py-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-40";

  const setEnabled = async (enabled: boolean): Promise<string | null> => {
    const res = await fetch(`/api/episodes/${episodeId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const body = (await res.json().catch(() => null)) as {
      url?: string | null;
    } | null;
    if (!res.ok) throw new Error("share failed");
    return enabled ? (body?.url ?? null) : null;
  };

  const shareAndCopy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const link = url ?? (await setEnabled(true));
      setShared(true);
      setUrl(link);
      if (link) {
        try {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // clipboard blocked; the link stays available on the next tap
        }
      }
    } catch {
      // leave state unchanged; the user can retry
    } finally {
      setBusy(false);
    }
  };

  const unshare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setEnabled(false);
      setShared(false);
      setUrl(null);
    } catch {
      // retryable
    } finally {
      setBusy(false);
    }
  };

  if (!shared) {
    return (
      <button
        type="button"
        onClick={() => void shareAndCopy()}
        disabled={busy}
        className={chipClass}
      >
        {busy ? "Sharing…" : "Share"}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => void shareAndCopy()}
        disabled={busy}
        className={chipClass}
      >
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={() => void unshare()}
        disabled={busy}
        aria-label="Stop sharing this episode"
        className={`rounded-full px-1.5 py-2 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
          dark ? "text-dark-3xt hover:text-dark-text" : "text-ink-4 hover:text-ink"
        }`}
      >
        Unshare
      </button>
    </span>
  );
}
