"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Episode,
  EpisodeMode,
  EpisodeOptions,
  UploadQuote,
} from "@/lib/types";
import { ACTIVE_STATUSES, formatTotalDuration } from "./format";
import { usePlayer } from "./PlayerProvider";
import UploadZone, { type ComposerApi } from "./UploadZone";
import EpisodeCard from "./EpisodeCard";
import BuyCredits from "./BuyCredits";
import FeedButton from "./FeedButton";
import Mark from "./ui/Mark";
import Button from "./ui/Button";
import Sheet from "./ui/Sheet";
import Eyebrow from "./ui/Eyebrow";

const POLL_INTERVAL_MS = 2500;
const RECENT_EPISODE_WINDOW_MS = 2 * 60 * 1000;

interface PodcastAppProps {
  userEmail: string;
  onSignOut: () => void;
}

function readPurchaseNote(): string | null {
  if (typeof window === "undefined") return null;
  const purchase = new URLSearchParams(window.location.search).get("purchase");
  if (purchase === "success") return "Payment received — credits are on the way.";
  if (purchase === "cancelled") return "Checkout cancelled — no charge was made.";
  return null;
}

function SkeletonRow() {
  return (
    <li className="flex animate-pulse items-center gap-3 rounded-2xl border border-line bg-card p-[13px] lg:gap-4 lg:px-[18px] lg:py-[15px]">
      <span className="size-10 shrink-0 rounded-full bg-paper-2 lg:size-11" />
      <span className="min-w-0 flex-1 space-y-2">
        <span className="block h-4 w-2/3 rounded bg-paper-2" />
        <span className="block h-3 w-1/3 rounded bg-paper-2" />
      </span>
    </li>
  );
}

export default function PodcastApp({ userEmail, onSignOut }: PodcastAppProps) {
  const player = usePlayer();
  const playingEpisodeId = player.episode?.id ?? null;
  const closePlayer = player.close;
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [credits, setCredits] = useState<{
    balance: number | null;
    isAdmin: boolean;
  } | null>(null);

  const [showBuy, setShowBuy] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [purchaseNote, setPurchaseNote] = useState<string | null>(
    readPurchaseNote,
  );
  const composerApiRef = useRef<ComposerApi | null>(null);
  const registerComposerApi = useCallback((api: ComposerApi) => {
    composerApiRef.current = api;
  }, []);

  const refreshCredits = useCallback(() => {
    fetch("/api/credits", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCredits(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // Returning from Stripe checkout: acknowledge and re-check the balance
  // (the webhook may land a second or two after the redirect).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchase = params.get("purchase");
    if (!purchase) return;
    window.history.replaceState({}, "", window.location.pathname);
    if (purchase === "success") {
      const timers = [2000, 5000, 10000].map((ms) =>
        setTimeout(refreshCredits, ms),
      );
      const clear = setTimeout(() => setPurchaseNote(null), 8000);
      return () => [...timers, clear].forEach(clearTimeout);
    }
    if (purchase === "cancelled") {
      const clear = setTimeout(() => setPurchaseNote(null), 6000);
      return () => clearTimeout(clear);
    }
  }, [refreshCredits]);

  // Lift the mobile mini player above the fixed "+ Add a PDF" pill.
  useEffect(() => {
    document.documentElement.style.setProperty("--mini-lift", "72px");
    return () => {
      document.documentElement.style.removeProperty("--mini-lift");
    };
  }, []);

  const requestSeqRef = useRef(0);
  const appliedSeqRef = useRef(0);
  const deletedIdsRef = useRef(new Set<string>());

  const refresh = useCallback(() => {
    const seq = ++requestSeqRef.current;
    fetch("/api/episodes", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ episodes: Episode[] }>;
      })
      .then((data) => {
        if (seq <= appliedSeqRef.current) return;
        appliedSeqRef.current = seq;

        const deletedIds = deletedIdsRef.current;
        const serverIds = new Set(data.episodes.map((episode) => episode.id));
        for (const id of deletedIds) {
          if (!serverIds.has(id)) deletedIds.delete(id);
        }
        const serverEpisodes = data.episodes.filter(
          (episode) => !deletedIds.has(episode.id),
        );

        // The backend list is eventually consistent: a just-created episode
        // can be missing from a response, so keep local entries that are
        // in-flight or very fresh instead of trusting the server snapshot.
        const now = Date.now();
        setEpisodes((prev) => {
          const localOnly = (prev ?? []).filter(
            (episode) =>
              !serverIds.has(episode.id) &&
              !deletedIds.has(episode.id) &&
              (ACTIVE_STATUSES.includes(episode.status) ||
                now - Date.parse(episode.createdAt) <
                  RECENT_EPISODE_WINDOW_MS),
          );
          return [...localOnly, ...serverEpisodes];
        });
        setLoadError(null);
      })
      .catch(() => {
        if (seq <= appliedSeqRef.current) return;
        setLoadError("Could not load episodes. Check your connection.");
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasActiveEpisode = useMemo(
    () =>
      episodes?.some((episode) => ACTIVE_STATUSES.includes(episode.status)) ??
      false,
    [episodes],
  );

  useEffect(() => {
    if (!hasActiveEpisode) return;
    const timer = setInterval(() => {
      refresh();
      // Failed generations refund credits, so keep the balance current too.
      refreshCredits();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasActiveEpisode, refresh, refreshCredits]);

  const handleQuote = useCallback(
    async (
      files: File[],
      mode: EpisodeMode,
      options: EpisodeOptions,
    ): Promise<UploadQuote> => {
      const form = new FormData();
      for (const file of files) form.append("file", file);
      form.append("mode", mode);
      form.append("options", JSON.stringify(options));
      const res = await fetch("/api/episodes/quote", {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => null)) as
        | (UploadQuote & { error?: string })
        | null;
      if (!res.ok || !body || body.error) {
        throw new Error(body?.error ?? `Could not price this PDF (${res.status}).`);
      }
      return body;
    },
    [],
  );

  const handleUpload = useCallback(
    async (files: File[], mode: EpisodeMode, options: EpisodeOptions) => {
      const form = new FormData();
      for (const file of files) form.append("file", file);
      form.append("mode", mode);
      form.append("options", JSON.stringify(options));
      const res = await fetch("/api/episodes", { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Upload failed (${res.status}).`);
      }
      const { id } = (await res.json()) as { id: string };
      deletedIdsRef.current.delete(id);
      const label =
        files.length === 1
          ? files[0].name.replace(/\.pdf$/i, "")
          : `${files.length} documents`;
      const optimistic: Episode = {
        id,
        title: label,
        sourceFilename: label,
        mode,
        options,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setEpisodes((prev) => [
        optimistic,
        ...(prev ?? []).filter((episode) => episode.id !== id),
      ]);
      refreshCredits();
    },
    [refreshCredits],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this episode? This cannot be undone.")) {
        return;
      }
      setActionError(null);
      try {
        const res = await fetch(`/api/episodes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        deletedIdsRef.current.add(id);
        setEpisodes((prev) =>
          prev ? prev.filter((episode) => episode.id !== id) : prev,
        );
        if (playingEpisodeId === id) closePlayer();
        if ("caches" in window) {
          const cache = await caches.open("episode-audio");
          await cache
            .delete(`/api/episodes/${id}/audio`, { ignoreSearch: true })
            .catch(() => false);
        }
      } catch {
        setActionError("Could not delete the episode. Please try again.");
      }
    },
    [playingEpisodeId, closePlayer],
  );

  const openComposer = useCallback(() => {
    composerApiRef.current?.openPicker();
  }, []);

  const trySample = useCallback(async () => {
    if (sampleBusy) return;
    setSampleBusy(true);
    try {
      const res = await fetch("/sample.pdf");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], "history-of-coffee.pdf", {
        type: "application/pdf",
      });
      composerApiRef.current?.addFiles([file]);
    } catch {
      setActionError("Could not load the sample document.");
    } finally {
      setSampleBusy(false);
    }
  }, [sampleBusy]);

  const readyEpisodes = episodes?.filter((e) => e.status === "ready") ?? [];
  const totalSeconds = readyEpisodes.reduce(
    (sum, e) => sum + (e.durationSeconds ?? 0),
    0,
  );
  const initial = (userEmail[0] ?? "?").toUpperCase();

  return (
    <div
      className={`flex flex-1 flex-col ${
        player.episode ? "pb-44 lg:pb-24" : "pb-28 lg:pb-12"
      }`}
    >
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1140px] items-center gap-2.5 px-5 py-4 lg:px-[34px]">
          <Mark size={30} />
          <span className="font-display text-[21px] leading-none text-ink">
            Earshot
          </span>
          <nav className="ml-6 hidden items-center gap-5 lg:flex" aria-label="Main">
            <span className="border-b-2 border-signal pb-[3px] text-[13px] font-medium text-ink">
              Library
            </span>
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              className="pb-[3px] text-[13px] font-medium text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Account
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            {credits &&
              (credits.isAdmin ? (
                <span
                  className="rounded-full bg-paper-2 px-3 py-1.5 font-mono text-[12px] text-ink-3"
                  aria-label="Unlimited credits"
                >
                  ∞
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBuy(true)}
                  aria-label={`${credits.balance} credits — buy more`}
                  className="rounded-full bg-paper-2 px-3 py-1.5 font-mono text-[12px] text-ink-3 transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  {credits.balance} credit{credits.balance === 1 ? "" : "s"}
                </button>
              ))}
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label="Account"
              className="flex size-[30px] items-center justify-center rounded-full bg-paper-2 text-[12px] font-medium text-ink-2 transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              {initial}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1140px] flex-1 px-5 pt-6 lg:px-[34px] lg:pt-8">
        {purchaseNote && (
          <p
            role="status"
            className="mb-5 rounded-2xl bg-signal-tint px-4 py-3 text-[13px] text-signal-ink"
          >
            {purchaseNote}
          </p>
        )}
        {actionError && (
          <p role="alert" className="mb-5 text-[13px] text-signal-ink">
            {actionError}
          </p>
        )}

        <div className="lg:grid lg:grid-cols-[1fr_372px] lg:items-start lg:gap-[34px]">
          <section aria-label="Your library">
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="font-display text-3xl leading-[1.1] text-ink">
                Your library
              </h1>
              {episodes && episodes.length > 0 && (
                <p className="shrink-0 font-mono text-[11.5px] text-ink-4">
                  {episodes.length} episode{episodes.length === 1 ? "" : "s"}
                  {totalSeconds > 0 && ` · ${formatTotalDuration(totalSeconds)}`}
                </p>
              )}
            </div>

            {episodes === null ? (
              <ul className="mt-5 space-y-3" role="status" aria-label="Loading episodes">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </ul>
            ) : episodes.length === 0 ? (
              <div className="mt-10 flex flex-col items-center px-4 py-8 text-center lg:py-16">
                <span className="flex size-16 items-center justify-center rounded-[20px] bg-signal-tint text-signal">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-6"
                    aria-hidden="true"
                  >
                    <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
                    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                  </svg>
                </span>
                <h2 className="mt-5 font-display text-[26px] leading-[1.1] text-ink">
                  Nothing in the queue
                </h2>
                <p className="mt-2 max-w-[300px] text-[13.5px] leading-[1.55] text-ink-2">
                  Add the paper, report, or chapter you&apos;ve been meaning to
                  read. First episode takes about two minutes.
                </p>
                <Button
                  onClick={openComposer}
                  className="mt-6 min-h-[52px] w-full max-w-[280px] lg:hidden"
                >
                  Add a PDF
                </Button>
                <button
                  type="button"
                  onClick={() => void trySample()}
                  disabled={sampleBusy}
                  className="mt-4 text-[13px] font-medium text-signal-ink underline underline-offset-[3px] disabled:opacity-40"
                >
                  {sampleBusy ? "Loading sample…" : "Try a sample document"}
                </button>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {episodes.map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    onDelete={() => void handleDelete(episode.id)}
                    onTryAnother={openComposer}
                  />
                ))}
              </ul>
            )}

            {loadError && episodes !== null && (
              <p className="mt-3 font-mono text-[11.5px] text-signal-ink" role="status">
                {loadError}
              </p>
            )}
            {loadError && episodes === null && (
              <p className="mt-3 text-[13px] text-signal-ink" role="alert">
                {loadError}
              </p>
            )}
          </section>

          <aside className="hidden lg:block" aria-label="New episode">
            <div className="sticky top-[84px] rounded-[20px] border border-line bg-card p-6">
              <h2 className="mb-4 font-display text-2xl leading-[1.15] text-ink">
                New episode
              </h2>
              <UploadZone
                surface="rail"
                onQuote={handleQuote}
                onConfirm={handleUpload}
                onBuyCredits={() => setShowBuy(true)}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile composer: file first, then the options sheet. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-[calc(0.875rem+env(safe-area-inset-bottom))] lg:hidden">
        <Button
          onClick={openComposer}
          className="pointer-events-auto min-h-[52px] shadow-[0_2px_8px_rgba(232,72,31,.28)]"
        >
          + Add a PDF
        </Button>
      </div>
      <UploadZone
        surface="sheet"
        registerApi={registerComposerApi}
        onQuote={handleQuote}
        onConfirm={handleUpload}
        onBuyCredits={() => setShowBuy(true)}
      />

      {showBuy && <BuyCredits onClose={() => setShowBuy(false)} />}

      <Sheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        aria-label="Account"
      >
        <Eyebrow className="mb-1">Account</Eyebrow>
        <p className="truncate font-mono text-[12px] text-ink-3">{userEmail}</p>
        <div className="mt-5 space-y-3 border-t border-line-2 pt-5">
          <FeedButton />
          <Link
            href="/legal"
            className="block py-1 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            Privacy &amp; Terms
          </Link>
          <Button variant="secondary" onClick={onSignOut} className="w-full">
            Sign out
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
