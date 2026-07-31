import { getStore, isValidEpisodeId } from "@/lib/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidEpisodeId(id)) {
    return new Response("Invalid id", { status: 400 });
  }
  const audio = await getStore().getAudio(id);
  if (!audio) {
    return new Response("Not found", { status: 404 });
  }
  if (audio.url) {
    return Response.redirect(audio.url, 302);
  }

  const data = audio.data!;
  const total = data.byteLength;
  const baseHeaders: Record<string, string> = {
    "Content-Type": audio.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const range = request.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match && (match[1] || match[2])) {
      let start: number;
      let end: number;
      if (!match[1]) {
        // Suffix range: last N bytes.
        const suffix = Math.min(parseInt(match[2], 10), total);
        start = total - suffix;
        end = total - 1;
      } else {
        start = parseInt(match[1], 10);
        end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;
      }
      if (start <= end && start < total) {
        const chunk = data.slice(start, end + 1);
        return new Response(Buffer.from(chunk), {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${total}`,
            "Content-Length": String(chunk.byteLength),
          },
        });
      }
      return new Response(null, {
        status: 416,
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes */${total}`,
        },
      });
    }
  }

  return new Response(Buffer.from(data), {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}
