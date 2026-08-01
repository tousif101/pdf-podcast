"use client";

import { useEffect, useRef, useState } from "react";
import type { DialogueLine, PodcastScript } from "@/lib/types";

// Grows to fit its content so long read-aloud chunks aren't clipped.
function AutoTextarea({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel: string;
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
      ref={ref}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      rows={1}
      className="w-full resize-none overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm leading-relaxed text-zinc-200 focus:border-violet-500 focus:outline-none"
    />
  );
}

interface ScriptEditorProps {
  script: PodcastScript;
  singleVoice: boolean;
  onSubmit: (script: PodcastScript) => Promise<void>;
}

export default function ScriptEditor({
  script,
  singleVoice,
  onSubmit,
}: ScriptEditorProps) {
  const [title, setTitle] = useState(script.title);
  const [lines, setLines] = useState<DialogueLine[]>(script.lines);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<DialogueLine>) =>
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const remove = (i: number) =>
    setLines((prev) => prev.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) =>
    setLines((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = () =>
    setLines((prev) => [...prev, { speaker: "HOST", text: "" }]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim() || "Untitled episode", lines });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the script.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-zinc-800 px-4 py-4">
      <p className="text-xs text-zinc-400">
        Edit the script, then generate the audio. Trim, reword, or reorder any
        line.
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={busy}
        aria-label="Episode title"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-100 focus:border-violet-500 focus:outline-none"
      />

      <div className="space-y-2">
        {lines.map((line, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2"
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              {!singleVoice && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    update(i, {
                      speaker: line.speaker === "HOST" ? "GUEST" : "HOST",
                    })
                  }
                  aria-label={`Speaker: ${line.speaker}, tap to switch`}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                    line.speaker === "HOST"
                      ? "bg-violet-500/20 text-violet-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {line.speaker}
                </button>
              )}
              <div className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={busy || i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Move line up"
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={busy || i === lines.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move line down"
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(i)}
                  aria-label="Delete line"
                  className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            </div>
            <AutoTextarea
              value={line.text}
              disabled={busy}
              onChange={(text) => update(i, { text })}
              ariaLabel={`Line ${i + 1} text`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={busy}
        className="w-full rounded-lg border border-dashed border-zinc-700 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      >
        + Add line
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy}
        className="w-full rounded-xl bg-violet-500 px-4 py-2.5 font-medium text-white hover:bg-violet-400 disabled:opacity-60"
      >
        {busy ? "Generating…" : "Generate audio"}
      </button>
    </div>
  );
}
