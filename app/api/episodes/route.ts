import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { getStore } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";
import { creditCost, getBalance, refundEpisode, spendCredits } from "@/lib/credits";
import { normalizeOptions } from "@/lib/options";
import {
  extractPdfText,
  looksLikePdf,
  validatePdfFile,
} from "@/lib/pipeline/extract";
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
  const check = validatePdfFile(form.get("file"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  const file = check.file;
  const data = new Uint8Array(await file.arrayBuffer());
  if (!looksLikePdf(data, file.name)) {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 415 },
    );
  }

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

  let extractedChars: number;
  try {
    // PDF.js transfers (detaches) the buffer it's given — extract from a copy
    // so `data` stays usable for saveSource below.
    const { text } = await extractPdfText(new Uint8Array(data));
    extractedChars = text.length;
  } catch {
    return NextResponse.json(
      { error: "Could not read this PDF. It may be scanned or corrupted." },
      { status: 422 },
    );
  }

  const episodeId = crypto.randomUUID();
  const cost = creditCost(mode, extractedChars, options.length);
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
    title: file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "),
    sourceFilename: file.name,
    mode,
    options,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  try {
    await store.saveSource(episode.id, data);
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
