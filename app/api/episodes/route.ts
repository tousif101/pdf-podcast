import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { getStore } from "@/lib/store";
import { generateEpisode } from "@/workflows/generate-episode";
import type { Episode } from "@/lib/types";

const MAX_PDF_BYTES = 25 * 1024 * 1024;

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
      { error: "PDF is too large (25 MB max)" },
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

  const store = getStore();
  const episode: Episode = {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "),
    sourceFilename: file.name,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await store.saveSource(episode.id, data);
  await store.put(episode);
  await start(generateEpisode, [episode.id]);

  return NextResponse.json({ id: episode.id }, { status: 202 });
}
