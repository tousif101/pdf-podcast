import { test } from "node:test";
import assert from "node:assert/strict";
import { creditCost, estimateMinutes } from "../../lib/credits";

// creditCost / estimateMinutes are pure; the async ledger helpers
// (getBalance/spendCredits/refundEpisode) require a live Supabase RPC and are
// covered by the credit-ledger SQL notes rather than these unit tests.

test("reading cost is 1 credit per 25k chars, rounded up, min 1", () => {
  assert.equal(creditCost("reading", 0), 1, "floor is 1 even for empty text");
  assert.equal(creditCost("reading", 1), 1);
  assert.equal(creditCost("reading", 25_000), 1, "exactly one bucket");
  assert.equal(creditCost("reading", 25_001), 2, "just over one bucket");
  assert.equal(creditCost("reading", 50_000), 2);
  assert.equal(creditCost("reading", 60_000), 3, "ceil, not round");
});

test("conversation cost is always a flat 1 credit regardless of size", () => {
  assert.equal(creditCost("conversation", 0), 1);
  assert.equal(creditCost("conversation", 500_000), 1);
});

test("reading minutes estimate is ~1 per 1000 chars, rounded, min 1", () => {
  assert.equal(estimateMinutes("reading", 0), 1, "floor is 1 minute");
  assert.equal(estimateMinutes("reading", 400), 1, "rounds up from 0.4");
  assert.equal(estimateMinutes("reading", 499), 1, "rounds down from 0.499");
  assert.equal(estimateMinutes("reading", 1_000), 1);
  assert.equal(estimateMinutes("reading", 1_500), 2, "rounds 1.5 -> 2");
  assert.equal(estimateMinutes("reading", 10_000), 10);
});

test("conversation minutes estimate is a flat 7 minutes", () => {
  assert.equal(estimateMinutes("conversation", 0), 7);
  assert.equal(estimateMinutes("conversation", 1_000_000), 7);
});
