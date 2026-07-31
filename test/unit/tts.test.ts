import { test } from "node:test";
import assert from "node:assert/strict";
import {
  synthesizeDialogue,
  ttsProviderName,
} from "../../lib/pipeline/tts";
import type { PodcastScript } from "../../lib/types";

// Only the credential-free mock synthesizer is exercised. The Gemini branch
// makes a live HTTP call and is out of scope for unit tests.

const GEMINI_ENVS = ["GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"];

function clearGeminiEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of GEMINI_ENVS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  return saved;
}

function restoreEnv(saved: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

const script: PodcastScript = {
  title: "Test Episode",
  lines: [
    { speaker: "HOST", text: "Welcome to the show everyone." },
    { speaker: "GUEST", text: "Thanks, glad to be here today." },
    { speaker: "HOST", text: "Let us dive right in." },
  ],
};

function readAscii(buf: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...buf.subarray(offset, offset + length));
}

test("ttsProviderName reports 'mock' with no Gemini key", () => {
  const saved = clearGeminiEnv();
  try {
    assert.equal(ttsProviderName(), "mock");
  } finally {
    restoreEnv(saved);
  }
});

test("ttsProviderName reports the model when GEMINI_API_KEY is set", () => {
  const saved = clearGeminiEnv();
  const savedModel = process.env.PODCAST_TTS_MODEL;
  process.env.GEMINI_API_KEY = "test-key";
  try {
    // Default model name (PODCAST_TTS_MODEL is read at import time, so we only
    // assert it is a non-mock string here).
    assert.notEqual(ttsProviderName(), "mock");
    assert.ok(ttsProviderName().length > 0);
  } finally {
    if (savedModel === undefined) delete process.env.PODCAST_TTS_MODEL;
    else process.env.PODCAST_TTS_MODEL = savedModel;
    restoreEnv(saved);
  }
});

test("synthesizeDialogue in mock mode returns a valid MP3 with positive duration", async () => {
  const saved = clearGeminiEnv();
  try {
    const result = await synthesizeDialogue(script, "conversation");
    assert.equal(result.mimeType, "audio/mpeg");
    assert.ok(result.durationSeconds > 0, "non-empty audio has a duration");

    // Output starts with an MP3 frame sync (11 set bits).
    assert.ok(result.audio.byteLength > 0, "non-empty payload");
    assert.equal(result.audio[0], 0xff);
    assert.equal(result.audio[1] & 0xe0, 0xe0, "MP3 frame sync bits");
  } finally {
    restoreEnv(saved);
  }
});

test("mock synthesis defaults to conversation mode when mode is omitted", async () => {
  const saved = clearGeminiEnv();
  try {
    const result = await synthesizeDialogue(script);
    assert.equal(result.mimeType, "audio/mpeg");
    assert.ok(result.durationSeconds > 0);
  } finally {
    restoreEnv(saved);
  }
});

test("mock synthesis duration grows with more dialogue", async () => {
  const saved = clearGeminiEnv();
  try {
    const short = await synthesizeDialogue(
      { title: "t", lines: [{ speaker: "HOST", text: "Hi." }] },
      "conversation",
    );
    const long = await synthesizeDialogue(
      {
        title: "t",
        lines: Array.from({ length: 10 }, (_, i) => ({
          speaker: (i % 2 === 0 ? "HOST" : "GUEST") as "HOST" | "GUEST",
          text: "This is a reasonably long spoken line with several words.",
        })),
      },
      "conversation",
    );
    assert.ok(
      long.durationSeconds > short.durationSeconds,
      "more/longer lines yield a longer episode",
    );
  } finally {
    restoreEnv(saved);
  }
});
