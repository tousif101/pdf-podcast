import { getStore } from "@/lib/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const audio = await getStore().getAudio(id);
  if (!audio) {
    return new Response("Not found", { status: 404 });
  }
  if (audio.url) {
    return Response.redirect(audio.url, 302);
  }

  const data = audio.data!;
  const range = request.headers.get("range");
  const baseHeaders: Record<string, string> = {
    "Content-Type": audio.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : data.byteLength - 1;
      if (start <= end && start < data.byteLength) {
        const chunk = data.slice(start, end + 1);
        return new Response(Buffer.from(chunk), {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${data.byteLength}`,
            "Content-Length": String(chunk.byteLength),
          },
        });
      }
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${data.byteLength}` },
      });
    }
  }

  return new Response(Buffer.from(data), {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(data.byteLength) },
  });
}
