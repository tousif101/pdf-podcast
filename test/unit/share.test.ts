import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidShareToken, newShareToken } from "../../lib/share";
import * as storeModule from "../../lib/store";

test("isValidShareToken accepts real tokens, rejects junk", () => {
  assert.equal(isValidShareToken(newShareToken()), true);
  assert.equal(isValidShareToken("../etc/passwd"), false);
  assert.equal(isValidShareToken("short"), false);
  assert.equal(isValidShareToken("has space bad token here"), false);
});

test("newShareToken is unguessable and unique", () => {
  const a = newShareToken();
  const b = newShareToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 16);
});

test("setShareToken/getByShareToken round-trips through the store", async () => {
  const store = storeModule.getStore();
  const id = "3a306267-d1f6-4803-814d-a0a17e85018c";
  await store.create({
    id,
    userId: "owner",
    title: "Sharable",
    sourceFilename: "x.pdf",
    status: "ready",
    createdAt: "2026-07-31T00:00:00Z",
  });
  const token = newShareToken();
  await store.setShareToken(id, token);
  const found = await store.getByShareToken(token);
  assert.equal(found?.id, id);
  assert.equal(found?.shareToken, token);

  // Clearing removes the link.
  await store.setShareToken(id, null);
  assert.equal(await store.getByShareToken(token), null);
});
