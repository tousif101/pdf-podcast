import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRssXml, isValidFeedToken } from "../../lib/feed";
import type { Episode } from "../../lib/types";

function ep(over: Partial<Episode>): Episode {
  return {
    id: "2a306267-d1f6-4803-814d-a0a17e85018c",
    userId: "u1",
    title: "Test Episode",
    sourceFilename: "test.pdf",
    status: "ready",
    createdAt: "2026-07-31T12:00:00.000Z",
    durationSeconds: 125,
    audioMimeType: "audio/mpeg",
    ...over,
  };
}

const ctx = {
  feedUrl: "https://x.test/api/feed/tok/rss.xml",
  audioBase: "https://x.test/api/feed/tok/audio",
  imageUrl: "https://x.test/icons/icon-512.png",
};

test("isValidFeedToken accepts our tokens and rejects junk", () => {
  assert.equal(isValidFeedToken("abc123DEF456ghi789"), true);
  assert.equal(isValidFeedToken("../etc"), false);
  assert.equal(isValidFeedToken("short"), false);
  assert.equal(isValidFeedToken("has space here bad"), false);
});

test("buildRssXml only includes ready episodes with a duration", () => {
  const xml = buildRssXml(
    [
      ep({}),
      ep({ id: "11111111-1111-4111-8111-111111111111", status: "synthesizing" }),
      ep({ id: "22222222-2222-4222-8222-222222222222", durationSeconds: undefined }),
    ],
    ctx,
  );
  assert.equal((xml.match(/<item>/g) ?? []).length, 1);
  assert.match(xml, /rss version="2.0"/);
  assert.match(xml, /2a306267-d1f6-4803-814d-a0a17e85018c\.mp3/);
  assert.match(xml, /<itunes:duration>2:05<\/itunes:duration>/);
});

test("buildRssXml escapes user text to prevent XML injection", () => {
  const xml = buildRssXml(
    [ep({ title: 'Bad & <script>"title"</script>' })],
    ctx,
  );
  assert.match(xml, /Bad &amp; &lt;script&gt;/);
  assert.doesNotMatch(xml, /<script>/);
});

test("buildRssXml produces an empty item list for no ready episodes", () => {
  const xml = buildRssXml([ep({ status: "pending" })], ctx);
  assert.equal((xml.match(/<item>/g) ?? []).length, 0);
  assert.match(xml, /<channel>/);
});
