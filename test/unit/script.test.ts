import { test } from "node:test";
import assert from "node:assert/strict";
import {
  verbatimScript,
  generatePodcastScript,
  scriptProviderName,
} from "../../lib/pipeline/script";
import { normalizeOptions } from "../../lib/options";

const OPTS = normalizeOptions({});
const READ_CAP = 100_000;

// These tests exercise the deterministic, credential-free code paths:
//   - verbatimScript (pure, "read aloud" mode)
//   - generatePodcastScript's mock fallback (no gateway credentials)
// The live AI-gateway branch is intentionally not exercised.

const GATEWAY_ENVS = ["AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "VERCEL"];

function clearGatewayEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of GATEWAY_ENVS) {
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

test("verbatimScript derives a title from the filename", () => {
  const s = verbatimScript("Some text.", "history-of_coffee.PDF", READ_CAP);
  // Strips the .pdf extension (case-insensitive) and normalises -/_ to spaces.
  assert.equal(s.title, "history of coffee");
});

test("verbatimScript keeps every line under the chunk limit and preserves order", () => {
  const sentences = Array.from(
    { length: 50 },
    (_, i) => `Sentence number ${i} has a little bit of content here.`,
  );
  const source = sentences.join(" ");
  const s = verbatimScript(source, "doc.pdf", READ_CAP);

  assert.ok(s.lines.length > 1, "long input is split into multiple lines");
  for (const line of s.lines) {
    assert.equal(line.speaker, "HOST", "read-aloud uses a single narrator");
    assert.ok(line.text.length <= 900, "each chunk stays under READ_CHUNK_CHARS");
  }
  // No content is dropped: concatenating chunks reproduces the source words.
  const rejoined = s.lines.map((l) => l.text).join(" ");
  assert.equal(rejoined, source);
});

test("verbatimScript keeps a sentence longer than the chunk limit intact", () => {
  const giant = "x".repeat(2_000) + ".";
  const s = verbatimScript(giant, "doc.pdf", READ_CAP);
  // A single oversized sentence can't be split further; it becomes one line.
  assert.equal(s.lines.length, 1);
  assert.equal(s.lines[0].text, giant);
});

test("verbatimScript produces no lines for empty input", () => {
  const s = verbatimScript("", "doc.pdf", READ_CAP);
  assert.deepEqual(s.lines, []);
});

test("generatePodcastScript falls back to a deterministic mock without credentials", async () => {
  const saved = clearGatewayEnv();
  try {
    const source = Array.from(
      { length: 100 },
      (_, i) => `This is sentence ${i} with enough words to be sampled here.`,
    ).join(" ");
    const script = await generatePodcastScript(source, "my-report.pdf", OPTS);

    assert.equal(script.title, "my report", "title from filename");
    assert.ok(script.lines.length >= 3, "has intro, body, outro");

    const first = script.lines[0];
    const last = script.lines[script.lines.length - 1];
    assert.equal(first.speaker, "HOST");
    assert.match(first.text, /Welcome back to the show/);
    assert.equal(last.speaker, "HOST");
    assert.match(last.text, /Thanks for listening/);

    // Only valid speaker labels appear.
    for (const line of script.lines) {
      assert.ok(
        line.speaker === "HOST" || line.speaker === "GUEST",
        "speaker is HOST or GUEST",
      );
    }
  } finally {
    restoreEnv(saved);
  }
});

test("mock script is deterministic for identical input", async () => {
  const saved = clearGatewayEnv();
  try {
    const source = Array.from(
      { length: 80 },
      (_, i) => `Deterministic sentence ${i} that is comfortably long enough.`,
    ).join(" ");
    const a = await generatePodcastScript(source, "doc.pdf", OPTS);
    const b = await generatePodcastScript(source, "doc.pdf", OPTS);
    assert.deepEqual(a, b);
  } finally {
    restoreEnv(saved);
  }
});

test("scriptProviderName reports 'mock' when no credentials are configured", () => {
  const saved = clearGatewayEnv();
  try {
    assert.equal(scriptProviderName(), "mock");
  } finally {
    restoreEnv(saved);
  }
});

test("scriptProviderName reports the model when a gateway key is present", () => {
  const saved = clearGatewayEnv();
  const savedModel = process.env.PODCAST_SCRIPT_MODEL;
  delete process.env.PODCAST_SCRIPT_MODEL;
  process.env.AI_GATEWAY_API_KEY = "test-key";
  try {
    assert.equal(scriptProviderName(), "anthropic/claude-sonnet-5");
    process.env.PODCAST_SCRIPT_MODEL = "anthropic/claude-sonnet-4.6";
    assert.equal(scriptProviderName(), "anthropic/claude-sonnet-4.6");
  } finally {
    if (savedModel === undefined) delete process.env.PODCAST_SCRIPT_MODEL;
    else process.env.PODCAST_SCRIPT_MODEL = savedModel;
    restoreEnv(saved);
  }
});
