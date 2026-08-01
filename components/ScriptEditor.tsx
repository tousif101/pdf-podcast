"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DialogueLine, Episode, Speaker } from "@/lib/types";
import {
  editCharBudget,
  isSingleVoiceFormat,
  normalizeOptions,
  scriptChars,
} from "@/lib/options";
import Button from "./ui/Button";
import Eyebrow from "./ui/Eyebrow";
import Spinner from "./ui/Spinner";

// ~640 script characters ≈ one minute of two-host audio.
const CHARS_PER_MINUTE = 640;

interface EditableLine extends DialogueLine {
  id: number;
}

// Grows to fit its content so long read-aloud chunks aren't clipped.
function AutoTextarea({
  value,
  onChange,
  disabled,
  ariaLabel,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  textareaRef?: (el: HTMLTextAreaElement | null) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };
  useEffect(resize, [value]);
  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        textareaRef?.(el);
      }}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      rows={1}
      className="w-full resize-none overflow-hidden bg-transparent text-[13.5px] leading-[1.65] text-[#2F2C25] focus:outline-none"
    />
  );
}

export default function ScriptEditor({ id }: { id: string }) {
  const router = useRouter();
  const [episode, setEpisode] = useState<Episode | "missing" | null>(null);
  const [title, setTitle] = useState("");
  // Lines carry a client-side id so React keeps card ⇄ content ⇄ focus
  // together when lines are reordered, split, or deleted.
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [budget, setBudget] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const textareaRefs = useRef(new Map<number, HTMLTextAreaElement>());
  const nextIdRef = useRef(0);
  const newId = () => nextIdRef.current++;

  useEffect(() => {
    fetch(`/api/episodes/${id}`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Episode>) : Promise.reject()))
      .then((data) => {
        setEpisode(data);
        if (data.script) {
          setTitle(data.script.title);
          setLines(
            data.script.lines.map((line) => ({
              ...line,
              id: nextIdRef.current++,
            })),
          );
          setBudget(editCharBudget(scriptChars(data.script)));
        }
      })
      .catch(() => setEpisode("missing"));
  }, [id]);

  if (episode === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper" role="status" aria-label="Loading">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (episode === "missing" || !episode.script) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <p className="text-[13.5px] text-ink-2">
          This episode isn&apos;t available.
        </p>
        <Link
          href="/"
          className="text-[13px] font-medium text-signal-ink underline underline-offset-[3px]"
        >
          Back to your library
        </Link>
      </div>
    );
  }

  if (episode.status !== "script_ready") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <p className="text-[13.5px] text-ink-2">
          This script has already been turned into audio.
        </p>
        <Link
          href="/"
          className="text-[13px] font-medium text-signal-ink underline underline-offset-[3px]"
        >
          Back to your library
        </Link>
      </div>
    );
  }

  const options = normalizeOptions(episode.options);
  const singleVoice =
    episode.mode === "reading" || isSingleVoiceFormat(options.format);
  const voiceName = (speaker: Speaker) =>
    speaker === "GUEST"
      ? options.guestVoice
      : episode.mode === "reading"
        ? options.readerVoice
        : options.hostVoice;

  const chars = lines.reduce((n, l) => n + l.text.trim().length, 0);
  const overBudget = chars > budget;
  const estMinutes = Math.max(1, Math.round(chars / CHARS_PER_MINUTE));

  const update = (lineId: number, patch: Partial<DialogueLine>) =>
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    );
  const remove = (lineId: number) =>
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  const move = (lineId: number, dir: -1 | 1) =>
    setLines((prev) => {
      const i = prev.findIndex((l) => l.id === lineId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = () =>
    setLines((prev) => [...prev, { id: newId(), speaker: "HOST", text: "" }]);
  const split = (lineId: number) => {
    const el = textareaRefs.current.get(lineId);
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;
    const text = line.text;
    const at = el ? el.selectionStart : Math.floor(text.length / 2);
    if (at <= 0 || at >= text.length) return;
    setLines((prev) =>
      prev.flatMap((l) =>
        l.id === lineId
          ? [
              { ...l, text: text.slice(0, at).trim() },
              { id: newId(), speaker: l.speaker, text: text.slice(at).trim() },
            ]
          : [l],
      ),
    );
  };

  const submit = async () => {
    if (busy || overBudget) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/episodes/${id}/script`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled episode",
          lines: lines.map(({ speaker, text }) => ({ speaker, text })),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Could not save script (${res.status}).`);
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the script.");
      setBusy(false);
    }
  };

  const counter = (
    <p
      className={`font-mono text-[11.5px] ${overBudget ? "text-signal-ink" : "text-ink-4"}`}
    >
      Draft script · {lines.length} line{lines.length === 1 ? "" : "s"} ·{" "}
      {chars.toLocaleString()} / {budget.toLocaleString()} characters
    </p>
  );

  const primary = (
    <Button
      onClick={() => void submit()}
      disabled={busy || overBudget}
      className="min-h-[52px] whitespace-nowrap"
    >
      {busy ? "Starting…" : `Make the audio · ≈${estMinutes} min`}
    </Button>
  );

  return (
    <div className="min-h-dvh bg-paper pb-40 lg:pb-16">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1140px] items-center gap-4 px-5 py-3.5 lg:px-[34px]">
          <Link
            href="/"
            className="shrink-0 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            ← Library
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[17px] leading-tight text-ink lg:text-[19px]">
              {title || "Untitled episode"}
            </p>
            <div className="hidden lg:block">{counter}</div>
          </div>
          <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
            <Button
              variant="secondary"
              onClick={() => router.push("/")}
              disabled={busy}
              className="px-5 py-[10px] text-[13px]"
            >
              Discard
            </Button>
            {primary}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-5 pt-6 lg:px-[34px]">
        <div className="flex items-center justify-between">
          <Eyebrow>Script</Eyebrow>
          {overBudget && (
            <p className="text-[12px] text-signal-ink" role="alert">
              Trim the script to make the audio.
            </p>
          )}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
          aria-label="Episode title"
          className="mt-3 w-full border-b border-transparent bg-transparent pb-1 font-display text-2xl leading-[1.15] text-ink focus:border-ink focus:outline-none"
        />

        <div className="mt-4 space-y-2.5">
          {lines.map((line, i) => {
            const focused = focusedId === line.id;
            const other: Speaker = line.speaker === "HOST" ? "GUEST" : "HOST";
            return (
              <div
                key={line.id}
                onFocusCapture={() => setFocusedId(line.id)}
                onBlurCapture={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  ) {
                    setFocusedId((current) =>
                      current === line.id ? null : current,
                    );
                  }
                }}
                className={`rounded-[14px] bg-card p-4 transition-colors ${
                  focused ? "border-2 border-ink" : "border border-line"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded-[5px] px-2 py-1 font-mono text-[9.5px] font-medium uppercase tracking-[.06em] ${
                      line.speaker === "GUEST"
                        ? "bg-done-tint text-done"
                        : "bg-signal-tint text-signal-ink"
                    }`}
                  >
                    {voiceName(line.speaker)}
                  </span>
                  <AutoTextarea
                    value={line.text}
                    disabled={busy}
                    onChange={(text) => update(line.id, { text })}
                    ariaLabel={`Line ${i + 1} text`}
                    textareaRef={(el) => {
                      if (el) textareaRefs.current.set(line.id, el);
                      else textareaRefs.current.delete(line.id);
                    }}
                  />
                </div>
                {focused && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-2 pt-2.5">
                    {!singleVoice && (
                      <button
                        type="button"
                        disabled={busy}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => update(line.id, { speaker: other })}
                        className="text-[12px] font-medium text-ink-3 transition-colors hover:text-ink"
                      >
                        Swap to {voiceName(other)}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => split(line.id)}
                      className="text-[12px] font-medium text-ink-3 transition-colors hover:text-ink"
                    >
                      Split line
                    </button>
                    <button
                      type="button"
                      disabled={busy || i === 0}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => move(line.id, -1)}
                      className="text-[12px] font-medium text-ink-3 transition-colors hover:text-ink disabled:opacity-30"
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={busy || i === lines.length - 1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => move(line.id, 1)}
                      className="text-[12px] font-medium text-ink-3 transition-colors hover:text-ink disabled:opacity-30"
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => remove(line.id)}
                      className="text-[12px] font-medium text-signal-ink"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-dashed border-line py-3 text-[13px] font-medium text-ink-3 transition-colors hover:border-ink-5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          + Add a line
        </button>

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-signal-ink">
            {error}
          </p>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper px-5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="mb-2.5 flex items-center justify-between">
          {counter}
          <button
            type="button"
            onClick={() => router.push("/")}
            disabled={busy}
            className="text-[13px] font-medium text-ink-3"
          >
            Discard
          </button>
        </div>
        <div className="[&>button]:w-full">{primary}</div>
      </div>
    </div>
  );
}
