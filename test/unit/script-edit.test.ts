import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateEditedScript,
  editCharBudget,
  scriptChars,
} from "../../lib/options";

// The original generated script the user paid for (~36 chars of text).
const ORIGINAL = {
  title: "Original",
  lines: [
    { speaker: "HOST" as const, text: "Welcome to the show." },
    { speaker: "GUEST" as const, text: "Glad to be here." },
  ],
};
const CAP = editCharBudget(scriptChars(ORIGINAL));

const goodLines = [
  { speaker: "HOST", text: "Welcome to the show." },
  { speaker: "GUEST", text: "Glad to be here." },
];

test("accepts a valid edited script and trims text", () => {
  const r = validateEditedScript({ title: "  My Episode  ", lines: goodLines }, CAP);
  assert.ok(r.ok);
  assert.equal(r.script?.title, "My Episode");
  assert.equal(r.script?.lines.length, 2);
});

test("drops blank lines but keeps content", () => {
  const r = validateEditedScript(
    { title: "t", lines: [{ speaker: "HOST", text: "  " }, ...goodLines] },
    CAP,
  );
  assert.ok(r.ok);
  assert.equal(r.script?.lines.length, 2);
});

test("rejects a non-array or empty lines payload", () => {
  assert.equal(validateEditedScript({ lines: "nope" }, CAP).ok, false);
  assert.equal(validateEditedScript({ lines: [] }, CAP).ok, false);
  assert.equal(validateEditedScript(null, CAP).ok, false);
});

test("rejects an invalid speaker (injection-safe enum)", () => {
  const r = validateEditedScript(
    { title: "t", lines: [{ speaker: "ADMIN", text: "hi" }] },
    CAP,
  );
  assert.equal(r.ok, false);
});

test("rejects an edit that grows past the original script size", () => {
  // Original is ~36 chars; cap ≈ 236. Pasting 4000 chars must be rejected.
  const r = validateEditedScript(
    { title: "t", lines: [{ speaker: "HOST", text: "x".repeat(4000) }] },
    CAP,
  );
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /longer than/);
});

test("allows light edits within the original-size headroom", () => {
  const r = validateEditedScript(
    { title: "t", lines: [{ speaker: "HOST", text: "A slightly reworded opening line here." }] },
    CAP,
  );
  assert.ok(r.ok);
});

test("editCharBudget scales with the original and adds a small allowance", () => {
  assert.equal(editCharBudget(0), 200);
  assert.equal(editCharBudget(1000), 1300);
});

test("rejects a single overlong line regardless of budget", () => {
  const r = validateEditedScript(
    { title: "t", lines: [{ speaker: "HOST", text: "x".repeat(5001) }] },
    1_000_000,
  );
  assert.equal(r.ok, false);
});
