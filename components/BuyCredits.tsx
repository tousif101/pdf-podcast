"use client";

import { useState } from "react";

const PACKS = [
  { id: "small", credits: 25, price: "$5" },
  { id: "large", credits: 60, price: "$10" },
] as const;

interface BuyCreditsProps {
  onClose: () => void;
}

export default function BuyCredits({ onClose }: BuyCreditsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (pack: string) => {
    if (busy) return;
    setBusy(pack);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.url) {
        throw new Error(body?.error ?? "Could not start checkout.");
      }
      window.location.assign(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Buy credits"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-zinc-800 bg-zinc-950 p-6 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-50">Buy credits</h2>
          <button
            type="button"
            onClick={onClose}
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
          1 credit ≈ one conversation episode or 25 minutes of read-aloud
          audio. One-time purchase, nothing recurring.
        </p>
        <div className="mt-5 space-y-3">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              disabled={busy !== null}
              onClick={() => void buy(pack.id)}
              className="flex w-full items-center justify-between rounded-2xl border border-zinc-700 bg-zinc-900/60 px-5 py-4 text-left hover:border-violet-500/60 disabled:opacity-60"
            >
              <span>
                <span className="block font-medium text-zinc-100">
                  {pack.credits} credits
                </span>
                <span className="text-xs text-zinc-500">
                  {(Number(pack.price.slice(1)) / pack.credits).toLocaleString(
                    "en-US",
                    { style: "currency", currency: "USD" },
                  )}
                  /credit
                </span>
              </span>
              <span className="text-lg font-semibold text-violet-300">
                {busy === pack.id ? "…" : pack.price}
              </span>
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}
        <p className="mt-4 text-center text-xs text-zinc-600">
          Secure checkout by Stripe
        </p>
      </div>
    </div>
  );
}
