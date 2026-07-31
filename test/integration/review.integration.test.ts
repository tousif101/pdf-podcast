import { describe, it, expect, beforeAll } from "vitest";
import { start, resumeHook } from "workflow/api";
import { waitForHook } from "@workflow/vitest";
import { generateEpisode } from "@/workflows/generate-episode";
import { getStore } from "@/lib/store";
import type { Episode } from "@/lib/types";

function makeEpisode(id: string): Episode {
  return {
    id,
    title: "test",
    sourceFilename: "history-of-coffee.pdf",
    mode: "reading",
    options: {
      length: "standard",
      format: "discussion",
      audience: "beginner",
      hostVoice: "Kore",
      guestVoice: "Puck",
      readerVoice: "Enceladus",
      reviewScript: true,
    },
    status: "pending",
    createdAt: new Date(2026, 0, 1).toISOString(),
  };
}

async function seed(id: string) {
  const store = getStore();
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const pdf = await fs.readFile(
    path.join(process.cwd(), "test/fixtures/history-of-coffee.pdf"),
  );
  await store.saveSource(id, new Uint8Array(pdf));
  await store.create(makeEpisode(id));
}

describe("script review flow", () => {
  beforeAll(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.GEMINI_API_KEY;
  });

  it("pauses at script_ready, applies edits, then finishes on resume", async () => {
    const id = "33333333-3333-4333-8333-333333333333";
    await seed(id);
    const run = await start(generateEpisode, [id, true]);

    // Workflow suspends at the approval hook.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await waitForHook(run as any, { token: `approve:${id}` });
    const paused = await getStore().get(id);
    expect(paused?.status).toBe("script_ready");
    expect(paused?.script?.lines.length).toBeGreaterThan(0);

    // Simulate the PATCH route: atomically claim the review, then resume.
    const claimed = await getStore().patchIf(id, "script_ready", {
      status: "synthesizing",
      title: "Edited Title",
      script: { title: "Edited Title", lines: [{ speaker: "HOST", text: "Just this one line." }] },
    });
    expect(claimed).not.toBeNull();
    // A second claim must fail (double-resume protection).
    const second = await getStore().patchIf(id, "script_ready", {
      status: "synthesizing",
    });
    expect(second).toBeNull();
    await resumeHook(`approve:${id}`, { ok: true });
    await run.returnValue;

    const done = await getStore().get(id);
    expect(done?.status).toBe("ready");
    expect(done?.title).toBe("Edited Title");
    // The synthesized audio reflects the edited (shorter) script.
    expect(done?.script?.lines.length).toBe(1);
    const audio = await getStore().openAudio(id, null);
    expect(audio?.status).toBe(200);
  });
});
