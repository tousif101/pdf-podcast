import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Episode } from "../../lib/types";

// Exercises the filesystem-backed store (FsMeta + FsBinary + CompositeStore)
// against a real temp directory. The Supabase/Blob drivers require live
// services and are not covered here.
//
// getStore() memoises a singleton keyed off env + cwd at first call, so we
// chdir into a temp dir and strip the cloud-backend envs BEFORE importing the
// module, then dynamically import it inside the tests.

const CLOUD_ENVS = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "VERCEL",
];

let tmpDir: string;
let originalCwd: string;
const savedEnv: Record<string, string | undefined> = {};
let storeModule: typeof import("../../lib/store");

before(async () => {
  originalCwd = process.cwd();
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-podcast-store-"));
  for (const key of CLOUD_ENVS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  process.chdir(tmpDir);
  storeModule = await import("../../lib/store");
});

after(async () => {
  process.chdir(originalCwd);
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const VALID_ID = "11111111-1111-4111-8111-111111111111";

function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: VALID_ID,
    userId: "user-1",
    title: "Draft",
    sourceFilename: "doc.pdf",
    status: "pending",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

test("isValidEpisodeId accepts UUIDs and rejects everything else", () => {
  assert.equal(storeModule.isValidEpisodeId(VALID_ID), true);
  assert.equal(
    storeModule.isValidEpisodeId("ABCDEF01-2345-6789-ABCD-EF0123456789"),
    true,
    "case-insensitive",
  );
  assert.equal(storeModule.isValidEpisodeId("not-a-uuid"), false);
  assert.equal(storeModule.isValidEpisodeId(""), false);
  assert.equal(
    storeModule.isValidEpisodeId(VALID_ID + "extra"),
    false,
    "anchored to the full string",
  );
});

test("id-guarded methods reject a non-UUID id before touching disk", () => {
  const store = storeModule.getStore();
  // assertId throws synchronously, before the promise is created.
  assert.throws(() => store.get("bad-id"), /Invalid episode id/);
  assert.throws(
    () => store.saveSource("bad-id", new Uint8Array()),
    /Invalid episode id/,
  );
});

test("create then get round-trips an episode through the fs meta driver", async () => {
  const store = storeModule.getStore();
  const ep = makeEpisode({ title: "Coffee History" });
  await store.create(ep);
  const got = await store.get(VALID_ID);
  assert.ok(got);
  assert.equal(got.title, "Coffee History");
  assert.equal(got.userId, "user-1");
  // The fs meta driver stores/returns fields verbatim; the "conversation"
  // default is applied only by the Supabase row mapper, not on read here.
  assert.equal(got.mode, undefined);
});

test("get returns null for a missing episode", async () => {
  const store = storeModule.getStore();
  const missing = "22222222-2222-4222-8222-222222222222";
  assert.equal(await store.get(missing), null);
});

test("patch updates only the given fields and returns the merged record", async () => {
  const store = storeModule.getStore();
  const updated = await store.patch(VALID_ID, {
    status: "ready",
    durationSeconds: 42,
  });
  assert.ok(updated);
  assert.equal(updated.status, "ready");
  assert.equal(updated.durationSeconds, 42);
  assert.equal(updated.title, "Coffee History", "untouched fields survive");
});

test("patch returns null for an episode that does not exist", async () => {
  const store = storeModule.getStore();
  const missing = "33333333-3333-4333-8333-333333333333";
  assert.equal(await store.patch(missing, { status: "ready" }), null);
});

test("source PDF bytes round-trip through the binary driver", async () => {
  const store = storeModule.getStore();
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2, 3]);
  await store.saveSource(VALID_ID, bytes);
  const got = await store.getSource(VALID_ID);
  assert.ok(got);
  assert.deepEqual(Array.from(got), Array.from(bytes));
});

test("getSource returns null when no source was saved", async () => {
  const store = storeModule.getStore();
  const other = "44444444-4444-4444-8444-444444444444";
  await store.create(makeEpisode({ id: other }));
  assert.equal(await store.getSource(other), null);
});

test("saved audio is retrievable and reports its mime type", async () => {
  const store = storeModule.getStore();
  await store.patch(VALID_ID, { audioMimeType: "audio/wav" });
  const wav = new Uint8Array([1, 2, 3, 4]);
  const saveResult = await store.saveAudio(VALID_ID, wav, "audio/wav");
  assert.equal(saveResult.url, undefined, "fs driver returns no public url");
  const audio = await store.getAudio(VALID_ID);
  assert.ok(audio);
  assert.equal(audio.mimeType, "audio/wav");
  assert.ok("data" in audio && audio.data);
  assert.deepEqual(Array.from(audio.data!), Array.from(wav));
});

test("getAudio returns null when the episode itself is gone", async () => {
  const store = storeModule.getStore();
  const missing = "55555555-5555-4555-8555-555555555555";
  assert.equal(await store.getAudio(missing), null);
});

test("list returns only the caller's episodes, newest first", async () => {
  const store = storeModule.getStore();
  const mine = "66666666-6666-4666-8666-666666666666";
  const theirs = "77777777-7777-4777-8777-777777777777";
  await store.create(
    makeEpisode({ id: mine, userId: "owner-x", createdAt: "2026-01-01T00:00:00Z" }),
  );
  await store.create(
    makeEpisode({ id: theirs, userId: "owner-y", createdAt: "2026-02-01T00:00:00Z" }),
  );
  const listed = await store.list({ userId: "owner-x" });
  const ids = listed.map((e) => e.id);
  assert.ok(ids.includes(mine));
  assert.ok(!ids.includes(theirs), "other users' episodes are filtered out");
  // Newest-first ordering across the whole listing.
  for (let i = 1; i < listed.length; i++) {
    assert.ok(listed[i - 1].createdAt >= listed[i].createdAt);
  }
});

test("list with includeUnowned surfaces legacy owner-less episodes", async () => {
  const store = storeModule.getStore();
  const legacy = "88888888-8888-4888-8888-888888888888";
  const ep = makeEpisode({ id: legacy });
  delete (ep as Partial<Episode>).userId;
  await store.create(ep);

  const withoutUnowned = await store.list({ userId: "owner-z" });
  assert.ok(!withoutUnowned.some((e) => e.id === legacy));

  const withUnowned = await store.list({
    userId: "owner-z",
    includeUnowned: true,
  });
  assert.ok(withUnowned.some((e) => e.id === legacy));
});

test("delete removes metadata, source and audio", async () => {
  const store = storeModule.getStore();
  const doomed = "99999999-9999-4999-8999-999999999999";
  await store.create(makeEpisode({ id: doomed, audioMimeType: "audio/wav" }));
  await store.saveSource(doomed, new Uint8Array([1, 2, 3]));
  await store.saveAudio(doomed, new Uint8Array([4, 5, 6]), "audio/wav");

  await store.delete(doomed);

  assert.equal(await store.get(doomed), null);
  assert.equal(await store.getSource(doomed), null);
  assert.equal(await store.getAudio(doomed), null);
});
