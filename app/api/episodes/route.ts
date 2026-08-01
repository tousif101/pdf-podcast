import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { getStore } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";
import { creditCost, getBalance, refundEpisode, spendCredits } from "@/lib/credits";
import { normalizeOptions } from "@/lib/options";
import { readUploads } from "@/lib/pipeline/extract";
import { ACTIVE_STATUSES } from "@/components/format";
import { generateEpisode } from "@/workflows/generate-episode";
import type { Episode } from "@/lib/types";

// One user can't monopolize the generation queue.
const MAX_CONCURRENT_GENERATIONS = 3;

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const episodes = await getStore().list({
    userId: user.id,
    includeUnowned: user.isAdmin,
  });
  return NextResponse.json({ episodes });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const form = await request.formData();
  const modeField = form.get("mode");
  const mode = modeField === "reading" ? "reading" : "conversation";
  const optionsRaw = form.get("options");
  const options = normalizeOptions(
    typeof optionsRaw === "string" ? safeJson(optionsRaw) : undefined,
  );

  const store = getStore();
  if (!user.isAdmin) {
    const mine = await store.list({ userId: user.id });
    const active = mine.filter((e) => ACTIVE_STATUSES.includes(e.status)).length;
    if (active >= MAX_CONCURRENT_GENERATIONS) {
      return NextResponse.json(
        { error: "You already have episodes generating. Please wait." },
        { status: 429 },
      );
    }
  }

  const upload = await readUploads(form.getAll("file"));
  if (!upload.ok) {
    return NextResponse.json({ error: upload.error }, { status: upload.status });
  }

  const episodeId = crypto.randomUUID();
  const cost = creditCost(mode, upload.chars, options.length);
  if (!user.isAdmin) {
    const ok = await spendCredits(user.id, cost, episodeId);
    if (!ok) {
      const balance = await getBalance(user.id);
      return NextResponse.json(
        { error: `Not enough credits (need ${cost}, have ${balance})`, cost, balance },
        { status: 402 },
      );
    }
  }

  const episode: Episode = {
    id: episodeId,
    userId: user.id,
    title: upload.sourceFilename.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "),
    sourceFilename: upload.sourceFilename,
    mode,
    options,
    totalPages: upload.totalPages,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  try {
    await store.saveSourceText(episode.id, upload.text);
    await store.create(episode);
    await start(generateEpisode, [episode.id, options.reviewScript]);
  } catch (err) {
    console.error(`Failed to start generation for ${episode.id}:`, err);
    await refundEpisode(user.id, episode.id);
    await store
      .patch(episode.id, {
        status: "error",
        error: "Could not start generation. Your credits were refunded.",
      })
      .catch(() => null);
    return NextResponse.json(
      { error: "Could not start generation" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: episode.id, cost }, { status: 202 });
}
