"use client";

import { useState } from "react";
import Button from "./ui/Button";
import Sheet from "./ui/Sheet";

const PACKS = [
  { id: "small", credits: 25, price: 5, best: false },
  { id: "large", credits: 60, price: 10, best: true },
] as const;

type PackId = (typeof PACKS)[number]["id"];

interface BuyCreditsProps {
  onClose: () => void;
}

export default function BuyCredits({ onClose }: BuyCreditsProps) {
  const [selected, setSelected] = useState<PackId>("large");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: selected }),
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
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={busy ? () => {} : onClose} aria-label="Buy credits">
      <h2 className="font-display text-[26px] leading-[1.1] text-ink">Top up</h2>
      <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-2">
        1 credit ≈ one conversation episode or 25 minutes of read-aloud audio.
        One-time purchase, nothing recurring.
      </p>

      <div
        role="radiogroup"
        aria-label="Credit packs"
        className="mt-6 space-y-3"
      >
        {PACKS.map((pack) => {
          const isSelected = selected === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={busy}
              onClick={() => setSelected(pack.id)}
              className={`relative flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                isSelected
                  ? "border-2 border-signal bg-[#FFF8F5]"
                  : "border border-line bg-card hover:border-ink-5"
              }`}
            >
              {pack.best && (
                <span className="absolute -top-[9px] left-4 rounded-full bg-signal px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[.06em] text-white">
                  Best value
                </span>
              )}
              <span>
                <span className="block text-[15px] font-medium text-ink">
                  {pack.credits} credits
                </span>
                <span className="mt-0.5 block font-mono text-[11px] text-ink-4">
                  ${(pack.price / pack.credits).toFixed(2)} each
                </span>
              </span>
              <span className="font-display text-xl text-ink">
                ${pack.price}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[13px] text-signal-ink">
          {error}
        </p>
      )}

      <Button
        onClick={() => void buy()}
        disabled={busy}
        className="mt-5 min-h-[52px] w-full"
      >
        {busy ? "Starting…" : "Continue to payment"}
      </Button>
      <p className="mt-3 text-center text-[11px] text-ink-5">
        Secure checkout by Stripe
      </p>
    </Sheet>
  );
}
