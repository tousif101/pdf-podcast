"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  EpisodeAudience,
  EpisodeFormat,
  EpisodeLength,
  EpisodeMode,
  EpisodeOptions,
  UploadQuote,
} from "@/lib/types";
import { VOICES } from "@/lib/voices";
import {
  LENGTH_BUDGETS,
  isSingleVoiceFormat,
  normalizeOptions,
} from "@/lib/options";
import { PRESETS, presetEstimate, type PresetId } from "./presets";
import { styleLabel } from "./format";
import Button from "./ui/Button";
import Sheet from "./ui/Sheet";
import Eyebrow from "./ui/Eyebrow";
import Spinner from "./ui/Spinner";

export interface ComposerApi {
  openPicker: () => void;
  addFiles: (files: File[]) => void;
}

interface UploadZoneProps {
  onQuote: (
    files: File[],
    mode: EpisodeMode,
    options: EpisodeOptions,
  ) => Promise<UploadQuote>;
  onConfirm: (
    files: File[],
    mode: EpisodeMode,
    options: EpisodeOptions,
  ) => Promise<void>;
  onBuyCredits: () => void;
  /** rail = laptop right column, always visible; sheet = opens after a file is picked. */
  surface: "rail" | "sheet";
  registerApi?: (api: ComposerApi) => void;
}

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
      <p className="mb-1.5 text-[12px] font-medium text-ink-3">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
              value === o.value
                ? "border-signal bg-signal-tint text-ink"
                : "border-line bg-card text-ink-3 hover:text-ink"
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
      <span className="mb-1.5 block text-[12px] font-medium text-ink-3">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
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

function CheckboxRow({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2.5 text-[13px] text-ink-2">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-line accent-signal"
      />
      {children}
    </label>
  );
}

function filesLabel(files: File[]): string {
  return files.length === 1 ? files[0].name : `${files.length} documents`;
}

export default function UploadZone({
  onQuote,
  onConfirm,
  onBuyCredits,
  surface,
  registerApi,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[] | null>(null);
  const [step, setStep] = useState<"options" | "quote">("options");
  const [quote, setQuote] = useState<UploadQuote | null>(null);
  const [presetId, setPresetId] = useState<PresetId>("hosts");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<EpisodeOptions>(() =>
    normalizeOptions(PRESETS[0].options),
  );

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const mode = preset.mode;
  const singleVoice = isSingleVoiceFormat(options.format);

  const set = <K extends keyof EpisodeOptions>(key: K, v: EpisodeOptions[K]) =>
    setOptions((o) => ({ ...o, [key]: v }));

  const selectPreset = (id: PresetId) => {
    const next = PRESETS.find((p) => p.id === id);
    if (!next) return;
    setPresetId(id);
    setOptions((o) => normalizeOptions({ ...o, ...next.options }));
  };

  const reset = useCallback(() => {
    setFiles(null);
    setQuote(null);
    setStep("options");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const runQuote = useCallback(
    async (
      pendingFiles: File[],
      quoteMode: EpisodeMode,
      quoteOptions: EpisodeOptions,
    ) => {
      setBusy(true);
      setError(null);
      try {
        const result = await onQuote(pendingFiles, quoteMode, quoteOptions);
        setQuote(result);
        setStep("quote");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not read the PDF.",
        );
      } finally {
        setBusy(false);
      }
    },
    [onQuote],
  );

  const handleFiles = useCallback(
    (list: FileList | File[] | null | undefined) => {
      const next = list ? Array.from(list) : [];
      if (next.length === 0 || busy) return;
      const allPdf = next.every(
        (f) =>
          f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
      );
      if (!allPdf) {
        setError("Only PDF files are supported.");
        return;
      }
      setError(null);
      setFiles(next);
      setStep("options");
      setQuote(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    [busy],
  );

  useEffect(() => {
    registerApi?.({
      openPicker: () => inputRef.current?.click(),
      addFiles: (added) => handleFiles(added),
    });
  }, [registerApi, handleFiles]);

  // On laptop the whole page is a drop target.
  useEffect(() => {
    if (surface !== "rail") return;
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) {
        event.preventDefault();
        setDragActive(true);
      }
    };
    const onDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) setDragActive(false);
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      handleFiles(event.dataTransfer?.files);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [surface, handleFiles]);

  const handleConfirm = async () => {
    if (!files || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(files, mode, options);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      multiple
      className="hidden"
      onChange={(event) => handleFiles(event.target.files)}
    />
  );

  const presetCards = (
    <div role="radiogroup" aria-label="How should it sound?" className="space-y-2">
      {PRESETS.map((p) => {
        const selected = p.id === presetId;
        const estimate = presetEstimate(p, quote?.chars ?? null);
        const sub = [
          estimate.minutes > 0 ? `~${estimate.minutes} min` : null,
          p.hint,
          estimate.credits !== null
            ? `${estimate.credits} credit${estimate.credits === 1 ? "" : "s"}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={busy}
            onClick={() => selectPreset(p.id)}
            className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
              selected
                ? "border-2 border-signal bg-[#FFF8F5]"
                : "border border-line bg-card hover:border-ink-5"
            }`}
          >
            <span
              className={`flex size-[30px] shrink-0 items-center justify-center rounded-lg text-[13px] ${
                selected
                  ? "bg-signal-tint text-signal"
                  : "bg-paper-2 text-ink-3"
              }`}
              aria-hidden="true"
            >
              {p.glyph}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium leading-snug text-ink">
                {p.title}
              </span>
              <span className="mt-0.5 block font-mono text-[11px] text-ink-4">
                {sub}
              </span>
            </span>
            {selected && (
              <span
                className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-signal"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-2.5"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const disclosure = (
    <div>
      <button
        type="button"
        aria-expanded={showAdvanced}
        aria-controls="composer-advanced"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        Voices, length &amp; depth
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {showAdvanced && (
        <div id="composer-advanced" className="space-y-3.5 pt-2">
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
            <VoiceSelect
              label="Voice"
              value={options.readerVoice}
              onChange={(v) => set("readerVoice", v)}
              disabled={busy}
            />
          )}
        </div>
      )}
    </div>
  );

  const reviewRow = (
    <CheckboxRow
      checked={options.reviewScript}
      disabled={busy}
      onChange={(v) => set("reviewScript", v)}
    >
      Review the script first
    </CheckboxRow>
  );

  const fileRow = files && (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-signal-tint font-mono text-[9px] font-medium text-signal-ink"
        aria-hidden="true"
      >
        PDF
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">
          {filesLabel(files)}
        </span>
        <span className="block font-mono text-[11px] text-ink-4">
          {quote
            ? `${quote.pages} page${quote.pages === 1 ? "" : "s"}`
            : `${(files.reduce((n, f) => n + f.size, 0) / 1024 / 1024).toFixed(1)} MB`}
        </span>
      </span>
      <button
        type="button"
        onClick={reset}
        disabled={busy}
        aria-label="Remove file"
        className="shrink-0 rounded-full p-1.5 text-ink-4 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-3.5"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );

  const dropzone = (
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
        handleFiles(event.dataTransfer.files);
      }}
      disabled={busy}
      aria-label="Upload a PDF to make an episode"
      className={`w-full rounded-2xl border-[1.5px] border-dashed p-7 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
        dragActive
          ? "border-signal bg-signal-tint"
          : "border-line bg-paper-3 hover:border-ink-5"
      } ${busy ? "opacity-60" : "cursor-pointer"}`}
    >
      <span className="mx-auto flex size-[46px] items-center justify-center rounded-[14px] bg-signal-tint text-signal">
        {busy ? (
          <Spinner />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
            <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
        )}
      </span>
      <span className="mt-3 block text-[13.5px] font-medium text-ink">
        {busy ? "Reading your PDF…" : "Drop a PDF here"}
      </span>
      <span className="mt-1 block text-[12.5px] text-ink-3">
        {busy ? (
          "Pricing the episode"
        ) : (
          <>
            or <span className="text-signal-ink underline">browse your files</span>
          </>
        )}
      </span>
    </button>
  );

  const quotePanel = quote && files && (
    <div>
      <h3 className="font-display text-[25px] leading-[1.1] text-ink">
        Ready to make
      </h3>
      <div className="mt-4 rounded-2xl border border-line bg-card px-4">
        {[
          ["Document", filesLabel(files)],
          [
            "Style",
            [styleLabel({ mode, options }), options.length]
              .map((word) => word[0].toUpperCase() + word.slice(1))
              .join(" · "),
          ],
          [
            "Voices",
            mode === "reading"
              ? options.readerVoice
              : singleVoice
                ? options.hostVoice
                : `${options.hostVoice} & ${options.guestVoice}`,
          ],
          ["Estimated", `≈ ${quote.estMinutes} min`],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`flex items-center justify-between gap-4 py-3 ${
              index > 0 ? "border-t border-line-2" : ""
            }`}
          >
            <span className="text-[13px] text-ink-3">{label}</span>
            <span
              className={`truncate text-[13px] font-medium text-ink ${
                label === "Estimated" ? "font-mono" : ""
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-signal-tint p-3.5">
        {quote.isAdmin ? (
          <p className="text-[13.5px] font-medium text-ink">
            Free — admin account
          </p>
        ) : (
          <div>
            <p className="text-[13.5px] font-semibold text-ink">
              {quote.cost} credit{quote.cost === 1 ? "" : "s"}
            </p>
            <p className="font-mono text-[11px] text-signal-ink">
              {Math.max(0, (quote.balance ?? 0) - quote.cost)} left after this
            </p>
          </div>
        )}
        {!quote.isAdmin && (
          <button
            type="button"
            onClick={onBuyCredits}
            className="shrink-0 rounded-full border border-ink px-4 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            Top up
          </button>
        )}
      </div>

      {!quote.isAdmin && (quote.balance ?? 0) < quote.cost && (
        <p className="mt-2 text-[13px] text-signal-ink" role="alert">
          Not enough credits for this episode.
        </p>
      )}

      <div className="mt-4">
        <CheckboxRow
          checked={options.reviewScript}
          disabled={busy}
          onChange={(v) => set("reviewScript", v)}
        >
          Show me the script before making audio
        </CheckboxRow>
      </div>

      <div className="mt-4 space-y-2">
        {quote.isAdmin || (quote.balance ?? 0) >= quote.cost ? (
          <Button
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="w-full min-h-[52px]"
          >
            {busy ? "Starting…" : "Make episode"}
          </Button>
        ) : (
          <Button onClick={onBuyCredits} className="w-full min-h-[52px]">
            Buy credits
          </Button>
        )}
        <button
          type="button"
          onClick={() => setStep("options")}
          disabled={busy}
          className="block w-full py-2 text-center text-[13px] font-medium text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          Back
        </button>
      </div>
    </div>
  );

  const errorLine = error && (
    <p role="alert" className="mt-3 text-[13px] text-signal-ink">
      {error}
    </p>
  );

  const optionsPanel = (
    <div className="space-y-4">
      {files ? fileRow : dropzone}
      <div>
        <Eyebrow className="mb-2">
          {files ? "How should it sound?" : "Style"}
        </Eyebrow>
        {presetCards}
      </div>
      {disclosure}
      {reviewRow}
      {files && (
        <Button
          onClick={() => void runQuote(files, mode, options)}
          disabled={busy}
          className="w-full min-h-[52px]"
        >
          {busy ? "Pricing…" : "Continue"}
        </Button>
      )}
    </div>
  );

  if (surface === "rail") {
    return (
      <div>
        {fileInput}
        {step === "quote" && quotePanel ? quotePanel : optionsPanel}
        {errorLine}
      </div>
    );
  }

  return (
    <>
      {fileInput}
      <Sheet
        open={files !== null}
        onClose={busy ? () => {} : reset}
        aria-label="New episode"
      >
        {step === "quote" && quotePanel ? quotePanel : optionsPanel}
        {errorLine}
      </Sheet>
    </>
  );
}
