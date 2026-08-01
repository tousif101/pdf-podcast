"use client";

import { useState } from "react";

export default function ShareButton({
  episodeId,
  initialShared,
}: {
  episodeId: string;
  initialShared: boolean;
}) {
  const [shared, setShared] = useState(initialShared);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = async (enabled: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const body = (await res.json().catch(() => null)) as {
        url?: string | null;
      } | null;
      if (res.ok) {
        setShared(enabled);
        setUrl(enabled ? (body?.url ?? null) : null);
      }
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
      // clipboard blocked
    }
  };

  if (shared && url) {
    return (
      <div className="flex w-full items-center gap-2 rounded-full bg-zinc-800 px-2 py-1">
        <span className="min-w-0 flex-1 truncate px-1 text-xs text-zinc-400">
          {url}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 rounded-full bg-violet-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-400"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => void toggle(false)}
          disabled={busy}
          aria-label="Stop sharing"
          className="shrink-0 rounded-full px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Unshare
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle(true)}
      disabled={busy}
      className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-60"
    >
      {busy ? "…" : shared ? "Get share link" : "Share"}
    </button>
  );
}
