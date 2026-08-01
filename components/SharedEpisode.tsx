"use client";

import { useEffect, useState } from "react";
import type { PodcastScript } from "@/lib/types";
import { formatTime } from "./format";

interface SharedData {
  title: string;
  durationSeconds: number | null;
  script: PodcastScript | null;
}

export default function SharedEpisode({ token }: { token: string }) {
  const [data, setData] = useState<SharedData | null | "missing">(null);

  useEffect(() => {
    fetch(`/api/share/${token}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData("missing"));
  }, [token]);

  if (data === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  if (data === "missing") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-zinc-300">This episode is no longer shared.</p>
        <a href="/" className="text-sm text-violet-400 hover:text-violet-300">
          Make your own with PDF Podcast →
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-8">
      <header className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M5 10v4m3.5-7v10M12 8v8m3.5-11v14M19 10v4" />
          </svg>
        </span>
        <span className="text-sm font-medium text-zinc-300">PDF Podcast</span>
      </header>

      <div className="mt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          {data.title}
        </h1>
        {typeof data.durationSeconds === "number" && (
          <p className="mt-1 text-sm text-zinc-400">
            {formatTime(data.durationSeconds)}
          </p>
        )}
        <audio
          controls
          preload="metadata"
          src={`/api/share/${token}/audio`}
          className="mt-5 w-full"
        />
      </div>

      {data.script && data.script.lines.length > 0 && (
        <div className="mt-8 space-y-3 border-t border-zinc-800 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Transcript
          </h2>
          {data.script.lines.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span
                className={`mt-0.5 h-fit shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                  line.speaker === "HOST"
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {line.speaker}
              </span>
              <p className="text-sm leading-relaxed text-zinc-300">
                {line.text}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-10 text-center">
        <a
          href="/"
          className="inline-block rounded-xl bg-violet-500 px-6 py-3 font-medium text-white hover:bg-violet-400"
        >
          Make your own podcast from any PDF
        </a>
      </div>
    </div>
  );
}
