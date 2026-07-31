import { describe, it, expect, beforeAll } from "vitest";
import { start } from "workflow/api";
import { generateEpisode } from "@/workflows/generate-episode";
import { getStore } from "@/lib/store";
import type { Episode } from "@/lib/types";

function makeEpisode(id: string, mode: Episode["mode"]): Episode {
  return {
    id,
    title: "test",
    sourceFilename: "history-of-coffee.pdf",
    mode,
    status: "pending",
    createdAt: new Date(2026, 0, 1).toISOString(),
  };
}

async function seed(id: string, mode: Episode["mode"]) {
  const store = getStore();
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const pdf = await fs.readFile(
    path.join(process.cwd(), "test/fixtures/history-of-coffee.pdf"),
  );
  await store.saveSource(id, new Uint8Array(pdf));
  await store.create(makeEpisode(id, mode));
}

describe("generateEpisode workflow", () => {
  beforeAll(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("takes a read-aloud episode from pending to ready with audio", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    await seed(id, "reading");
    const run = await start(generateEpisode, [id]);
    await run.returnValue;
    const episode = await getStore().get(id);
    expect(episode?.status).toBe("ready");
    expect(episode?.durationSeconds).toBeGreaterThan(0);
    const audio = await getStore().openAudio(id, null);
    expect(audio?.status).toBe(200);
  });

  it("marks a missing-source episode as error, not stuck", async () => {
    const id = "22222222-2222-4222-8222-222222222222";
    await getStore().create(makeEpisode(id, "reading"));
    const run = await start(generateEpisode, [id]);
    await run.returnValue.catch(() => {});
    const episode = await getStore().get(id);
    expect(episode?.status).toBe("error");
  });
});
