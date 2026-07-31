import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { getStore } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";
import { creditCost, getBalance, refundEpisode, spendCredits } from "@/lib/credits";
import { extractPdfText } from "@/lib/pipeline/extract";
import { generateEpisode } from "@/workflows/generate-episode";
import type { Episode } from "@/lib/types";

// Vercel functions reject request bodies over ~4.5 MB before the handler runs,
// so advertising a bigger limit would produce opaque platform 413s.
const MAX_PDF_BYTES = 4 * 1024 * 1024;

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
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Upload a PDF in the 'file' field" },
      { status: 400 },
    );
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: "PDF is too large (4 MB max)" },
      { status: 413 },
    );
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const isPdf =
    data.length > 4 &&
    data[0] === 0x25 &&
    data[1] === 0x50 &&
    data[2] === 0x44 &&
    data[3] === 0x46;
  if (!isPdf && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 415 },
    );
  }

  const modeField = form.get("mode");
  const mode = modeField === "reading" ? "reading" : "conversation";

  let extractedChars: number;
  try {
    // PDF.js transfers (detaches) the buffer it's given — extract from a copy
    // so `data` stays usable for saveSource below.
    const { text } = await extractPdfText(new Uint8Array(data));
    extractedChars = text.length;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read this PDF" },
      { status: 422 },
    );
  }

  const episodeId = crypto.randomUUID();
  const cost = creditCost(mode, extractedChars);
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

  const store = getStore();
  const episode: Episode = {
    id: episodeId,
    userId: user.id,
    title: file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "),
    sourceFilename: file.name,
    mode,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  try {
    await store.saveSource(episode.id, data);
    await store.create(episode);
    await start(generateEpisode, [episode.id]);
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
