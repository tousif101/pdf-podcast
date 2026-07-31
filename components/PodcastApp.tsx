"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Episode } from "@/lib/types";
import { ACTIVE_STATUSES } from "./format";
import UploadZone from "./UploadZone";
import EpisodeCard from "./EpisodeCard";
import Player from "./Player";

const POLL_INTERVAL_MS = 2500;

export default function PodcastApp() {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/episodes", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ episodes: Episode[] }>;
      })
      .then((data) => {
        setEpisodes(data.episodes);
        setLoadError(null);
      })
      .catch(() => {
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
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasActiveEpisode, refresh]);

  const handleUpload = useCallback(async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/episodes", { method: "POST", body: form });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? `Upload failed (${res.status}).`);
    }
    const { id } = (await res.json()) as { id: string };
    const optimistic: Episode = {
      id,
      title: file.name.replace(/\.pdf$/i, ""),
      sourceFilename: file.name,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setEpisodes((prev) => [
      optimistic,
      ...(prev ?? []).filter((episode) => episode.id !== id),
    ]);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this episode? This cannot be undone.")) {
        return;
      }
      setActionError(null);
      try {
        const res = await fetch(`/api/episodes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              PDF Podcast
            </h1>
            <p className="text-xs text-zinc-400">
              Turn any PDF into an episode
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6">
        <UploadZone onUpload={handleUpload} />

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
    </div>
  );
}
