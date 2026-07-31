"use client";

import { useRef, useState } from "react";
import type {
  EpisodeAudience,
  EpisodeFormat,
  EpisodeLength,
  EpisodeMode,
  EpisodeOptions,
  UploadQuote,
} from "@/lib/types";
import { VOICES } from "@/lib/voices";
import { isSingleVoiceFormat, normalizeOptions } from "@/lib/options";

interface UploadZoneProps {
  onQuote: (
    file: File,
    mode: EpisodeMode,
    options: EpisodeOptions,
  ) => Promise<UploadQuote>;
  onConfirm: (
    file: File,
    mode: EpisodeMode,
    options: EpisodeOptions,
  ) => Promise<void>;
  onBuyCredits: () => void;
}

const MODES: Array<{ value: EpisodeMode; label: string; hint: string }> = [
  { value: "conversation", label: "Conversation", hint: "Hosts discuss the document" },
  { value: "reading", label: "Read aloud", hint: "One voice reads the text verbatim" },
];

const LENGTHS: Array<{ value: EpisodeLength; label: string }> = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "deep", label: "Deep" },
];

const FORMATS: Array<{ value: EpisodeFormat; label: string }> = [
  { value: "discussion", label: "Discussion" },
  { value: "brief", label: "Brief" },
  { value: "debate", label: "Debate" },
  { value: "lecture", label: "Lecture" },
];

const AUDIENCES: Array<{ value: EpisodeAudience; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "expert", label: "Expert" },
];

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              value === o.value
                ? "border-violet-500/70 bg-violet-500/10 text-zinc-50"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function VoiceSelect({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex-1">
      <span className="mb-1.5 block text-xs font-medium text-zinc-500">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
      >
        {VOICES.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label} — {v.description}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function UploadZone({
  onQuote,
  onConfirm,
  onBuyCredits,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EpisodeMode>("conversation");
  const [options, setOptions] = useState<EpisodeOptions>(() =>
    normalizeOptions({}),
  );
  const [pending, setPending] = useState<{
    file: File;
    quote: UploadQuote;
  } | null>(null);

  const set = <K extends keyof EpisodeOptions>(key: K, v: EpisodeOptions[K]) =>
    setOptions((o) => ({ ...o, [key]: v }));

  const singleVoice = isSingleVoiceFormat(options.format);

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
      const quote = await onQuote(file, mode, options);
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
      await onConfirm(pending.file, mode, options);
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
          {quote.estMinutes} min · {selectedMode.label.toLowerCase()}
          {mode === "conversation" ? ` · ${options.format}` : ""}
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
            Not enough credits for this episode.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          {affordable ? (
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={busy}
              className="flex-1 rounded-xl bg-violet-500 px-4 py-2.5 font-medium text-white hover:bg-violet-400 disabled:opacity-50"
            >
              {busy ? "Starting…" : "Generate"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onBuyCredits}
              className="flex-1 rounded-xl bg-violet-500 px-4 py-2.5 font-medium text-white hover:bg-violet-400"
            >
              Buy credits
            </button>
          )}
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

      <div className="mb-4 space-y-3 rounded-xl border border-zinc-800/70 bg-zinc-900/30 p-3">
        <Segmented
          label="Length"
          value={options.length}
          options={LENGTHS}
          onChange={(v) => set("length", v)}
          disabled={busy}
        />
        {mode === "conversation" && (
          <>
            <Segmented
              label="Format"
              value={options.format}
              options={FORMATS}
              onChange={(v) => set("format", v)}
              disabled={busy}
            />
            <Segmented
              label="Audience"
              value={options.audience}
              options={AUDIENCES}
              onChange={(v) => set("audience", v)}
              disabled={busy}
            />
            <div className="flex gap-2">
              <VoiceSelect
                label={singleVoice ? "Voice" : "Host voice"}
                value={options.hostVoice}
                onChange={(v) => set("hostVoice", v)}
                disabled={busy}
              />
              {!singleVoice && (
                <VoiceSelect
                  label="Guest voice"
                  value={options.guestVoice}
                  onChange={(v) => set("guestVoice", v)}
                  disabled={busy}
                />
              )}
            </div>
          </>
        )}
        {mode === "reading" && (
          <div className="flex gap-2">
            <VoiceSelect
              label="Voice"
              value={options.readerVoice}
              onChange={(v) => set("readerVoice", v)}
              disabled={busy}
            />
          </div>
        )}

        <label className="flex items-center gap-2.5 pt-1 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={options.reviewScript}
            disabled={busy}
            onChange={(e) => set("reviewScript", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-violet-500"
          />
          Review &amp; edit the script before generating audio
        </label>
      </div>

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
          {busy ? "Calculating episode price" : selectedMode.hint}
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
