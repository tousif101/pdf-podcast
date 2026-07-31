import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeOptions,
  isSingleVoiceFormat,
  readCharBudget,
  LENGTH_BUDGETS,
} from "../../lib/options";
import { creditCost, estimateMinutes } from "../../lib/credits";
import { isValidVoice } from "../../lib/voices";

test("normalizeOptions fills sensible defaults for empty input", () => {
  const o = normalizeOptions({});
  assert.equal(o.length, "standard");
  assert.equal(o.format, "discussion");
  assert.equal(o.audience, "beginner");
  assert.ok(isValidVoice(o.hostVoice));
  assert.ok(isValidVoice(o.guestVoice));
  assert.ok(isValidVoice(o.readerVoice));
});

test("normalizeOptions rejects invalid/injection values and falls back", () => {
  const o = normalizeOptions({
    length: "'; drop table",
    format: "hacker",
    audience: 42,
    hostVoice: "EvilVoice",
    guestVoice: "../secret",
    readerVoice: null,
  });
  assert.equal(o.length, "standard");
  assert.equal(o.format, "discussion");
  assert.equal(o.audience, "beginner");
  assert.equal(o.hostVoice, "Kore");
  assert.equal(o.guestVoice, "Puck");
  assert.equal(o.readerVoice, "Enceladus");
});

test("normalizeOptions preserves valid values", () => {
  const o = normalizeOptions({
    length: "deep",
    format: "debate",
    audience: "expert",
    hostVoice: "Charon",
    guestVoice: "Aoede",
    readerVoice: "Zephyr",
    reviewScript: true,
  });
  assert.deepEqual(o, {
    length: "deep",
    format: "debate",
    audience: "expert",
    hostVoice: "Charon",
    guestVoice: "Aoede",
    readerVoice: "Zephyr",
    reviewScript: true,
  });
});

test("reviewScript defaults false and only true when explicitly set", () => {
  assert.equal(normalizeOptions({}).reviewScript, false);
  assert.equal(normalizeOptions({ reviewScript: "yes" }).reviewScript, false);
  assert.equal(normalizeOptions({ reviewScript: true }).reviewScript, true);
});

test("isSingleVoiceFormat identifies brief and lecture", () => {
  assert.equal(isSingleVoiceFormat("brief"), true);
  assert.equal(isSingleVoiceFormat("lecture"), true);
  assert.equal(isSingleVoiceFormat("discussion"), false);
  assert.equal(isSingleVoiceFormat("debate"), false);
});

test("readCharBudget uses read cap for reading, script budget for conversation", () => {
  assert.equal(readCharBudget("reading", "short"), LENGTH_BUDGETS.short.readChars);
  assert.equal(
    readCharBudget("conversation", "deep"),
    LENGTH_BUDGETS.deep.scriptChars,
  );
});

test("reading credit cost scales with length cap, not raw document size", () => {
  const huge = 5_000_000;
  // short caps at 30k chars => 2 credits; deep caps at 200k => 8 (max)
  assert.equal(creditCost("reading", huge, "short"), 2);
  assert.equal(creditCost("reading", huge, "deep"), 8);
});

test("conversation credit cost scales with the length tier", () => {
  // short (2k) and standard (4.5k) round to 1; deep (9k) is 2x standard => 2.
  assert.equal(creditCost("conversation", 999, "short"), 1);
  assert.equal(creditCost("conversation", 999, "standard"), 1);
  assert.equal(creditCost("conversation", 999, "deep"), 2);
});

test("estimateMinutes reflects the length preset for conversations", () => {
  assert.equal(estimateMinutes("conversation", 999, "short"), 3);
  assert.equal(estimateMinutes("conversation", 999, "deep"), 15);
});
