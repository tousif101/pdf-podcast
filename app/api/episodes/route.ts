import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { getStore } from "@/lib/store";
import { generateEpisode } from "@/workflows/generate-episode";
import type { Episode } from "@/lib/types";

// Vercel functions reject request bodies over ~4.5 MB before the handler runs,
// so advertising a bigger limit would produce opaque platform 413s.
const MAX_PDF_BYTES = 4 * 1024 * 1024;

export async function GET() {
  const episodes = await getStore().list();
  return NextResponse.json({ episodes });
}

export async function POST(request: Request) {
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

  const store = getStore();
  const episode: Episode = {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "),
    sourceFilename: file.name,
    mode,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await store.saveSource(episode.id, data);
  await store.create(episode);
  try {
    await start(generateEpisode, [episode.id]);
  } catch (err) {
    console.error(`Failed to start workflow for ${episode.id}:`, err);
    await store.patch(episode.id, {
      status: "error",
      error: "Could not start generation. Please retry the upload.",
    });
    return NextResponse.json(
      { error: "Could not start generation" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: episode.id }, { status: 202 });
}
