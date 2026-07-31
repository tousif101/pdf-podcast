"use client";

import { useRef, useState } from "react";
import type { EpisodeMode } from "@/lib/types";

interface UploadZoneProps {
  onUpload: (file: File, mode: EpisodeMode) => Promise<void>;
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

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EpisodeMode>("conversation");

  const handleFile = async (file: File | null | undefined) => {
    if (!file || uploading) return;
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are supported.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await onUpload(file, mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const selectedMode = MODES.find((m) => m.value === mode) ?? MODES[0];

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
            disabled={uploading}
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
        disabled={uploading}
        aria-label="Upload a PDF to create a podcast episode"
        className={`w-full rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragActive
            ? "border-violet-400 bg-violet-500/10"
            : "border-zinc-700 bg-zinc-900/40 hover:border-violet-500/60"
        } ${uploading ? "opacity-60" : "cursor-pointer"}`}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
          {uploading ? (
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
          {uploading ? "Uploading…" : "Upload a PDF"}
        </span>
        <span className="mt-1 block text-sm text-zinc-400">
          {uploading
            ? "Starting episode generation"
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
