"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Episode,
  EpisodeMode,
  EpisodeOptions,
  PodcastScript,
  UploadQuote,
} from "@/lib/types";
import { ACTIVE_STATUSES } from "./format";
import UploadZone from "./UploadZone";
import EpisodeCard from "./EpisodeCard";
import Player from "./Player";
import BuyCredits from "./BuyCredits";

const POLL_INTERVAL_MS = 2500;
const RECENT_EPISODE_WINDOW_MS = 2 * 60 * 1000;

interface PodcastAppProps {
  userEmail: string;
  onSignOut: () => void;
}

export default function PodcastApp({ userEmail, onSignOut }: PodcastAppProps) {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [credits, setCredits] = useState<{
    balance: number | null;
    isAdmin: boolean;
  } | null>(null);

  const [showBuy, setShowBuy] = useState(false);
  const [purchaseNote, setPurchaseNote] = useState<string | null>(null);

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
      setPurchaseNote("Payment received — credits are on the way.");
      const timers = [2000, 5000, 10000].map((ms) =>
        setTimeout(refreshCredits, ms),
      );
      const clear = setTimeout(() => setPurchaseNote(null), 8000);
      return () => [...timers, clear].forEach(clearTimeout);
    }
    if (purchase === "cancelled") {
      setPurchaseNote("Checkout cancelled — no charge was made.");
      const clear = setTimeout(() => setPurchaseNote(null), 6000);
      return () => clearTimeout(clear);
    }
  }, [refreshCredits]);

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
      file: File,
      mode: EpisodeMode,
      options: EpisodeOptions,
    ): Promise<UploadQuote> => {
      const form = new FormData();
      form.append("file", file);
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
    async (file: File, mode: EpisodeMode, options: EpisodeOptions) => {
      const form = new FormData();
      form.append("file", file);
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
      const optimistic: Episode = {
        id,
        title: file.name.replace(/\.pdf$/i, ""),
        sourceFilename: file.name,
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

  const handleReviewSubmit = useCallback(
    async (id: string, script: PodcastScript) => {
      const res = await fetch(`/api/episodes/${id}/script`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(script),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Could not save script (${res.status}).`);
      }
      // Optimistically move it out of review so the editor closes immediately.
      setEpisodes((prev) =>
        prev
          ? prev.map((e) =>
              e.id === id ? { ...e, status: "synthesizing", script } : e,
            )
          : prev,
      );
    },
    [],
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
        setPlayingId((current) => (current === id ? null : current));
        setExpandedId((current) => (current === id ? null : current));
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
    [],
  );

  const playingEpisode =
    episodes?.find(
      (episode) => episode.id === playingId && episode.status === "ready",
    ) ?? null;

  return (
    <div
      className={`flex flex-1 flex-col ${playingEpisode ? "pb-48" : "pb-12"}`}
    >
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-[#0a0a0a]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 py-4">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M5 10v4m3.5-7v10M12 8v8m3.5-11v14M19 10v4" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              PDF Podcast
            </h1>
            <p className="truncate text-xs text-zinc-400">{userEmail}</p>
          </div>
          {credits &&
            (credits.isAdmin ? (
              <span
                className="shrink-0 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300"
                aria-label="Unlimited credits"
              >
                ∞
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowBuy(true)}
                aria-label={`${credits.balance} credits — buy more`}
                className="shrink-0 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/25"
              >
                {credits.balance}{" "}
                {credits.balance === 1 ? "credit" : "credits"} +
              </button>
            ))}
          <button
            type="button"
            onClick={onSignOut}
            className="shrink-0 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6">
        {purchaseNote && (
          <p
            role="status"
            className="mb-4 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-3 text-sm text-violet-200"
          >
            {purchaseNote}
          </p>
        )}

        <UploadZone
          onQuote={handleQuote}
          onConfirm={handleUpload}
          onBuyCredits={() => setShowBuy(true)}
        />

        {actionError && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {actionError}
          </p>
        )}

        <section className="mt-8" aria-label="Episodes">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Episodes
          </h2>

          {episodes === null ? (
            <p className="mt-4 text-sm text-zinc-500" role="status">
              {loadError ?? "Loading episodes…"}
            </p>
          ) : episodes.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No episodes yet. Upload a PDF to create your first one.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {episodes.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  isCurrent={episode.id === playingId}
                  expanded={episode.id === expandedId}
                  onPlay={() => setPlayingId(episode.id)}
                  onToggleExpand={() =>
                    setExpandedId((current) =>
                      current === episode.id ? null : episode.id,
                    )
                  }
                  onDelete={() => void handleDelete(episode.id)}
                  onReviewSubmit={(script) =>
                    handleReviewSubmit(episode.id, script)
                  }
                />
              ))}
            </ul>
          )}

          {loadError && episodes !== null && (
            <p className="mt-3 text-xs text-amber-400" role="status">
              {loadError}
            </p>
          )}
        </section>
      </main>

      {playingEpisode && (
        <Player
          key={playingEpisode.id}
          episode={playingEpisode}
          onClose={() => setPlayingId(null)}
        />
      )}

      {showBuy && <BuyCredits onClose={() => setShowBuy(false)} />}
    </div>
  );
}
