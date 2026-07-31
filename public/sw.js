const SHELL_CACHE = "shell-v1";
const AUDIO_CACHE = "episode-audio";
const ALLOWED_CACHES = [SHELL_CACHE, AUDIO_CACHE];
const AUDIO_PATH = /^\/api\/episodes\/.+\/audio$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add("/"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALLOWED_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function respondToAudio(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request.url, {
    ignoreSearch: true,
    ignoreVary: true,
  });
  if (cached && cached.status === 200) {
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      const match = /bytes=(\d*)-(\d*)/i.exec(rangeHeader);
      if (match && (match[1] !== "" || match[2] !== "")) {
        const buffer = await cached.arrayBuffer();
        const total = buffer.byteLength;
        let start;
        let end;
        if (match[1] === "") {
          start = Math.max(0, total - Number(match[2]));
          end = total - 1;
        } else {
          start = Number(match[1]);
          end =
            match[2] === "" ? total - 1 : Math.min(Number(match[2]), total - 1);
        }
        if (start >= total) {
          return new Response(null, {
            status: 416,
            statusText: "Range Not Satisfiable",
            headers: {
              "Content-Range": "bytes */" + total,
              "Accept-Ranges": "bytes",
            },
          });
        }
        if (start <= end) {
          const body = buffer.slice(start, end + 1);
          return new Response(body, {
            status: 206,
            statusText: "Partial Content",
            headers: {
              "Content-Type":
                cached.headers.get("Content-Type") || "application/octet-stream",
              "Content-Range": "bytes " + start + "-" + end + "/" + total,
              "Content-Length": String(body.byteLength),
              "Accept-Ranges": "bytes",
            },
          });
        }
      }
    } else {
      return cached.clone();
    }
  }
  return fetch(request);
}

async function respondToNavigation(request) {
  try {
    return await fetch(request);
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match("/");
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (AUDIO_PATH.test(url.pathname)) {
    event.respondWith(respondToAudio(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(respondToNavigation(request));
  }
});
