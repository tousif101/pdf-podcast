"use client";

import Link from "next/link";
import type { Episode } from "@/lib/types";
import { formatTime } from "./format";
import { getResumeSeconds, usePlayer } from "./PlayerProvider";
import PlayButton from "./ui/PlayButton";
import Eyebrow from "./ui/Eyebrow";

/** Dark "continue listening" card at the top of the library (wiremocks 1b/1c). */
export default function ContinueCard({ episode }: { episode: Episode }) {
  const player = usePlayer();
  const isCurrent = player.episode?.id === episode.id;
  const resumeSeconds = getResumeSeconds(episode.id);

  const played = isCurrent ? player.currentTime : resumeSeconds;
  const total = isCurrent
    ? player.duration || (episode.durationSeconds ?? 0)
    : (episode.durationSeconds ?? 0);
  const left = Math.max(0, total - played);
  const progressPercent = total > 0 ? (played / total) * 100 : 0;

  return (
    <div className="rounded-2xl bg-dark p-[18px] lg:px-6 lg:py-5">
      <div className="flex items-center gap-4">
        <PlayButton
          size="lg"
          focal
          playing={isCurrent && player.playing}
          onClick={() => player.play(episode)}
          aria-label={
            isCurrent
              ? player.playing
                ? `Pause ${episode.title}`
                : `Resume ${episode.title}`
              : `Resume ${episode.title}`
          }
        />
        <div className="min-w-0 flex-1">
          <Eyebrow className="text-dark-3xt!">
            {isCurrent && player.playing ? "Now playing" : "Continue listening"}
          </Eyebrow>
          <p className="mt-0.5 truncate font-display text-[20px] leading-tight text-dark-text lg:text-[22px]">
            {episode.title}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={player.cycleSpeed}
            aria-label={`Playback speed ${player.speed}×, tap to change`}
            className="rounded-full bg-dark-2 px-[14px] py-2 font-mono text-[12px] text-dark-2xt transition-colors hover:text-dark-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            {player.speed}×
          </button>
          {episode.script && episode.script.lines.length > 0 && (
            <Link
              href={`/e/${episode.id}/transcript`}
              className="rounded-full bg-dark-2 px-[14px] py-2 text-[12.5px] font-medium text-dark-2xt transition-colors hover:text-dark-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Transcript
            </Link>
          )}
        </div>
      </div>
      <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-dark-3">
        <div
          className="h-full rounded-full bg-signal"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[11px] tabular-nums text-dark-2xt">
        <span>{formatTime(played)} played</span>
        <span>{formatTime(left)} left</span>
      </div>
    </div>
  );
}
