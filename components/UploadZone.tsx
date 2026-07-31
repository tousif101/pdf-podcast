"use client";

import { useRef, useState } from "react";
import type { EpisodeMode, UploadQuote } from "@/lib/types";

interface UploadZoneProps {
  onQuote: (file: File, mode: EpisodeMode) => Promise<UploadQuote>;
  onConfirm: (file: File, mode: EpisodeMode) => Promise<void>;
}

const MODES: Array<{ value: EpisodeMode; label: string; hint: string }> = [
  {
    value: "conversation",
    label: "Conversation",
    hint: "Two hosts discuss the document",
  },
  {
    value: "reading",
    label: "Read aloud",
    hint: "One calm voice reads the text verbatim",
  },
];

export default function UploadZone({ onQuote, onConfirm }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EpisodeMode>("conversation");
  const [pending, setPending] = useState<{
    file: File;
    quote: UploadQuote;
  } | null>(null);

  const handleFile = async (file: File | null | undefined) => {
    if (!file || busy) return;
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are supported.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const quote = await onQuote(file, mode);
      setPending({ file, quote });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the PDF.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleConfirm = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(pending.file, mode);
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const selectedMode = MODES.find((m) => m.value === mode) ?? MODES[0];

  if (pending) {
    const { quote, file } = pending;
    const affordable = quote.isAdmin || (quote.balance ?? 0) >= quote.cost;
    return (
      <div className="rounded-2xl border border-violet-500/40 bg-violet-500/5 px-5 py-5">
        <p className="truncate font-medium text-zinc-100">{file.name}</p>
        <p className="mt-1 text-sm text-zinc-400">
          {quote.pages} {quote.pages === 1 ? "page" : "pages"} · ≈
          {quote.estMinutes} min of audio · {selectedMode.label.toLowerCase()}
        </p>
        <p className="mt-3 text-sm">
          {quote.isAdmin ? (
            <span className="text-violet-300">Free — admin account</span>
          ) : (
            <span className="text-zinc-200">
              Costs{" "}
              <strong>
                {quote.cost} {quote.cost === 1 ? "credit" : "credits"}
              </strong>{" "}
              · you have {quote.balance}
            </span>
          )}
        </p>
        {!affordable && (
          <p className="mt-2 text-sm text-amber-400">
            Not enough credits. Credit packs are coming soon.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || !affordable}
            className="flex-1 rounded-xl bg-violet-500 px-4 py-2.5 font-medium text-white hover:bg-violet-400 disabled:opacity-50"
          >
            {busy ? "Starting…" : "Generate"}
          </button>
          <button
            type="button"
            onClick={() => setPending(null)}
            disabled={busy}
            className="rounded-xl border border-zinc-700 px-4 py-2.5 text-zinc-300 hover:border-zinc-500"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Episode style"
        className="mb-3 grid grid-cols-2 gap-2"
      >
        {MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={mode === option.value}
            disabled={busy}
            onClick={() => setMode(option.value)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
              mode === option.value
                ? "border-violet-500/70 bg-violet-500/10 text-zinc-50"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <span className="block font-medium">{option.label}</span>
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-zinc-500">{selectedMode.hint}.</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        disabled={busy}
        aria-label="Upload a PDF to create a podcast episode"
        className={`w-full rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragActive
            ? "border-violet-400 bg-violet-500/10"
            : "border-zinc-700 bg-zinc-900/40 hover:border-violet-500/60"
        } ${busy ? "opacity-60" : "cursor-pointer"}`}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
          {busy ? (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-violet-300 border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          )}
        </span>
        <span className="mt-3 block font-medium text-zinc-100">
          {busy ? "Reading PDF…" : "Upload a PDF"}
        </span>
        <span className="mt-1 block text-sm text-zinc-400">
          {busy
            ? "Calculating episode price"
            : "Tap to browse or drop a file here"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
