import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEditedScript } from "../../lib/options";

const goodLines = [
  { speaker: "HOST", text: "Welcome to the show." },
  { speaker: "GUEST", text: "Glad to be here." },
];

test("accepts a valid edited script and trims text", () => {
  const r = validateEditedScript(
    { title: "  My Episode  ", lines: goodLines },
    "conversation",
    "standard",
  );
  assert.ok(r.ok);
  assert.equal(r.script?.title, "My Episode");
  assert.equal(r.script?.lines.length, 2);
});

test("drops blank lines but keeps content", () => {
  const r = validateEditedScript(
    { title: "t", lines: [{ speaker: "HOST", text: "  " }, ...goodLines] },
    "conversation",
    "standard",
  );
  assert.ok(r.ok);
  assert.equal(r.script?.lines.length, 2);
});

test("rejects a non-array or empty lines payload", () => {
  assert.equal(validateEditedScript({ lines: "nope" }, "conversation", "standard").ok, false);
  assert.equal(validateEditedScript({ lines: [] }, "conversation", "standard").ok, false);
  assert.equal(validateEditedScript(null, "conversation", "standard").ok, false);
});

test("rejects an invalid speaker (injection-safe enum)", () => {
  const r = validateEditedScript(
    { title: "t", lines: [{ speaker: "ADMIN", text: "hi" }] },
    "conversation",
    "standard",
  );
  assert.equal(r.ok, false);
});

test("rejects a script that exceeds the paid length budget", () => {
  // standard conversation budget is 4500 chars * 1.25 headroom ≈ 5625.
  const huge = { speaker: "HOST", text: "x".repeat(4000) };
  const r = validateEditedScript(
    { title: "t", lines: [huge, huge] },
    "conversation",
    "standard",
  );
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /too long/);
});

test("a longer length tier permits a longer edited script", () => {
  const huge = { speaker: "HOST", text: "x".repeat(4000) };
  const r = validateEditedScript(
    { title: "t", lines: [huge, huge] },
    "reading",
    "deep",
  );
  assert.ok(r.ok, "deep reading budget easily fits 8k chars");
});

test("rejects a single overlong line", () => {
  const r = validateEditedScript(
    { title: "t", lines: [{ speaker: "HOST", text: "x".repeat(5001) }] },
    "reading",
    "deep",
  );
  assert.equal(r.ok, false);
});
