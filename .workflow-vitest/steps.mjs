// biome-ignore-all lint: generated file
/* eslint-disable */

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// lib/store.ts
var store_exports = {};
__export(store_exports, {
  getStore: () => getStore,
  isValidEpisodeId: () => isValidEpisodeId
});
import { promises as fs } from "fs";
import path from "path";
function isValidEpisodeId(id) {
  return UUID_RE.test(id);
}
function assertId(id) {
  if (!isValidEpisodeId(id)) {
    throw new Error(`Invalid episode id: ${id.slice(0, 40)}`);
  }
}
function rowToEpisode(row) {
  return {
    id: row.id,
    userId: row.user_id ?? void 0,
    title: row.title,
    sourceFilename: row.source_filename,
    mode: row.mode ?? "conversation",
    options: row.options ?? void 0,
    shareToken: row.share_token ?? void 0,
    status: row.status,
    error: row.error ?? void 0,
    createdAt: row.created_at,
    totalPages: row.total_pages ?? void 0,
    extractedChars: row.extracted_chars ?? void 0,
    script: row.script ?? void 0,
    audioMimeType: row.audio_mime_type ?? void 0,
    durationSeconds: row.duration_seconds ?? void 0,
    providers: row.providers ?? void 0
  };
}
function episodeToRow(fields) {
  const row = {};
  if (fields.id !== void 0) row.id = fields.id;
  if (fields.userId !== void 0) row.user_id = fields.userId;
  if (fields.title !== void 0) row.title = fields.title;
  if (fields.sourceFilename !== void 0) row.source_filename = fields.sourceFilename;
  if (fields.mode !== void 0) row.mode = fields.mode;
  if (fields.options !== void 0) row.options = fields.options;
  if (fields.shareToken !== void 0) row.share_token = fields.shareToken ?? null;
  if (fields.status !== void 0) row.status = fields.status;
  if (fields.error !== void 0) row.error = fields.error;
  if (fields.createdAt !== void 0) row.created_at = fields.createdAt;
  if (fields.totalPages !== void 0) row.total_pages = fields.totalPages;
  if (fields.extractedChars !== void 0) row.extracted_chars = fields.extractedChars;
  if (fields.script !== void 0) row.script = fields.script;
  if (fields.audioMimeType !== void 0) row.audio_mime_type = fields.audioMimeType;
  if (fields.durationSeconds !== void 0) row.duration_seconds = fields.durationSeconds;
  if (fields.providers !== void 0) row.providers = fields.providers;
  return row;
}
function sliceRange(data, mimeType, range) {
  const total = data.byteLength;
  const base = {
    "Content-Type": mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable"
  };
  const match = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
  if (match && (match[1] || match[2])) {
    let start2;
    let end;
    if (!match[1]) {
      const suffix = Math.min(parseInt(match[2], 10), total);
      start2 = total - suffix;
      end = total - 1;
    } else {
      start2 = parseInt(match[1], 10);
      end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;
    }
    if (start2 <= end && start2 < total) {
      const chunk = data.slice(start2, end + 1);
      return {
        status: 206,
        headers: {
          ...base,
          "Content-Range": `bytes ${start2}-${end}/${total}`,
          "Content-Length": String(chunk.byteLength)
        },
        body: chunk
      };
    }
    return {
      status: 416,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes */${total}`
      },
      body: new Uint8Array(0)
    };
  }
  return {
    status: 200,
    headers: {
      ...base,
      "Content-Length": String(total)
    },
    body: data
  };
}
function getStore() {
  if (!store) {
    const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
    const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    if (process.env.VERCEL && (!hasSupabase || !hasBlob)) {
      throw new Error("Production requires SUPABASE_URL + SUPABASE_SECRET_KEY and BLOB_READ_WRITE_TOKEN; the filesystem fallback does not work on Vercel.");
    }
    const dataRoot = path.join(process.cwd(), ".data");
    store = new CompositeStore(hasSupabase ? new SupabaseMeta() : new FsMeta(path.join(dataRoot, "episodes")), hasBlob ? new BlobBinary() : new FsBinary(dataRoot));
  }
  return store;
}
var UUID_RE, AUDIO_EXT, FsMeta, SupabaseMeta, FsBinary, BlobBinary, CompositeStore, store;
var init_store = __esm({
  "lib/store.ts"() {
    "use strict";
    UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    __name(isValidEpisodeId, "isValidEpisodeId");
    __name(assertId, "assertId");
    AUDIO_EXT = {
      "audio/wav": "wav",
      "audio/mpeg": "mp3"
    };
    FsMeta = class {
      static {
        __name(this, "FsMeta");
      }
      dir;
      constructor(dir) {
        this.dir = dir;
      }
      file(id) {
        return path.join(this.dir, `${id}.json`);
      }
      async write(episode) {
        await fs.mkdir(this.dir, {
          recursive: true
        });
        const target = this.file(episode.id);
        const tmp = `${target}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(episode, null, 2));
        await fs.rename(tmp, target);
      }
      async list(filter) {
        await fs.mkdir(this.dir, {
          recursive: true
        });
        const files = await fs.readdir(this.dir);
        const episodes = [];
        for (const f of files) {
          if (!f.endsWith(".json")) continue;
          try {
            episodes.push(JSON.parse(await fs.readFile(path.join(this.dir, f), "utf8")));
          } catch {
          }
        }
        const visible = filter ? episodes.filter((e) => e.userId === filter.userId || filter.includeUnowned && e.userId === void 0) : episodes;
        return visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      async get(id) {
        try {
          return JSON.parse(await fs.readFile(this.file(id), "utf8"));
        } catch {
          return null;
        }
      }
      async getByShareToken(token) {
        const all = await this.list();
        return all.find((e) => e.shareToken === token) ?? null;
      }
      async setShareToken(id, token) {
        const existing = await this.get(id);
        if (!existing) return;
        await this.write({
          ...existing,
          shareToken: token ?? void 0
        });
      }
      async create(episode) {
        await this.write(episode);
      }
      async patch(id, fields) {
        const existing = await this.get(id);
        if (!existing) return null;
        const updated = {
          ...existing,
          ...fields,
          id
        };
        await this.write(updated);
        return updated;
      }
      async patchIf(id, expectedStatus, fields) {
        const existing = await this.get(id);
        if (!existing || existing.status !== expectedStatus) return null;
        const updated = {
          ...existing,
          ...fields,
          id
        };
        await this.write(updated);
        return updated;
      }
      async delete(id) {
        await fs.rm(this.file(id), {
          force: true
        });
      }
    };
    __name(rowToEpisode, "rowToEpisode");
    __name(episodeToRow, "episodeToRow");
    SupabaseMeta = class {
      static {
        __name(this, "SupabaseMeta");
      }
      clientPromise = null;
      client() {
        if (!this.clientPromise) {
          this.clientPromise = import("@supabase/supabase-js").then(({ createClient }) => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
            auth: {
              persistSession: false
            }
          }));
        }
        return this.clientPromise;
      }
      async list(filter) {
        const supabase = await this.client();
        let query = supabase.from("episodes").select("*").order("created_at", {
          ascending: false
        });
        if (filter) {
          query = filter.includeUnowned ? query.or(`user_id.eq.${filter.userId},user_id.is.null`) : query.eq("user_id", filter.userId);
        }
        const { data, error } = await query;
        if (error) throw new Error(`episodes list failed: ${error.message}`);
        return data.map(rowToEpisode);
      }
      async get(id) {
        const supabase = await this.client();
        const { data, error } = await supabase.from("episodes").select("*").eq("id", id).maybeSingle();
        if (error) throw new Error(`episode get failed: ${error.message}`);
        return data ? rowToEpisode(data) : null;
      }
      async getByShareToken(token) {
        const supabase = await this.client();
        const { data, error } = await supabase.from("episodes").select("*").eq("share_token", token).maybeSingle();
        if (error) throw new Error(`episode share lookup failed: ${error.message}`);
        return data ? rowToEpisode(data) : null;
      }
      async setShareToken(id, token) {
        const supabase = await this.client();
        const { error } = await supabase.from("episodes").update({
          share_token: token
        }).eq("id", id);
        if (error) throw new Error(`set share token failed: ${error.message}`);
      }
      async create(episode) {
        const supabase = await this.client();
        const { error } = await supabase.from("episodes").insert(episodeToRow(episode));
        if (error) throw new Error(`episode create failed: ${error.message}`);
      }
      async patch(id, fields) {
        const supabase = await this.client();
        const { data, error } = await supabase.from("episodes").update(episodeToRow(fields)).eq("id", id).select().maybeSingle();
        if (error) throw new Error(`episode patch failed: ${error.message}`);
        return data ? rowToEpisode(data) : null;
      }
      async patchIf(id, expectedStatus, fields) {
        const supabase = await this.client();
        const { data, error } = await supabase.from("episodes").update(episodeToRow(fields)).eq("id", id).eq("status", expectedStatus).select().maybeSingle();
        if (error) throw new Error(`episode patchIf failed: ${error.message}`);
        return data ? rowToEpisode(data) : null;
      }
      async delete(id) {
        const supabase = await this.client();
        const { error } = await supabase.from("episodes").delete().eq("id", id);
        if (error) throw new Error(`episode delete failed: ${error.message}`);
      }
    };
    __name(sliceRange, "sliceRange");
    FsBinary = class {
      static {
        __name(this, "FsBinary");
      }
      root;
      constructor(root) {
        this.root = root;
      }
      async dir(sub) {
        const p = path.join(this.root, sub);
        await fs.mkdir(p, {
          recursive: true
        });
        return p;
      }
      async saveSource(id, data) {
        await fs.writeFile(path.join(await this.dir("sources"), `${id}.pdf`), data);
      }
      async getSource(id) {
        try {
          return new Uint8Array(await fs.readFile(path.join(this.root, "sources", `${id}.pdf`)));
        } catch {
          return null;
        }
      }
      async saveSourceText(id, text) {
        await fs.writeFile(path.join(await this.dir("sources"), `${id}.txt`), text);
      }
      async getSourceText(id) {
        try {
          return await fs.readFile(path.join(this.root, "sources", `${id}.txt`), "utf8");
        } catch {
          return null;
        }
      }
      async saveAudio(id, data, mimeType) {
        const ext = AUDIO_EXT[mimeType] ?? "bin";
        await fs.writeFile(path.join(await this.dir("audio"), `${id}.${ext}`), data);
      }
      async openAudio(id, mimeType, range) {
        const ext = AUDIO_EXT[mimeType] ?? "bin";
        try {
          const data = new Uint8Array(await fs.readFile(path.join(this.root, "audio", `${id}.${ext}`)));
          return sliceRange(data, mimeType, range);
        } catch {
          return null;
        }
      }
      async delete(id, mimeType) {
        await fs.rm(path.join(this.root, "sources", `${id}.pdf`), {
          force: true
        });
        await fs.rm(path.join(this.root, "sources", `${id}.txt`), {
          force: true
        });
        const exts = mimeType ? [
          AUDIO_EXT[mimeType] ?? "bin"
        ] : Object.values(AUDIO_EXT);
        for (const ext of exts) {
          await fs.rm(path.join(this.root, "audio", `${id}.${ext}`), {
            force: true
          });
        }
      }
    };
    BlobBinary = class {
      static {
        __name(this, "BlobBinary");
      }
      blob() {
        return import("@vercel/blob");
      }
      async saveSource(id, data) {
        const { put } = await this.blob();
        await put(`sources/${id}.pdf`, Buffer.from(data), {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/pdf"
        });
      }
      async getSource(id) {
        const { get } = await this.blob();
        const result = await get(`sources/${id}.pdf`, {
          access: "private"
        });
        if (!result?.stream) return null;
        return new Uint8Array(await new Response(result.stream).arrayBuffer());
      }
      async saveSourceText(id, text) {
        const { put } = await this.blob();
        await put(`sources/${id}.txt`, Buffer.from(text, "utf8"), {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "text/plain; charset=utf-8"
        });
      }
      async getSourceText(id) {
        const { get } = await this.blob();
        const result = await get(`sources/${id}.txt`, {
          access: "private"
        });
        if (!result?.stream) return null;
        return await new Response(result.stream).text();
      }
      async saveAudio(id, data, mimeType) {
        const { put } = await this.blob();
        const ext = AUDIO_EXT[mimeType] ?? "bin";
        await put(`audio/${id}.${ext}`, Buffer.from(data), {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: mimeType
        });
      }
      async openAudio(id, mimeType, range) {
        const { get } = await this.blob();
        const ext = AUDIO_EXT[mimeType] ?? "bin";
        const result = await get(`audio/${id}.${ext}`, {
          access: "private",
          ...range ? {
            headers: {
              Range: range
            }
          } : {}
        });
        if (!result?.stream) return null;
        const src = result.headers;
        const headers = {
          "Content-Type": src.get("content-type") ?? mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=31536000, immutable"
        };
        const contentRange = src.get("content-range");
        const contentLength = src.get("content-length");
        if (contentRange) headers["Content-Range"] = contentRange;
        if (contentLength) headers["Content-Length"] = contentLength;
        return {
          status: range && contentRange ? 206 : 200,
          headers,
          body: result.stream
        };
      }
      async delete(id, mimeType) {
        const { list, del } = await this.blob();
        const exts = mimeType ? [
          AUDIO_EXT[mimeType] ?? "bin"
        ] : Object.values(AUDIO_EXT);
        const prefixes = [
          `sources/${id}.pdf`,
          `sources/${id}.txt`,
          ...exts.map((ext) => `audio/${id}.${ext}`)
        ];
        for (const prefix of prefixes) {
          const { blobs } = await list({
            prefix
          });
          if (blobs.length > 0) await del(blobs.map((b) => b.url));
        }
      }
    };
    CompositeStore = class {
      static {
        __name(this, "CompositeStore");
      }
      meta;
      binary;
      constructor(meta, binary) {
        this.meta = meta;
        this.binary = binary;
      }
      list(filter) {
        return this.meta.list(filter);
      }
      get(id) {
        assertId(id);
        return this.meta.get(id);
      }
      getByShareToken(token) {
        return this.meta.getByShareToken(token);
      }
      setShareToken(id, token) {
        assertId(id);
        return this.meta.setShareToken(id, token);
      }
      create(episode) {
        assertId(episode.id);
        return this.meta.create(episode);
      }
      patch(id, fields) {
        assertId(id);
        return this.meta.patch(id, fields);
      }
      patchIf(id, expectedStatus, fields) {
        assertId(id);
        return this.meta.patchIf(id, expectedStatus, fields);
      }
      async delete(id) {
        assertId(id);
        const episode = await this.meta.get(id);
        await this.meta.delete(id);
        await this.binary.delete(id, episode?.audioMimeType);
      }
      saveSource(id, data) {
        assertId(id);
        return this.binary.saveSource(id, data);
      }
      getSource(id) {
        assertId(id);
        return this.binary.getSource(id);
      }
      saveSourceText(id, text) {
        assertId(id);
        return this.binary.saveSourceText(id, text);
      }
      getSourceText(id) {
        assertId(id);
        return this.binary.getSourceText(id);
      }
      saveAudio(id, data, mimeType) {
        assertId(id);
        return this.binary.saveAudio(id, data, mimeType);
      }
      async openAudio(id, range) {
        assertId(id);
        const episode = await this.meta.get(id);
        if (!episode) return null;
        return this.binary.openAudio(id, episode.audioMimeType ?? "audio/wav", range);
      }
    };
    store = null;
    __name(getStore, "getStore");
  }
});

// lib/pipeline/extract.ts
var extract_exports = {};
__export(extract_exports, {
  MAX_PDF_BYTES: () => MAX_PDF_BYTES,
  MAX_UPLOAD_FILES: () => MAX_UPLOAD_FILES,
  extractMany: () => extractMany,
  extractPdfText: () => extractPdfText,
  looksLikePdf: () => looksLikePdf,
  readUploads: () => readUploads,
  validatePdfFile: () => validatePdfFile
});
import { extractText, getDocumentProxy } from "unpdf";
function validatePdfFile(file) {
  if (!(file instanceof File)) {
    return {
      ok: false,
      status: 400,
      error: "Upload a PDF in the 'file' field"
    };
  }
  if (file.size > MAX_PDF_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "PDF is too large (4 MB max)"
    };
  }
  return {
    ok: true,
    file
  };
}
function looksLikePdf(data, filename) {
  const magic = data.length > 4 && data[0] === 37 && data[1] === 80 && data[2] === 68 && data[3] === 70;
  return magic || filename.toLowerCase().endsWith(".pdf");
}
async function readUploads(entries) {
  const files = [];
  for (const entry of entries) {
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }
  if (files.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Upload a PDF in the 'file' field"
    };
  }
  if (files.length > MAX_UPLOAD_FILES) {
    return {
      ok: false,
      status: 400,
      error: `Too many files (max ${MAX_UPLOAD_FILES})`
    };
  }
  const loaded = [];
  for (const file of files) {
    const check = validatePdfFile(file);
    if (!check.ok) return check;
    const data = new Uint8Array(await file.arrayBuffer());
    if (!looksLikePdf(data, file.name)) {
      return {
        ok: false,
        status: 415,
        error: "Only PDF files are supported"
      };
    }
    loaded.push({
      name: file.name,
      data
    });
  }
  try {
    const { text, totalPages } = await extractMany(loaded);
    const sourceFilename = loaded.length === 1 ? loaded[0].name : `${loaded[0].name} +${loaded.length - 1} more`;
    return {
      ok: true,
      text,
      chars: text.length,
      totalPages,
      sourceFilename
    };
  } catch {
    return {
      ok: false,
      status: 422,
      error: "Could not read one of these PDFs. It may be scanned or corrupted."
    };
  }
}
async function extractMany(files) {
  const parts = [];
  let totalPages = 0;
  for (const file of files) {
    const { text, totalPages: pages } = await extractPdfText(new Uint8Array(file.data));
    totalPages += pages;
    parts.push(files.length > 1 ? `# ${file.name.replace(/\.pdf$/i, "")}

${text}` : text);
  }
  return {
    text: parts.join("\n\n\n"),
    totalPages
  };
}
async function extractPdfText(data) {
  const pdf = await getDocumentProxy(data);
  const { totalPages, text } = await extractText(pdf, {
    mergePages: true
  });
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    throw new Error("No text could be extracted from this PDF. It may be a scanned document without a text layer.");
  }
  return {
    text: cleaned,
    totalPages
  };
}
var MAX_PDF_BYTES, MAX_UPLOAD_FILES;
var init_extract = __esm({
  "lib/pipeline/extract.ts"() {
    "use strict";
    MAX_PDF_BYTES = 4 * 1024 * 1024;
    __name(validatePdfFile, "validatePdfFile");
    __name(looksLikePdf, "looksLikePdf");
    MAX_UPLOAD_FILES = 5;
    __name(readUploads, "readUploads");
    __name(extractMany, "extractMany");
    __name(extractPdfText, "extractPdfText");
  }
});

// lib/voices.ts
function normalizeVoice(id, fallback) {
  return typeof id === "string" && VOICE_IDS.has(id) ? id : fallback;
}
var VOICES, VOICE_IDS, DEFAULT_HOST_VOICE, DEFAULT_GUEST_VOICE, DEFAULT_READER_VOICE;
var init_voices = __esm({
  "lib/voices.ts"() {
    "use strict";
    VOICES = [
      {
        id: "Kore",
        label: "Kore",
        description: "Firm, clear"
      },
      {
        id: "Puck",
        label: "Puck",
        description: "Upbeat, lively"
      },
      {
        id: "Enceladus",
        label: "Enceladus",
        description: "Soft, breathy"
      },
      {
        id: "Charon",
        label: "Charon",
        description: "Deep, informative"
      },
      {
        id: "Aoede",
        label: "Aoede",
        description: "Breezy, warm"
      },
      {
        id: "Leda",
        label: "Leda",
        description: "Youthful, bright"
      },
      {
        id: "Zephyr",
        label: "Zephyr",
        description: "Bright, crisp"
      }
    ];
    VOICE_IDS = new Set(VOICES.map((v) => v.id));
    DEFAULT_HOST_VOICE = "Kore";
    DEFAULT_GUEST_VOICE = "Puck";
    DEFAULT_READER_VOICE = "Enceladus";
    __name(normalizeVoice, "normalizeVoice");
  }
});

// lib/options.ts
var options_exports = {};
__export(options_exports, {
  LENGTH_BUDGETS: () => LENGTH_BUDGETS,
  SINGLE_VOICE_FORMATS: () => SINGLE_VOICE_FORMATS,
  editCharBudget: () => editCharBudget,
  isSingleVoiceFormat: () => isSingleVoiceFormat,
  normalizeOptions: () => normalizeOptions,
  readCharBudget: () => readCharBudget,
  scriptChars: () => scriptChars,
  validateEditedScript: () => validateEditedScript
});
function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}
function normalizeOptions(input) {
  const o = input ?? {};
  return {
    length: pick(o.length, LENGTHS, "standard"),
    format: pick(o.format, FORMATS, "discussion"),
    audience: pick(o.audience, AUDIENCES, "beginner"),
    hostVoice: normalizeVoice(o.hostVoice, DEFAULT_HOST_VOICE),
    guestVoice: normalizeVoice(o.guestVoice, DEFAULT_GUEST_VOICE),
    readerVoice: normalizeVoice(o.readerVoice, DEFAULT_READER_VOICE),
    reviewScript: o.reviewScript === true
  };
}
function scriptChars(script) {
  return script.lines.reduce((n, l) => n + l.text.trim().length, 0);
}
function editCharBudget(originalChars) {
  return Math.round(originalChars * 1.1) + 200;
}
function validateEditedScript(input, maxChars) {
  const raw = input;
  if (!raw || !Array.isArray(raw.lines)) {
    return {
      ok: false,
      error: "Script must have a lines array"
    };
  }
  if (raw.lines.length === 0) {
    return {
      ok: false,
      error: "Script cannot be empty"
    };
  }
  if (raw.lines.length > MAX_SCRIPT_LINES) {
    return {
      ok: false,
      error: `Too many lines (max ${MAX_SCRIPT_LINES})`
    };
  }
  const lines = [];
  let total = 0;
  for (const entry of raw.lines) {
    const line = entry;
    if (line.speaker !== "HOST" && line.speaker !== "GUEST") {
      return {
        ok: false,
        error: "Each line needs speaker HOST or GUEST"
      };
    }
    if (typeof line.text !== "string") {
      return {
        ok: false,
        error: "Each line needs text"
      };
    }
    const text = line.text.trim();
    if (text.length === 0) continue;
    if (text.length > MAX_LINE_CHARS) {
      return {
        ok: false,
        error: "A line is too long"
      };
    }
    total += text.length;
    lines.push({
      speaker: line.speaker,
      text
    });
  }
  if (lines.length === 0) {
    return {
      ok: false,
      error: "Script cannot be empty"
    };
  }
  if (total > maxChars) {
    return {
      ok: false,
      error: "Edited script is longer than the version you generated"
    };
  }
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim().slice(0, 200) : "Untitled episode";
  return {
    ok: true,
    script: {
      title,
      lines
    }
  };
}
function isSingleVoiceFormat(format) {
  return SINGLE_VOICE_FORMATS.includes(format);
}
function readCharBudget(mode, length) {
  return mode === "reading" ? LENGTH_BUDGETS[length].readChars : LENGTH_BUDGETS[length].scriptChars;
}
var LENGTHS, FORMATS, AUDIENCES, SINGLE_VOICE_FORMATS, LENGTH_BUDGETS, MAX_SCRIPT_LINES, MAX_LINE_CHARS;
var init_options = __esm({
  "lib/options.ts"() {
    "use strict";
    init_voices();
    LENGTHS = [
      "short",
      "standard",
      "deep"
    ];
    FORMATS = [
      "discussion",
      "brief",
      "debate",
      "lecture"
    ];
    AUDIENCES = [
      "beginner",
      "expert"
    ];
    SINGLE_VOICE_FORMATS = [
      "brief",
      "lecture"
    ];
    LENGTH_BUDGETS = {
      short: {
        scriptChars: 2e3,
        readChars: 3e4,
        approxMinutes: 3
      },
      standard: {
        scriptChars: 4500,
        readChars: 1e5,
        approxMinutes: 7
      },
      deep: {
        scriptChars: 9e3,
        readChars: 2e5,
        approxMinutes: 15
      }
    };
    __name(pick, "pick");
    __name(normalizeOptions, "normalizeOptions");
    MAX_SCRIPT_LINES = 600;
    MAX_LINE_CHARS = 5e3;
    __name(scriptChars, "scriptChars");
    __name(editCharBudget, "editCharBudget");
    __name(validateEditedScript, "validateEditedScript");
    __name(isSingleVoiceFormat, "isSingleVoiceFormat");
    __name(readCharBudget, "readCharBudget");
  }
});

// lib/pipeline/script.ts
var script_exports = {};
__export(script_exports, {
  generatePodcastScript: () => generatePodcastScript,
  scriptProviderName: () => scriptProviderName,
  verbatimScript: () => verbatimScript
});
import { z } from "zod";
function systemPrompt(options) {
  const budget = LENGTH_BUDGETS[options.length];
  const audience = options.audience === "expert" ? "Assume an expert listener; use precise terminology and go deep." : "Assume a curious newcomer; explain jargon in plain language.";
  return `You are a world-class podcast producer. Turn documents into ${FORMAT_BRIEF[options.format]}

Rules:
- Open by welcoming listeners and naming the topic in one or two sentences.
- Cover the document's most important ideas accurately; do not invent facts.
- ${audience}
- Close with the single biggest takeaway and a sign-off.
- Total spoken text must stay under ${budget.scriptChars} characters (about ${budget.approxMinutes} minutes).`;
}
function scriptProviderName() {
  if (scriptFellBack) return "mock (gateway unavailable)";
  return hasScriptCredentials() ? process.env.PODCAST_SCRIPT_MODEL ?? "anthropic/claude-sonnet-5" : "mock";
}
function hasScriptCredentials() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);
}
async function generatePodcastScript(sourceText, sourceFilename, options) {
  const text = sourceText.slice(0, MAX_SOURCE_CHARS);
  if (!hasScriptCredentials()) {
    return mockScript(text, sourceFilename, options);
  }
  try {
    const { generateText, Output } = await import("ai");
    const { output } = await generateText({
      model: scriptProviderName(),
      system: systemPrompt(options),
      output: Output.object({
        schema: scriptSchema
      }),
      prompt: `Turn the following document ("${sourceFilename}") into a podcast script.

<document>
${text}
</document>`
    });
    const script = output;
    if (isSingleVoiceFormat(options.format)) {
      script.lines = script.lines.map((l) => ({
        ...l,
        speaker: "HOST"
      }));
    }
    return script;
  } catch (err) {
    console.error("Script generation via AI Gateway failed, falling back to mock:", err instanceof Error ? err.message : err);
    scriptFellBack = true;
    return mockScript(text, sourceFilename, options);
  }
}
function verbatimScript(sourceText, sourceFilename, maxChars) {
  const title = sourceFilename.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  const text = sourceText.slice(0, maxChars);
  const sentences = text.split(/(?<=[.!?])\s+/);
  const lines = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > READ_CHUNK_CHARS) {
      lines.push({
        speaker: "HOST",
        text: current
      });
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) lines.push({
    speaker: "HOST",
    text: current
  });
  return {
    title,
    lines
  };
}
function mockScript(text, sourceFilename, options) {
  const single = isSingleVoiceFormat(options.format);
  const all = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
  const target = Math.max(8, Math.round(LENGTH_BUDGETS[options.length].scriptChars / 110));
  const step = Math.max(1, Math.floor(all.length / target));
  const sentences = all.filter((_, i) => i % step === 0).slice(0, target);
  const title = sourceFilename.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  const lines = [
    {
      speaker: "HOST",
      text: `Welcome back to the show. Today we're digging into ${title}.`
    }
  ];
  if (!single) {
    lines.push({
      speaker: "GUEST",
      text: "Thanks for having me. There's a lot in here."
    });
  }
  sentences.forEach((sentence, i) => {
    lines.push({
      speaker: single || i % 2 === 1 ? "HOST" : "GUEST",
      text: sentence.trim()
    });
  });
  lines.push({
    speaker: "HOST",
    text: "That's the big picture. Thanks for listening, and see you next time."
  });
  return {
    title,
    lines
  };
}
var MAX_SOURCE_CHARS, scriptSchema, FORMAT_BRIEF, scriptFellBack, READ_CHUNK_CHARS;
var init_script = __esm({
  "lib/pipeline/script.ts"() {
    "use strict";
    init_options();
    MAX_SOURCE_CHARS = 2e5;
    scriptSchema = z.object({
      title: z.string().describe("A short, catchy episode title based on the document"),
      lines: z.array(z.object({
        speaker: z.enum([
          "HOST",
          "GUEST"
        ]),
        text: z.string()
      })).describe("The dialogue, alternating naturally between speakers")
    });
    FORMAT_BRIEF = {
      discussion: "a natural two-person conversation between HOST (curious, asks sharp questions) and GUEST (an expert who explains vividly with analogies). Short turns, real reactions, no lists.",
      brief: "a tight solo briefing delivered entirely by HOST \u2014 a single confident narrator summarizing the essentials. Every line uses speaker HOST. No second speaker.",
      debate: "a lively debate between HOST and GUEST who take opposing positions on the document's key claims, each making their strongest case and rebutting the other. Keep it sharp but fair.",
      lecture: "an in-depth expert lecture delivered entirely by HOST \u2014 a knowledgeable teacher walking through the material with rigor and structure, the depth of an 80,000 Hours briefing. Every line uses speaker HOST. No second speaker."
    };
    __name(systemPrompt, "systemPrompt");
    scriptFellBack = false;
    __name(scriptProviderName, "scriptProviderName");
    __name(hasScriptCredentials, "hasScriptCredentials");
    __name(generatePodcastScript, "generatePodcastScript");
    READ_CHUNK_CHARS = 900;
    __name(verbatimScript, "verbatimScript");
    __name(mockScript, "mockScript");
  }
});

// lib/audio/wav.ts
function pcm16ToWav(pcm, sampleRate, channels = 1) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const byteRate = sampleRate * channels * BYTES_PER_SAMPLE;
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, channels * BYTES_PER_SAMPLE, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.byteLength, true);
  const wav = new Uint8Array(44 + pcm.byteLength);
  wav.set(new Uint8Array(header), 0);
  wav.set(pcm, 44);
  return wav;
}
function wavDurationSeconds(pcmByteLength, sampleRate, channels = 1) {
  return pcmByteLength / (sampleRate * channels * BYTES_PER_SAMPLE);
}
function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
var BYTES_PER_SAMPLE;
var init_wav = __esm({
  "lib/audio/wav.ts"() {
    "use strict";
    BYTES_PER_SAMPLE = 2;
    __name(pcm16ToWav, "pcm16ToWav");
    __name(wavDurationSeconds, "wavDurationSeconds");
    __name(writeAscii, "writeAscii");
  }
});

// lib/audio/mp3.ts
async function encodeMp3(pcm, sampleRate) {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const encoder = new Mp3Encoder(1, sampleRate, MP3_BITRATE_KBPS);
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
  const chunks = [];
  for (let i = 0; i < samples.length; i += SAMPLES_PER_FRAME) {
    const block = samples.subarray(i, i + SAMPLES_PER_FRAME);
    const frame = encoder.encodeBuffer(block);
    if (frame.length > 0) chunks.push(new Uint8Array(frame));
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(new Uint8Array(tail));
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
async function finalizeAudio(pcm, sampleRate) {
  const durationSeconds = wavDurationSeconds(pcm.byteLength, sampleRate);
  try {
    const audio = await encodeMp3(pcm, sampleRate);
    if (audio.byteLength > 0) {
      return {
        audio,
        mimeType: "audio/mpeg",
        durationSeconds
      };
    }
  } catch (err) {
    console.error("MP3 encode failed, falling back to WAV:", err);
  }
  return {
    audio: pcm16ToWav(pcm, sampleRate),
    mimeType: "audio/wav",
    durationSeconds
  };
}
var MP3_BITRATE_KBPS, SAMPLES_PER_FRAME;
var init_mp3 = __esm({
  "lib/audio/mp3.ts"() {
    "use strict";
    init_wav();
    MP3_BITRATE_KBPS = 64;
    SAMPLES_PER_FRAME = 1152;
    __name(encodeMp3, "encodeMp3");
    __name(finalizeAudio, "finalizeAudio");
  }
});

// lib/pipeline/tts.ts
var tts_exports = {};
__export(tts_exports, {
  synthesizeDialogue: () => synthesizeDialogue,
  ttsProviderName: () => ttsProviderName
});
function geminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}
function ttsProviderName() {
  return geminiApiKey() ? GEMINI_TTS_MODEL : "mock";
}
async function synthesizeDialogue(script, mode = "conversation", options) {
  if (!geminiApiKey()) return finalizeAudio(...mockPcm(script));
  const readerVoice = options?.readerVoice ?? DEFAULT_READER_VOICE;
  const hostVoice = options?.hostVoice ?? DEFAULT_HOST_VOICE;
  const guestVoice = options?.guestVoice ?? DEFAULT_GUEST_VOICE;
  if (mode === "reading") {
    return geminiSingleVoice(script, readerVoice, "Read the following text aloud in a calm, warm, soothing voice at a relaxed pace:");
  }
  if (options && isSingleVoiceFormat(options.format)) {
    return geminiSingleVoice(script, hostVoice, "Narrate the following in a clear, engaging voice:");
  }
  return geminiTts(script, hostVoice, guestVoice);
}
async function geminiSingleVoice(script, voiceName, instruction) {
  const chunks = [];
  let current = "";
  for (const line of script.lines) {
    if (current && current.length + line.text.length + 1 > SINGLE_TTS_CHUNK_CHARS) {
      chunks.push(current);
      current = line.text;
    } else {
      current = current ? `${current}
${line.text}` : line.text;
    }
  }
  if (current) chunks.push(current);
  const pcmParts = [];
  let sampleRate = GEMINI_SAMPLE_RATE;
  for (const chunk of chunks) {
    const part = await geminiGenerate(`${instruction}
${chunk}`, {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName
        }
      }
    });
    pcmParts.push(part.pcm);
    sampleRate = part.sampleRate;
  }
  const pcm = new Uint8Array(Buffer.concat(pcmParts.map((p) => Buffer.from(p))));
  return finalizeAudio(pcm, sampleRate);
}
async function geminiTts(script, hostVoice, guestVoice) {
  const transcript = script.lines.map((line) => `${line.speaker === "HOST" ? "Host" : "Guest"}: ${line.text}`).join("\n");
  const { pcm, sampleRate } = await geminiGenerate(`TTS the following podcast conversation between Host and Guest:
${transcript}`, {
    multiSpeakerVoiceConfig: {
      speakerVoiceConfigs: [
        {
          speaker: "Host",
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: hostVoice
            }
          }
        },
        {
          speaker: "Guest",
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: guestVoice
            }
          }
        }
      ]
    }
  });
  return finalizeAudio(pcm, sampleRate);
}
async function geminiGenerate(text, speechConfig) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiApiKey()
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: [
          "AUDIO"
        ],
        speechConfig
      }
    })
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    console.error(`Gemini TTS error ${res.status}: ${body}`);
    const message = `Speech synthesis failed (Gemini returned ${res.status})`;
    if (res.status === 429 || res.status >= 500) {
      const { RetryableError } = await import("workflow");
      throw new RetryableError(message, {
        retryAfter: "30s"
      });
    }
    const { FatalError: FatalError2 } = await import("workflow");
    throw new FatalError2(message);
  }
  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts?.filter((p) => p.inlineData?.data) ?? [];
  if (parts.length === 0) {
    const { FatalError: FatalError2 } = await import("workflow");
    throw new FatalError2("Speech synthesis returned no audio data");
  }
  const pcm = new Uint8Array(Buffer.concat(parts.map((p) => Buffer.from(p.inlineData.data, "base64"))));
  const rateMatch = /rate=(\d+)/.exec(parts[0].inlineData?.mimeType ?? "");
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : GEMINI_SAMPLE_RATE;
  return {
    pcm,
    sampleRate
  };
}
function mockPcm(script) {
  const sampleRate = 24e3;
  const wordSeconds = 0.22;
  const lineGapSeconds = 0.4;
  const maxSeconds = 120;
  let totalSeconds = 0;
  const segments = [];
  for (const line of script.lines) {
    const words = Math.max(1, line.text.split(/\s+/).length);
    const seconds = words * wordSeconds + lineGapSeconds;
    if (totalSeconds + seconds > maxSeconds) break;
    totalSeconds += seconds;
    segments.push({
      freq: line.speaker === "HOST" ? 196 : 147,
      words
    });
  }
  const totalSamples = Math.ceil(totalSeconds * sampleRate);
  const pcm = new Int16Array(totalSamples);
  let offset = 0;
  for (const segment of segments) {
    for (let w = 0; w < segment.words; w++) {
      const wordSamples = Math.floor(wordSeconds * sampleRate * 0.85);
      const freq = segment.freq * (1 + 0.12 * Math.sin(w));
      for (let i = 0; i < wordSamples && offset + i < totalSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.sin(Math.PI * i / wordSamples);
        pcm[offset + i] = Math.round(6e3 * envelope * Math.sin(2 * Math.PI * freq * t));
      }
      offset += Math.floor(wordSeconds * sampleRate);
    }
    offset += Math.floor(lineGapSeconds * sampleRate);
  }
  const bytes = new Uint8Array(pcm.buffer, 0, totalSamples * 2);
  return [
    bytes,
    sampleRate
  ];
}
var GEMINI_SAMPLE_RATE, GEMINI_TTS_MODEL, SINGLE_TTS_CHUNK_CHARS;
var init_tts = __esm({
  "lib/pipeline/tts.ts"() {
    "use strict";
    init_mp3();
    init_options();
    init_voices();
    GEMINI_SAMPLE_RATE = 24e3;
    GEMINI_TTS_MODEL = process.env.PODCAST_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
    SINGLE_TTS_CHUNK_CHARS = 3500;
    __name(geminiApiKey, "geminiApiKey");
    __name(ttsProviderName, "ttsProviderName");
    __name(synthesizeDialogue, "synthesizeDialogue");
    __name(geminiSingleVoice, "geminiSingleVoice");
    __name(geminiTts, "geminiTts");
    __name(geminiGenerate, "geminiGenerate");
    __name(mockPcm, "mockPcm");
  }
});

// lib/supabase/admin.ts
function getAdminClient() {
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
      auth: {
        persistSession: false
      }
    }));
  }
  return clientPromise;
}
function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
var clientPromise;
var init_admin = __esm({
  "lib/supabase/admin.ts"() {
    "use strict";
    clientPromise = null;
    __name(getAdminClient, "getAdminClient");
    __name(supabaseConfigured, "supabaseConfigured");
  }
});

// lib/credits.ts
var credits_exports = {};
__export(credits_exports, {
  creditCost: () => creditCost,
  creditsEnabled: () => creditsEnabled,
  estimateMinutes: () => estimateMinutes,
  getBalance: () => getBalance,
  refundEpisode: () => refundEpisode,
  spendCredits: () => spendCredits
});
function readableChars(extractedChars, length) {
  return Math.min(Math.max(0, extractedChars), LENGTH_BUDGETS[length].readChars);
}
function creditCost(mode, extractedChars, length = "standard") {
  if (mode === "reading") {
    const chars = readableChars(extractedChars, length);
    return Math.min(MAX_CREDITS_PER_EPISODE, Math.max(1, Math.ceil(chars / READ_CHARS_PER_CREDIT)));
  }
  return Math.min(MAX_CREDITS_PER_EPISODE, Math.max(1, Math.ceil(LENGTH_BUDGETS[length].scriptChars / CONVERSATION_CHARS_PER_CREDIT)));
}
function estimateMinutes(mode, extractedChars, length = "standard") {
  if (mode === "reading") {
    return Math.max(1, Math.round(readableChars(extractedChars, length) / 1e3));
  }
  return LENGTH_BUDGETS[length].approxMinutes;
}
function creditsEnabled() {
  return supabaseConfigured();
}
async function getBalance(userId) {
  if (!creditsEnabled()) return Infinity;
  const supabase = await getAdminClient();
  const { data, error } = await supabase.rpc("credit_balance", {
    p_user: userId
  });
  if (error) throw new Error(`credit balance failed: ${error.message}`);
  return Number(data ?? 0);
}
async function spendCredits(userId, amount, episodeId) {
  if (!creditsEnabled()) return true;
  const supabase = await getAdminClient();
  const { data, error } = await supabase.rpc("spend_credits", {
    p_user: userId,
    p_amount: amount,
    p_ref: `episode:${episodeId}`
  });
  if (error) throw new Error(`credit spend failed: ${error.message}`);
  return data === true;
}
async function refundEpisode(userId, episodeId) {
  if (!creditsEnabled()) return;
  const supabase = await getAdminClient();
  const { error } = await supabase.rpc("refund_episode", {
    p_user: userId,
    p_episode: episodeId
  });
  if (error) throw new Error(`credit refund failed: ${error.message}`);
}
var READ_CHARS_PER_CREDIT, MAX_CREDITS_PER_EPISODE, CONVERSATION_CHARS_PER_CREDIT;
var init_credits = __esm({
  "lib/credits.ts"() {
    "use strict";
    init_admin();
    init_options();
    READ_CHARS_PER_CREDIT = 25e3;
    MAX_CREDITS_PER_EPISODE = 8;
    __name(readableChars, "readableChars");
    CONVERSATION_CHARS_PER_CREDIT = LENGTH_BUDGETS.standard.scriptChars;
    __name(creditCost, "creditCost");
    __name(estimateMinutes, "estimateMinutes");
    __name(creditsEnabled, "creditsEnabled");
    __name(getBalance, "getBalance");
    __name(spendCredits, "spendCredits");
    __name(refundEpisode, "refundEpisode");
  }
});

// node_modules/workflow/dist/internal/builtins.js
import { registerStepFunction } from "workflow/internal/private";
async function __builtin_response_array_buffer() {
  return this.arrayBuffer();
}
__name(__builtin_response_array_buffer, "__builtin_response_array_buffer");
async function __builtin_response_json() {
  return this.json();
}
__name(__builtin_response_json, "__builtin_response_json");
async function __builtin_response_text() {
  return this.text();
}
__name(__builtin_response_text, "__builtin_response_text");
registerStepFunction("__builtin_response_array_buffer", __builtin_response_array_buffer);
registerStepFunction("__builtin_response_json", __builtin_response_json);
registerStepFunction("__builtin_response_text", __builtin_response_text);

// node_modules/workflow/dist/stdlib.js
import { registerStepFunction as registerStepFunction2 } from "workflow/internal/private";
async function fetch2(...args) {
  return globalThis.fetch(...args);
}
__name(fetch2, "fetch");
registerStepFunction2("step//workflow@4.7.0//fetch", fetch2);

// workflows/generate-episode.ts
import { registerStepFunction as registerStepFunction3 } from "workflow/internal/private";
import { createHook, FatalError } from "workflow";
async function generateEpisode(episodeId, reviewScript = false) {
  throw new Error("You attempted to execute workflow generateEpisode function directly. To start a workflow, use start(generateEpisode) from workflow/api");
}
__name(generateEpisode, "generateEpisode");
generateEpisode.workflowId = "workflow//./workflows/generate-episode//generateEpisode";
async function markScriptReady(episodeId) {
  console.log(`[generate-episode:${episodeId}] awaiting script review`);
  const { getStore: getStore2 } = await Promise.resolve().then(() => (init_store(), store_exports));
  if (!await getStore2().patch(episodeId, {
    status: "script_ready"
  })) {
    throw new FatalError("Episode was deleted");
  }
}
__name(markScriptReady, "markScriptReady");
async function extractStep(episodeId) {
  console.log(`[generate-episode:${episodeId}] extracting text`);
  const { getStore: getStore2 } = await Promise.resolve().then(() => (init_store(), store_exports));
  const { extractPdfText: extractPdfText2 } = await Promise.resolve().then(() => (init_extract(), extract_exports));
  const store2 = getStore2();
  const episode = await store2.patch(episodeId, {
    status: "extracting"
  });
  if (!episode) throw new FatalError("Episode was deleted");
  let text;
  let totalPages;
  const storedText = await store2.getSourceText(episodeId);
  if (storedText !== null) {
    text = storedText;
    totalPages = episode.totalPages ?? 0;
  } else {
    const source = await store2.getSource(episodeId);
    if (!source) throw new FatalError("Source is missing");
    try {
      ({ text, totalPages } = await extractPdfText2(source));
    } catch (err) {
      throw new FatalError(err instanceof Error ? err.message : String(err));
    }
  }
  await store2.patch(episodeId, {
    totalPages,
    extractedChars: text.length
  });
  return text;
}
__name(extractStep, "extractStep");
async function scriptStep(episodeId, text) {
  console.log(`[generate-episode:${episodeId}] generating script`);
  const { getStore: getStore2 } = await Promise.resolve().then(() => (init_store(), store_exports));
  const { generatePodcastScript: generatePodcastScript2, verbatimScript: verbatimScript2, scriptProviderName: scriptProviderName2 } = await Promise.resolve().then(() => (init_script(), script_exports));
  const { normalizeOptions: normalizeOptions2, LENGTH_BUDGETS: LENGTH_BUDGETS2 } = await Promise.resolve().then(() => (init_options(), options_exports));
  const store2 = getStore2();
  const episode = await store2.patch(episodeId, {
    status: "scripting"
  });
  if (!episode) throw new FatalError("Episode was deleted");
  const options = normalizeOptions2(episode.options);
  const script = episode.mode === "reading" ? verbatimScript2(text, episode.sourceFilename, LENGTH_BUDGETS2[options.length].readChars) : await generatePodcastScript2(text, episode.sourceFilename, options);
  await store2.patch(episodeId, {
    title: script.title,
    script,
    providers: {
      script: episode.mode === "reading" ? "verbatim" : scriptProviderName2(),
      tts: ""
    }
  });
}
__name(scriptStep, "scriptStep");
async function synthesizeStep(episodeId) {
  console.log(`[generate-episode:${episodeId}] synthesizing audio`);
  const { getStore: getStore2 } = await Promise.resolve().then(() => (init_store(), store_exports));
  const { synthesizeDialogue: synthesizeDialogue2, ttsProviderName: ttsProviderName2 } = await Promise.resolve().then(() => (init_tts(), tts_exports));
  const { normalizeOptions: normalizeOptions2 } = await Promise.resolve().then(() => (init_options(), options_exports));
  const store2 = getStore2();
  const episode = await store2.patch(episodeId, {
    status: "synthesizing"
  });
  if (!episode) throw new FatalError("Episode was deleted");
  const script = episode.script;
  if (!script) throw new FatalError("Script is missing");
  const { audio, mimeType, durationSeconds } = await synthesizeDialogue2(script, episode.mode ?? "conversation", normalizeOptions2(episode.options));
  await store2.saveAudio(episodeId, audio, mimeType);
  await store2.patch(episodeId, {
    status: "ready",
    audioMimeType: mimeType,
    durationSeconds: Math.round(durationSeconds),
    providers: {
      script: episode.providers?.script ?? "",
      tts: ttsProviderName2()
    }
  });
}
__name(synthesizeStep, "synthesizeStep");
async function failStep(episodeId, message) {
  console.error(`[generate-episode:${episodeId}] failed: ${message}`);
  try {
    const { getStore: getStore2 } = await Promise.resolve().then(() => (init_store(), store_exports));
    const episode = await getStore2().patch(episodeId, {
      status: "error",
      error: message
    });
    if (episode?.userId) {
      const { refundEpisode: refundEpisode2 } = await Promise.resolve().then(() => (init_credits(), credits_exports));
      await refundEpisode2(episode.userId, episodeId);
    }
  } catch (patchErr) {
    console.error(`[generate-episode:${episodeId}] could not record failure:`, patchErr);
  }
}
__name(failStep, "failStep");
registerStepFunction3("step//./workflows/generate-episode//markScriptReady", markScriptReady);
registerStepFunction3("step//./workflows/generate-episode//extractStep", extractStep);
registerStepFunction3("step//./workflows/generate-episode//scriptStep", scriptStep);
registerStepFunction3("step//./workflows/generate-episode//synthesizeStep", synthesizeStep);
registerStepFunction3("step//./workflows/generate-episode//failStep", failStep);

// node_modules/@workflow/builders/dist/serde-checker.js
import builtinModules from "builtin-modules";
var nodeBuiltins = builtinModules.join("|");
var nodeImportExtractRegex = new RegExp(`(?:from\\s+['"](?:node:)?((?:${nodeBuiltins})(?:/[^'"]*)?)['"]|require\\s*\\(\\s*['"](?:node:)?((?:${nodeBuiltins})(?:/[^'"]*)?)['"]\\s*\\))`, "g");

// node_modules/@workflow/vitest/node_modules/@workflow/builders/dist/serde-checker.js
import builtinModules2 from "builtin-modules";
var nodeBuiltins2 = builtinModules2.join("|");
var nodeImportExtractRegex2 = new RegExp(`(?:from\\s+['"](?:node:)?((?:${nodeBuiltins2})(?:/[^'"]*)?)['"]|require\\s*\\(\\s*['"](?:node:)?((?:${nodeBuiltins2})(?:/[^'"]*)?)['"]\\s*\\))`, "g");

// node_modules/@workflow/core/dist/runtime.js
import { CorruptedEventLogError, EntityConflictError, PreconditionFailedError, ReplayDivergenceError as ReplayDivergenceError2, RUN_ERROR_CODES, RunExpiredError, WorkflowRuntimeError as WorkflowRuntimeError3 } from "@workflow/errors";
import { setWorkflowBasePath } from "@workflow/utils";
import { parseWorkflowName as parseWorkflowName2 } from "@workflow/utils/parse-name";
import { getQueueTopicPrefix, resolveQueueNamespace, SPEC_VERSION_CURRENT as SPEC_VERSION_CURRENT2, SPEC_VERSION_LEGACY as SPEC_VERSION_LEGACY2, WorkflowInvokePayloadSchema } from "@workflow/world";
import { classifyRunError, isRetryableWorldError, isWorldContractError } from "../node_modules/@workflow/core/dist/classify-error.js";
import { importKey as importKey2 } from "../node_modules/@workflow/core/dist/encryption.js";
import { WorkflowSuspension as WorkflowSuspension2 } from "../node_modules/@workflow/core/dist/global.js";
import { runtimeLogger as runtimeLogger3 } from "../node_modules/@workflow/core/dist/logger.js";
import { MAX_QUEUE_DELIVERIES, REPLAY_DIVERGENCE_MAX_RETRIES, REPLAY_TIMEOUT_MAX_RETRIES, REPLAY_TIMEOUT_MS } from "../node_modules/@workflow/core/dist/runtime/constants.js";
import { getQueueOverhead, getWorkflowQueueName as getWorkflowQueueName2, getWorkflowRunEvents, handleHealthCheckMessage, parseHealthCheckPayload, queueMessage, stateUpdatedAtForCreate, withHealthCheck, withPreconditionRetry } from "../node_modules/@workflow/core/dist/runtime/helpers.js";
import { handleSuspension } from "../node_modules/@workflow/core/dist/runtime/suspension-handler.js";
import { getWorld as getWorld2, getWorldHandlers } from "../node_modules/@workflow/core/dist/runtime/world.js";
import { remapErrorStack } from "../node_modules/@workflow/core/dist/source-map.js";
import * as Attribute3 from "../node_modules/@workflow/core/dist/telemetry/semantic-conventions.js";
import { linkToCurrentContext, trace as trace3, withTraceContext, withWorkflowBaggage } from "../node_modules/@workflow/core/dist/telemetry.js";
import { getErrorName, getErrorStack, normalizeUnknownError } from "../node_modules/@workflow/core/dist/types.js";
import { buildWorkflowSuspensionMessage } from "../node_modules/@workflow/core/dist/util.js";

// node_modules/@workflow/core/dist/workflow.js
import { ERROR_SLUGS, ReplayDivergenceError, WorkflowNotRegisteredError, WorkflowRuntimeError } from "@workflow/errors";
import { createWorkflowBaseUrl, withResolvers } from "@workflow/utils";
import { parseWorkflowName } from "@workflow/utils/parse-name";
import * as nanoid from "nanoid";
import { monotonicFactory } from "ulid";
import { EventConsumerResult, EventsConsumer } from "../node_modules/@workflow/core/dist/events-consumer.js";
import { ENOTSUP, WorkflowSuspension } from "../node_modules/@workflow/core/dist/global.js";
import { runtimeLogger } from "../node_modules/@workflow/core/dist/logger.js";
import { getPortLazy } from "../node_modules/@workflow/core/dist/runtime/get-port-lazy.js";
import { dehydrateWorkflowReturnValue, hydrateWorkflowArguments } from "../node_modules/@workflow/core/dist/serialization.js";
import { createUseStep } from "../node_modules/@workflow/core/dist/step.js";
import { BODY_INIT_SYMBOL, STABLE_ULID, WORKFLOW_CREATE_HOOK, WORKFLOW_GET_STREAM_ID, WORKFLOW_SLEEP, WORKFLOW_USE_STEP } from "../node_modules/@workflow/core/dist/symbols.js";
import * as Attribute from "../node_modules/@workflow/core/dist/telemetry/semantic-conventions.js";
import { trace } from "../node_modules/@workflow/core/dist/telemetry.js";
import { getWorkflowRunStreamId } from "../node_modules/@workflow/core/dist/util.js";
import { createContext } from "../node_modules/@workflow/core/dist/vm/index.js";
import { runCachedWorkflowScript } from "../node_modules/@workflow/core/dist/vm/script-cache.js";
import { WORKFLOW_CONTEXT_SYMBOL } from "../node_modules/@workflow/core/dist/workflow/get-workflow-metadata.js";
import { createCreateHook } from "../node_modules/@workflow/core/dist/workflow/hook.js";
import { createSleep } from "../node_modules/@workflow/core/dist/workflow/sleep.js";

// node_modules/@workflow/core/dist/runtime.js
import { WorkflowSuspension as WorkflowSuspension3 } from "../node_modules/@workflow/core/dist/global.js";
import { healthCheck } from "../node_modules/@workflow/core/dist/runtime/helpers.js";

// node_modules/@workflow/core/dist/runtime/resume-hook.js
import { ERROR_SLUGS as ERROR_SLUGS2, HookNotFoundError, WorkflowRuntimeError as WorkflowRuntimeError2 } from "@workflow/errors";
import { isLegacySpecVersion, SPEC_VERSION_CURRENT, SPEC_VERSION_LEGACY } from "@workflow/world";
import { getRunCapabilities } from "../node_modules/@workflow/core/dist/capabilities.js";
import { importKey } from "../node_modules/@workflow/core/dist/encryption.js";
import { runtimeLogger as runtimeLogger2 } from "../node_modules/@workflow/core/dist/logger.js";
import { dehydrateStepReturnValue, hydrateStepArguments, SerializationFormat } from "../node_modules/@workflow/core/dist/serialization.js";
import { WEBHOOK_RESPONSE_WRITABLE } from "../node_modules/@workflow/core/dist/symbols.js";
import * as Attribute2 from "../node_modules/@workflow/core/dist/telemetry/semantic-conventions.js";
import { getSpanContextForTraceCarrier, trace as trace2 } from "../node_modules/@workflow/core/dist/telemetry.js";
import { getWorkflowQueueName } from "../node_modules/@workflow/core/dist/runtime/helpers.js";
import { safeWaitUntil, waitedUntil } from "../node_modules/@workflow/core/dist/runtime/wait-until.js";
import { getWorld } from "../node_modules/@workflow/core/dist/runtime/world.js";

// node_modules/@workflow/core/dist/runtime.js
import { getRun, Run } from "../node_modules/@workflow/core/dist/runtime/run.js";
import { cancelRun, listStreams, readStream, recreateRunFromExisting, reenqueueRun, wakeUpRun } from "../node_modules/@workflow/core/dist/runtime/runs.js";
import { start } from "../node_modules/@workflow/core/dist/runtime/start.js";
import { stepEntrypoint } from "../node_modules/@workflow/core/dist/runtime/step-handler.js";
import { createWorld, getWorld as getWorld3, getWorldHandlers as getWorldHandlers2, setWorld } from "../node_modules/@workflow/core/dist/runtime/world.js";
export {
  stepEntrypoint as HEAD,
  stepEntrypoint as POST
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbGliL3N0b3JlLnRzIiwgIi4uL2xpYi9waXBlbGluZS9leHRyYWN0LnRzIiwgIi4uL2xpYi92b2ljZXMudHMiLCAiLi4vbGliL29wdGlvbnMudHMiLCAiLi4vbGliL3BpcGVsaW5lL3NjcmlwdC50cyIsICIuLi9saWIvYXVkaW8vd2F2LnRzIiwgIi4uL2xpYi9hdWRpby9tcDMudHMiLCAiLi4vbGliL3BpcGVsaW5lL3R0cy50cyIsICIuLi9saWIvc3VwYWJhc2UvYWRtaW4udHMiLCAiLi4vbGliL2NyZWRpdHMudHMiLCAiLi4vbm9kZV9tb2R1bGVzL3dvcmtmbG93L3NyYy9pbnRlcm5hbC9idWlsdGlucy50cyIsICIuLi9ub2RlX21vZHVsZXMvd29ya2Zsb3cvc3JjL3N0ZGxpYi50cyIsICIuLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS50cyIsICIuLi9ub2RlX21vZHVsZXMvQHdvcmtmbG93L2J1aWxkZXJzL3NyYy9zZXJkZS1jaGVja2VyLnRzIiwgIi4uL25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvdml0ZXN0L25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvYnVpbGRlcnMvc3JjL3NlcmRlLWNoZWNrZXIudHMiLCAiLi4vbm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9jb3JlL3NyYy9ydW50aW1lLnRzIiwgIi4uL25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvY29yZS9zcmMvd29ya2Zsb3cudHMiLCAiLi4vbm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9jb3JlL3NyYy9ydW50aW1lL3Jlc3VtZS1ob29rLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmNvbnN0IFVVSURfUkUgPSAvXlswLTlhLWZdezh9LVswLTlhLWZdezR9LVswLTlhLWZdezR9LVswLTlhLWZdezR9LVswLTlhLWZdezEyfSQvaTtcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkRXBpc29kZUlkKGlkKSB7XG4gICAgcmV0dXJuIFVVSURfUkUudGVzdChpZCk7XG59XG5mdW5jdGlvbiBhc3NlcnRJZChpZCkge1xuICAgIGlmICghaXNWYWxpZEVwaXNvZGVJZChpZCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVwaXNvZGUgaWQ6ICR7aWQuc2xpY2UoMCwgNDApfWApO1xuICAgIH1cbn1cbmNvbnN0IEFVRElPX0VYVCA9IHtcbiAgICBcImF1ZGlvL3dhdlwiOiBcIndhdlwiLFxuICAgIFwiYXVkaW8vbXBlZ1wiOiBcIm1wM1wiXG59O1xuY2xhc3MgRnNNZXRhIHtcbiAgICBkaXI7XG4gICAgY29uc3RydWN0b3IoZGlyKXtcbiAgICAgICAgdGhpcy5kaXIgPSBkaXI7XG4gICAgfVxuICAgIGZpbGUoaWQpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbih0aGlzLmRpciwgYCR7aWR9Lmpzb25gKTtcbiAgICB9XG4gICAgYXN5bmMgd3JpdGUoZXBpc29kZSkge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih0aGlzLmRpciwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmZpbGUoZXBpc29kZS5pZCk7XG4gICAgICAgIGNvbnN0IHRtcCA9IGAke3RhcmdldH0udG1wYDtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHRtcCwgSlNPTi5zdHJpbmdpZnkoZXBpc29kZSwgbnVsbCwgMikpO1xuICAgICAgICBhd2FpdCBmcy5yZW5hbWUodG1wLCB0YXJnZXQpO1xuICAgIH1cbiAgICBhc3luYyBsaXN0KGZpbHRlcikge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih0aGlzLmRpciwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnJlYWRkaXIodGhpcy5kaXIpO1xuICAgICAgICBjb25zdCBlcGlzb2RlcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGYgb2YgZmlsZXMpe1xuICAgICAgICAgICAgaWYgKCFmLmVuZHNXaXRoKFwiLmpzb25cIikpIGNvbnRpbnVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlcGlzb2Rlcy5wdXNoKEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKHRoaXMuZGlyLCBmKSwgXCJ1dGY4XCIpKSk7XG4gICAgICAgICAgICB9IGNhdGNoICB7XG4gICAgICAgICAgICAvLyBza2lwIHRvcm4vY29ycnVwdCBlbnRyaWVzIHJhdGhlciB0aGFuIGZhaWxpbmcgdGhlIHdob2xlIGxpc3RpbmdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2aXNpYmxlID0gZmlsdGVyID8gZXBpc29kZXMuZmlsdGVyKChlKT0+ZS51c2VySWQgPT09IGZpbHRlci51c2VySWQgfHwgZmlsdGVyLmluY2x1ZGVVbm93bmVkICYmIGUudXNlcklkID09PSB1bmRlZmluZWQpIDogZXBpc29kZXM7XG4gICAgICAgIHJldHVybiB2aXNpYmxlLnNvcnQoKGEsIGIpPT5iLmNyZWF0ZWRBdC5sb2NhbGVDb21wYXJlKGEuY3JlYXRlZEF0KSk7XG4gICAgfVxuICAgIGFzeW5jIGdldChpZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUodGhpcy5maWxlKGlkKSwgXCJ1dGY4XCIpKTtcbiAgICAgICAgfSBjYXRjaCAge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgZ2V0QnlTaGFyZVRva2VuKHRva2VuKSB7XG4gICAgICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMubGlzdCgpO1xuICAgICAgICByZXR1cm4gYWxsLmZpbmQoKGUpPT5lLnNoYXJlVG9rZW4gPT09IHRva2VuKSA/PyBudWxsO1xuICAgIH1cbiAgICBhc3luYyBzZXRTaGFyZVRva2VuKGlkLCB0b2tlbikge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKCFleGlzdGluZykgcmV0dXJuO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlKHtcbiAgICAgICAgICAgIC4uLmV4aXN0aW5nLFxuICAgICAgICAgICAgc2hhcmVUb2tlbjogdG9rZW4gPz8gdW5kZWZpbmVkXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBjcmVhdGUoZXBpc29kZSkge1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlKGVwaXNvZGUpO1xuICAgIH1cbiAgICBhc3luYyBwYXRjaChpZCwgZmllbGRzKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5nZXQoaWQpO1xuICAgICAgICBpZiAoIWV4aXN0aW5nKSByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgdXBkYXRlZCA9IHtcbiAgICAgICAgICAgIC4uLmV4aXN0aW5nLFxuICAgICAgICAgICAgLi4uZmllbGRzLFxuICAgICAgICAgICAgaWRcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZSh1cGRhdGVkKTtcbiAgICAgICAgcmV0dXJuIHVwZGF0ZWQ7XG4gICAgfVxuICAgIGFzeW5jIHBhdGNoSWYoaWQsIGV4cGVjdGVkU3RhdHVzLCBmaWVsZHMpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLmdldChpZCk7XG4gICAgICAgIGlmICghZXhpc3RpbmcgfHwgZXhpc3Rpbmcuc3RhdHVzICE9PSBleHBlY3RlZFN0YXR1cykgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWQgPSB7XG4gICAgICAgICAgICAuLi5leGlzdGluZyxcbiAgICAgICAgICAgIC4uLmZpZWxkcyxcbiAgICAgICAgICAgIGlkXG4gICAgICAgIH07XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGUodXBkYXRlZCk7XG4gICAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgIH1cbiAgICBhc3luYyBkZWxldGUoaWQpIHtcbiAgICAgICAgYXdhaXQgZnMucm0odGhpcy5maWxlKGlkKSwge1xuICAgICAgICAgICAgZm9yY2U6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gcm93VG9FcGlzb2RlKHJvdykge1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiByb3cuaWQsXG4gICAgICAgIHVzZXJJZDogcm93LnVzZXJfaWQgPz8gdW5kZWZpbmVkLFxuICAgICAgICB0aXRsZTogcm93LnRpdGxlLFxuICAgICAgICBzb3VyY2VGaWxlbmFtZTogcm93LnNvdXJjZV9maWxlbmFtZSxcbiAgICAgICAgbW9kZTogcm93Lm1vZGUgPz8gXCJjb252ZXJzYXRpb25cIixcbiAgICAgICAgb3B0aW9uczogcm93Lm9wdGlvbnMgPz8gdW5kZWZpbmVkLFxuICAgICAgICBzaGFyZVRva2VuOiByb3cuc2hhcmVfdG9rZW4gPz8gdW5kZWZpbmVkLFxuICAgICAgICBzdGF0dXM6IHJvdy5zdGF0dXMsXG4gICAgICAgIGVycm9yOiByb3cuZXJyb3IgPz8gdW5kZWZpbmVkLFxuICAgICAgICBjcmVhdGVkQXQ6IHJvdy5jcmVhdGVkX2F0LFxuICAgICAgICB0b3RhbFBhZ2VzOiByb3cudG90YWxfcGFnZXMgPz8gdW5kZWZpbmVkLFxuICAgICAgICBleHRyYWN0ZWRDaGFyczogcm93LmV4dHJhY3RlZF9jaGFycyA/PyB1bmRlZmluZWQsXG4gICAgICAgIHNjcmlwdDogcm93LnNjcmlwdCA/PyB1bmRlZmluZWQsXG4gICAgICAgIGF1ZGlvTWltZVR5cGU6IHJvdy5hdWRpb19taW1lX3R5cGUgPz8gdW5kZWZpbmVkLFxuICAgICAgICBkdXJhdGlvblNlY29uZHM6IHJvdy5kdXJhdGlvbl9zZWNvbmRzID8/IHVuZGVmaW5lZCxcbiAgICAgICAgcHJvdmlkZXJzOiByb3cucHJvdmlkZXJzID8/IHVuZGVmaW5lZFxuICAgIH07XG59XG5mdW5jdGlvbiBlcGlzb2RlVG9Sb3coZmllbGRzKSB7XG4gICAgY29uc3Qgcm93ID0ge307XG4gICAgaWYgKGZpZWxkcy5pZCAhPT0gdW5kZWZpbmVkKSByb3cuaWQgPSBmaWVsZHMuaWQ7XG4gICAgaWYgKGZpZWxkcy51c2VySWQgIT09IHVuZGVmaW5lZCkgcm93LnVzZXJfaWQgPSBmaWVsZHMudXNlcklkO1xuICAgIGlmIChmaWVsZHMudGl0bGUgIT09IHVuZGVmaW5lZCkgcm93LnRpdGxlID0gZmllbGRzLnRpdGxlO1xuICAgIGlmIChmaWVsZHMuc291cmNlRmlsZW5hbWUgIT09IHVuZGVmaW5lZCkgcm93LnNvdXJjZV9maWxlbmFtZSA9IGZpZWxkcy5zb3VyY2VGaWxlbmFtZTtcbiAgICBpZiAoZmllbGRzLm1vZGUgIT09IHVuZGVmaW5lZCkgcm93Lm1vZGUgPSBmaWVsZHMubW9kZTtcbiAgICBpZiAoZmllbGRzLm9wdGlvbnMgIT09IHVuZGVmaW5lZCkgcm93Lm9wdGlvbnMgPSBmaWVsZHMub3B0aW9ucztcbiAgICBpZiAoZmllbGRzLnNoYXJlVG9rZW4gIT09IHVuZGVmaW5lZCkgcm93LnNoYXJlX3Rva2VuID0gZmllbGRzLnNoYXJlVG9rZW4gPz8gbnVsbDtcbiAgICBpZiAoZmllbGRzLnN0YXR1cyAhPT0gdW5kZWZpbmVkKSByb3cuc3RhdHVzID0gZmllbGRzLnN0YXR1cztcbiAgICBpZiAoZmllbGRzLmVycm9yICE9PSB1bmRlZmluZWQpIHJvdy5lcnJvciA9IGZpZWxkcy5lcnJvcjtcbiAgICBpZiAoZmllbGRzLmNyZWF0ZWRBdCAhPT0gdW5kZWZpbmVkKSByb3cuY3JlYXRlZF9hdCA9IGZpZWxkcy5jcmVhdGVkQXQ7XG4gICAgaWYgKGZpZWxkcy50b3RhbFBhZ2VzICE9PSB1bmRlZmluZWQpIHJvdy50b3RhbF9wYWdlcyA9IGZpZWxkcy50b3RhbFBhZ2VzO1xuICAgIGlmIChmaWVsZHMuZXh0cmFjdGVkQ2hhcnMgIT09IHVuZGVmaW5lZCkgcm93LmV4dHJhY3RlZF9jaGFycyA9IGZpZWxkcy5leHRyYWN0ZWRDaGFycztcbiAgICBpZiAoZmllbGRzLnNjcmlwdCAhPT0gdW5kZWZpbmVkKSByb3cuc2NyaXB0ID0gZmllbGRzLnNjcmlwdDtcbiAgICBpZiAoZmllbGRzLmF1ZGlvTWltZVR5cGUgIT09IHVuZGVmaW5lZCkgcm93LmF1ZGlvX21pbWVfdHlwZSA9IGZpZWxkcy5hdWRpb01pbWVUeXBlO1xuICAgIGlmIChmaWVsZHMuZHVyYXRpb25TZWNvbmRzICE9PSB1bmRlZmluZWQpIHJvdy5kdXJhdGlvbl9zZWNvbmRzID0gZmllbGRzLmR1cmF0aW9uU2Vjb25kcztcbiAgICBpZiAoZmllbGRzLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSByb3cucHJvdmlkZXJzID0gZmllbGRzLnByb3ZpZGVycztcbiAgICByZXR1cm4gcm93O1xufVxuY2xhc3MgU3VwYWJhc2VNZXRhIHtcbiAgICBjbGllbnRQcm9taXNlID0gbnVsbDtcbiAgICBjbGllbnQoKSB7XG4gICAgICAgIGlmICghdGhpcy5jbGllbnRQcm9taXNlKSB7XG4gICAgICAgICAgICB0aGlzLmNsaWVudFByb21pc2UgPSBpbXBvcnQoXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIikudGhlbigoeyBjcmVhdGVDbGllbnQgfSk9PmNyZWF0ZUNsaWVudChwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFQ1JFVF9LRVksIHtcbiAgICAgICAgICAgICAgICAgICAgYXV0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVyc2lzdFNlc3Npb246IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50UHJvbWlzZTtcbiAgICB9XG4gICAgYXN5bmMgbGlzdChmaWx0ZXIpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBsZXQgcXVlcnkgPSBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikuc2VsZWN0KFwiKlwiKS5vcmRlcihcImNyZWF0ZWRfYXRcIiwge1xuICAgICAgICAgICAgYXNjZW5kaW5nOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgcXVlcnkgPSBmaWx0ZXIuaW5jbHVkZVVub3duZWQgPyBxdWVyeS5vcihgdXNlcl9pZC5lcS4ke2ZpbHRlci51c2VySWR9LHVzZXJfaWQuaXMubnVsbGApIDogcXVlcnkuZXEoXCJ1c2VyX2lkXCIsIGZpbHRlci51c2VySWQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHF1ZXJ5O1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgZXBpc29kZXMgbGlzdCBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgcmV0dXJuIGRhdGEubWFwKHJvd1RvRXBpc29kZSk7XG4gICAgfVxuICAgIGFzeW5jIGdldChpZCkge1xuICAgICAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oXCJlcGlzb2Rlc1wiKS5zZWxlY3QoXCIqXCIpLmVxKFwiaWRcIiwgaWQpLm1heWJlU2luZ2xlKCk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBlcGlzb2RlIGdldCBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgcmV0dXJuIGRhdGEgPyByb3dUb0VwaXNvZGUoZGF0YSkgOiBudWxsO1xuICAgIH1cbiAgICBhc3luYyBnZXRCeVNoYXJlVG9rZW4odG9rZW4pIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikuc2VsZWN0KFwiKlwiKS5lcShcInNoYXJlX3Rva2VuXCIsIHRva2VuKS5tYXliZVNpbmdsZSgpO1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgZXBpc29kZSBzaGFyZSBsb29rdXAgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIHJldHVybiBkYXRhID8gcm93VG9FcGlzb2RlKGRhdGEpIDogbnVsbDtcbiAgICB9XG4gICAgYXN5bmMgc2V0U2hhcmVUb2tlbihpZCwgdG9rZW4pIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikudXBkYXRlKHtcbiAgICAgICAgICAgIHNoYXJlX3Rva2VuOiB0b2tlblxuICAgICAgICB9KS5lcShcImlkXCIsIGlkKTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBuZXcgRXJyb3IoYHNldCBzaGFyZSB0b2tlbiBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9XG4gICAgYXN5bmMgY3JlYXRlKGVwaXNvZGUpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikuaW5zZXJ0KGVwaXNvZGVUb1JvdyhlcGlzb2RlKSk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBlcGlzb2RlIGNyZWF0ZSBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9XG4gICAgYXN5bmMgcGF0Y2goaWQsIGZpZWxkcykge1xuICAgICAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oXCJlcGlzb2Rlc1wiKS51cGRhdGUoZXBpc29kZVRvUm93KGZpZWxkcykpLmVxKFwiaWRcIiwgaWQpLnNlbGVjdCgpLm1heWJlU2luZ2xlKCk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBlcGlzb2RlIHBhdGNoIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICByZXR1cm4gZGF0YSA/IHJvd1RvRXBpc29kZShkYXRhKSA6IG51bGw7XG4gICAgfVxuICAgIGFzeW5jIHBhdGNoSWYoaWQsIGV4cGVjdGVkU3RhdHVzLCBmaWVsZHMpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICAvLyBBdG9taWMgY29tcGFyZS1hbmQtc2V0OiB0aGUgc3RhdHVzIHByZWRpY2F0ZSBtYWtlcyBjb25jdXJyZW50IFBBVENIZXNcbiAgICAgICAgLy8gcmFjZSBmb3IgdGhlIHNpbmdsZSByb3cgdGhhdCBzdGlsbCBtYXRjaGVzIGV4cGVjdGVkU3RhdHVzLlxuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikudXBkYXRlKGVwaXNvZGVUb1JvdyhmaWVsZHMpKS5lcShcImlkXCIsIGlkKS5lcShcInN0YXR1c1wiLCBleHBlY3RlZFN0YXR1cykuc2VsZWN0KCkubWF5YmVTaW5nbGUoKTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBuZXcgRXJyb3IoYGVwaXNvZGUgcGF0Y2hJZiBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgcmV0dXJuIGRhdGEgPyByb3dUb0VwaXNvZGUoZGF0YSkgOiBudWxsO1xuICAgIH1cbiAgICBhc3luYyBkZWxldGUoaWQpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikuZGVsZXRlKCkuZXEoXCJpZFwiLCBpZCk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBlcGlzb2RlIGRlbGV0ZSBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzbGljZVJhbmdlKGRhdGEsIG1pbWVUeXBlLCByYW5nZSkge1xuICAgIGNvbnN0IHRvdGFsID0gZGF0YS5ieXRlTGVuZ3RoO1xuICAgIGNvbnN0IGJhc2UgPSB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IG1pbWVUeXBlLFxuICAgICAgICBcIkFjY2VwdC1SYW5nZXNcIjogXCJieXRlc1wiLFxuICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJwcml2YXRlLCBtYXgtYWdlPTMxNTM2MDAwLCBpbW11dGFibGVcIlxuICAgIH07XG4gICAgY29uc3QgbWF0Y2ggPSByYW5nZSA/IC9ieXRlcz0oXFxkKiktKFxcZCopLy5leGVjKHJhbmdlKSA6IG51bGw7XG4gICAgaWYgKG1hdGNoICYmIChtYXRjaFsxXSB8fCBtYXRjaFsyXSkpIHtcbiAgICAgICAgbGV0IHN0YXJ0O1xuICAgICAgICBsZXQgZW5kO1xuICAgICAgICBpZiAoIW1hdGNoWzFdKSB7XG4gICAgICAgICAgICBjb25zdCBzdWZmaXggPSBNYXRoLm1pbihwYXJzZUludChtYXRjaFsyXSwgMTApLCB0b3RhbCk7XG4gICAgICAgICAgICBzdGFydCA9IHRvdGFsIC0gc3VmZml4O1xuICAgICAgICAgICAgZW5kID0gdG90YWwgLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhcnQgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICAgICAgZW5kID0gbWF0Y2hbMl0gPyBNYXRoLm1pbihwYXJzZUludChtYXRjaFsyXSwgMTApLCB0b3RhbCAtIDEpIDogdG90YWwgLSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydCA8PSBlbmQgJiYgc3RhcnQgPCB0b3RhbCkge1xuICAgICAgICAgICAgY29uc3QgY2h1bmsgPSBkYXRhLnNsaWNlKHN0YXJ0LCBlbmQgKyAxKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAyMDYsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAuLi5iYXNlLFxuICAgICAgICAgICAgICAgICAgICBcIkNvbnRlbnQtUmFuZ2VcIjogYGJ5dGVzICR7c3RhcnR9LSR7ZW5kfS8ke3RvdGFsfWAsXG4gICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1MZW5ndGhcIjogU3RyaW5nKGNodW5rLmJ5dGVMZW5ndGgpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBjaHVua1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzOiA0MTYsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJBY2NlcHQtUmFuZ2VzXCI6IFwiYnl0ZXNcIixcbiAgICAgICAgICAgICAgICBcIkNvbnRlbnQtUmFuZ2VcIjogYGJ5dGVzICovJHt0b3RhbH1gXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogbmV3IFVpbnQ4QXJyYXkoMClcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIC4uLmJhc2UsXG4gICAgICAgICAgICBcIkNvbnRlbnQtTGVuZ3RoXCI6IFN0cmluZyh0b3RhbClcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogZGF0YVxuICAgIH07XG59XG5jbGFzcyBGc0JpbmFyeSB7XG4gICAgcm9vdDtcbiAgICBjb25zdHJ1Y3Rvcihyb290KXtcbiAgICAgICAgdGhpcy5yb290ID0gcm9vdDtcbiAgICB9XG4gICAgYXN5bmMgZGlyKHN1Yikge1xuICAgICAgICBjb25zdCBwID0gcGF0aC5qb2luKHRoaXMucm9vdCwgc3ViKTtcbiAgICAgICAgYXdhaXQgZnMubWtkaXIocCwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVNvdXJjZShpZCwgZGF0YSkge1xuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGUocGF0aC5qb2luKGF3YWl0IHRoaXMuZGlyKFwic291cmNlc1wiKSwgYCR7aWR9LnBkZmApLCBkYXRhKTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0U291cmNlKGlkKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKHRoaXMucm9vdCwgXCJzb3VyY2VzXCIsIGAke2lkfS5wZGZgKSkpO1xuICAgICAgICB9IGNhdGNoICB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlU291cmNlVGV4dChpZCwgdGV4dCkge1xuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGUocGF0aC5qb2luKGF3YWl0IHRoaXMuZGlyKFwic291cmNlc1wiKSwgYCR7aWR9LnR4dGApLCB0ZXh0KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0U291cmNlVGV4dChpZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbih0aGlzLnJvb3QsIFwic291cmNlc1wiLCBgJHtpZH0udHh0YCksIFwidXRmOFwiKTtcbiAgICAgICAgfSBjYXRjaCAge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgc2F2ZUF1ZGlvKGlkLCBkYXRhLCBtaW1lVHlwZSkge1xuICAgICAgICBjb25zdCBleHQgPSBBVURJT19FWFRbbWltZVR5cGVdID8/IFwiYmluXCI7XG4gICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShwYXRoLmpvaW4oYXdhaXQgdGhpcy5kaXIoXCJhdWRpb1wiKSwgYCR7aWR9LiR7ZXh0fWApLCBkYXRhKTtcbiAgICB9XG4gICAgYXN5bmMgb3BlbkF1ZGlvKGlkLCBtaW1lVHlwZSwgcmFuZ2UpIHtcbiAgICAgICAgY29uc3QgZXh0ID0gQVVESU9fRVhUW21pbWVUeXBlXSA/PyBcImJpblwiO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbih0aGlzLnJvb3QsIFwiYXVkaW9cIiwgYCR7aWR9LiR7ZXh0fWApKSk7XG4gICAgICAgICAgICByZXR1cm4gc2xpY2VSYW5nZShkYXRhLCBtaW1lVHlwZSwgcmFuZ2UpO1xuICAgICAgICB9IGNhdGNoICB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBkZWxldGUoaWQsIG1pbWVUeXBlKSB7XG4gICAgICAgIGF3YWl0IGZzLnJtKHBhdGguam9pbih0aGlzLnJvb3QsIFwic291cmNlc1wiLCBgJHtpZH0ucGRmYCksIHtcbiAgICAgICAgICAgIGZvcmNlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBmcy5ybShwYXRoLmpvaW4odGhpcy5yb290LCBcInNvdXJjZXNcIiwgYCR7aWR9LnR4dGApLCB7XG4gICAgICAgICAgICBmb3JjZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZXh0cyA9IG1pbWVUeXBlID8gW1xuICAgICAgICAgICAgQVVESU9fRVhUW21pbWVUeXBlXSA/PyBcImJpblwiXG4gICAgICAgIF0gOiBPYmplY3QudmFsdWVzKEFVRElPX0VYVCk7XG4gICAgICAgIGZvciAoY29uc3QgZXh0IG9mIGV4dHMpe1xuICAgICAgICAgICAgYXdhaXQgZnMucm0ocGF0aC5qb2luKHRoaXMucm9vdCwgXCJhdWRpb1wiLCBgJHtpZH0uJHtleHR9YCksIHtcbiAgICAgICAgICAgICAgICBmb3JjZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5jbGFzcyBCbG9iQmluYXJ5IHtcbiAgICBibG9iKCkge1xuICAgICAgICByZXR1cm4gaW1wb3J0KFwiQHZlcmNlbC9ibG9iXCIpO1xuICAgIH1cbiAgICBhc3luYyBzYXZlU291cmNlKGlkLCBkYXRhKSB7XG4gICAgICAgIGNvbnN0IHsgcHV0IH0gPSBhd2FpdCB0aGlzLmJsb2IoKTtcbiAgICAgICAgYXdhaXQgcHV0KGBzb3VyY2VzLyR7aWR9LnBkZmAsIEJ1ZmZlci5mcm9tKGRhdGEpLCB7XG4gICAgICAgICAgICBhY2Nlc3M6IFwicHJpdmF0ZVwiLFxuICAgICAgICAgICAgYWRkUmFuZG9tU3VmZml4OiBmYWxzZSxcbiAgICAgICAgICAgIGFsbG93T3ZlcndyaXRlOiB0cnVlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vcGRmXCJcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGdldFNvdXJjZShpZCkge1xuICAgICAgICBjb25zdCB7IGdldCB9ID0gYXdhaXQgdGhpcy5ibG9iKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdldChgc291cmNlcy8ke2lkfS5wZGZgLCB7XG4gICAgICAgICAgICBhY2Nlc3M6IFwicHJpdmF0ZVwiXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXJlc3VsdD8uc3RyZWFtKSByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGF3YWl0IG5ldyBSZXNwb25zZShyZXN1bHQuc3RyZWFtKS5hcnJheUJ1ZmZlcigpKTtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVNvdXJjZVRleHQoaWQsIHRleHQpIHtcbiAgICAgICAgY29uc3QgeyBwdXQgfSA9IGF3YWl0IHRoaXMuYmxvYigpO1xuICAgICAgICBhd2FpdCBwdXQoYHNvdXJjZXMvJHtpZH0udHh0YCwgQnVmZmVyLmZyb20odGV4dCwgXCJ1dGY4XCIpLCB7XG4gICAgICAgICAgICBhY2Nlc3M6IFwicHJpdmF0ZVwiLFxuICAgICAgICAgICAgYWRkUmFuZG9tU3VmZml4OiBmYWxzZSxcbiAgICAgICAgICAgIGFsbG93T3ZlcndyaXRlOiB0cnVlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwidGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRTb3VyY2VUZXh0KGlkKSB7XG4gICAgICAgIGNvbnN0IHsgZ2V0IH0gPSBhd2FpdCB0aGlzLmJsb2IoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZ2V0KGBzb3VyY2VzLyR7aWR9LnR4dGAsIHtcbiAgICAgICAgICAgIGFjY2VzczogXCJwcml2YXRlXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghcmVzdWx0Py5zdHJlYW0pIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gYXdhaXQgbmV3IFJlc3BvbnNlKHJlc3VsdC5zdHJlYW0pLnRleHQoKTtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZUF1ZGlvKGlkLCBkYXRhLCBtaW1lVHlwZSkge1xuICAgICAgICBjb25zdCB7IHB1dCB9ID0gYXdhaXQgdGhpcy5ibG9iKCk7XG4gICAgICAgIGNvbnN0IGV4dCA9IEFVRElPX0VYVFttaW1lVHlwZV0gPz8gXCJiaW5cIjtcbiAgICAgICAgYXdhaXQgcHV0KGBhdWRpby8ke2lkfS4ke2V4dH1gLCBCdWZmZXIuZnJvbShkYXRhKSwge1xuICAgICAgICAgICAgYWNjZXNzOiBcInByaXZhdGVcIixcbiAgICAgICAgICAgIGFkZFJhbmRvbVN1ZmZpeDogZmFsc2UsXG4gICAgICAgICAgICBhbGxvd092ZXJ3cml0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBtaW1lVHlwZVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgb3BlbkF1ZGlvKGlkLCBtaW1lVHlwZSwgcmFuZ2UpIHtcbiAgICAgICAgY29uc3QgeyBnZXQgfSA9IGF3YWl0IHRoaXMuYmxvYigpO1xuICAgICAgICBjb25zdCBleHQgPSBBVURJT19FWFRbbWltZVR5cGVdID8/IFwiYmluXCI7XG4gICAgICAgIC8vIFBhc3MgdGhlIGNsaWVudCdzIFJhbmdlIHRocm91Z2ggdG8gb3JpZ2luIHNvIHdlIHN0cmVhbSBwYXJ0aWFsIGNvbnRlbnRcbiAgICAgICAgLy8gd2l0aG91dCBidWZmZXJpbmcgdGhlIHdob2xlIGZpbGUgaW4gdGhlIGZ1bmN0aW9uLlxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXQoYGF1ZGlvLyR7aWR9LiR7ZXh0fWAsIHtcbiAgICAgICAgICAgIGFjY2VzczogXCJwcml2YXRlXCIsXG4gICAgICAgICAgICAuLi5yYW5nZSA/IHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIFJhbmdlOiByYW5nZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gOiB7fVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFyZXN1bHQ/LnN0cmVhbSkgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IHNyYyA9IHJlc3VsdC5oZWFkZXJzO1xuICAgICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogc3JjLmdldChcImNvbnRlbnQtdHlwZVwiKSA/PyBtaW1lVHlwZSxcbiAgICAgICAgICAgIFwiQWNjZXB0LVJhbmdlc1wiOiBcImJ5dGVzXCIsXG4gICAgICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJwcml2YXRlLCBtYXgtYWdlPTMxNTM2MDAwLCBpbW11dGFibGVcIlxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBjb250ZW50UmFuZ2UgPSBzcmMuZ2V0KFwiY29udGVudC1yYW5nZVwiKTtcbiAgICAgICAgY29uc3QgY29udGVudExlbmd0aCA9IHNyYy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKTtcbiAgICAgICAgaWYgKGNvbnRlbnRSYW5nZSkgaGVhZGVyc1tcIkNvbnRlbnQtUmFuZ2VcIl0gPSBjb250ZW50UmFuZ2U7XG4gICAgICAgIGlmIChjb250ZW50TGVuZ3RoKSBoZWFkZXJzW1wiQ29udGVudC1MZW5ndGhcIl0gPSBjb250ZW50TGVuZ3RoO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzOiByYW5nZSAmJiBjb250ZW50UmFuZ2UgPyAyMDYgOiAyMDAsXG4gICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgYm9keTogcmVzdWx0LnN0cmVhbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhc3luYyBkZWxldGUoaWQsIG1pbWVUeXBlKSB7XG4gICAgICAgIGNvbnN0IHsgbGlzdCwgZGVsIH0gPSBhd2FpdCB0aGlzLmJsb2IoKTtcbiAgICAgICAgY29uc3QgZXh0cyA9IG1pbWVUeXBlID8gW1xuICAgICAgICAgICAgQVVESU9fRVhUW21pbWVUeXBlXSA/PyBcImJpblwiXG4gICAgICAgIF0gOiBPYmplY3QudmFsdWVzKEFVRElPX0VYVCk7XG4gICAgICAgIGNvbnN0IHByZWZpeGVzID0gW1xuICAgICAgICAgICAgYHNvdXJjZXMvJHtpZH0ucGRmYCxcbiAgICAgICAgICAgIGBzb3VyY2VzLyR7aWR9LnR4dGAsXG4gICAgICAgICAgICAuLi5leHRzLm1hcCgoZXh0KT0+YGF1ZGlvLyR7aWR9LiR7ZXh0fWApXG4gICAgICAgIF07XG4gICAgICAgIGZvciAoY29uc3QgcHJlZml4IG9mIHByZWZpeGVzKXtcbiAgICAgICAgICAgIGNvbnN0IHsgYmxvYnMgfSA9IGF3YWl0IGxpc3Qoe1xuICAgICAgICAgICAgICAgIHByZWZpeFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoYmxvYnMubGVuZ3RoID4gMCkgYXdhaXQgZGVsKGJsb2JzLm1hcCgoYik9PmIudXJsKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIENvbXBvc2l0ZVN0b3JlIHtcbiAgICBtZXRhO1xuICAgIGJpbmFyeTtcbiAgICBjb25zdHJ1Y3RvcihtZXRhLCBiaW5hcnkpe1xuICAgICAgICB0aGlzLm1ldGEgPSBtZXRhO1xuICAgICAgICB0aGlzLmJpbmFyeSA9IGJpbmFyeTtcbiAgICB9XG4gICAgbGlzdChmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWV0YS5saXN0KGZpbHRlcik7XG4gICAgfVxuICAgIGdldChpZCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEuZ2V0KGlkKTtcbiAgICB9XG4gICAgZ2V0QnlTaGFyZVRva2VuKHRva2VuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEuZ2V0QnlTaGFyZVRva2VuKHRva2VuKTtcbiAgICB9XG4gICAgc2V0U2hhcmVUb2tlbihpZCwgdG9rZW4pIHtcbiAgICAgICAgYXNzZXJ0SWQoaWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5tZXRhLnNldFNoYXJlVG9rZW4oaWQsIHRva2VuKTtcbiAgICB9XG4gICAgY3JlYXRlKGVwaXNvZGUpIHtcbiAgICAgICAgYXNzZXJ0SWQoZXBpc29kZS5pZCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEuY3JlYXRlKGVwaXNvZGUpO1xuICAgIH1cbiAgICBwYXRjaChpZCwgZmllbGRzKSB7XG4gICAgICAgIGFzc2VydElkKGlkKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWV0YS5wYXRjaChpZCwgZmllbGRzKTtcbiAgICB9XG4gICAgcGF0Y2hJZihpZCwgZXhwZWN0ZWRTdGF0dXMsIGZpZWxkcykge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEucGF0Y2hJZihpZCwgZXhwZWN0ZWRTdGF0dXMsIGZpZWxkcyk7XG4gICAgfVxuICAgIGFzeW5jIGRlbGV0ZShpZCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIGNvbnN0IGVwaXNvZGUgPSBhd2FpdCB0aGlzLm1ldGEuZ2V0KGlkKTtcbiAgICAgICAgYXdhaXQgdGhpcy5tZXRhLmRlbGV0ZShpZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYmluYXJ5LmRlbGV0ZShpZCwgZXBpc29kZT8uYXVkaW9NaW1lVHlwZSk7XG4gICAgfVxuICAgIHNhdmVTb3VyY2UoaWQsIGRhdGEpIHtcbiAgICAgICAgYXNzZXJ0SWQoaWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5iaW5hcnkuc2F2ZVNvdXJjZShpZCwgZGF0YSk7XG4gICAgfVxuICAgIGdldFNvdXJjZShpZCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLmJpbmFyeS5nZXRTb3VyY2UoaWQpO1xuICAgIH1cbiAgICBzYXZlU291cmNlVGV4dChpZCwgdGV4dCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLmJpbmFyeS5zYXZlU291cmNlVGV4dChpZCwgdGV4dCk7XG4gICAgfVxuICAgIGdldFNvdXJjZVRleHQoaWQpIHtcbiAgICAgICAgYXNzZXJ0SWQoaWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5iaW5hcnkuZ2V0U291cmNlVGV4dChpZCk7XG4gICAgfVxuICAgIHNhdmVBdWRpbyhpZCwgZGF0YSwgbWltZVR5cGUpIHtcbiAgICAgICAgYXNzZXJ0SWQoaWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5iaW5hcnkuc2F2ZUF1ZGlvKGlkLCBkYXRhLCBtaW1lVHlwZSk7XG4gICAgfVxuICAgIGFzeW5jIG9wZW5BdWRpbyhpZCwgcmFuZ2UpIHtcbiAgICAgICAgYXNzZXJ0SWQoaWQpO1xuICAgICAgICBjb25zdCBlcGlzb2RlID0gYXdhaXQgdGhpcy5tZXRhLmdldChpZCk7XG4gICAgICAgIGlmICghZXBpc29kZSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiB0aGlzLmJpbmFyeS5vcGVuQXVkaW8oaWQsIGVwaXNvZGUuYXVkaW9NaW1lVHlwZSA/PyBcImF1ZGlvL3dhdlwiLCByYW5nZSk7XG4gICAgfVxufVxubGV0IHN0b3JlID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdG9yZSgpIHtcbiAgICBpZiAoIXN0b3JlKSB7XG4gICAgICAgIGNvbnN0IGhhc1N1cGFiYXNlID0gQm9vbGVhbihwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwgJiYgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VDUkVUX0tFWSk7XG4gICAgICAgIGNvbnN0IGhhc0Jsb2IgPSBCb29sZWFuKHByb2Nlc3MuZW52LkJMT0JfUkVBRF9XUklURV9UT0tFTik7XG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5WRVJDRUwgJiYgKCFoYXNTdXBhYmFzZSB8fCAhaGFzQmxvYikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb2R1Y3Rpb24gcmVxdWlyZXMgU1VQQUJBU0VfVVJMICsgU1VQQUJBU0VfU0VDUkVUX0tFWSBhbmQgQkxPQl9SRUFEX1dSSVRFX1RPS0VOOyB0aGUgZmlsZXN5c3RlbSBmYWxsYmFjayBkb2VzIG5vdCB3b3JrIG9uIFZlcmNlbC5cIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGF0YVJvb3QgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgXCIuZGF0YVwiKTtcbiAgICAgICAgc3RvcmUgPSBuZXcgQ29tcG9zaXRlU3RvcmUoaGFzU3VwYWJhc2UgPyBuZXcgU3VwYWJhc2VNZXRhKCkgOiBuZXcgRnNNZXRhKHBhdGguam9pbihkYXRhUm9vdCwgXCJlcGlzb2Rlc1wiKSksIGhhc0Jsb2IgPyBuZXcgQmxvYkJpbmFyeSgpIDogbmV3IEZzQmluYXJ5KGRhdGFSb290KSk7XG4gICAgfVxuICAgIHJldHVybiBzdG9yZTtcbn1cbiIsICJpbXBvcnQgeyBleHRyYWN0VGV4dCwgZ2V0RG9jdW1lbnRQcm94eSB9IGZyb20gXCJ1bnBkZlwiO1xuZXhwb3J0IGNvbnN0IE1BWF9QREZfQllURVMgPSA0ICogMTAyNCAqIDEwMjQ7XG4vKiogU2l6ZS90eXBlIGdhdGUgZm9yIGFuIHVwbG9hZGVkIGZpbGUsIGJlZm9yZSBpdCBpcyByZWFkIGludG8gbWVtb3J5LiAqLyBleHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQZGZGaWxlKGZpbGUpIHtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgRmlsZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgICAgZXJyb3I6IFwiVXBsb2FkIGEgUERGIGluIHRoZSAnZmlsZScgZmllbGRcIlxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoZmlsZS5zaXplID4gTUFYX1BERl9CWVRFUykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgc3RhdHVzOiA0MTMsXG4gICAgICAgICAgICBlcnJvcjogXCJQREYgaXMgdG9vIGxhcmdlICg0IE1CIG1heClcIlxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBvazogdHJ1ZSxcbiAgICAgICAgZmlsZVxuICAgIH07XG59XG5leHBvcnQgZnVuY3Rpb24gbG9va3NMaWtlUGRmKGRhdGEsIGZpbGVuYW1lKSB7XG4gICAgY29uc3QgbWFnaWMgPSBkYXRhLmxlbmd0aCA+IDQgJiYgZGF0YVswXSA9PT0gMHgyNSAmJiBkYXRhWzFdID09PSAweDUwICYmIGRhdGFbMl0gPT09IDB4NDQgJiYgZGF0YVszXSA9PT0gMHg0NjtcbiAgICByZXR1cm4gbWFnaWMgfHwgZmlsZW5hbWUudG9Mb3dlckNhc2UoKS5lbmRzV2l0aChcIi5wZGZcIik7XG59XG5leHBvcnQgY29uc3QgTUFYX1VQTE9BRF9GSUxFUyA9IDU7XG4vLyBWYWxpZGF0ZXMgYW5kIGV4dHJhY3RzIG9uZSBvciBtb3JlIHVwbG9hZGVkIFBERnMgaW50byBjb21iaW5lZCBzb3VyY2UgdGV4dC5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkVXBsb2FkcyhlbnRyaWVzKSB7XG4gICAgY29uc3QgZmlsZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpe1xuICAgICAgICBpZiAoZW50cnkgaW5zdGFuY2VvZiBGaWxlICYmIGVudHJ5LnNpemUgPiAwKSBmaWxlcy5wdXNoKGVudHJ5KTtcbiAgICB9XG4gICAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICAgICAgICBlcnJvcjogXCJVcGxvYWQgYSBQREYgaW4gdGhlICdmaWxlJyBmaWVsZFwiXG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChmaWxlcy5sZW5ndGggPiBNQVhfVVBMT0FEX0ZJTEVTKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgICAgIGVycm9yOiBgVG9vIG1hbnkgZmlsZXMgKG1heCAke01BWF9VUExPQURfRklMRVN9KWBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgbG9hZGVkID0gW107XG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKXtcbiAgICAgICAgY29uc3QgY2hlY2sgPSB2YWxpZGF0ZVBkZkZpbGUoZmlsZSk7XG4gICAgICAgIGlmICghY2hlY2sub2spIHJldHVybiBjaGVjaztcbiAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGZpbGUuYXJyYXlCdWZmZXIoKSk7XG4gICAgICAgIGlmICghbG9va3NMaWtlUGRmKGRhdGEsIGZpbGUubmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHN0YXR1czogNDE1LFxuICAgICAgICAgICAgICAgIGVycm9yOiBcIk9ubHkgUERGIGZpbGVzIGFyZSBzdXBwb3J0ZWRcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBsb2FkZWQucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICBkYXRhXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IHRleHQsIHRvdGFsUGFnZXMgfSA9IGF3YWl0IGV4dHJhY3RNYW55KGxvYWRlZCk7XG4gICAgICAgIGNvbnN0IHNvdXJjZUZpbGVuYW1lID0gbG9hZGVkLmxlbmd0aCA9PT0gMSA/IGxvYWRlZFswXS5uYW1lIDogYCR7bG9hZGVkWzBdLm5hbWV9ICske2xvYWRlZC5sZW5ndGggLSAxfSBtb3JlYDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9rOiB0cnVlLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIGNoYXJzOiB0ZXh0Lmxlbmd0aCxcbiAgICAgICAgICAgIHRvdGFsUGFnZXMsXG4gICAgICAgICAgICBzb3VyY2VGaWxlbmFtZVxuICAgICAgICB9O1xuICAgIH0gY2F0Y2ggIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXR1czogNDIyLFxuICAgICAgICAgICAgZXJyb3I6IFwiQ291bGQgbm90IHJlYWQgb25lIG9mIHRoZXNlIFBERnMuIEl0IG1heSBiZSBzY2FubmVkIG9yIGNvcnJ1cHRlZC5cIlxuICAgICAgICB9O1xuICAgIH1cbn1cbi8vIEV4dHJhY3RzIGFuZCBjb25jYXRlbmF0ZXMgc2V2ZXJhbCBQREZzLCBsYWJlbGluZyBlYWNoIGRvY3VtZW50J3Mgc2VjdGlvbiBzb1xuLy8gdGhlIExMTS9yZWFkZXIga25vd3Mgd2hlcmUgb25lIGVuZHMgYW5kIHRoZSBuZXh0IGJlZ2lucy5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0TWFueShmaWxlcykge1xuICAgIGNvbnN0IHBhcnRzID0gW107XG4gICAgbGV0IHRvdGFsUGFnZXMgPSAwO1xuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcyl7XG4gICAgICAgIGNvbnN0IHsgdGV4dCwgdG90YWxQYWdlczogcGFnZXMgfSA9IGF3YWl0IGV4dHJhY3RQZGZUZXh0KG5ldyBVaW50OEFycmF5KGZpbGUuZGF0YSkpO1xuICAgICAgICB0b3RhbFBhZ2VzICs9IHBhZ2VzO1xuICAgICAgICBwYXJ0cy5wdXNoKGZpbGVzLmxlbmd0aCA+IDEgPyBgIyAke2ZpbGUubmFtZS5yZXBsYWNlKC9cXC5wZGYkL2ksIFwiXCIpfVxcblxcbiR7dGV4dH1gIDogdGV4dCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHRleHQ6IHBhcnRzLmpvaW4oXCJcXG5cXG5cXG5cIiksXG4gICAgICAgIHRvdGFsUGFnZXNcbiAgICB9O1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQZGZUZXh0KGRhdGEpIHtcbiAgICBjb25zdCBwZGYgPSBhd2FpdCBnZXREb2N1bWVudFByb3h5KGRhdGEpO1xuICAgIGNvbnN0IHsgdG90YWxQYWdlcywgdGV4dCB9ID0gYXdhaXQgZXh0cmFjdFRleHQocGRmLCB7XG4gICAgICAgIG1lcmdlUGFnZXM6IHRydWVcbiAgICB9KTtcbiAgICBjb25zdCBjbGVhbmVkID0gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHRleHQgY291bGQgYmUgZXh0cmFjdGVkIGZyb20gdGhpcyBQREYuIEl0IG1heSBiZSBhIHNjYW5uZWQgZG9jdW1lbnQgd2l0aG91dCBhIHRleHQgbGF5ZXIuXCIpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICB0b3RhbFBhZ2VzXG4gICAgfTtcbn1cbiIsICIvLyBDdXJhdGVkLCBBUEktdmFsaWRhdGVkIEdlbWluaSBwcmVidWlsdCB2b2ljZXMuXG5leHBvcnQgY29uc3QgVk9JQ0VTID0gW1xuICAgIHtcbiAgICAgICAgaWQ6IFwiS29yZVwiLFxuICAgICAgICBsYWJlbDogXCJLb3JlXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkZpcm0sIGNsZWFyXCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiUHVja1wiLFxuICAgICAgICBsYWJlbDogXCJQdWNrXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlVwYmVhdCwgbGl2ZWx5XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiRW5jZWxhZHVzXCIsXG4gICAgICAgIGxhYmVsOiBcIkVuY2VsYWR1c1wiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTb2Z0LCBicmVhdGh5XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiQ2hhcm9uXCIsXG4gICAgICAgIGxhYmVsOiBcIkNoYXJvblwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJEZWVwLCBpbmZvcm1hdGl2ZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiBcIkFvZWRlXCIsXG4gICAgICAgIGxhYmVsOiBcIkFvZWRlXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkJyZWV6eSwgd2FybVwiXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiBcIkxlZGFcIixcbiAgICAgICAgbGFiZWw6IFwiTGVkYVwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJZb3V0aGZ1bCwgYnJpZ2h0XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiWmVwaHlyXCIsXG4gICAgICAgIGxhYmVsOiBcIlplcGh5clwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJCcmlnaHQsIGNyaXNwXCJcbiAgICB9XG5dO1xuY29uc3QgVk9JQ0VfSURTID0gbmV3IFNldChWT0lDRVMubWFwKCh2KT0+di5pZCkpO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfSE9TVF9WT0lDRSA9IFwiS29yZVwiO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfR1VFU1RfVk9JQ0UgPSBcIlB1Y2tcIjtcbmV4cG9ydCBjb25zdCBERUZBVUxUX1JFQURFUl9WT0lDRSA9IFwiRW5jZWxhZHVzXCI7XG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZFZvaWNlKGlkKSB7XG4gICAgcmV0dXJuIFZPSUNFX0lEUy5oYXMoaWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVZvaWNlKGlkLCBmYWxsYmFjaykge1xuICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwic3RyaW5nXCIgJiYgVk9JQ0VfSURTLmhhcyhpZCkgPyBpZCA6IGZhbGxiYWNrO1xufVxuIiwgImltcG9ydCB7IERFRkFVTFRfR1VFU1RfVk9JQ0UsIERFRkFVTFRfSE9TVF9WT0lDRSwgREVGQVVMVF9SRUFERVJfVk9JQ0UsIG5vcm1hbGl6ZVZvaWNlIH0gZnJvbSBcIi4vdm9pY2VzXCI7XG5jb25zdCBMRU5HVEhTID0gW1xuICAgIFwic2hvcnRcIixcbiAgICBcInN0YW5kYXJkXCIsXG4gICAgXCJkZWVwXCJcbl07XG5jb25zdCBGT1JNQVRTID0gW1xuICAgIFwiZGlzY3Vzc2lvblwiLFxuICAgIFwiYnJpZWZcIixcbiAgICBcImRlYmF0ZVwiLFxuICAgIFwibGVjdHVyZVwiXG5dO1xuY29uc3QgQVVESUVOQ0VTID0gW1xuICAgIFwiYmVnaW5uZXJcIixcbiAgICBcImV4cGVydFwiXG5dO1xuLy8gU2luZ2xlLXZvaWNlIGNvbnZlcnNhdGlvbiBmb3JtYXRzIHNwZWFrIG9ubHkgaW4gdGhlIGhvc3Qgdm9pY2UuXG5leHBvcnQgY29uc3QgU0lOR0xFX1ZPSUNFX0ZPUk1BVFMgPSBbXG4gICAgXCJicmllZlwiLFxuICAgIFwibGVjdHVyZVwiXG5dO1xuZXhwb3J0IGNvbnN0IExFTkdUSF9CVURHRVRTID0ge1xuICAgIHNob3J0OiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiAyXzAwMCxcbiAgICAgICAgcmVhZENoYXJzOiAzMF8wMDAsXG4gICAgICAgIGFwcHJveE1pbnV0ZXM6IDNcbiAgICB9LFxuICAgIHN0YW5kYXJkOiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiA0XzUwMCxcbiAgICAgICAgcmVhZENoYXJzOiAxMDBfMDAwLFxuICAgICAgICBhcHByb3hNaW51dGVzOiA3XG4gICAgfSxcbiAgICBkZWVwOiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiA5XzAwMCxcbiAgICAgICAgcmVhZENoYXJzOiAyMDBfMDAwLFxuICAgICAgICBhcHByb3hNaW51dGVzOiAxNVxuICAgIH1cbn07XG5mdW5jdGlvbiBwaWNrKHZhbHVlLCBhbGxvd2VkLCBmYWxsYmFjaykge1xuICAgIHJldHVybiBhbGxvd2VkLmluY2x1ZGVzKHZhbHVlKSA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG4vKiogVmFsaWRhdGVzL25vcm1hbGl6ZXMgdW50cnVzdGVkIG9wdGlvbiBpbnB1dCBpbnRvIGEgY29tcGxldGUgRXBpc29kZU9wdGlvbnMuICovIGV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVPcHRpb25zKGlucHV0KSB7XG4gICAgY29uc3QgbyA9IGlucHV0ID8/IHt9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGxlbmd0aDogcGljayhvLmxlbmd0aCwgTEVOR1RIUywgXCJzdGFuZGFyZFwiKSxcbiAgICAgICAgZm9ybWF0OiBwaWNrKG8uZm9ybWF0LCBGT1JNQVRTLCBcImRpc2N1c3Npb25cIiksXG4gICAgICAgIGF1ZGllbmNlOiBwaWNrKG8uYXVkaWVuY2UsIEFVRElFTkNFUywgXCJiZWdpbm5lclwiKSxcbiAgICAgICAgaG9zdFZvaWNlOiBub3JtYWxpemVWb2ljZShvLmhvc3RWb2ljZSwgREVGQVVMVF9IT1NUX1ZPSUNFKSxcbiAgICAgICAgZ3Vlc3RWb2ljZTogbm9ybWFsaXplVm9pY2Uoby5ndWVzdFZvaWNlLCBERUZBVUxUX0dVRVNUX1ZPSUNFKSxcbiAgICAgICAgcmVhZGVyVm9pY2U6IG5vcm1hbGl6ZVZvaWNlKG8ucmVhZGVyVm9pY2UsIERFRkFVTFRfUkVBREVSX1ZPSUNFKSxcbiAgICAgICAgcmV2aWV3U2NyaXB0OiBvLnJldmlld1NjcmlwdCA9PT0gdHJ1ZVxuICAgIH07XG59XG5jb25zdCBNQVhfU0NSSVBUX0xJTkVTID0gNjAwO1xuY29uc3QgTUFYX0xJTkVfQ0hBUlMgPSA1XzAwMDtcbmV4cG9ydCBmdW5jdGlvbiBzY3JpcHRDaGFycyhzY3JpcHQpIHtcbiAgICByZXR1cm4gc2NyaXB0LmxpbmVzLnJlZHVjZSgobiwgbCk9Pm4gKyBsLnRleHQudHJpbSgpLmxlbmd0aCwgMCk7XG59XG4vKiogSG93IG11Y2ggYSB1c2VyIG1heSBncm93IGFuIGVkaXRlZCBzY3JpcHQgb3ZlciB0aGUgb3JpZ2luYWwgdGhleSBwYWlkIGZvcjpcbiAqICAxMCUgcHJvcG9ydGlvbmFsIGhlYWRyb29tIHBsdXMgYSBzbWFsbCBhYnNvbHV0ZSBhbGxvd2FuY2UgZm9yIGEgc2hvcnQgYWRkLiAqLyBleHBvcnQgZnVuY3Rpb24gZWRpdENoYXJCdWRnZXQob3JpZ2luYWxDaGFycykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG9yaWdpbmFsQ2hhcnMgKiAxLjEpICsgMjAwO1xufVxuLy8gVmFsaWRhdGVzIGEgdXNlci1lZGl0ZWQgc2NyaXB0IGFuZCBjYXBzIHRvdGFsIGxlbmd0aCBzbyBlZGl0aW5nIGNhbid0XG4vLyBpbmZsYXRlIFRUUyBjb3N0IGJleW9uZCB0aGUgc2NyaXB0IHRoZSB1c2VyIGFscmVhZHkgcGFpZCB0byBnZW5lcmF0ZS5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUVkaXRlZFNjcmlwdChpbnB1dCwgbWF4Q2hhcnMpIHtcbiAgICBjb25zdCByYXcgPSBpbnB1dDtcbiAgICBpZiAoIXJhdyB8fCAhQXJyYXkuaXNBcnJheShyYXcubGluZXMpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogXCJTY3JpcHQgbXVzdCBoYXZlIGEgbGluZXMgYXJyYXlcIlxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAocmF3LmxpbmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IFwiU2NyaXB0IGNhbm5vdCBiZSBlbXB0eVwiXG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChyYXcubGluZXMubGVuZ3RoID4gTUFYX1NDUklQVF9MSU5FUykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGBUb28gbWFueSBsaW5lcyAobWF4ICR7TUFYX1NDUklQVF9MSU5FU30pYFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBsaW5lcyA9IFtdO1xuICAgIGxldCB0b3RhbCA9IDA7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiByYXcubGluZXMpe1xuICAgICAgICBjb25zdCBsaW5lID0gZW50cnk7XG4gICAgICAgIGlmIChsaW5lLnNwZWFrZXIgIT09IFwiSE9TVFwiICYmIGxpbmUuc3BlYWtlciAhPT0gXCJHVUVTVFwiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogXCJFYWNoIGxpbmUgbmVlZHMgc3BlYWtlciBIT1NUIG9yIEdVRVNUXCJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBsaW5lLnRleHQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBcIkVhY2ggbGluZSBuZWVkcyB0ZXh0XCJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGxpbmUudGV4dC50cmltKCk7XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkgY29udGludWU7XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IE1BWF9MSU5FX0NIQVJTKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogXCJBIGxpbmUgaXMgdG9vIGxvbmdcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB0b3RhbCArPSB0ZXh0Lmxlbmd0aDtcbiAgICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgICAgICBzcGVha2VyOiBsaW5lLnNwZWFrZXIsXG4gICAgICAgICAgICB0ZXh0XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAobGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogXCJTY3JpcHQgY2Fubm90IGJlIGVtcHR5XCJcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHRvdGFsID4gbWF4Q2hhcnMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBcIkVkaXRlZCBzY3JpcHQgaXMgbG9uZ2VyIHRoYW4gdGhlIHZlcnNpb24geW91IGdlbmVyYXRlZFwiXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHRpdGxlID0gdHlwZW9mIHJhdy50aXRsZSA9PT0gXCJzdHJpbmdcIiAmJiByYXcudGl0bGUudHJpbSgpID8gcmF3LnRpdGxlLnRyaW0oKS5zbGljZSgwLCAyMDApIDogXCJVbnRpdGxlZCBlcGlzb2RlXCI7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IHRydWUsXG4gICAgICAgIHNjcmlwdDoge1xuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBsaW5lc1xuICAgICAgICB9XG4gICAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1NpbmdsZVZvaWNlRm9ybWF0KGZvcm1hdCkge1xuICAgIHJldHVybiBTSU5HTEVfVk9JQ0VfRk9STUFUUy5pbmNsdWRlcyhmb3JtYXQpO1xufVxuLyoqIFRoZSBjaGFyYWN0ZXIgYnVkZ2V0IHRoYXQgZHJpdmVzIGNyZWRpdCBjb3N0IGZvciBhIGdpdmVuIG1vZGUgKyBsZW5ndGguICovIGV4cG9ydCBmdW5jdGlvbiByZWFkQ2hhckJ1ZGdldChtb2RlLCBsZW5ndGgpIHtcbiAgICByZXR1cm4gbW9kZSA9PT0gXCJyZWFkaW5nXCIgPyBMRU5HVEhfQlVER0VUU1tsZW5ndGhdLnJlYWRDaGFycyA6IExFTkdUSF9CVURHRVRTW2xlbmd0aF0uc2NyaXB0Q2hhcnM7XG59XG4iLCAiaW1wb3J0IHsgeiB9IGZyb20gXCJ6b2RcIjtcbmltcG9ydCB7IGlzU2luZ2xlVm9pY2VGb3JtYXQsIExFTkdUSF9CVURHRVRTIH0gZnJvbSBcIi4uL29wdGlvbnNcIjtcbmNvbnN0IE1BWF9TT1VSQ0VfQ0hBUlMgPSAyMDBfMDAwO1xuY29uc3Qgc2NyaXB0U2NoZW1hID0gei5vYmplY3Qoe1xuICAgIHRpdGxlOiB6LnN0cmluZygpLmRlc2NyaWJlKFwiQSBzaG9ydCwgY2F0Y2h5IGVwaXNvZGUgdGl0bGUgYmFzZWQgb24gdGhlIGRvY3VtZW50XCIpLFxuICAgIGxpbmVzOiB6LmFycmF5KHoub2JqZWN0KHtcbiAgICAgICAgc3BlYWtlcjogei5lbnVtKFtcbiAgICAgICAgICAgIFwiSE9TVFwiLFxuICAgICAgICAgICAgXCJHVUVTVFwiXG4gICAgICAgIF0pLFxuICAgICAgICB0ZXh0OiB6LnN0cmluZygpXG4gICAgfSkpLmRlc2NyaWJlKFwiVGhlIGRpYWxvZ3VlLCBhbHRlcm5hdGluZyBuYXR1cmFsbHkgYmV0d2VlbiBzcGVha2Vyc1wiKVxufSk7XG5jb25zdCBGT1JNQVRfQlJJRUYgPSB7XG4gICAgZGlzY3Vzc2lvbjogXCJhIG5hdHVyYWwgdHdvLXBlcnNvbiBjb252ZXJzYXRpb24gYmV0d2VlbiBIT1NUIChjdXJpb3VzLCBhc2tzIHNoYXJwIHF1ZXN0aW9ucykgYW5kIEdVRVNUIChhbiBleHBlcnQgd2hvIGV4cGxhaW5zIHZpdmlkbHkgd2l0aCBhbmFsb2dpZXMpLiBTaG9ydCB0dXJucywgcmVhbCByZWFjdGlvbnMsIG5vIGxpc3RzLlwiLFxuICAgIGJyaWVmOiBcImEgdGlnaHQgc29sbyBicmllZmluZyBkZWxpdmVyZWQgZW50aXJlbHkgYnkgSE9TVCBcdTIwMTQgYSBzaW5nbGUgY29uZmlkZW50IG5hcnJhdG9yIHN1bW1hcml6aW5nIHRoZSBlc3NlbnRpYWxzLiBFdmVyeSBsaW5lIHVzZXMgc3BlYWtlciBIT1NULiBObyBzZWNvbmQgc3BlYWtlci5cIixcbiAgICBkZWJhdGU6IFwiYSBsaXZlbHkgZGViYXRlIGJldHdlZW4gSE9TVCBhbmQgR1VFU1Qgd2hvIHRha2Ugb3Bwb3NpbmcgcG9zaXRpb25zIG9uIHRoZSBkb2N1bWVudCdzIGtleSBjbGFpbXMsIGVhY2ggbWFraW5nIHRoZWlyIHN0cm9uZ2VzdCBjYXNlIGFuZCByZWJ1dHRpbmcgdGhlIG90aGVyLiBLZWVwIGl0IHNoYXJwIGJ1dCBmYWlyLlwiLFxuICAgIGxlY3R1cmU6IFwiYW4gaW4tZGVwdGggZXhwZXJ0IGxlY3R1cmUgZGVsaXZlcmVkIGVudGlyZWx5IGJ5IEhPU1QgXHUyMDE0IGEga25vd2xlZGdlYWJsZSB0ZWFjaGVyIHdhbGtpbmcgdGhyb3VnaCB0aGUgbWF0ZXJpYWwgd2l0aCByaWdvciBhbmQgc3RydWN0dXJlLCB0aGUgZGVwdGggb2YgYW4gODAsMDAwIEhvdXJzIGJyaWVmaW5nLiBFdmVyeSBsaW5lIHVzZXMgc3BlYWtlciBIT1NULiBObyBzZWNvbmQgc3BlYWtlci5cIlxufTtcbmZ1bmN0aW9uIHN5c3RlbVByb21wdChvcHRpb25zKSB7XG4gICAgY29uc3QgYnVkZ2V0ID0gTEVOR1RIX0JVREdFVFNbb3B0aW9ucy5sZW5ndGhdO1xuICAgIGNvbnN0IGF1ZGllbmNlID0gb3B0aW9ucy5hdWRpZW5jZSA9PT0gXCJleHBlcnRcIiA/IFwiQXNzdW1lIGFuIGV4cGVydCBsaXN0ZW5lcjsgdXNlIHByZWNpc2UgdGVybWlub2xvZ3kgYW5kIGdvIGRlZXAuXCIgOiBcIkFzc3VtZSBhIGN1cmlvdXMgbmV3Y29tZXI7IGV4cGxhaW4gamFyZ29uIGluIHBsYWluIGxhbmd1YWdlLlwiO1xuICAgIHJldHVybiBgWW91IGFyZSBhIHdvcmxkLWNsYXNzIHBvZGNhc3QgcHJvZHVjZXIuIFR1cm4gZG9jdW1lbnRzIGludG8gJHtGT1JNQVRfQlJJRUZbb3B0aW9ucy5mb3JtYXRdfVxuXG5SdWxlczpcbi0gT3BlbiBieSB3ZWxjb21pbmcgbGlzdGVuZXJzIGFuZCBuYW1pbmcgdGhlIHRvcGljIGluIG9uZSBvciB0d28gc2VudGVuY2VzLlxuLSBDb3ZlciB0aGUgZG9jdW1lbnQncyBtb3N0IGltcG9ydGFudCBpZGVhcyBhY2N1cmF0ZWx5OyBkbyBub3QgaW52ZW50IGZhY3RzLlxuLSAke2F1ZGllbmNlfVxuLSBDbG9zZSB3aXRoIHRoZSBzaW5nbGUgYmlnZ2VzdCB0YWtlYXdheSBhbmQgYSBzaWduLW9mZi5cbi0gVG90YWwgc3Bva2VuIHRleHQgbXVzdCBzdGF5IHVuZGVyICR7YnVkZ2V0LnNjcmlwdENoYXJzfSBjaGFyYWN0ZXJzIChhYm91dCAke2J1ZGdldC5hcHByb3hNaW51dGVzfSBtaW51dGVzKS5gO1xufVxubGV0IHNjcmlwdEZlbGxCYWNrID0gZmFsc2U7XG5leHBvcnQgZnVuY3Rpb24gc2NyaXB0UHJvdmlkZXJOYW1lKCkge1xuICAgIGlmIChzY3JpcHRGZWxsQmFjaykgcmV0dXJuIFwibW9jayAoZ2F0ZXdheSB1bmF2YWlsYWJsZSlcIjtcbiAgICByZXR1cm4gaGFzU2NyaXB0Q3JlZGVudGlhbHMoKSA/IHByb2Nlc3MuZW52LlBPRENBU1RfU0NSSVBUX01PREVMID8/IFwiYW50aHJvcGljL2NsYXVkZS1zb25uZXQtNVwiIDogXCJtb2NrXCI7XG59XG5mdW5jdGlvbiBoYXNTY3JpcHRDcmVkZW50aWFscygpIHtcbiAgICByZXR1cm4gQm9vbGVhbihwcm9jZXNzLmVudi5BSV9HQVRFV0FZX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuVkVSQ0VMX09JRENfVE9LRU4gfHwgcHJvY2Vzcy5lbnYuVkVSQ0VMKTtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVBvZGNhc3RTY3JpcHQoc291cmNlVGV4dCwgc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB0ZXh0ID0gc291cmNlVGV4dC5zbGljZSgwLCBNQVhfU09VUkNFX0NIQVJTKTtcbiAgICBpZiAoIWhhc1NjcmlwdENyZWRlbnRpYWxzKCkpIHtcbiAgICAgICAgcmV0dXJuIG1vY2tTY3JpcHQodGV4dCwgc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGdlbmVyYXRlVGV4dCwgT3V0cHV0IH0gPSBhd2FpdCBpbXBvcnQoXCJhaVwiKTtcbiAgICAgICAgY29uc3QgeyBvdXRwdXQgfSA9IGF3YWl0IGdlbmVyYXRlVGV4dCh7XG4gICAgICAgICAgICBtb2RlbDogc2NyaXB0UHJvdmlkZXJOYW1lKCksXG4gICAgICAgICAgICBzeXN0ZW06IHN5c3RlbVByb21wdChvcHRpb25zKSxcbiAgICAgICAgICAgIG91dHB1dDogT3V0cHV0Lm9iamVjdCh7XG4gICAgICAgICAgICAgICAgc2NoZW1hOiBzY3JpcHRTY2hlbWFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcHJvbXB0OiBgVHVybiB0aGUgZm9sbG93aW5nIGRvY3VtZW50IChcIiR7c291cmNlRmlsZW5hbWV9XCIpIGludG8gYSBwb2RjYXN0IHNjcmlwdC5cXG5cXG48ZG9jdW1lbnQ+XFxuJHt0ZXh0fVxcbjwvZG9jdW1lbnQ+YFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc2NyaXB0ID0gb3V0cHV0O1xuICAgICAgICAvLyBTaW5nbGUtdm9pY2UgZm9ybWF0cyBtdXN0IG5vdCBjb250YWluIGEgR1VFU1Qgc3BlYWtlci5cbiAgICAgICAgaWYgKGlzU2luZ2xlVm9pY2VGb3JtYXQob3B0aW9ucy5mb3JtYXQpKSB7XG4gICAgICAgICAgICBzY3JpcHQubGluZXMgPSBzY3JpcHQubGluZXMubWFwKChsKT0+KHtcbiAgICAgICAgICAgICAgICAgICAgLi4ubCxcbiAgICAgICAgICAgICAgICAgICAgc3BlYWtlcjogXCJIT1NUXCJcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjcmlwdDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlNjcmlwdCBnZW5lcmF0aW9uIHZpYSBBSSBHYXRld2F5IGZhaWxlZCwgZmFsbGluZyBiYWNrIHRvIG1vY2s6XCIsIGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBlcnIpO1xuICAgICAgICBzY3JpcHRGZWxsQmFjayA9IHRydWU7XG4gICAgICAgIHJldHVybiBtb2NrU2NyaXB0KHRleHQsIHNvdXJjZUZpbGVuYW1lLCBvcHRpb25zKTtcbiAgICB9XG59XG4vLyBcIlJlYWQgYWxvdWRcIiBtb2RlOiBubyBMTE0sIG5vIHN1bW1hcml6aW5nIFx1MjAxNCB0aGUgZXh0cmFjdGVkIHRleHQgYmVjb21lcyB0aGVcbi8vIHNjcmlwdCB2ZXJiYXRpbSwgY2h1bmtlZCBpbnRvIG5hcnJhdG9yIGxpbmVzIHNvIFRUUyByZXF1ZXN0cyBzdGF5IHNtYWxsIGFuZFxuLy8gdGhlIHRyYW5zY3JpcHQgc3RheXMgc2Nyb2xsYWJsZS5cbmNvbnN0IFJFQURfQ0hVTktfQ0hBUlMgPSA5MDA7XG5leHBvcnQgZnVuY3Rpb24gdmVyYmF0aW1TY3JpcHQoc291cmNlVGV4dCwgc291cmNlRmlsZW5hbWUsIG1heENoYXJzKSB7XG4gICAgY29uc3QgdGl0bGUgPSBzb3VyY2VGaWxlbmFtZS5yZXBsYWNlKC9cXC5wZGYkL2ksIFwiXCIpLnJlcGxhY2UoL1stX10rL2csIFwiIFwiKTtcbiAgICBjb25zdCB0ZXh0ID0gc291cmNlVGV4dC5zbGljZSgwLCBtYXhDaGFycyk7XG4gICAgY29uc3Qgc2VudGVuY2VzID0gdGV4dC5zcGxpdCgvKD88PVsuIT9dKVxccysvKTtcbiAgICBjb25zdCBsaW5lcyA9IFtdO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHNlbnRlbmNlIG9mIHNlbnRlbmNlcyl7XG4gICAgICAgIGlmIChjdXJyZW50ICYmIGN1cnJlbnQubGVuZ3RoICsgc2VudGVuY2UubGVuZ3RoICsgMSA+IFJFQURfQ0hVTktfQ0hBUlMpIHtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goe1xuICAgICAgICAgICAgICAgIHNwZWFrZXI6IFwiSE9TVFwiLFxuICAgICAgICAgICAgICAgIHRleHQ6IGN1cnJlbnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3VycmVudCA9IHNlbnRlbmNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQgPyBgJHtjdXJyZW50fSAke3NlbnRlbmNlfWAgOiBzZW50ZW5jZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoY3VycmVudCkgbGluZXMucHVzaCh7XG4gICAgICAgIHNwZWFrZXI6IFwiSE9TVFwiLFxuICAgICAgICB0ZXh0OiBjdXJyZW50XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGxpbmVzXG4gICAgfTtcbn1cbmZ1bmN0aW9uIG1vY2tTY3JpcHQodGV4dCwgc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBzaW5nbGUgPSBpc1NpbmdsZVZvaWNlRm9ybWF0KG9wdGlvbnMuZm9ybWF0KTtcbiAgICBjb25zdCBhbGwgPSB0ZXh0LnNwbGl0KC8oPzw9Wy4hP10pXFxzKy8pLmZpbHRlcigocyk9PnMubGVuZ3RoID4gMjApO1xuICAgIGNvbnN0IHRhcmdldCA9IE1hdGgubWF4KDgsIE1hdGgucm91bmQoTEVOR1RIX0JVREdFVFNbb3B0aW9ucy5sZW5ndGhdLnNjcmlwdENoYXJzIC8gMTEwKSk7XG4gICAgY29uc3Qgc3RlcCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3IoYWxsLmxlbmd0aCAvIHRhcmdldCkpO1xuICAgIGNvbnN0IHNlbnRlbmNlcyA9IGFsbC5maWx0ZXIoKF8sIGkpPT5pICUgc3RlcCA9PT0gMCkuc2xpY2UoMCwgdGFyZ2V0KTtcbiAgICBjb25zdCB0aXRsZSA9IHNvdXJjZUZpbGVuYW1lLnJlcGxhY2UoL1xcLnBkZiQvaSwgXCJcIikucmVwbGFjZSgvWy1fXSsvZywgXCIgXCIpO1xuICAgIGNvbnN0IGxpbmVzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgICBzcGVha2VyOiBcIkhPU1RcIixcbiAgICAgICAgICAgIHRleHQ6IGBXZWxjb21lIGJhY2sgdG8gdGhlIHNob3cuIFRvZGF5IHdlJ3JlIGRpZ2dpbmcgaW50byAke3RpdGxlfS5gXG4gICAgICAgIH1cbiAgICBdO1xuICAgIGlmICghc2luZ2xlKSB7XG4gICAgICAgIGxpbmVzLnB1c2goe1xuICAgICAgICAgICAgc3BlYWtlcjogXCJHVUVTVFwiLFxuICAgICAgICAgICAgdGV4dDogXCJUaGFua3MgZm9yIGhhdmluZyBtZS4gVGhlcmUncyBhIGxvdCBpbiBoZXJlLlwiXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzZW50ZW5jZXMuZm9yRWFjaCgoc2VudGVuY2UsIGkpPT57XG4gICAgICAgIGxpbmVzLnB1c2goe1xuICAgICAgICAgICAgc3BlYWtlcjogc2luZ2xlIHx8IGkgJSAyID09PSAxID8gXCJIT1NUXCIgOiBcIkdVRVNUXCIsXG4gICAgICAgICAgICB0ZXh0OiBzZW50ZW5jZS50cmltKClcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgbGluZXMucHVzaCh7XG4gICAgICAgIHNwZWFrZXI6IFwiSE9TVFwiLFxuICAgICAgICB0ZXh0OiBcIlRoYXQncyB0aGUgYmlnIHBpY3R1cmUuIFRoYW5rcyBmb3IgbGlzdGVuaW5nLCBhbmQgc2VlIHlvdSBuZXh0IHRpbWUuXCJcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbGluZXNcbiAgICB9O1xufVxuIiwgImNvbnN0IEJZVEVTX1BFUl9TQU1QTEUgPSAyO1xuZXhwb3J0IGZ1bmN0aW9uIHBjbTE2VG9XYXYocGNtLCBzYW1wbGVSYXRlLCBjaGFubmVscyA9IDEpIHtcbiAgICBjb25zdCBoZWFkZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoaGVhZGVyKTtcbiAgICBjb25zdCBieXRlUmF0ZSA9IHNhbXBsZVJhdGUgKiBjaGFubmVscyAqIEJZVEVTX1BFUl9TQU1QTEU7XG4gICAgd3JpdGVBc2NpaSh2aWV3LCAwLCBcIlJJRkZcIik7XG4gICAgdmlldy5zZXRVaW50MzIoNCwgMzYgKyBwY20uYnl0ZUxlbmd0aCwgdHJ1ZSk7XG4gICAgd3JpdGVBc2NpaSh2aWV3LCA4LCBcIldBVkVcIik7XG4gICAgd3JpdGVBc2NpaSh2aWV3LCAxMiwgXCJmbXQgXCIpO1xuICAgIHZpZXcuc2V0VWludDMyKDE2LCAxNiwgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MTYoMjAsIDEsIHRydWUpO1xuICAgIHZpZXcuc2V0VWludDE2KDIyLCBjaGFubmVscywgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MzIoMjQsIHNhbXBsZVJhdGUsIHRydWUpO1xuICAgIHZpZXcuc2V0VWludDMyKDI4LCBieXRlUmF0ZSwgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MTYoMzIsIGNoYW5uZWxzICogQllURVNfUEVSX1NBTVBMRSwgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MTYoMzQsIDE2LCB0cnVlKTtcbiAgICB3cml0ZUFzY2lpKHZpZXcsIDM2LCBcImRhdGFcIik7XG4gICAgdmlldy5zZXRVaW50MzIoNDAsIHBjbS5ieXRlTGVuZ3RoLCB0cnVlKTtcbiAgICBjb25zdCB3YXYgPSBuZXcgVWludDhBcnJheSg0NCArIHBjbS5ieXRlTGVuZ3RoKTtcbiAgICB3YXYuc2V0KG5ldyBVaW50OEFycmF5KGhlYWRlciksIDApO1xuICAgIHdhdi5zZXQocGNtLCA0NCk7XG4gICAgcmV0dXJuIHdhdjtcbn1cbmV4cG9ydCBmdW5jdGlvbiB3YXZEdXJhdGlvblNlY29uZHMocGNtQnl0ZUxlbmd0aCwgc2FtcGxlUmF0ZSwgY2hhbm5lbHMgPSAxKSB7XG4gICAgcmV0dXJuIHBjbUJ5dGVMZW5ndGggLyAoc2FtcGxlUmF0ZSAqIGNoYW5uZWxzICogQllURVNfUEVSX1NBTVBMRSk7XG59XG5mdW5jdGlvbiB3cml0ZUFzY2lpKHZpZXcsIG9mZnNldCwgdGV4dCkge1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQgKyBpLCB0ZXh0LmNoYXJDb2RlQXQoaSkpO1xuICAgIH1cbn1cbiIsICJpbXBvcnQgeyBwY20xNlRvV2F2LCB3YXZEdXJhdGlvblNlY29uZHMgfSBmcm9tIFwiLi93YXZcIjtcbi8vIDY0IGticHMgbW9ubyBpcyB0cmFuc3BhcmVudCBmb3Igc3BlZWNoIGFuZCB+Nnggc21hbGxlciB0aGFuIDE2LWJpdCBXQVYuXG5jb25zdCBNUDNfQklUUkFURV9LQlBTID0gNjQ7XG5jb25zdCBTQU1QTEVTX1BFUl9GUkFNRSA9IDExNTI7XG5hc3luYyBmdW5jdGlvbiBlbmNvZGVNcDMocGNtLCBzYW1wbGVSYXRlKSB7XG4gICAgY29uc3QgeyBNcDNFbmNvZGVyIH0gPSBhd2FpdCBpbXBvcnQoXCJAYnJlZXp5c3RhY2svbGFtZWpzXCIpO1xuICAgIGNvbnN0IGVuY29kZXIgPSBuZXcgTXAzRW5jb2RlcigxLCBzYW1wbGVSYXRlLCBNUDNfQklUUkFURV9LQlBTKTtcbiAgICBjb25zdCBzYW1wbGVzID0gbmV3IEludDE2QXJyYXkocGNtLmJ1ZmZlciwgcGNtLmJ5dGVPZmZzZXQsIE1hdGguZmxvb3IocGNtLmJ5dGVMZW5ndGggLyAyKSk7XG4gICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHNhbXBsZXMubGVuZ3RoOyBpICs9IFNBTVBMRVNfUEVSX0ZSQU1FKXtcbiAgICAgICAgY29uc3QgYmxvY2sgPSBzYW1wbGVzLnN1YmFycmF5KGksIGkgKyBTQU1QTEVTX1BFUl9GUkFNRSk7XG4gICAgICAgIGNvbnN0IGZyYW1lID0gZW5jb2Rlci5lbmNvZGVCdWZmZXIoYmxvY2spO1xuICAgICAgICBpZiAoZnJhbWUubGVuZ3RoID4gMCkgY2h1bmtzLnB1c2gobmV3IFVpbnQ4QXJyYXkoZnJhbWUpKTtcbiAgICB9XG4gICAgY29uc3QgdGFpbCA9IGVuY29kZXIuZmx1c2goKTtcbiAgICBpZiAodGFpbC5sZW5ndGggPiAwKSBjaHVua3MucHVzaChuZXcgVWludDhBcnJheSh0YWlsKSk7XG4gICAgY29uc3QgdG90YWwgPSBjaHVua3MucmVkdWNlKChuLCBjKT0+biArIGMuYnl0ZUxlbmd0aCwgMCk7XG4gICAgY29uc3Qgb3V0ID0gbmV3IFVpbnQ4QXJyYXkodG90YWwpO1xuICAgIGxldCBvZmZzZXQgPSAwO1xuICAgIGZvciAoY29uc3QgYyBvZiBjaHVua3Mpe1xuICAgICAgICBvdXQuc2V0KGMsIG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSBjLmJ5dGVMZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG4vKiogRW5jb2RlcyAxNi1iaXQgbW9ubyBQQ00gdG8gTVAzLCBmYWxsaW5nIGJhY2sgdG8gV0FWIGlmIGVuY29kaW5nIGZhaWxzLiAqLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gZmluYWxpemVBdWRpbyhwY20sIHNhbXBsZVJhdGUpIHtcbiAgICBjb25zdCBkdXJhdGlvblNlY29uZHMgPSB3YXZEdXJhdGlvblNlY29uZHMocGNtLmJ5dGVMZW5ndGgsIHNhbXBsZVJhdGUpO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGF1ZGlvID0gYXdhaXQgZW5jb2RlTXAzKHBjbSwgc2FtcGxlUmF0ZSk7XG4gICAgICAgIGlmIChhdWRpby5ieXRlTGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhdWRpbyxcbiAgICAgICAgICAgICAgICBtaW1lVHlwZTogXCJhdWRpby9tcGVnXCIsXG4gICAgICAgICAgICAgICAgZHVyYXRpb25TZWNvbmRzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNUDMgZW5jb2RlIGZhaWxlZCwgZmFsbGluZyBiYWNrIHRvIFdBVjpcIiwgZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXVkaW86IHBjbTE2VG9XYXYocGNtLCBzYW1wbGVSYXRlKSxcbiAgICAgICAgbWltZVR5cGU6IFwiYXVkaW8vd2F2XCIsXG4gICAgICAgIGR1cmF0aW9uU2Vjb25kc1xuICAgIH07XG59XG4iLCAiaW1wb3J0IHsgZmluYWxpemVBdWRpbyB9IGZyb20gXCIuLi9hdWRpby9tcDNcIjtcbmltcG9ydCB7IGlzU2luZ2xlVm9pY2VGb3JtYXQgfSBmcm9tIFwiLi4vb3B0aW9uc1wiO1xuaW1wb3J0IHsgREVGQVVMVF9HVUVTVF9WT0lDRSwgREVGQVVMVF9IT1NUX1ZPSUNFLCBERUZBVUxUX1JFQURFUl9WT0lDRSB9IGZyb20gXCIuLi92b2ljZXNcIjtcbmNvbnN0IEdFTUlOSV9TQU1QTEVfUkFURSA9IDI0XzAwMDtcbmNvbnN0IEdFTUlOSV9UVFNfTU9ERUwgPSBwcm9jZXNzLmVudi5QT0RDQVNUX1RUU19NT0RFTCA/PyBcImdlbWluaS0yLjUtZmxhc2gtcHJldmlldy10dHNcIjtcbmNvbnN0IFNJTkdMRV9UVFNfQ0hVTktfQ0hBUlMgPSAzXzUwMDtcbmZ1bmN0aW9uIGdlbWluaUFwaUtleSgpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuR09PR0xFX0dFTkVSQVRJVkVfQUlfQVBJX0tFWTtcbn1cbmV4cG9ydCBmdW5jdGlvbiB0dHNQcm92aWRlck5hbWUoKSB7XG4gICAgcmV0dXJuIGdlbWluaUFwaUtleSgpID8gR0VNSU5JX1RUU19NT0RFTCA6IFwibW9ja1wiO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN5bnRoZXNpemVEaWFsb2d1ZShzY3JpcHQsIG1vZGUgPSBcImNvbnZlcnNhdGlvblwiLCBvcHRpb25zKSB7XG4gICAgaWYgKCFnZW1pbmlBcGlLZXkoKSkgcmV0dXJuIGZpbmFsaXplQXVkaW8oLi4ubW9ja1BjbShzY3JpcHQpKTtcbiAgICBjb25zdCByZWFkZXJWb2ljZSA9IG9wdGlvbnM/LnJlYWRlclZvaWNlID8/IERFRkFVTFRfUkVBREVSX1ZPSUNFO1xuICAgIGNvbnN0IGhvc3RWb2ljZSA9IG9wdGlvbnM/Lmhvc3RWb2ljZSA/PyBERUZBVUxUX0hPU1RfVk9JQ0U7XG4gICAgY29uc3QgZ3Vlc3RWb2ljZSA9IG9wdGlvbnM/Lmd1ZXN0Vm9pY2UgPz8gREVGQVVMVF9HVUVTVF9WT0lDRTtcbiAgICBpZiAobW9kZSA9PT0gXCJyZWFkaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIGdlbWluaVNpbmdsZVZvaWNlKHNjcmlwdCwgcmVhZGVyVm9pY2UsIFwiUmVhZCB0aGUgZm9sbG93aW5nIHRleHQgYWxvdWQgaW4gYSBjYWxtLCB3YXJtLCBzb290aGluZyB2b2ljZSBhdCBhIHJlbGF4ZWQgcGFjZTpcIik7XG4gICAgfVxuICAgIGlmIChvcHRpb25zICYmIGlzU2luZ2xlVm9pY2VGb3JtYXQob3B0aW9ucy5mb3JtYXQpKSB7XG4gICAgICAgIHJldHVybiBnZW1pbmlTaW5nbGVWb2ljZShzY3JpcHQsIGhvc3RWb2ljZSwgXCJOYXJyYXRlIHRoZSBmb2xsb3dpbmcgaW4gYSBjbGVhciwgZW5nYWdpbmcgdm9pY2U6XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZ2VtaW5pVHRzKHNjcmlwdCwgaG9zdFZvaWNlLCBndWVzdFZvaWNlKTtcbn1cbi8vIE9uZSB2b2ljZSwgY2h1bmtlZCB0byBrZWVwIGVhY2ggcmVxdWVzdCBzbWFsbDsgUENNIGNodW5rcyBzaGFyZSBhIHNhbXBsZVxuLy8gcmF0ZSBhbmQgY29uY2F0ZW5hdGUgY2xlYW5seS4gVXNlZCBieSByZWFkLWFsb3VkIGFuZCBzaW5nbGUtdm9pY2UgZm9ybWF0cy5cbmFzeW5jIGZ1bmN0aW9uIGdlbWluaVNpbmdsZVZvaWNlKHNjcmlwdCwgdm9pY2VOYW1lLCBpbnN0cnVjdGlvbikge1xuICAgIGNvbnN0IGNodW5rcyA9IFtdO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2Ygc2NyaXB0LmxpbmVzKXtcbiAgICAgICAgaWYgKGN1cnJlbnQgJiYgY3VycmVudC5sZW5ndGggKyBsaW5lLnRleHQubGVuZ3RoICsgMSA+IFNJTkdMRV9UVFNfQ0hVTktfQ0hBUlMpIHtcbiAgICAgICAgICAgIGNodW5rcy5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgICAgY3VycmVudCA9IGxpbmUudGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH1cXG4ke2xpbmUudGV4dH1gIDogbGluZS50ZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjdXJyZW50KSBjaHVua3MucHVzaChjdXJyZW50KTtcbiAgICBjb25zdCBwY21QYXJ0cyA9IFtdO1xuICAgIGxldCBzYW1wbGVSYXRlID0gR0VNSU5JX1NBTVBMRV9SQVRFO1xuICAgIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKXtcbiAgICAgICAgY29uc3QgcGFydCA9IGF3YWl0IGdlbWluaUdlbmVyYXRlKGAke2luc3RydWN0aW9ufVxcbiR7Y2h1bmt9YCwge1xuICAgICAgICAgICAgdm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICBwcmVidWlsdFZvaWNlQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgIHZvaWNlTmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHBjbVBhcnRzLnB1c2gocGFydC5wY20pO1xuICAgICAgICBzYW1wbGVSYXRlID0gcGFydC5zYW1wbGVSYXRlO1xuICAgIH1cbiAgICBjb25zdCBwY20gPSBuZXcgVWludDhBcnJheShCdWZmZXIuY29uY2F0KHBjbVBhcnRzLm1hcCgocCk9PkJ1ZmZlci5mcm9tKHApKSkpO1xuICAgIHJldHVybiBmaW5hbGl6ZUF1ZGlvKHBjbSwgc2FtcGxlUmF0ZSk7XG59XG5hc3luYyBmdW5jdGlvbiBnZW1pbmlUdHMoc2NyaXB0LCBob3N0Vm9pY2UsIGd1ZXN0Vm9pY2UpIHtcbiAgICBjb25zdCB0cmFuc2NyaXB0ID0gc2NyaXB0LmxpbmVzLm1hcCgobGluZSk9PmAke2xpbmUuc3BlYWtlciA9PT0gXCJIT1NUXCIgPyBcIkhvc3RcIiA6IFwiR3Vlc3RcIn06ICR7bGluZS50ZXh0fWApLmpvaW4oXCJcXG5cIik7XG4gICAgY29uc3QgeyBwY20sIHNhbXBsZVJhdGUgfSA9IGF3YWl0IGdlbWluaUdlbmVyYXRlKGBUVFMgdGhlIGZvbGxvd2luZyBwb2RjYXN0IGNvbnZlcnNhdGlvbiBiZXR3ZWVuIEhvc3QgYW5kIEd1ZXN0OlxcbiR7dHJhbnNjcmlwdH1gLCB7XG4gICAgICAgIG11bHRpU3BlYWtlclZvaWNlQ29uZmlnOiB7XG4gICAgICAgICAgICBzcGVha2VyVm9pY2VDb25maWdzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzcGVha2VyOiBcIkhvc3RcIixcbiAgICAgICAgICAgICAgICAgICAgdm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWJ1aWx0Vm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2ljZU5hbWU6IGhvc3RWb2ljZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNwZWFrZXI6IFwiR3Vlc3RcIixcbiAgICAgICAgICAgICAgICAgICAgdm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWJ1aWx0Vm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2ljZU5hbWU6IGd1ZXN0Vm9pY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBmaW5hbGl6ZUF1ZGlvKHBjbSwgc2FtcGxlUmF0ZSk7XG59XG5hc3luYyBmdW5jdGlvbiBnZW1pbmlHZW5lcmF0ZSh0ZXh0LCBzcGVlY2hDb25maWcpIHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy8ke0dFTUlOSV9UVFNfTU9ERUx9OmdlbmVyYXRlQ29udGVudGAsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICBcIngtZ29vZy1hcGkta2V5XCI6IGdlbWluaUFwaUtleSgpXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0czogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBnZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VNb2RhbGl0aWVzOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiQVVESU9cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgc3BlZWNoQ29uZmlnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSk7XG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgY29uc3QgYm9keSA9IChhd2FpdCByZXMudGV4dCgpKS5zbGljZSgwLCAyMDApO1xuICAgICAgICBjb25zb2xlLmVycm9yKGBHZW1pbmkgVFRTIGVycm9yICR7cmVzLnN0YXR1c306ICR7Ym9keX1gKTtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBTcGVlY2ggc3ludGhlc2lzIGZhaWxlZCAoR2VtaW5pIHJldHVybmVkICR7cmVzLnN0YXR1c30pYDtcbiAgICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQyOSB8fCByZXMuc3RhdHVzID49IDUwMCkge1xuICAgICAgICAgICAgY29uc3QgeyBSZXRyeWFibGVFcnJvciB9ID0gYXdhaXQgaW1wb3J0KFwid29ya2Zsb3dcIik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmV0cnlhYmxlRXJyb3IobWVzc2FnZSwge1xuICAgICAgICAgICAgICAgIHJldHJ5QWZ0ZXI6IFwiMzBzXCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgRmF0YWxFcnJvciB9ID0gYXdhaXQgaW1wb3J0KFwid29ya2Zsb3dcIik7XG4gICAgICAgIHRocm93IG5ldyBGYXRhbEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICBjb25zdCBwYXJ0cyA9IGpzb24uY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uZmlsdGVyKChwKT0+cC5pbmxpbmVEYXRhPy5kYXRhKSA/PyBbXTtcbiAgICBpZiAocGFydHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnN0IHsgRmF0YWxFcnJvciB9ID0gYXdhaXQgaW1wb3J0KFwid29ya2Zsb3dcIik7XG4gICAgICAgIHRocm93IG5ldyBGYXRhbEVycm9yKFwiU3BlZWNoIHN5bnRoZXNpcyByZXR1cm5lZCBubyBhdWRpbyBkYXRhXCIpO1xuICAgIH1cbiAgICAvLyBMb25nIHRyYW5zY3JpcHRzIGNvbWUgYmFjayBhcyBtdWx0aXBsZSBpbmxpbmVEYXRhIFBDTSBjaHVua3MuXG4gICAgY29uc3QgcGNtID0gbmV3IFVpbnQ4QXJyYXkoQnVmZmVyLmNvbmNhdChwYXJ0cy5tYXAoKHApPT5CdWZmZXIuZnJvbShwLmlubGluZURhdGEuZGF0YSwgXCJiYXNlNjRcIikpKSk7XG4gICAgY29uc3QgcmF0ZU1hdGNoID0gL3JhdGU9KFxcZCspLy5leGVjKHBhcnRzWzBdLmlubGluZURhdGE/Lm1pbWVUeXBlID8/IFwiXCIpO1xuICAgIGNvbnN0IHNhbXBsZVJhdGUgPSByYXRlTWF0Y2ggPyBwYXJzZUludChyYXRlTWF0Y2hbMV0sIDEwKSA6IEdFTUlOSV9TQU1QTEVfUkFURTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwY20sXG4gICAgICAgIHNhbXBsZVJhdGVcbiAgICB9O1xufVxuLy8gU3BlZWNoLXBhY2VkIHRvbmVzIChkaXN0aW5jdCBwaXRjaCBwZXIgc3BlYWtlcikgc28gdGhlIGZ1bGwgcGlwZWxpbmUgYW5kXG4vLyBwbGF5ZXIgYXJlIHRlc3RhYmxlIHdpdGhvdXQgYW55IFRUUyBjcmVkZW50aWFscy5cbmZ1bmN0aW9uIG1vY2tQY20oc2NyaXB0KSB7XG4gICAgY29uc3Qgc2FtcGxlUmF0ZSA9IDI0XzAwMDtcbiAgICBjb25zdCB3b3JkU2Vjb25kcyA9IDAuMjI7XG4gICAgY29uc3QgbGluZUdhcFNlY29uZHMgPSAwLjQ7XG4gICAgY29uc3QgbWF4U2Vjb25kcyA9IDEyMDtcbiAgICBsZXQgdG90YWxTZWNvbmRzID0gMDtcbiAgICBjb25zdCBzZWdtZW50cyA9IFtdO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBzY3JpcHQubGluZXMpe1xuICAgICAgICBjb25zdCB3b3JkcyA9IE1hdGgubWF4KDEsIGxpbmUudGV4dC5zcGxpdCgvXFxzKy8pLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHNlY29uZHMgPSB3b3JkcyAqIHdvcmRTZWNvbmRzICsgbGluZUdhcFNlY29uZHM7XG4gICAgICAgIGlmICh0b3RhbFNlY29uZHMgKyBzZWNvbmRzID4gbWF4U2Vjb25kcykgYnJlYWs7XG4gICAgICAgIHRvdGFsU2Vjb25kcyArPSBzZWNvbmRzO1xuICAgICAgICBzZWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIGZyZXE6IGxpbmUuc3BlYWtlciA9PT0gXCJIT1NUXCIgPyAxOTYgOiAxNDcsXG4gICAgICAgICAgICB3b3Jkc1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgdG90YWxTYW1wbGVzID0gTWF0aC5jZWlsKHRvdGFsU2Vjb25kcyAqIHNhbXBsZVJhdGUpO1xuICAgIGNvbnN0IHBjbSA9IG5ldyBJbnQxNkFycmF5KHRvdGFsU2FtcGxlcyk7XG4gICAgbGV0IG9mZnNldCA9IDA7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKXtcbiAgICAgICAgZm9yKGxldCB3ID0gMDsgdyA8IHNlZ21lbnQud29yZHM7IHcrKyl7XG4gICAgICAgICAgICBjb25zdCB3b3JkU2FtcGxlcyA9IE1hdGguZmxvb3Iod29yZFNlY29uZHMgKiBzYW1wbGVSYXRlICogMC44NSk7XG4gICAgICAgICAgICBjb25zdCBmcmVxID0gc2VnbWVudC5mcmVxICogKDEgKyAwLjEyICogTWF0aC5zaW4odykpO1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHdvcmRTYW1wbGVzICYmIG9mZnNldCArIGkgPCB0b3RhbFNhbXBsZXM7IGkrKyl7XG4gICAgICAgICAgICAgICAgY29uc3QgdCA9IGkgLyBzYW1wbGVSYXRlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudmVsb3BlID0gTWF0aC5zaW4oTWF0aC5QSSAqIGkgLyB3b3JkU2FtcGxlcyk7XG4gICAgICAgICAgICAgICAgcGNtW29mZnNldCArIGldID0gTWF0aC5yb3VuZCg2MDAwICogZW52ZWxvcGUgKiBNYXRoLnNpbigyICogTWF0aC5QSSAqIGZyZXEgKiB0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvZmZzZXQgKz0gTWF0aC5mbG9vcih3b3JkU2Vjb25kcyAqIHNhbXBsZVJhdGUpO1xuICAgICAgICB9XG4gICAgICAgIG9mZnNldCArPSBNYXRoLmZsb29yKGxpbmVHYXBTZWNvbmRzICogc2FtcGxlUmF0ZSk7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkocGNtLmJ1ZmZlciwgMCwgdG90YWxTYW1wbGVzICogMik7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgYnl0ZXMsXG4gICAgICAgIHNhbXBsZVJhdGVcbiAgICBdO1xufVxuIiwgImxldCBjbGllbnRQcm9taXNlID0gbnVsbDtcbi8qKiBTZWNyZXQta2V5IGNsaWVudCBmb3Igc2VydmVyLXNpZGUgd3JpdGVzOyBieXBhc3NlcyBSTFMuIE5ldmVyIGltcG9ydCBmcm9tIGNsaWVudCBjb2RlLiAqLyBleHBvcnQgZnVuY3Rpb24gZ2V0QWRtaW5DbGllbnQoKSB7XG4gICAgaWYgKCFjbGllbnRQcm9taXNlKSB7XG4gICAgICAgIGNsaWVudFByb21pc2UgPSBpbXBvcnQoXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIikudGhlbigoeyBjcmVhdGVDbGllbnQgfSk9PmNyZWF0ZUNsaWVudChwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFQ1JFVF9LRVksIHtcbiAgICAgICAgICAgICAgICBhdXRoOiB7XG4gICAgICAgICAgICAgICAgICAgIHBlcnNpc3RTZXNzaW9uOiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGNsaWVudFByb21pc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gc3VwYWJhc2VDb25maWd1cmVkKCkge1xuICAgIHJldHVybiBCb29sZWFuKHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCAmJiBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRUNSRVRfS0VZKTtcbn1cbiIsICJpbXBvcnQgeyBnZXRBZG1pbkNsaWVudCwgc3VwYWJhc2VDb25maWd1cmVkIH0gZnJvbSBcIi4vc3VwYWJhc2UvYWRtaW5cIjtcbmltcG9ydCB7IExFTkdUSF9CVURHRVRTIH0gZnJvbSBcIi4vb3B0aW9uc1wiO1xuLy8gMSBjcmVkaXQgXHUyMjQ4IDI1IG1pbnV0ZXMgb2YgcmVhZC1hbG91ZCBhdWRpbzsgY29udmVyc2F0aW9ucyBhcmUgYSBmaXhlZC1sZW5ndGhcbi8vIHN1bW1hcnkgcmVnYXJkbGVzcyBvZiBpbnB1dCBzaXplLlxuY29uc3QgUkVBRF9DSEFSU19QRVJfQ1JFRElUID0gMjVfMDAwO1xuLy8gUmVhZC1hbG91ZCBpcyBjYXBwZWQgYnkgdGhlIHNlbGVjdGVkIGxlbmd0aCwgc28gY29zdCB0b3BzIG91dCBoZXJlOyB0aGUgY2FwXG4vLyBhbHNvIGd1YXJkcyBhZ2FpbnN0IGFueSBleHRyYWN0aW9uIGFub21hbHkgaW5mbGF0aW5nIHRoZSBjaGFyZ2UuXG5jb25zdCBNQVhfQ1JFRElUU19QRVJfRVBJU09ERSA9IDg7XG4vKiogQ2hhcnMgYWN0dWFsbHkgc3Bva2VuID0gbWluKGV4dHJhY3RlZCwgdGhlIGxlbmd0aCBidWRnZXQncyByZWFkIGNhcCkuICovIGZ1bmN0aW9uIHJlYWRhYmxlQ2hhcnMoZXh0cmFjdGVkQ2hhcnMsIGxlbmd0aCkge1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCgwLCBleHRyYWN0ZWRDaGFycyksIExFTkdUSF9CVURHRVRTW2xlbmd0aF0ucmVhZENoYXJzKTtcbn1cbi8vIEEgY29udmVyc2F0aW9uJ3Mgc3Bva2VuIGxlbmd0aCBpcyBzZXQgYnkgaXRzIHRpZXIgYnVkZ2V0OyB+MSBjcmVkaXQgcGVyXG4vLyBzdGFuZGFyZC1lcGlzb2RlJ3Mgd29ydGggb2YgZGlhbG9ndWUsIHNvIGRlZXAgKDJ4KSBjb3N0cyAyLlxuY29uc3QgQ09OVkVSU0FUSU9OX0NIQVJTX1BFUl9DUkVESVQgPSBMRU5HVEhfQlVER0VUUy5zdGFuZGFyZC5zY3JpcHRDaGFycztcbmV4cG9ydCBmdW5jdGlvbiBjcmVkaXRDb3N0KG1vZGUsIGV4dHJhY3RlZENoYXJzLCBsZW5ndGggPSBcInN0YW5kYXJkXCIpIHtcbiAgICBpZiAobW9kZSA9PT0gXCJyZWFkaW5nXCIpIHtcbiAgICAgICAgY29uc3QgY2hhcnMgPSByZWFkYWJsZUNoYXJzKGV4dHJhY3RlZENoYXJzLCBsZW5ndGgpO1xuICAgICAgICByZXR1cm4gTWF0aC5taW4oTUFYX0NSRURJVFNfUEVSX0VQSVNPREUsIE1hdGgubWF4KDEsIE1hdGguY2VpbChjaGFycyAvIFJFQURfQ0hBUlNfUEVSX0NSRURJVCkpKTtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGgubWluKE1BWF9DUkVESVRTX1BFUl9FUElTT0RFLCBNYXRoLm1heCgxLCBNYXRoLmNlaWwoTEVOR1RIX0JVREdFVFNbbGVuZ3RoXS5zY3JpcHRDaGFycyAvIENPTlZFUlNBVElPTl9DSEFSU19QRVJfQ1JFRElUKSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGVzdGltYXRlTWludXRlcyhtb2RlLCBleHRyYWN0ZWRDaGFycywgbGVuZ3RoID0gXCJzdGFuZGFyZFwiKSB7XG4gICAgaWYgKG1vZGUgPT09IFwicmVhZGluZ1wiKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKHJlYWRhYmxlQ2hhcnMoZXh0cmFjdGVkQ2hhcnMsIGxlbmd0aCkgLyAxXzAwMCkpO1xuICAgIH1cbiAgICByZXR1cm4gTEVOR1RIX0JVREdFVFNbbGVuZ3RoXS5hcHByb3hNaW51dGVzO1xufVxuLyoqIENyZWRpdHMgYXJlIGVuZm9yY2VkIG9ubHkgd2hlbiBTdXBhYmFzZSBpcyBjb25maWd1cmVkIChhbHdheXMsIGluIHByb2R1Y3Rpb24pLiAqLyBleHBvcnQgZnVuY3Rpb24gY3JlZGl0c0VuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHN1cGFiYXNlQ29uZmlndXJlZCgpO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEJhbGFuY2UodXNlcklkKSB7XG4gICAgaWYgKCFjcmVkaXRzRW5hYmxlZCgpKSByZXR1cm4gSW5maW5pdHk7XG4gICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCBnZXRBZG1pbkNsaWVudCgpO1xuICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLnJwYyhcImNyZWRpdF9iYWxhbmNlXCIsIHtcbiAgICAgICAgcF91c2VyOiB1c2VySWRcbiAgICB9KTtcbiAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgY3JlZGl0IGJhbGFuY2UgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgcmV0dXJuIE51bWJlcihkYXRhID8/IDApO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNwZW5kQ3JlZGl0cyh1c2VySWQsIGFtb3VudCwgZXBpc29kZUlkKSB7XG4gICAgaWYgKCFjcmVkaXRzRW5hYmxlZCgpKSByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IGdldEFkbWluQ2xpZW50KCk7XG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKFwic3BlbmRfY3JlZGl0c1wiLCB7XG4gICAgICAgIHBfdXNlcjogdXNlcklkLFxuICAgICAgICBwX2Ftb3VudDogYW1vdW50LFxuICAgICAgICBwX3JlZjogYGVwaXNvZGU6JHtlcGlzb2RlSWR9YFxuICAgIH0pO1xuICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBjcmVkaXQgc3BlbmQgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgcmV0dXJuIGRhdGEgPT09IHRydWU7XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmdW5kRXBpc29kZSh1c2VySWQsIGVwaXNvZGVJZCkge1xuICAgIGlmICghY3JlZGl0c0VuYWJsZWQoKSkgcmV0dXJuO1xuICAgIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgZ2V0QWRtaW5DbGllbnQoKTtcbiAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoXCJyZWZ1bmRfZXBpc29kZVwiLCB7XG4gICAgICAgIHBfdXNlcjogdXNlcklkLFxuICAgICAgICBwX2VwaXNvZGU6IGVwaXNvZGVJZFxuICAgIH0pO1xuICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBjcmVkaXQgcmVmdW5kIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWApO1xufVxuIiwgIi8qKlxuICogVGhlc2UgYXJlIHRoZSBidWlsdC1pbiBzdGVwcyB0aGF0IGFyZSBcImF1dG9tYXRpY2FsbHkgYXZhaWxhYmxlXCIgaW4gdGhlIHdvcmtmbG93IHNjb3BlLiBUaGV5IGFyZVxuICogc2ltaWxhciB0byBcInN0ZGxpYlwiIGV4Y2VwdCB0aGF0IGFyZSBub3QgbWVhbnQgdG8gYmUgaW1wb3J0ZWQgYnkgdXNlcnMsIGJ1dCBhcmUgaW5zdGVhZCBcImp1c3QgYXZhaWxhYmxlXCJcbiAqIGFsb25nc2lkZSB1c2VyIGRlZmluZWQgc3RlcHMuIFRoZXkgYXJlIHVzZWQgaW50ZXJuYWxseSBieSB0aGUgcnVudGltZVxuICovXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBfX2J1aWx0aW5fcmVzcG9uc2VfYXJyYXlfYnVmZmVyKFxuICB0aGlzOiBSZXF1ZXN0IHwgUmVzcG9uc2Vcbikge1xuICAndXNlIHN0ZXAnO1xuICByZXR1cm4gdGhpcy5hcnJheUJ1ZmZlcigpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gX19idWlsdGluX3Jlc3BvbnNlX2pzb24odGhpczogUmVxdWVzdCB8IFJlc3BvbnNlKSB7XG4gICd1c2Ugc3RlcCc7XG4gIHJldHVybiB0aGlzLmpzb24oKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIF9fYnVpbHRpbl9yZXNwb25zZV90ZXh0KHRoaXM6IFJlcXVlc3QgfCBSZXNwb25zZSkge1xuICAndXNlIHN0ZXAnO1xuICByZXR1cm4gdGhpcy50ZXh0KCk7XG59XG4iLCAiLyoqXG4gKiBUaGlzIGlzIHRoZSBcInN0YW5kYXJkIGxpYnJhcnlcIiBvZiBzdGVwcyB0aGF0IHdlIG1ha2UgYXZhaWxhYmxlIHRvIGFsbCB3b3JrZmxvdyB1c2Vycy5cbiAqIFRoZSBjYW4gYmUgaW1wb3J0ZWQgbGlrZSBzbzogYGltcG9ydCB7IGZldGNoIH0gZnJvbSAnd29ya2Zsb3cnYC4gYW5kIHVzZWQgaW4gd29ya2Zsb3cuXG4gKiBUaGUgbmVlZCB0byBiZSBleHBvcnRlZCBkaXJlY3RseSBpbiB0aGlzIHBhY2thZ2UgYW5kIGNhbm5vdCBsaXZlIGluIGBjb3JlYCB0byBwcmV2ZW50XG4gKiBjaXJjdWxhciBkZXBlbmRlbmNpZXMgcG9zdC1jb21waWxhdGlvbi5cbiAqL1xuXG4vKipcbiAqIEEgaG9pc3RlZCBgZmV0Y2goKWAgZnVuY3Rpb24gdGhhdCBpcyBleGVjdXRlZCBhcyBhIFwic3RlcFwiIGZ1bmN0aW9uLFxuICogZm9yIHVzZSB3aXRoaW4gd29ya2Zsb3cgZnVuY3Rpb25zLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0ZldGNoX0FQSVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2goLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgZ2xvYmFsVGhpcy5mZXRjaD4pIHtcbiAgJ3VzZSBzdGVwJztcbiAgcmV0dXJuIGdsb2JhbFRoaXMuZmV0Y2goLi4uYXJncyk7XG59XG4iLCAiaW1wb3J0IHsgcmVnaXN0ZXJTdGVwRnVuY3Rpb24gfSBmcm9tIFwid29ya2Zsb3cvaW50ZXJuYWwvcHJpdmF0ZVwiO1xuaW1wb3J0IHsgY3JlYXRlSG9vaywgRmF0YWxFcnJvciB9IGZyb20gXCJ3b3JrZmxvd1wiO1xuLyoqX19pbnRlcm5hbF93b3JrZmxvd3N7XCJ3b3JrZmxvd3NcIjp7XCJ3b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS50c1wiOntcImdlbmVyYXRlRXBpc29kZVwiOntcIndvcmtmbG93SWRcIjpcIndvcmtmbG93Ly8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9nZW5lcmF0ZUVwaXNvZGVcIn19fSxcInN0ZXBzXCI6e1wid29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUudHNcIjp7XCJleHRyYWN0U3RlcFwiOntcInN0ZXBJZFwiOlwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vZXh0cmFjdFN0ZXBcIn0sXCJmYWlsU3RlcFwiOntcInN0ZXBJZFwiOlwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vZmFpbFN0ZXBcIn0sXCJtYXJrU2NyaXB0UmVhZHlcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL21hcmtTY3JpcHRSZWFkeVwifSxcInNjcmlwdFN0ZXBcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL3NjcmlwdFN0ZXBcIn0sXCJzeW50aGVzaXplU3RlcFwiOntcInN0ZXBJZFwiOlwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vc3ludGhlc2l6ZVN0ZXBcIn19fX0qLztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUVwaXNvZGUoZXBpc29kZUlkLCByZXZpZXdTY3JpcHQgPSBmYWxzZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBhdHRlbXB0ZWQgdG8gZXhlY3V0ZSB3b3JrZmxvdyBnZW5lcmF0ZUVwaXNvZGUgZnVuY3Rpb24gZGlyZWN0bHkuIFRvIHN0YXJ0IGEgd29ya2Zsb3csIHVzZSBzdGFydChnZW5lcmF0ZUVwaXNvZGUpIGZyb20gd29ya2Zsb3cvYXBpXCIpO1xufVxuZ2VuZXJhdGVFcGlzb2RlLndvcmtmbG93SWQgPSBcIndvcmtmbG93Ly8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9nZW5lcmF0ZUVwaXNvZGVcIjtcbmFzeW5jIGZ1bmN0aW9uIG1hcmtTY3JpcHRSZWFkeShlcGlzb2RlSWQpIHtcbiAgICBjb25zb2xlLmxvZyhgW2dlbmVyYXRlLWVwaXNvZGU6JHtlcGlzb2RlSWR9XSBhd2FpdGluZyBzY3JpcHQgcmV2aWV3YCk7XG4gICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgaWYgKCFhd2FpdCBnZXRTdG9yZSgpLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICBzdGF0dXM6IFwic2NyaXB0X3JlYWR5XCJcbiAgICB9KSkge1xuICAgICAgICB0aHJvdyBuZXcgRmF0YWxFcnJvcihcIkVwaXNvZGUgd2FzIGRlbGV0ZWRcIik7XG4gICAgfVxufVxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFN0ZXAoZXBpc29kZUlkKSB7XG4gICAgY29uc29sZS5sb2coYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gZXh0cmFjdGluZyB0ZXh0YCk7XG4gICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgY29uc3QgeyBleHRyYWN0UGRmVGV4dCB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvcGlwZWxpbmUvZXh0cmFjdFwiKTtcbiAgICBjb25zdCBzdG9yZSA9IGdldFN0b3JlKCk7XG4gICAgY29uc3QgZXBpc29kZSA9IGF3YWl0IHN0b3JlLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICBzdGF0dXM6IFwiZXh0cmFjdGluZ1wiXG4gICAgfSk7XG4gICAgaWYgKCFlcGlzb2RlKSB0aHJvdyBuZXcgRmF0YWxFcnJvcihcIkVwaXNvZGUgd2FzIGRlbGV0ZWRcIik7XG4gICAgLy8gTmV3IGVwaXNvZGVzIHN0b3JlIHByZS1leHRyYWN0ZWQgKHBvc3NpYmx5IG11bHRpLVBERikgdGV4dDsgZmFsbCBiYWNrIHRvXG4gICAgLy8gZXh0cmFjdGluZyBhIHJhdyBQREYgZm9yIGFueSBsZWdhY3kgZXBpc29kZS5cbiAgICBsZXQgdGV4dDtcbiAgICBsZXQgdG90YWxQYWdlcztcbiAgICBjb25zdCBzdG9yZWRUZXh0ID0gYXdhaXQgc3RvcmUuZ2V0U291cmNlVGV4dChlcGlzb2RlSWQpO1xuICAgIGlmIChzdG9yZWRUZXh0ICE9PSBudWxsKSB7XG4gICAgICAgIHRleHQgPSBzdG9yZWRUZXh0O1xuICAgICAgICB0b3RhbFBhZ2VzID0gZXBpc29kZS50b3RhbFBhZ2VzID8/IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgc291cmNlID0gYXdhaXQgc3RvcmUuZ2V0U291cmNlKGVwaXNvZGVJZCk7XG4gICAgICAgIGlmICghc291cmNlKSB0aHJvdyBuZXcgRmF0YWxFcnJvcihcIlNvdXJjZSBpcyBtaXNzaW5nXCIpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgKHsgdGV4dCwgdG90YWxQYWdlcyB9ID0gYXdhaXQgZXh0cmFjdFBkZlRleHQoc291cmNlKSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEZhdGFsRXJyb3IoZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhd2FpdCBzdG9yZS5wYXRjaChlcGlzb2RlSWQsIHtcbiAgICAgICAgdG90YWxQYWdlcyxcbiAgICAgICAgZXh0cmFjdGVkQ2hhcnM6IHRleHQubGVuZ3RoXG4gICAgfSk7XG4gICAgcmV0dXJuIHRleHQ7XG59XG5hc3luYyBmdW5jdGlvbiBzY3JpcHRTdGVwKGVwaXNvZGVJZCwgdGV4dCkge1xuICAgIGNvbnNvbGUubG9nKGBbZ2VuZXJhdGUtZXBpc29kZToke2VwaXNvZGVJZH1dIGdlbmVyYXRpbmcgc2NyaXB0YCk7XG4gICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgY29uc3QgeyBnZW5lcmF0ZVBvZGNhc3RTY3JpcHQsIHZlcmJhdGltU2NyaXB0LCBzY3JpcHRQcm92aWRlck5hbWUgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL3BpcGVsaW5lL3NjcmlwdFwiKTtcbiAgICBjb25zdCB7IG5vcm1hbGl6ZU9wdGlvbnMsIExFTkdUSF9CVURHRVRTIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9vcHRpb25zXCIpO1xuICAgIGNvbnN0IHN0b3JlID0gZ2V0U3RvcmUoKTtcbiAgICBjb25zdCBlcGlzb2RlID0gYXdhaXQgc3RvcmUucGF0Y2goZXBpc29kZUlkLCB7XG4gICAgICAgIHN0YXR1czogXCJzY3JpcHRpbmdcIlxuICAgIH0pO1xuICAgIGlmICghZXBpc29kZSkgdGhyb3cgbmV3IEZhdGFsRXJyb3IoXCJFcGlzb2RlIHdhcyBkZWxldGVkXCIpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBub3JtYWxpemVPcHRpb25zKGVwaXNvZGUub3B0aW9ucyk7XG4gICAgY29uc3Qgc2NyaXB0ID0gZXBpc29kZS5tb2RlID09PSBcInJlYWRpbmdcIiA/IHZlcmJhdGltU2NyaXB0KHRleHQsIGVwaXNvZGUuc291cmNlRmlsZW5hbWUsIExFTkdUSF9CVURHRVRTW29wdGlvbnMubGVuZ3RoXS5yZWFkQ2hhcnMpIDogYXdhaXQgZ2VuZXJhdGVQb2RjYXN0U2NyaXB0KHRleHQsIGVwaXNvZGUuc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpO1xuICAgIGF3YWl0IHN0b3JlLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICB0aXRsZTogc2NyaXB0LnRpdGxlLFxuICAgICAgICBzY3JpcHQsXG4gICAgICAgIHByb3ZpZGVyczoge1xuICAgICAgICAgICAgc2NyaXB0OiBlcGlzb2RlLm1vZGUgPT09IFwicmVhZGluZ1wiID8gXCJ2ZXJiYXRpbVwiIDogc2NyaXB0UHJvdmlkZXJOYW1lKCksXG4gICAgICAgICAgICB0dHM6IFwiXCJcbiAgICAgICAgfVxuICAgIH0pO1xufVxuYXN5bmMgZnVuY3Rpb24gc3ludGhlc2l6ZVN0ZXAoZXBpc29kZUlkKSB7XG4gICAgY29uc29sZS5sb2coYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gc3ludGhlc2l6aW5nIGF1ZGlvYCk7XG4gICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgY29uc3QgeyBzeW50aGVzaXplRGlhbG9ndWUsIHR0c1Byb3ZpZGVyTmFtZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvcGlwZWxpbmUvdHRzXCIpO1xuICAgIGNvbnN0IHsgbm9ybWFsaXplT3B0aW9ucyB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvb3B0aW9uc1wiKTtcbiAgICBjb25zdCBzdG9yZSA9IGdldFN0b3JlKCk7XG4gICAgY29uc3QgZXBpc29kZSA9IGF3YWl0IHN0b3JlLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICBzdGF0dXM6IFwic3ludGhlc2l6aW5nXCJcbiAgICB9KTtcbiAgICBpZiAoIWVwaXNvZGUpIHRocm93IG5ldyBGYXRhbEVycm9yKFwiRXBpc29kZSB3YXMgZGVsZXRlZFwiKTtcbiAgICAvLyBUaGUgc2NyaXB0IGluIHRoZSBEQiBtYXkgaGF2ZSBiZWVuIGVkaXRlZCBkdXJpbmcgcmV2aWV3IFx1MjAxNCBpdCdzIHRoZSBzb3VyY2VcbiAgICAvLyBvZiB0cnV0aCwgbm90IHdoYXRldmVyIHNjcmlwdFN0ZXAgb3JpZ2luYWxseSBwcm9kdWNlZC5cbiAgICBjb25zdCBzY3JpcHQgPSBlcGlzb2RlLnNjcmlwdDtcbiAgICBpZiAoIXNjcmlwdCkgdGhyb3cgbmV3IEZhdGFsRXJyb3IoXCJTY3JpcHQgaXMgbWlzc2luZ1wiKTtcbiAgICBjb25zdCB7IGF1ZGlvLCBtaW1lVHlwZSwgZHVyYXRpb25TZWNvbmRzIH0gPSBhd2FpdCBzeW50aGVzaXplRGlhbG9ndWUoc2NyaXB0LCBlcGlzb2RlLm1vZGUgPz8gXCJjb252ZXJzYXRpb25cIiwgbm9ybWFsaXplT3B0aW9ucyhlcGlzb2RlLm9wdGlvbnMpKTtcbiAgICBhd2FpdCBzdG9yZS5zYXZlQXVkaW8oZXBpc29kZUlkLCBhdWRpbywgbWltZVR5cGUpO1xuICAgIGF3YWl0IHN0b3JlLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICBzdGF0dXM6IFwicmVhZHlcIixcbiAgICAgICAgYXVkaW9NaW1lVHlwZTogbWltZVR5cGUsXG4gICAgICAgIGR1cmF0aW9uU2Vjb25kczogTWF0aC5yb3VuZChkdXJhdGlvblNlY29uZHMpLFxuICAgICAgICBwcm92aWRlcnM6IHtcbiAgICAgICAgICAgIHNjcmlwdDogZXBpc29kZS5wcm92aWRlcnM/LnNjcmlwdCA/PyBcIlwiLFxuICAgICAgICAgICAgdHRzOiB0dHNQcm92aWRlck5hbWUoKVxuICAgICAgICB9XG4gICAgfSk7XG59XG5hc3luYyBmdW5jdGlvbiBmYWlsU3RlcChlcGlzb2RlSWQsIG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbZ2VuZXJhdGUtZXBpc29kZToke2VwaXNvZGVJZH1dIGZhaWxlZDogJHttZXNzYWdlfWApO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgZ2V0U3RvcmUgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL3N0b3JlXCIpO1xuICAgICAgICBjb25zdCBlcGlzb2RlID0gYXdhaXQgZ2V0U3RvcmUoKS5wYXRjaChlcGlzb2RlSWQsIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgICAgICAgZXJyb3I6IG1lc3NhZ2VcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChlcGlzb2RlPy51c2VySWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgcmVmdW5kRXBpc29kZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvY3JlZGl0c1wiKTtcbiAgICAgICAgICAgIC8vIE5vLW9wIHVubGVzcyBhIHNwZW5kIHJvdyBleGlzdHMgZm9yIHRoaXMgZXBpc29kZSwgc28gYWRtaW4gcnVucyBhbmRcbiAgICAgICAgICAgIC8vIHJldHJpZXMgYXJlIHNhZmUuXG4gICAgICAgICAgICBhd2FpdCByZWZ1bmRFcGlzb2RlKGVwaXNvZGUudXNlcklkLCBlcGlzb2RlSWQpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAocGF0Y2hFcnIpIHtcbiAgICAgICAgLy8gTmV2ZXIgbWFzayB0aGUgb3JpZ2luYWwgd29ya2Zsb3cgZXJyb3Igd2l0aCBhIGJvb2trZWVwaW5nIGZhaWx1cmUuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gY291bGQgbm90IHJlY29yZCBmYWlsdXJlOmAsIHBhdGNoRXJyKTtcbiAgICB9XG59XG5yZWdpc3RlclN0ZXBGdW5jdGlvbihcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL21hcmtTY3JpcHRSZWFkeVwiLCBtYXJrU2NyaXB0UmVhZHkpO1xucmVnaXN0ZXJTdGVwRnVuY3Rpb24oXCJzdGVwLy8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9leHRyYWN0U3RlcFwiLCBleHRyYWN0U3RlcCk7XG5yZWdpc3RlclN0ZXBGdW5jdGlvbihcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL3NjcmlwdFN0ZXBcIiwgc2NyaXB0U3RlcCk7XG5yZWdpc3RlclN0ZXBGdW5jdGlvbihcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL3N5bnRoZXNpemVTdGVwXCIsIHN5bnRoZXNpemVTdGVwKTtcbnJlZ2lzdGVyU3RlcEZ1bmN0aW9uKFwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vZmFpbFN0ZXBcIiwgZmFpbFN0ZXApO1xuIiwgIi8qKlxuICogU2VyZGUgY29tcGxpYW5jZSBjaGVja2VyIGZvciB3b3JrZmxvdyBjdXN0b20gY2xhc3Mgc2VyaWFsaXphdGlvbi5cbiAqXG4gKiBBbmFseXplcyBzb3VyY2UgY29kZSB0byBkZXRlcm1pbmUgaWYgY2xhc3NlcyB3aXRoIFdPUktGTE9XX1NFUklBTElaRSAvXG4gKiBXT1JLRkxPV19ERVNFUklBTElaRSBhcmUgY29ycmVjdGx5IHNldCB1cCBmb3IgdGhlIHdvcmtmbG93IHNhbmRib3guXG4gKlxuICogVXNlZCBieTpcbiAqIC0gQ0xJIGB2YWxpZGF0ZWAgY29tbWFuZFxuICogLSBDTEkgYHRyYW5zZm9ybWAgY29tbWFuZCAoLS1jaGVjay1zZXJkZSlcbiAqIC0gU1dDIHBsYXlncm91bmQgc2VyZGUgYW5hbHlzaXMgcGFuZWxcbiAqIC0gQnVpbGQtdGltZSB3YXJuaW5ncyBpbiBCYXNlQnVpbGRlclxuICovXG5cbmltcG9ydCBidWlsdGluTW9kdWxlcyBmcm9tICdidWlsdGluLW1vZHVsZXMnO1xuaW1wb3J0IHR5cGUgeyBXb3JrZmxvd01hbmlmZXN0IH0gZnJvbSAnLi9hcHBseS1zd2MtdHJhbnNmb3JtLmpzJztcblxuLy8gQnVpbGQgYSByZWdleCB0aGF0IG1hdGNoZXMgTm9kZS5qcyBidWlsdC1pbiBtb2R1bGUgaW1wb3J0cyBpbiB0cmFuc2Zvcm1lZCBjb2RlLlxuLy8gSGFuZGxlcyBib3RoIEVTTSAoYGZyb20gJ2ZzJ2AsIGBmcm9tICdub2RlOmZzJ2ApIGFuZCBDSlMgKGByZXF1aXJlKCdmcycpYClcbmNvbnN0IG5vZGVCdWlsdGlucyA9IGJ1aWx0aW5Nb2R1bGVzLmpvaW4oJ3wnKTtcblxuLy8gUmVnZXggdG8gZXh0cmFjdCBzcGVjaWZpYyBtb2R1bGUgbmFtZXMgZnJvbSBpbXBvcnQvcmVxdWlyZSBzdGF0ZW1lbnRzXG5jb25zdCBub2RlSW1wb3J0RXh0cmFjdFJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgYCg/OmZyb21cXFxccytbJ1wiXSg/Om5vZGU6KT8oKD86JHtub2RlQnVpbHRpbnN9KSg/Oi9bXidcIl0qKT8pWydcIl1gICtcbiAgICBgfHJlcXVpcmVcXFxccypcXFxcKFxcXFxzKlsnXCJdKD86bm9kZTopPygoPzoke25vZGVCdWlsdGluc30pKD86L1teJ1wiXSopPylbJ1wiXVxcXFxzKlxcXFwpKWAsXG4gICdnJ1xuKTtcblxuLy8gUmVnZXggdG8gZGV0ZWN0IGNsYXNzIHJlZ2lzdHJhdGlvbiBJSUZFcyBnZW5lcmF0ZWQgYnkgdGhlIFNXQyBwbHVnaW5cbmNvbnN0IHJlZ2lzdHJhdGlvbklpZmVSZWdleCA9XG4gIC9TeW1ib2xcXC5mb3JcXHMqXFwoXFxzKltcIiddd29ya2Zsb3ctY2xhc3MtcmVnaXN0cnlbXCInXVxccypcXCkvO1xuXG4vKipcbiAqIFJlc3VsdCBvZiBjaGVja2luZyBhIHNpbmdsZSBjbGFzcyBmb3Igc2VyZGUgY29tcGxpYW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJkZUNsYXNzQ2hlY2tSZXN1bHQge1xuICAvKiogVGhlIGNsYXNzIG5hbWUgYXMgZGV0ZWN0ZWQgaW4gdGhlIHNvdXJjZSAqL1xuICBjbGFzc05hbWU6IHN0cmluZztcbiAgLyoqIFRoZSBjbGFzc0lkIGFzc2lnbmVkIGJ5IHRoZSBTV0MgcGx1Z2luIChmcm9tIHRoZSBtYW5pZmVzdCkgKi9cbiAgY2xhc3NJZDogc3RyaW5nO1xuICAvKiogV2hldGhlciB0aGUgU1dDIHBsdWdpbiBkZXRlY3RlZCBzZXJkZSBzeW1ib2xzIG9uIHRoaXMgY2xhc3MgKi9cbiAgZGV0ZWN0ZWQ6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIGEgcmVnaXN0cmF0aW9uIElJRkUgd2FzIGdlbmVyYXRlZCBpbiB0aGUgb3V0cHV0ICovXG4gIHJlZ2lzdGVyZWQ6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBOb2RlLmpzIGJ1aWx0LWluIG1vZHVsZSBpbXBvcnRzIHJlbWFpbmluZyBpbiB0aGUgd29ya2Zsb3ctbW9kZSBvdXRwdXQuXG4gICAqIElmIG5vbi1lbXB0eSwgdGhlIGNsYXNzIGlzIE5PVCB3b3JrZmxvdy1zYW5kYm94IGNvbXBsaWFudC5cbiAgICovXG4gIG5vZGVJbXBvcnRzOiBzdHJpbmdbXTtcbiAgLyoqIFdoZXRoZXIgdGhlIGNsYXNzIHBhc3NlcyBhbGwgY29tcGxpYW5jZSBjaGVja3MgKi9cbiAgY29tcGxpYW50OiBib29sZWFuO1xuICAvKiogSHVtYW4tcmVhZGFibGUgZGVzY3JpcHRpb25zIG9mIGFueSBpc3N1ZXMgZm91bmQgKi9cbiAgaXNzdWVzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBGdWxsIHJlc3VsdCBvZiBzZXJkZSBjb21wbGlhbmNlIGFuYWx5c2lzIGZvciBhIHNvdXJjZSBmaWxlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlcmRlQ2hlY2tSZXN1bHQge1xuICAvKiogUGVyLWNsYXNzIGFuYWx5c2lzIHJlc3VsdHMgKi9cbiAgY2xhc3NlczogU2VyZGVDbGFzc0NoZWNrUmVzdWx0W107XG4gIC8qKiBBbGwgTm9kZS5qcyBidWlsdC1pbiBpbXBvcnRzIGZvdW5kIGluIHRoZSB3b3JrZmxvdy1tb2RlIG91dHB1dCAqL1xuICBnbG9iYWxOb2RlSW1wb3J0czogc3RyaW5nW107XG4gIC8qKiBXaGV0aGVyIHRoZSB3b3JrZmxvdy1tb2RlIG91dHB1dCBjb250YWlucyBhbnkgc2VyZGUtcmVsYXRlZCBjbGFzc2VzICovXG4gIGhhc1NlcmRlQ2xhc3NlczogYm9vbGVhbjtcbiAgLyoqIFRoZSByYXcgd29ya2Zsb3cgbWFuaWZlc3QgZXh0cmFjdGVkIGZyb20gdGhlIFNXQyB0cmFuc2Zvcm0gKi9cbiAgbWFuaWZlc3Q6IFdvcmtmbG93TWFuaWZlc3Q7XG59XG5cbi8qKlxuICogTGlnaHR3ZWlnaHQgc2VyZGUgY29tcGxpYW5jZSBjaGVja2VyIHRoYXQgd29ya3Mgd2l0aCBwcmUtY29tcHV0ZWRcbiAqIFNXQyB0cmFuc2Zvcm0gcmVzdWx0cy4gVGhpcyBhdm9pZHMgcmUtcnVubmluZyB0aGUgU1dDIHRyYW5zZm9ybVxuICogd2hlbiB0aGUgY2FsbGVyIGFscmVhZHkgaGFzIHRoZSBvdXRwdXRzIChlLmcuLCB0aGUgcGxheWdyb3VuZCBvciBidWlsZGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVTZXJkZUNvbXBsaWFuY2Uob3B0aW9uczoge1xuICAvKiogU291cmNlIGNvZGUgKHVzZWQgZm9yIHBhdHRlcm4gZGV0ZWN0aW9uKSAqL1xuICBzb3VyY2VDb2RlOiBzdHJpbmc7XG4gIC8qKiBXb3JrZmxvdy1tb2RlIHRyYW5zZm9ybWVkIG91dHB1dCAqL1xuICB3b3JrZmxvd0NvZGU6IHN0cmluZztcbiAgLyoqIE1hbmlmZXN0IGV4dHJhY3RlZCBmcm9tIHRoZSBTV0MgdHJhbnNmb3JtICovXG4gIG1hbmlmZXN0OiBXb3JrZmxvd01hbmlmZXN0O1xufSk6IFNlcmRlQ2hlY2tSZXN1bHQge1xuICBjb25zdCB7IHNvdXJjZUNvZGUsIHdvcmtmbG93Q29kZSwgbWFuaWZlc3QgfSA9IG9wdGlvbnM7XG5cbiAgLy8gMS4gRXh0cmFjdCBhbGwgTm9kZS5qcyBidWlsdC1pbiBpbXBvcnRzIGZyb20gdGhlIHdvcmtmbG93IG91dHB1dFxuICBjb25zdCBnbG9iYWxOb2RlSW1wb3J0cyA9IGV4dHJhY3ROb2RlSW1wb3J0cyh3b3JrZmxvd0NvZGUpO1xuXG4gIC8vIDIuIENoZWNrIGlmIHRoZSBtYW5pZmVzdCBjb250YWlucyBhbnkgc2VyZGUtcmVnaXN0ZXJlZCBjbGFzc2VzXG4gIGNvbnN0IGNsYXNzRW50cmllcyA9IGV4dHJhY3RDbGFzc0VudHJpZXMobWFuaWZlc3QpO1xuICBjb25zdCBoYXNTZXJkZUNsYXNzZXMgPSBjbGFzc0VudHJpZXMubGVuZ3RoID4gMDtcblxuICAvLyAzLiBDaGVjayBpZiB0aGUgd29ya2Zsb3cgb3V0cHV0IGNvbnRhaW5zIHJlZ2lzdHJhdGlvbiBJSUZFc1xuICBjb25zdCBoYXNSZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25JaWZlUmVnZXgudGVzdCh3b3JrZmxvd0NvZGUpO1xuXG4gIC8vIDQuIEFuYWx5emUgZWFjaCBjbGFzc1xuICBjb25zdCBjbGFzc2VzOiBTZXJkZUNsYXNzQ2hlY2tSZXN1bHRbXSA9IGNsYXNzRW50cmllcy5tYXAoKGVudHJ5KSA9PiB7XG4gICAgY29uc3QgaXNzdWVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8gQ2hlY2sgZm9yIE5vZGUuanMgaW1wb3J0cyAodGhlc2Ugd2lsbCBmYWlsIGluIHRoZSB3b3JrZmxvdyBzYW5kYm94KVxuICAgIGlmIChnbG9iYWxOb2RlSW1wb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYFdvcmtmbG93IGJ1bmRsZSBjb250YWlucyBOb2RlLmpzIGJ1aWx0LWluIGltcG9ydHM6ICR7Z2xvYmFsTm9kZUltcG9ydHMuam9pbignLCAnKX0uIGAgK1xuICAgICAgICAgIGBUaGVzZSB3aWxsIGZhaWwgYXQgcnVudGltZSBpbiB0aGUgd29ya2Zsb3cgc2FuZGJveC4gYCArXG4gICAgICAgICAgYEFkZCBcInVzZSBzdGVwXCIgdG8gbWV0aG9kcyB0aGF0IGRlcGVuZCBvbiBOb2RlLmpzIEFQSXMgc28gdGhleSBhcmUgc3RyaXBwZWQgZnJvbSB0aGUgd29ya2Zsb3cgYnVuZGxlLmBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHJlZ2lzdHJhdGlvblxuICAgIGlmICghaGFzUmVnaXN0cmF0aW9uKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYE5vIGNsYXNzIHJlZ2lzdHJhdGlvbiBJSUZFIHdhcyBnZW5lcmF0ZWQuIGAgK1xuICAgICAgICAgIGBFbnN1cmUgV09SS0ZMT1dfU0VSSUFMSVpFIGFuZCBXT1JLRkxPV19ERVNFUklBTElaRSBhcmUgZGVmaW5lZCBhcyBzdGF0aWMgbWV0aG9kcyBgICtcbiAgICAgICAgICBgaW5zaWRlIHRoZSBjbGFzcyBib2R5IHVzaW5nIGNvbXB1dGVkIHByb3BlcnR5IHN5bnRheDogc3RhdGljIFtXT1JLRkxPV19TRVJJQUxJWkVdKC4uLikgeyAuLi4gfWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzTmFtZTogZW50cnkuY2xhc3NOYW1lLFxuICAgICAgY2xhc3NJZDogZW50cnkuY2xhc3NJZCxcbiAgICAgIGRldGVjdGVkOiB0cnVlLFxuICAgICAgcmVnaXN0ZXJlZDogaGFzUmVnaXN0cmF0aW9uLFxuICAgICAgbm9kZUltcG9ydHM6IGdsb2JhbE5vZGVJbXBvcnRzLFxuICAgICAgY29tcGxpYW50OiBnbG9iYWxOb2RlSW1wb3J0cy5sZW5ndGggPT09IDAgJiYgaGFzUmVnaXN0cmF0aW9uLFxuICAgICAgaXNzdWVzLFxuICAgIH07XG4gIH0pO1xuXG4gIC8vIDUuIENoZWNrIGZvciBjbGFzc2VzIHRoYXQgaGF2ZSBzZXJkZSBwYXR0ZXJucyBpbiBzb3VyY2UgYnV0IHdlcmVuJ3QgZGV0ZWN0ZWQgYnkgU1dDXG4gIGNvbnN0IHNvdXJjZUhhc1NlcmRlUGF0dGVybnMgPVxuICAgIC9cXFtcXHMqV09SS0ZMT1dfKD86U0VSSUFMSVpFfERFU0VSSUFMSVpFKVxccypcXF0vLnRlc3Qoc291cmNlQ29kZSkgfHxcbiAgICAvU3ltYm9sXFwuZm9yXFxzKlxcKFxccypbJ1wiXXdvcmtmbG93LSg/OnNlcmlhbGl6ZXxkZXNlcmlhbGl6ZSlbJ1wiXVxccypcXCkvLnRlc3QoXG4gICAgICBzb3VyY2VDb2RlXG4gICAgKTtcblxuICBpZiAoc291cmNlSGFzU2VyZGVQYXR0ZXJucyAmJiBjbGFzc0VudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY2xhc3Nlcy5wdXNoKHtcbiAgICAgIGNsYXNzTmFtZTogJzx1bmtub3duPicsXG4gICAgICBjbGFzc0lkOiAnJyxcbiAgICAgIGRldGVjdGVkOiBmYWxzZSxcbiAgICAgIHJlZ2lzdGVyZWQ6IGZhbHNlLFxuICAgICAgbm9kZUltcG9ydHM6IGdsb2JhbE5vZGVJbXBvcnRzLFxuICAgICAgY29tcGxpYW50OiBmYWxzZSxcbiAgICAgIGlzc3VlczogW1xuICAgICAgICBgU291cmNlIGNvZGUgY29udGFpbnMgV09SS0ZMT1dfU0VSSUFMSVpFL1dPUktGTE9XX0RFU0VSSUFMSVpFIHBhdHRlcm5zIGJ1dCBgICtcbiAgICAgICAgICBgdGhlIFNXQyBwbHVnaW4gZGlkIG5vdCBkZXRlY3QgYW55IHNlcmRlLWVuYWJsZWQgY2xhc3Nlcy4gYCArXG4gICAgICAgICAgYEVuc3VyZSB0aGUgc3ltYm9scyBhcmUgZGVmaW5lZCBhcyBzdGF0aWMgbWV0aG9kcyBJTlNJREUgdGhlIGNsYXNzIGJvZHksIGAgK1xuICAgICAgICAgIGBub3QgYXNzaWduZWQgZXh0ZXJuYWxseSAoZS5nLiwgKE15Q2xhc3MgYXMgYW55KVtXT1JLRkxPV19TRVJJQUxJWkVdID0gLi4uKS5gLFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY2xhc3NlcyxcbiAgICBnbG9iYWxOb2RlSW1wb3J0cyxcbiAgICBoYXNTZXJkZUNsYXNzZXMsXG4gICAgbWFuaWZlc3QsXG4gIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBOb2RlLmpzIGJ1aWx0LWluIG1vZHVsZSBuYW1lcyBmcm9tIHRyYW5zZm9ybWVkIGNvZGUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3ROb2RlSW1wb3J0cyhjb2RlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGltcG9ydHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgLy8gUmVzZXQgcmVnZXggc3RhdGVcbiAgbm9kZUltcG9ydEV4dHJhY3RSZWdleC5sYXN0SW5kZXggPSAwO1xuICBmb3IgKFxuICAgIGxldCBtYXRjaCA9IG5vZGVJbXBvcnRFeHRyYWN0UmVnZXguZXhlYyhjb2RlKTtcbiAgICBtYXRjaCAhPT0gbnVsbDtcbiAgICBtYXRjaCA9IG5vZGVJbXBvcnRFeHRyYWN0UmVnZXguZXhlYyhjb2RlKVxuICApIHtcbiAgICAvLyBtYXRjaFsxXSBpcyBmcm9tIHRoZSBFU00gcGF0dGVybiwgbWF0Y2hbMl0gaXMgZnJvbSB0aGUgQ0pTIHBhdHRlcm5cbiAgICBjb25zdCBtb2R1bGVOYW1lID0gbWF0Y2hbMV0gfHwgbWF0Y2hbMl07XG4gICAgaWYgKG1vZHVsZU5hbWUpIHtcbiAgICAgIC8vIE5vcm1hbGl6ZSB0byBiYXNlIG1vZHVsZSBuYW1lIChlLmcuLCAnZnMvcHJvbWlzZXMnIC0+ICdmcycpXG4gICAgICBpbXBvcnRzLmFkZChtb2R1bGVOYW1lLnNwbGl0KCcvJylbMF0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gWy4uLmltcG9ydHNdLnNvcnQoKTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGNsYXNzIGVudHJpZXMgZnJvbSBhIFdvcmtmbG93TWFuaWZlc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Q2xhc3NFbnRyaWVzKFxuICBtYW5pZmVzdDogV29ya2Zsb3dNYW5pZmVzdFxuKTogQXJyYXk8eyBjbGFzc05hbWU6IHN0cmluZzsgY2xhc3NJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH0+IHtcbiAgY29uc3QgZW50cmllczogQXJyYXk8e1xuICAgIGNsYXNzTmFtZTogc3RyaW5nO1xuICAgIGNsYXNzSWQ6IHN0cmluZztcbiAgICBmaWxlTmFtZTogc3RyaW5nO1xuICB9PiA9IFtdO1xuICBpZiAoIW1hbmlmZXN0LmNsYXNzZXMpIHJldHVybiBlbnRyaWVzO1xuXG4gIGZvciAoY29uc3QgW2ZpbGVOYW1lLCBjbGFzc2VzXSBvZiBPYmplY3QuZW50cmllcyhtYW5pZmVzdC5jbGFzc2VzKSkge1xuICAgIGZvciAoY29uc3QgW2NsYXNzTmFtZSwgeyBjbGFzc0lkIH1dIG9mIE9iamVjdC5lbnRyaWVzKGNsYXNzZXMpKSB7XG4gICAgICBlbnRyaWVzLnB1c2goeyBjbGFzc05hbWUsIGNsYXNzSWQsIGZpbGVOYW1lIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZW50cmllcztcbn1cbiIsICIvKipcbiAqIFNlcmRlIGNvbXBsaWFuY2UgY2hlY2tlciBmb3Igd29ya2Zsb3cgY3VzdG9tIGNsYXNzIHNlcmlhbGl6YXRpb24uXG4gKlxuICogQW5hbHl6ZXMgc291cmNlIGNvZGUgdG8gZGV0ZXJtaW5lIGlmIGNsYXNzZXMgd2l0aCBXT1JLRkxPV19TRVJJQUxJWkUgL1xuICogV09SS0ZMT1dfREVTRVJJQUxJWkUgYXJlIGNvcnJlY3RseSBzZXQgdXAgZm9yIHRoZSB3b3JrZmxvdyBzYW5kYm94LlxuICpcbiAqIFVzZWQgYnk6XG4gKiAtIENMSSBgdmFsaWRhdGVgIGNvbW1hbmRcbiAqIC0gQ0xJIGB0cmFuc2Zvcm1gIGNvbW1hbmQgKC0tY2hlY2stc2VyZGUpXG4gKiAtIFNXQyBwbGF5Z3JvdW5kIHNlcmRlIGFuYWx5c2lzIHBhbmVsXG4gKiAtIEJ1aWxkLXRpbWUgd2FybmluZ3MgaW4gQmFzZUJ1aWxkZXJcbiAqL1xuXG5pbXBvcnQgYnVpbHRpbk1vZHVsZXMgZnJvbSAnYnVpbHRpbi1tb2R1bGVzJztcbmltcG9ydCB0eXBlIHsgV29ya2Zsb3dNYW5pZmVzdCB9IGZyb20gJy4vYXBwbHktc3djLXRyYW5zZm9ybS5qcyc7XG5cbi8vIEJ1aWxkIGEgcmVnZXggdGhhdCBtYXRjaGVzIE5vZGUuanMgYnVpbHQtaW4gbW9kdWxlIGltcG9ydHMgaW4gdHJhbnNmb3JtZWQgY29kZS5cbi8vIEhhbmRsZXMgYm90aCBFU00gKGBmcm9tICdmcydgLCBgZnJvbSAnbm9kZTpmcydgKSBhbmQgQ0pTIChgcmVxdWlyZSgnZnMnKWApXG5jb25zdCBub2RlQnVpbHRpbnMgPSBidWlsdGluTW9kdWxlcy5qb2luKCd8Jyk7XG5cbi8vIFJlZ2V4IHRvIGV4dHJhY3Qgc3BlY2lmaWMgbW9kdWxlIG5hbWVzIGZyb20gaW1wb3J0L3JlcXVpcmUgc3RhdGVtZW50c1xuY29uc3Qgbm9kZUltcG9ydEV4dHJhY3RSZWdleCA9IG5ldyBSZWdFeHAoXG4gIGAoPzpmcm9tXFxcXHMrWydcIl0oPzpub2RlOik/KCg/OiR7bm9kZUJ1aWx0aW5zfSkoPzovW14nXCJdKik/KVsnXCJdYCArXG4gICAgYHxyZXF1aXJlXFxcXHMqXFxcXChcXFxccypbJ1wiXSg/Om5vZGU6KT8oKD86JHtub2RlQnVpbHRpbnN9KSg/Oi9bXidcIl0qKT8pWydcIl1cXFxccypcXFxcKSlgLFxuICAnZydcbik7XG5cbi8vIFJlZ2V4IHRvIGRldGVjdCBjbGFzcyByZWdpc3RyYXRpb24gSUlGRXMgZ2VuZXJhdGVkIGJ5IHRoZSBTV0MgcGx1Z2luXG5jb25zdCByZWdpc3RyYXRpb25JaWZlUmVnZXggPVxuICAvU3ltYm9sXFwuZm9yXFxzKlxcKFxccypbXCInXXdvcmtmbG93LWNsYXNzLXJlZ2lzdHJ5W1wiJ11cXHMqXFwpLztcblxuLyoqXG4gKiBSZXN1bHQgb2YgY2hlY2tpbmcgYSBzaW5nbGUgY2xhc3MgZm9yIHNlcmRlIGNvbXBsaWFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VyZGVDbGFzc0NoZWNrUmVzdWx0IHtcbiAgLyoqIFRoZSBjbGFzcyBuYW1lIGFzIGRldGVjdGVkIGluIHRoZSBzb3VyY2UgKi9cbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIC8qKiBUaGUgY2xhc3NJZCBhc3NpZ25lZCBieSB0aGUgU1dDIHBsdWdpbiAoZnJvbSB0aGUgbWFuaWZlc3QpICovXG4gIGNsYXNzSWQ6IHN0cmluZztcbiAgLyoqIFdoZXRoZXIgdGhlIFNXQyBwbHVnaW4gZGV0ZWN0ZWQgc2VyZGUgc3ltYm9scyBvbiB0aGlzIGNsYXNzICovXG4gIGRldGVjdGVkOiBib29sZWFuO1xuICAvKiogV2hldGhlciBhIHJlZ2lzdHJhdGlvbiBJSUZFIHdhcyBnZW5lcmF0ZWQgaW4gdGhlIG91dHB1dCAqL1xuICByZWdpc3RlcmVkOiBib29sZWFuO1xuICAvKipcbiAgICogTm9kZS5qcyBidWlsdC1pbiBtb2R1bGUgaW1wb3J0cyByZW1haW5pbmcgaW4gdGhlIHdvcmtmbG93LW1vZGUgb3V0cHV0LlxuICAgKiBJZiBub24tZW1wdHksIHRoZSBjbGFzcyBpcyBOT1Qgd29ya2Zsb3ctc2FuZGJveCBjb21wbGlhbnQuXG4gICAqL1xuICBub2RlSW1wb3J0czogc3RyaW5nW107XG4gIC8qKiBXaGV0aGVyIHRoZSBjbGFzcyBwYXNzZXMgYWxsIGNvbXBsaWFuY2UgY2hlY2tzICovXG4gIGNvbXBsaWFudDogYm9vbGVhbjtcbiAgLyoqIEh1bWFuLXJlYWRhYmxlIGRlc2NyaXB0aW9ucyBvZiBhbnkgaXNzdWVzIGZvdW5kICovXG4gIGlzc3Vlczogc3RyaW5nW107XG59XG5cbi8qKlxuICogRnVsbCByZXN1bHQgb2Ygc2VyZGUgY29tcGxpYW5jZSBhbmFseXNpcyBmb3IgYSBzb3VyY2UgZmlsZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJkZUNoZWNrUmVzdWx0IHtcbiAgLyoqIFBlci1jbGFzcyBhbmFseXNpcyByZXN1bHRzICovXG4gIGNsYXNzZXM6IFNlcmRlQ2xhc3NDaGVja1Jlc3VsdFtdO1xuICAvKiogQWxsIE5vZGUuanMgYnVpbHQtaW4gaW1wb3J0cyBmb3VuZCBpbiB0aGUgd29ya2Zsb3ctbW9kZSBvdXRwdXQgKi9cbiAgZ2xvYmFsTm9kZUltcG9ydHM6IHN0cmluZ1tdO1xuICAvKiogV2hldGhlciB0aGUgd29ya2Zsb3ctbW9kZSBvdXRwdXQgY29udGFpbnMgYW55IHNlcmRlLXJlbGF0ZWQgY2xhc3NlcyAqL1xuICBoYXNTZXJkZUNsYXNzZXM6IGJvb2xlYW47XG4gIC8qKiBUaGUgcmF3IHdvcmtmbG93IG1hbmlmZXN0IGV4dHJhY3RlZCBmcm9tIHRoZSBTV0MgdHJhbnNmb3JtICovXG4gIG1hbmlmZXN0OiBXb3JrZmxvd01hbmlmZXN0O1xufVxuXG4vKipcbiAqIExpZ2h0d2VpZ2h0IHNlcmRlIGNvbXBsaWFuY2UgY2hlY2tlciB0aGF0IHdvcmtzIHdpdGggcHJlLWNvbXB1dGVkXG4gKiBTV0MgdHJhbnNmb3JtIHJlc3VsdHMuIFRoaXMgYXZvaWRzIHJlLXJ1bm5pbmcgdGhlIFNXQyB0cmFuc2Zvcm1cbiAqIHdoZW4gdGhlIGNhbGxlciBhbHJlYWR5IGhhcyB0aGUgb3V0cHV0cyAoZS5nLiwgdGhlIHBsYXlncm91bmQgb3IgYnVpbGRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplU2VyZGVDb21wbGlhbmNlKG9wdGlvbnM6IHtcbiAgLyoqIFNvdXJjZSBjb2RlICh1c2VkIGZvciBwYXR0ZXJuIGRldGVjdGlvbikgKi9cbiAgc291cmNlQ29kZTogc3RyaW5nO1xuICAvKiogV29ya2Zsb3ctbW9kZSB0cmFuc2Zvcm1lZCBvdXRwdXQgKi9cbiAgd29ya2Zsb3dDb2RlOiBzdHJpbmc7XG4gIC8qKiBNYW5pZmVzdCBleHRyYWN0ZWQgZnJvbSB0aGUgU1dDIHRyYW5zZm9ybSAqL1xuICBtYW5pZmVzdDogV29ya2Zsb3dNYW5pZmVzdDtcbn0pOiBTZXJkZUNoZWNrUmVzdWx0IHtcbiAgY29uc3QgeyBzb3VyY2VDb2RlLCB3b3JrZmxvd0NvZGUsIG1hbmlmZXN0IH0gPSBvcHRpb25zO1xuXG4gIC8vIDEuIEV4dHJhY3QgYWxsIE5vZGUuanMgYnVpbHQtaW4gaW1wb3J0cyBmcm9tIHRoZSB3b3JrZmxvdyBvdXRwdXRcbiAgY29uc3QgZ2xvYmFsTm9kZUltcG9ydHMgPSBleHRyYWN0Tm9kZUltcG9ydHMod29ya2Zsb3dDb2RlKTtcblxuICAvLyAyLiBDaGVjayBpZiB0aGUgbWFuaWZlc3QgY29udGFpbnMgYW55IHNlcmRlLXJlZ2lzdGVyZWQgY2xhc3Nlc1xuICBjb25zdCBjbGFzc0VudHJpZXMgPSBleHRyYWN0Q2xhc3NFbnRyaWVzKG1hbmlmZXN0KTtcbiAgY29uc3QgaGFzU2VyZGVDbGFzc2VzID0gY2xhc3NFbnRyaWVzLmxlbmd0aCA+IDA7XG5cbiAgLy8gMy4gQ2hlY2sgaWYgdGhlIHdvcmtmbG93IG91dHB1dCBjb250YWlucyByZWdpc3RyYXRpb24gSUlGRXNcbiAgY29uc3QgaGFzUmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uSWlmZVJlZ2V4LnRlc3Qod29ya2Zsb3dDb2RlKTtcblxuICAvLyA0LiBBbmFseXplIGVhY2ggY2xhc3NcbiAgY29uc3QgY2xhc3NlczogU2VyZGVDbGFzc0NoZWNrUmVzdWx0W10gPSBjbGFzc0VudHJpZXMubWFwKChlbnRyeSkgPT4ge1xuICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIENoZWNrIGZvciBOb2RlLmpzIGltcG9ydHMgKHRoZXNlIHdpbGwgZmFpbCBpbiB0aGUgd29ya2Zsb3cgc2FuZGJveClcbiAgICBpZiAoZ2xvYmFsTm9kZUltcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgaXNzdWVzLnB1c2goXG4gICAgICAgIGBXb3JrZmxvdyBidW5kbGUgY29udGFpbnMgTm9kZS5qcyBidWlsdC1pbiBpbXBvcnRzOiAke2dsb2JhbE5vZGVJbXBvcnRzLmpvaW4oJywgJyl9LiBgICtcbiAgICAgICAgICBgVGhlc2Ugd2lsbCBmYWlsIGF0IHJ1bnRpbWUgaW4gdGhlIHdvcmtmbG93IHNhbmRib3guIGAgK1xuICAgICAgICAgIGBBZGQgXCJ1c2Ugc3RlcFwiIHRvIG1ldGhvZHMgdGhhdCBkZXBlbmQgb24gTm9kZS5qcyBBUElzIHNvIHRoZXkgYXJlIHN0cmlwcGVkIGZyb20gdGhlIHdvcmtmbG93IGJ1bmRsZS5gXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciByZWdpc3RyYXRpb25cbiAgICBpZiAoIWhhc1JlZ2lzdHJhdGlvbikge1xuICAgICAgaXNzdWVzLnB1c2goXG4gICAgICAgIGBObyBjbGFzcyByZWdpc3RyYXRpb24gSUlGRSB3YXMgZ2VuZXJhdGVkLiBgICtcbiAgICAgICAgICBgRW5zdXJlIFdPUktGTE9XX1NFUklBTElaRSBhbmQgV09SS0ZMT1dfREVTRVJJQUxJWkUgYXJlIGRlZmluZWQgYXMgc3RhdGljIG1ldGhvZHMgYCArXG4gICAgICAgICAgYGluc2lkZSB0aGUgY2xhc3MgYm9keSB1c2luZyBjb21wdXRlZCBwcm9wZXJ0eSBzeW50YXg6IHN0YXRpYyBbV09SS0ZMT1dfU0VSSUFMSVpFXSguLi4pIHsgLi4uIH1gXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjbGFzc05hbWU6IGVudHJ5LmNsYXNzTmFtZSxcbiAgICAgIGNsYXNzSWQ6IGVudHJ5LmNsYXNzSWQsXG4gICAgICBkZXRlY3RlZDogdHJ1ZSxcbiAgICAgIHJlZ2lzdGVyZWQ6IGhhc1JlZ2lzdHJhdGlvbixcbiAgICAgIG5vZGVJbXBvcnRzOiBnbG9iYWxOb2RlSW1wb3J0cyxcbiAgICAgIGNvbXBsaWFudDogZ2xvYmFsTm9kZUltcG9ydHMubGVuZ3RoID09PSAwICYmIGhhc1JlZ2lzdHJhdGlvbixcbiAgICAgIGlzc3VlcyxcbiAgICB9O1xuICB9KTtcblxuICAvLyA1LiBDaGVjayBmb3IgY2xhc3NlcyB0aGF0IGhhdmUgc2VyZGUgcGF0dGVybnMgaW4gc291cmNlIGJ1dCB3ZXJlbid0IGRldGVjdGVkIGJ5IFNXQ1xuICBjb25zdCBzb3VyY2VIYXNTZXJkZVBhdHRlcm5zID1cbiAgICAvXFxbXFxzKldPUktGTE9XXyg/OlNFUklBTElaRXxERVNFUklBTElaRSlcXHMqXFxdLy50ZXN0KHNvdXJjZUNvZGUpIHx8XG4gICAgL1N5bWJvbFxcLmZvclxccypcXChcXHMqWydcIl13b3JrZmxvdy0oPzpzZXJpYWxpemV8ZGVzZXJpYWxpemUpWydcIl1cXHMqXFwpLy50ZXN0KFxuICAgICAgc291cmNlQ29kZVxuICAgICk7XG5cbiAgaWYgKHNvdXJjZUhhc1NlcmRlUGF0dGVybnMgJiYgY2xhc3NFbnRyaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNsYXNzZXMucHVzaCh7XG4gICAgICBjbGFzc05hbWU6ICc8dW5rbm93bj4nLFxuICAgICAgY2xhc3NJZDogJycsXG4gICAgICBkZXRlY3RlZDogZmFsc2UsXG4gICAgICByZWdpc3RlcmVkOiBmYWxzZSxcbiAgICAgIG5vZGVJbXBvcnRzOiBnbG9iYWxOb2RlSW1wb3J0cyxcbiAgICAgIGNvbXBsaWFudDogZmFsc2UsXG4gICAgICBpc3N1ZXM6IFtcbiAgICAgICAgYFNvdXJjZSBjb2RlIGNvbnRhaW5zIFdPUktGTE9XX1NFUklBTElaRS9XT1JLRkxPV19ERVNFUklBTElaRSBwYXR0ZXJucyBidXQgYCArXG4gICAgICAgICAgYHRoZSBTV0MgcGx1Z2luIGRpZCBub3QgZGV0ZWN0IGFueSBzZXJkZS1lbmFibGVkIGNsYXNzZXMuIGAgK1xuICAgICAgICAgIGBFbnN1cmUgdGhlIHN5bWJvbHMgYXJlIGRlZmluZWQgYXMgc3RhdGljIG1ldGhvZHMgSU5TSURFIHRoZSBjbGFzcyBib2R5LCBgICtcbiAgICAgICAgICBgbm90IGFzc2lnbmVkIGV4dGVybmFsbHkgKGUuZy4sIChNeUNsYXNzIGFzIGFueSlbV09SS0ZMT1dfU0VSSUFMSVpFXSA9IC4uLikuYCxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNsYXNzZXMsXG4gICAgZ2xvYmFsTm9kZUltcG9ydHMsXG4gICAgaGFzU2VyZGVDbGFzc2VzLFxuICAgIG1hbmlmZXN0LFxuICB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgTm9kZS5qcyBidWlsdC1pbiBtb2R1bGUgbmFtZXMgZnJvbSB0cmFuc2Zvcm1lZCBjb2RlLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Tm9kZUltcG9ydHMoY29kZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBpbXBvcnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIC8vIFJlc2V0IHJlZ2V4IHN0YXRlXG4gIG5vZGVJbXBvcnRFeHRyYWN0UmVnZXgubGFzdEluZGV4ID0gMDtcbiAgZm9yIChcbiAgICBsZXQgbWF0Y2ggPSBub2RlSW1wb3J0RXh0cmFjdFJlZ2V4LmV4ZWMoY29kZSk7XG4gICAgbWF0Y2ggIT09IG51bGw7XG4gICAgbWF0Y2ggPSBub2RlSW1wb3J0RXh0cmFjdFJlZ2V4LmV4ZWMoY29kZSlcbiAgKSB7XG4gICAgLy8gbWF0Y2hbMV0gaXMgZnJvbSB0aGUgRVNNIHBhdHRlcm4sIG1hdGNoWzJdIGlzIGZyb20gdGhlIENKUyBwYXR0ZXJuXG4gICAgY29uc3QgbW9kdWxlTmFtZSA9IG1hdGNoWzFdIHx8IG1hdGNoWzJdO1xuICAgIGlmIChtb2R1bGVOYW1lKSB7XG4gICAgICAvLyBOb3JtYWxpemUgdG8gYmFzZSBtb2R1bGUgbmFtZSAoZS5nLiwgJ2ZzL3Byb21pc2VzJyAtPiAnZnMnKVxuICAgICAgaW1wb3J0cy5hZGQobW9kdWxlTmFtZS5zcGxpdCgnLycpWzBdKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFsuLi5pbXBvcnRzXS5zb3J0KCk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBjbGFzcyBlbnRyaWVzIGZyb20gYSBXb3JrZmxvd01hbmlmZXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdENsYXNzRW50cmllcyhcbiAgbWFuaWZlc3Q6IFdvcmtmbG93TWFuaWZlc3Rcbik6IEFycmF5PHsgY2xhc3NOYW1lOiBzdHJpbmc7IGNsYXNzSWQ6IHN0cmluZzsgZmlsZU5hbWU6IHN0cmluZyB9PiB7XG4gIGNvbnN0IGVudHJpZXM6IEFycmF5PHtcbiAgICBjbGFzc05hbWU6IHN0cmluZztcbiAgICBjbGFzc0lkOiBzdHJpbmc7XG4gICAgZmlsZU5hbWU6IHN0cmluZztcbiAgfT4gPSBbXTtcbiAgaWYgKCFtYW5pZmVzdC5jbGFzc2VzKSByZXR1cm4gZW50cmllcztcblxuICBmb3IgKGNvbnN0IFtmaWxlTmFtZSwgY2xhc3Nlc10gb2YgT2JqZWN0LmVudHJpZXMobWFuaWZlc3QuY2xhc3NlcykpIHtcbiAgICBmb3IgKGNvbnN0IFtjbGFzc05hbWUsIHsgY2xhc3NJZCB9XSBvZiBPYmplY3QuZW50cmllcyhjbGFzc2VzKSkge1xuICAgICAgZW50cmllcy5wdXNoKHsgY2xhc3NOYW1lLCBjbGFzc0lkLCBmaWxlTmFtZSB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGVudHJpZXM7XG59XG4iLCAiaW1wb3J0IHtcbiAgQ29ycnVwdGVkRXZlbnRMb2dFcnJvcixcbiAgRW50aXR5Q29uZmxpY3RFcnJvcixcbiAgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IsXG4gIFJlcGxheURpdmVyZ2VuY2VFcnJvcixcbiAgUlVOX0VSUk9SX0NPREVTLFxuICBSdW5FeHBpcmVkRXJyb3IsXG4gIFdvcmtmbG93UnVudGltZUVycm9yLFxufSBmcm9tICdAd29ya2Zsb3cvZXJyb3JzJztcbmltcG9ydCB7IHNldFdvcmtmbG93QmFzZVBhdGggfSBmcm9tICdAd29ya2Zsb3cvdXRpbHMnO1xuaW1wb3J0IHsgcGFyc2VXb3JrZmxvd05hbWUgfSBmcm9tICdAd29ya2Zsb3cvdXRpbHMvcGFyc2UtbmFtZSc7XG5pbXBvcnQge1xuICB0eXBlIEV2ZW50LFxuICBnZXRRdWV1ZVRvcGljUHJlZml4LFxuICByZXNvbHZlUXVldWVOYW1lc3BhY2UsXG4gIFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICBTUEVDX1ZFUlNJT05fTEVHQUNZLFxuICBXb3JrZmxvd0ludm9rZVBheWxvYWRTY2hlbWEsXG4gIHR5cGUgV29ya2Zsb3dSdW4sXG59IGZyb20gJ0B3b3JrZmxvdy93b3JsZCc7XG5pbXBvcnQge1xuICBjbGFzc2lmeVJ1bkVycm9yLFxuICBpc1JldHJ5YWJsZVdvcmxkRXJyb3IsXG4gIGlzV29ybGRDb250cmFjdEVycm9yLFxufSBmcm9tICcuL2NsYXNzaWZ5LWVycm9yLmpzJztcbmltcG9ydCB7IGltcG9ydEtleSB9IGZyb20gJy4vZW5jcnlwdGlvbi5qcyc7XG5pbXBvcnQgeyBXb3JrZmxvd1N1c3BlbnNpb24gfSBmcm9tICcuL2dsb2JhbC5qcyc7XG5pbXBvcnQgeyBydW50aW1lTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXIuanMnO1xuaW1wb3J0IHtcbiAgTUFYX1FVRVVFX0RFTElWRVJJRVMsXG4gIFJFUExBWV9ESVZFUkdFTkNFX01BWF9SRVRSSUVTLFxuICBSRVBMQVlfVElNRU9VVF9NQVhfUkVUUklFUyxcbiAgUkVQTEFZX1RJTUVPVVRfTVMsXG59IGZyb20gJy4vcnVudGltZS9jb25zdGFudHMuanMnO1xuaW1wb3J0IHtcbiAgZ2V0UXVldWVPdmVyaGVhZCxcbiAgZ2V0V29ya2Zsb3dRdWV1ZU5hbWUsXG4gIGdldFdvcmtmbG93UnVuRXZlbnRzLFxuICBoYW5kbGVIZWFsdGhDaGVja01lc3NhZ2UsXG4gIHR5cGUgTXV0YWJsZUV2ZW50TG9nLFxuICBwYXJzZUhlYWx0aENoZWNrUGF5bG9hZCxcbiAgcXVldWVNZXNzYWdlLFxuICBzdGF0ZVVwZGF0ZWRBdEZvckNyZWF0ZSxcbiAgd2l0aEhlYWx0aENoZWNrLFxuICB3aXRoUHJlY29uZGl0aW9uUmV0cnksXG59IGZyb20gJy4vcnVudGltZS9oZWxwZXJzLmpzJztcbmltcG9ydCB7IGhhbmRsZVN1c3BlbnNpb24gfSBmcm9tICcuL3J1bnRpbWUvc3VzcGVuc2lvbi1oYW5kbGVyLmpzJztcbmltcG9ydCB7IGdldFdvcmxkLCBnZXRXb3JsZEhhbmRsZXJzIH0gZnJvbSAnLi9ydW50aW1lL3dvcmxkLmpzJztcbmltcG9ydCB7IHJlbWFwRXJyb3JTdGFjayB9IGZyb20gJy4vc291cmNlLW1hcC5qcyc7XG5pbXBvcnQgKiBhcyBBdHRyaWJ1dGUgZnJvbSAnLi90ZWxlbWV0cnkvc2VtYW50aWMtY29udmVudGlvbnMuanMnO1xuaW1wb3J0IHtcbiAgbGlua1RvQ3VycmVudENvbnRleHQsXG4gIHRyYWNlLFxuICB3aXRoVHJhY2VDb250ZXh0LFxuICB3aXRoV29ya2Zsb3dCYWdnYWdlLFxufSBmcm9tICcuL3RlbGVtZXRyeS5qcyc7XG5pbXBvcnQgeyBnZXRFcnJvck5hbWUsIGdldEVycm9yU3RhY2ssIG5vcm1hbGl6ZVVua25vd25FcnJvciB9IGZyb20gJy4vdHlwZXMuanMnO1xuaW1wb3J0IHsgYnVpbGRXb3JrZmxvd1N1c3BlbnNpb25NZXNzYWdlIH0gZnJvbSAnLi91dGlsLmpzJztcbmltcG9ydCB7IHJ1bldvcmtmbG93IH0gZnJvbSAnLi93b3JrZmxvdy5qcyc7XG5cbmV4cG9ydCB0eXBlIHsgRXZlbnQsIFdvcmtmbG93UnVuIH07XG5leHBvcnQgeyBXb3JrZmxvd1N1c3BlbnNpb24gfSBmcm9tICcuL2dsb2JhbC5qcyc7XG5leHBvcnQge1xuICB0eXBlIEhlYWx0aENoZWNrRW5kcG9pbnQsXG4gIHR5cGUgSGVhbHRoQ2hlY2tPcHRpb25zLFxuICB0eXBlIEhlYWx0aENoZWNrUmVzdWx0LFxuICBoZWFsdGhDaGVjayxcbn0gZnJvbSAnLi9ydW50aW1lL2hlbHBlcnMuanMnO1xuZXhwb3J0IHtcbiAgZ2V0SG9va0J5VG9rZW4sXG4gIHJlc3VtZUhvb2ssXG4gIHJlc3VtZVdlYmhvb2ssXG59IGZyb20gJy4vcnVudGltZS9yZXN1bWUtaG9vay5qcyc7XG5leHBvcnQge1xuICBnZXRSdW4sXG4gIFJ1bixcbiAgdHlwZSBXb3JrZmxvd1JlYWRhYmxlU3RyZWFtLFxuICB0eXBlIFdvcmtmbG93UmVhZGFibGVTdHJlYW1PcHRpb25zLFxufSBmcm9tICcuL3J1bnRpbWUvcnVuLmpzJztcbmV4cG9ydCB7XG4gIGNhbmNlbFJ1bixcbiAgbGlzdFN0cmVhbXMsXG4gIHR5cGUgUmVhZFN0cmVhbU9wdGlvbnMsXG4gIHR5cGUgUmVjcmVhdGVSdW5PcHRpb25zLFxuICByZWFkU3RyZWFtLFxuICByZWNyZWF0ZVJ1bkZyb21FeGlzdGluZyxcbiAgcmVlbnF1ZXVlUnVuLFxuICB0eXBlIFN0b3BTbGVlcE9wdGlvbnMsXG4gIHR5cGUgU3RvcFNsZWVwUmVzdWx0LFxuICB3YWtlVXBSdW4sXG59IGZyb20gJy4vcnVudGltZS9ydW5zLmpzJztcbmV4cG9ydCB7XG4gIHR5cGUgU3RhcnRPcHRpb25zLFxuICB0eXBlIFN0YXJ0T3B0aW9uc0Jhc2UsXG4gIHR5cGUgU3RhcnRPcHRpb25zV2l0aERlcGxveW1lbnRJZCxcbiAgdHlwZSBTdGFydE9wdGlvbnNXaXRob3V0RGVwbG95bWVudElkLFxuICBzdGFydCxcbn0gZnJvbSAnLi9ydW50aW1lL3N0YXJ0LmpzJztcbmV4cG9ydCB7IHN0ZXBFbnRyeXBvaW50IH0gZnJvbSAnLi9ydW50aW1lL3N0ZXAtaGFuZGxlci5qcyc7XG5leHBvcnQge1xuICBjcmVhdGVXb3JsZCxcbiAgZ2V0V29ybGQsXG4gIGdldFdvcmxkSGFuZGxlcnMsXG4gIHNldFdvcmxkLFxufSBmcm9tICcuL3J1bnRpbWUvd29ybGQuanMnO1xuXG5mdW5jdGlvbiBoYXNSZWNvcmRlZFRlcm1pbmFsUnVuRXZlbnQoZXZlbnRzOiBFdmVudFtdLCBydW5JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRlcm1pbmFsRXZlbnQgPSBldmVudHMuZmluZChcbiAgICAoZXZlbnQpID0+XG4gICAgICBldmVudC5ydW5JZCA9PT0gcnVuSWQgJiZcbiAgICAgIChldmVudC5ldmVudFR5cGUgPT09ICdydW5fY29tcGxldGVkJyB8fFxuICAgICAgICBldmVudC5ldmVudFR5cGUgPT09ICdydW5fZmFpbGVkJyB8fFxuICAgICAgICBldmVudC5ldmVudFR5cGUgPT09ICdydW5fY2FuY2VsbGVkJylcbiAgKTtcblxuICBpZiAoIXRlcm1pbmFsRXZlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBydW50aW1lTG9nZ2VyLmluZm8oXG4gICAgJ1dvcmtmbG93IGV2ZW50IGxvZyBhbHJlYWR5IGNvbnRhaW5zIGEgdGVybWluYWwgcnVuIGV2ZW50LCBza2lwcGluZyByZXBsYXknLFxuICAgIHtcbiAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgZXZlbnRUeXBlOiB0ZXJtaW5hbEV2ZW50LmV2ZW50VHlwZSxcbiAgICAgIGV2ZW50SWQ6IHRlcm1pbmFsRXZlbnQuZXZlbnRJZCxcbiAgICB9XG4gICk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBhIHNpbmdsZSByb3V0ZSB3aGljaCBoYW5kbGVzIGFueSB3b3JrZmxvdyBleGVjdXRpb25cbiAqIHJlcXVlc3QgYW5kIHJvdXRlcyB0byB0aGUgYXBwcm9wcmlhdGUgd29ya2Zsb3cgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHdvcmtmbG93Q29kZSAtIFRoZSB3b3JrZmxvdyBidW5kbGUgY29kZSBjb250YWluaW5nIGFsbCB0aGUgd29ya2Zsb3dcbiAqIGZ1bmN0aW9ucyBhdCB0aGUgdG9wIGxldmVsLlxuICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIGFzIGEgVmVyY2VsIEFQSSByb3V0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdvcmtmbG93RW50cnlwb2ludChcbiAgd29ya2Zsb3dDb2RlOiBzdHJpbmcsXG4gIG9wdGlvbnM/OiB7IG5hbWVzcGFjZT86IHN0cmluZzsgYmFzZVBhdGg/OiBzdHJpbmcgfVxuKTogKHJlcTogUmVxdWVzdCkgPT4gUHJvbWlzZTxSZXNwb25zZT4ge1xuICBzZXRXb3JrZmxvd0Jhc2VQYXRoKG9wdGlvbnM/LmJhc2VQYXRoKTtcblxuICBjb25zdCBuYW1lc3BhY2UgPSByZXNvbHZlUXVldWVOYW1lc3BhY2Uob3B0aW9ucz8ubmFtZXNwYWNlKTtcbiAgY29uc3Qgd29ya2Zsb3dQcmVmaXggPSBnZXRRdWV1ZVRvcGljUHJlZml4KCd3b3JrZmxvdycsIG5hbWVzcGFjZSk7XG5cbiAgY29uc3QgeyBjcmVhdGVRdWV1ZUhhbmRsZXIsIHNwZWNWZXJzaW9uOiB3b3JsZFNwZWNWZXJzaW9uIH0gPVxuICAgIGdldFdvcmxkSGFuZGxlcnMoKTtcbiAgY29uc3QgaGFuZGxlciA9IGNyZWF0ZVF1ZXVlSGFuZGxlcihcbiAgICB3b3JrZmxvd1ByZWZpeCxcbiAgICBhc3luYyAobWVzc2FnZV8sIG1ldGFkYXRhKSA9PiB7XG4gICAgICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgaGVhbHRoIGNoZWNrIG1lc3NhZ2VcbiAgICAgIC8vIE5PVEU6IEhlYWx0aCBjaGVjayBtZXNzYWdlcyBhcmUgaW50ZW50aW9uYWxseSB1bmF1dGhlbnRpY2F0ZWQgZm9yIG1vbml0b3JpbmcgcHVycG9zZXMuXG4gICAgICAvLyBUaGV5IG9ubHkgd3JpdGUgYSBzaW1wbGUgc3RhdHVzIHJlc3BvbnNlIHRvIGEgc3RyZWFtIGFuZCBkbyBub3QgZXhwb3NlIHNlbnNpdGl2ZSBkYXRhLlxuICAgICAgLy8gVGhlIHN0cmVhbSBuYW1lIGluY2x1ZGVzIGEgdW5pcXVlIGNvcnJlbGF0aW9uSWQgdGhhdCBtdXN0IGJlIGtub3duIGJ5IHRoZSBjYWxsZXIuXG4gICAgICBjb25zdCBoZWFsdGhDaGVjayA9IHBhcnNlSGVhbHRoQ2hlY2tQYXlsb2FkKG1lc3NhZ2VfKTtcbiAgICAgIGlmIChoZWFsdGhDaGVjaykge1xuICAgICAgICBhd2FpdCBoYW5kbGVIZWFsdGhDaGVja01lc3NhZ2UoXG4gICAgICAgICAgaGVhbHRoQ2hlY2ssXG4gICAgICAgICAgJ3dvcmtmbG93JyxcbiAgICAgICAgICB3b3JsZFNwZWNWZXJzaW9uXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICBydW5JZCxcbiAgICAgICAgdHJhY2VDYXJyaWVyOiB0cmFjZUNvbnRleHQsXG4gICAgICAgIHJlcXVlc3RlZEF0LFxuICAgICAgICByZXBsYXlEaXZlcmdlbmNlLFxuICAgICAgICBydW5JbnB1dCxcbiAgICAgIH0gPSBXb3JrZmxvd0ludm9rZVBheWxvYWRTY2hlbWEucGFyc2UobWVzc2FnZV8pO1xuICAgICAgY29uc3QgeyByZXF1ZXN0SWQgfSA9IG1ldGFkYXRhO1xuICAgICAgLy8gRXh0cmFjdCB0aGUgd29ya2Zsb3cgbmFtZSBmcm9tIHRoZSB0b3BpYyBuYW1lXG4gICAgICBjb25zdCB3b3JrZmxvd05hbWUgPSBtZXRhZGF0YS5xdWV1ZU5hbWUuc2xpY2Uod29ya2Zsb3dQcmVmaXgubGVuZ3RoKTtcblxuICAgICAgLy8gLS0tIE1heCBkZWxpdmVyeSBjaGVjayAtLS1cbiAgICAgIC8vIEVuZm9yY2UgbWF4IGRlbGl2ZXJ5IGxpbWl0IGJlZm9yZSBhbnkgaW5mcmFzdHJ1Y3R1cmUgY2FsbHMuXG4gICAgICAvLyBUaGlzIHByZXZlbnRzIHJ1bmF3YXkgd29ya2Zsb3dzIGZyb20gY29uc3VtaW5nIGluZmluaXRlIHF1ZXVlIGRlbGl2ZXJpZXMuXG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSB3YW50IHRvIGRvIHRoZSBtaW5pbWFsIGFtb3VudCBvZiB3b3JrIChubyBmZXRjaGluZ1xuICAgICAgLy8gb2YgdGhlIHdvcmtmbG93IGV2ZW50cywgZXRjLiBXZSBzaW1wbHkgYXR0ZW1wdCB0byBtYXJrIHRoZSBydW4gYXMgZmFpbGVkXG4gICAgICAvLyBhbmQgaWYgdGhhdCBmYWlscywgdGhlIG1lc3NhZ2UgaXMgc3RpbGwgY29uc3VtZWQgYnV0IHdpdGggYWRlcXVhdGUgbG9nZ2luZ1xuICAgICAgLy8gdGhhdCBhbiBlcnJvciBvY2N1cnJlZCBwcmV2ZW50aW5nIHVzIGZyb20gZmFpbGluZyB0aGUgcnVuLlxuICAgICAgaWYgKG1ldGFkYXRhLmF0dGVtcHQgPiBNQVhfUVVFVUVfREVMSVZFUklFUykge1xuICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgIGBXb3JrZmxvdyBoYW5kbGVyIGV4Y2VlZGVkIG1heCBkZWxpdmVyaWVzICgke21ldGFkYXRhLmF0dGVtcHR9LyR7TUFYX1FVRVVFX0RFTElWRVJJRVN9KWAsXG4gICAgICAgICAgeyB3b3JrZmxvd1J1bklkOiBydW5JZCwgd29ya2Zsb3dOYW1lLCBhdHRlbXB0OiBtZXRhZGF0YS5hdHRlbXB0IH1cbiAgICAgICAgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB3b3JsZCA9IGdldFdvcmxkKCk7XG4gICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFdvcmtmbG93IGV4Y2VlZGVkIG1heGltdW0gcXVldWUgZGVsaXZlcmllcyAoJHttZXRhZGF0YS5hdHRlbXB0fS8ke01BWF9RVUVVRV9ERUxJVkVSSUVTfSlgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuTUFYX0RFTElWRVJJRVNfRVhDRUVERUQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeyByZXF1ZXN0SWQgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmIChFbnRpdHlDb25mbGljdEVycm9yLmlzKGVycikgfHwgUnVuRXhwaXJlZEVycm9yLmlzKGVycikpIHtcbiAgICAgICAgICAgIC8vIFJ1biBhbHJlYWR5IGZpbmlzaGVkLCBjb25zdW1lIHRoZSBtZXNzYWdlIHNpbGVudGx5XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICBgRmFpbGVkIHRvIG1hcmsgcnVuIGFzIGZhaWxlZCBhZnRlciAke21ldGFkYXRhLmF0dGVtcHR9IGRlbGl2ZXJ5IGF0dGVtcHRzLiBgICtcbiAgICAgICAgICAgICAgYEEgcGVyc2lzdGVudCBlcnJvciBpcyBwcmV2ZW50aW5nIHRoZSBydW4gZnJvbSBiZWluZyB0ZXJtaW5hdGVkLiBgICtcbiAgICAgICAgICAgICAgYFRoZSBydW4gd2lsbCByZW1haW4gaW4gaXRzIGN1cnJlbnQgc3RhdGUgdW50aWwgbWFudWFsbHkgcmVzb2x2ZWQuIGAgK1xuICAgICAgICAgICAgICBgVGhpcyBpcyBtb3N0IGxpa2VseSBkdWUgdG8gYSBwZXJzaXN0ZW50IG91dGFnZSBvZiB0aGUgd29ya2Zsb3cgYmFja2VuZCBgICtcbiAgICAgICAgICAgICAgYG9yIGEgYnVnIGluIHRoZSB3b3JrZmxvdyBydW50aW1lIGFuZCBzaG91bGQgYmUgcmVwb3J0ZWQgdG8gdGhlIFdvcmtmbG93IHRlYW0uYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgIGVycm9yOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgICAgICAgICAgIGF0dGVtcHQ6IG1ldGFkYXRhLmF0dGVtcHQsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNwYW5MaW5rcyA9IGF3YWl0IGxpbmtUb0N1cnJlbnRDb250ZXh0KCk7XG5cbiAgICAgIC8vIC0tLSBSZXBsYXkgdGltZW91dCBndWFyZCAtLS1cbiAgICAgIC8vIElmIHRoZSByZXBsYXkgdGFrZXMgbG9uZ2VyIHRoYW4gdGhlIHRpbWVvdXQsIGZhaWwgdGhlIHJ1biBhbmQgZXhpdC5cbiAgICAgIC8vIFRoaXMgbXVzdCBiZSBsb3dlciB0aGFuIHRoZSBmdW5jdGlvbidzIG1heER1cmF0aW9uIHRvIGVuc3VyZVxuICAgICAgLy8gdGhlIGZhaWx1cmUgaXMgcmVjb3JkZWQgYmVmb3JlIHRoZSBwbGF0Zm9ybSBraWxscyB0aGUgZnVuY3Rpb24uXG4gICAgICBsZXQgcmVwbGF5VGltZW91dDogTm9kZUpTLlRpbWVvdXQgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuVkVSQ0VMX1VSTCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlcGxheVRpbWVvdXQgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKCdXb3JrZmxvdyByZXBsYXkgZXhjZWVkZWQgdGltZW91dCcsIHtcbiAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgICAgICAgdGltZW91dE1zOiBSRVBMQVlfVElNRU9VVF9NUyxcbiAgICAgICAgICAgIGF0dGVtcHQ6IG1ldGFkYXRhLmF0dGVtcHQsXG4gICAgICAgICAgICBtYXhSZXRyaWVzOiBSRVBMQVlfVElNRU9VVF9NQVhfUkVUUklFUyxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIEFsbG93IGEgZmV3IHJldHJpZXMgYmVmb3JlIHBlcm1hbmVudGx5IGZhaWxpbmcgdGhlIHJ1bi5cbiAgICAgICAgICAvLyBPbiBlYXJseSBhdHRlbXB0cywganVzdCBleGl0IHNvIHRoZSBxdWV1ZSByZXRyaWVzIHRoZSBtZXNzYWdlLlxuICAgICAgICAgIGlmIChtZXRhZGF0YS5hdHRlbXB0IDw9IFJFUExBWV9USU1FT1VUX01BWF9SRVRSSUVTKSB7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkID0gYXdhaXQgZ2V0V29ybGQoKTtcbiAgICAgICAgICAgIGF3YWl0IHdvcmxkLmV2ZW50cy5jcmVhdGUoXG4gICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZXZlbnRUeXBlOiAncnVuX2ZhaWxlZCcsXG4gICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFdvcmtmbG93IHJlcGxheSBleGNlZWRlZCBtYXhpbXVtIGR1cmF0aW9uICgke1JFUExBWV9USU1FT1VUX01TIC8gMTAwMH1zKSBhZnRlciAke21ldGFkYXRhLmF0dGVtcHR9IGF0dGVtcHRzYCxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5SRVBMQVlfVElNRU9VVCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gQmVzdCBlZmZvcnQg4oCUIHByb2Nlc3MgZXhpdHMgcmVnYXJkbGVzc1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBOb3RlIHRoYXQgdGhpcyBhbHNvIHByZXZlbnRzIHRoZSBydW50aW1lIGZyb20gYWNraW5nIHRoZSBxdWV1ZSBtZXNzYWdlLFxuICAgICAgICAgIC8vIHNvIHRoZSBxdWV1ZSB3aWxsIGNhbGwgYmFjayBvbmNlLCBhZnRlciB3aGljaCBhIDQxMCB3aWxsIGdldCBpdCB0byBleGl0IGVhcmx5LlxuICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfSwgUkVQTEFZX1RJTUVPVVRfTVMpO1xuICAgICAgICByZXBsYXlUaW1lb3V0LnVucmVmKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEludm9rZSB1c2VyIHdvcmtmbG93IHdpdGhpbiB0aGUgcHJvcGFnYXRlZCB0cmFjZSBjb250ZXh0IGFuZCBiYWdnYWdlXG4gICAgICByZXR1cm4gYXdhaXQgd2l0aFRyYWNlQ29udGV4dCh0cmFjZUNvbnRleHQsIGFzeW5jICgpID0+IHtcbiAgICAgICAgLy8gU2V0IHdvcmtmbG93IGNvbnRleHQgYXMgYmFnZ2FnZSBmb3IgYXV0b21hdGljIHByb3BhZ2F0aW9uXG4gICAgICAgIHJldHVybiBhd2FpdCB3aXRoV29ya2Zsb3dCYWdnYWdlKFxuICAgICAgICAgIHsgd29ya2Zsb3dSdW5JZDogcnVuSWQsIHdvcmtmbG93TmFtZSB9LFxuICAgICAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkID0gZ2V0V29ybGQoKTtcbiAgICAgICAgICAgIHJldHVybiB0cmFjZShcbiAgICAgICAgICAgICAgYFdPUktGTE9XICR7d29ya2Zsb3dOYW1lfWAsXG4gICAgICAgICAgICAgIHsgbGlua3M6IHNwYW5MaW5rcyB9LFxuICAgICAgICAgICAgICBhc3luYyAoc3BhbikgPT4ge1xuICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93TmFtZSh3b3JrZmxvd05hbWUpLFxuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93T3BlcmF0aW9uKCdleGVjdXRlJyksXG4gICAgICAgICAgICAgICAgICAvLyBTdGFuZGFyZCBPVEVMIG1lc3NhZ2luZyBjb252ZW50aW9uc1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLk1lc3NhZ2luZ1N5c3RlbSgndmVyY2VsLXF1ZXVlJyksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuTWVzc2FnaW5nRGVzdGluYXRpb25OYW1lKG1ldGFkYXRhLnF1ZXVlTmFtZSksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuTWVzc2FnaW5nTWVzc2FnZUlkKG1ldGFkYXRhLm1lc3NhZ2VJZCksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuTWVzc2FnaW5nT3BlcmF0aW9uVHlwZSgncHJvY2VzcycpLFxuICAgICAgICAgICAgICAgICAgLi4uZ2V0UXVldWVPdmVyaGVhZCh7IHJlcXVlc3RlZEF0IH0pLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogdmFsaWRhdGUgYHdvcmtmbG93TmFtZWAgZXhpc3RzIGJlZm9yZSBjb25zdW1pbmcgbWVzc2FnZT9cblxuICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93UnVuSWQocnVuSWQpLFxuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93VHJhY2VQcm9wYWdhdGVkKCEhdHJhY2VDb250ZXh0KSxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGxldCB3b3JrZmxvd1N0YXJ0ZWRBdCA9IC0xO1xuICAgICAgICAgICAgICAgIGxldCB3b3JrZmxvd1J1bjogV29ya2Zsb3dSdW4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgLy8gUHJlLWxvYWRlZCBldmVudHMgZnJvbSB0aGUgcnVuX3N0YXJ0ZWQgcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgLy8gV2hlbiBwcmVzZW50LCB3ZSBza2lwIHRoZSBldmVudHMubGlzdCBjYWxsLlxuICAgICAgICAgICAgICAgIGxldCBwcmVsb2FkZWRFdmVudHM6IEV2ZW50W10gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbGV0IHByZWxvYWRlZEV2ZW50c0N1cnNvcjogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgIC8vIC0tLSBJbmZyYXN0cnVjdHVyZTogcHJlcGFyZSB0aGUgcnVuIHN0YXRlIC0tLVxuICAgICAgICAgICAgICAgIC8vIEFsd2F5cyBjYWxsIHJ1bl9zdGFydGVkIGRpcmVjdGx5IOKAlCB0aGlzIGJvdGggdHJhbnNpdGlvbnNcbiAgICAgICAgICAgICAgICAvLyB0aGUgcnVuIHRvICdydW5uaW5nJyBBTkQgcmV0dXJucyB0aGUgcnVuIGVudGl0eSwgc2F2aW5nXG4gICAgICAgICAgICAgICAgLy8gYSBzZXBhcmF0ZSBydW5zLmdldCByb3VuZC10cmlwLlxuICAgICAgICAgICAgICAgIC8vIENvbnRyYWN0OiBldmVudHMuY3JlYXRlKCdydW5fc3RhcnRlZCcpIG11c3QgYmUgaWRlbXBvdGVudFxuICAgICAgICAgICAgICAgIC8vIGZvciBydW5zIGFscmVhZHkgaW4gJ3J1bm5pbmcnIHN0YXR1cyAocmV0dXJuIHRoZSBydW5cbiAgICAgICAgICAgICAgICAvLyB3aXRob3V0IGVycm9yKSwgbm90IGp1c3QgZm9yIHBlbmRpbmcg4oaSIHJ1bm5pbmcgdHJhbnNpdGlvbnMuXG4gICAgICAgICAgICAgICAgLy8gTmV0d29yay9zZXJ2ZXIgZXJyb3JzIHByb3BhZ2F0ZSB0byB0aGUgcXVldWUgaGFuZGxlciBmb3IgcmV0cnkuXG4gICAgICAgICAgICAgICAgLy8gV29ya2Zsb3dSdW50aW1lRXJyb3IgKGRhdGEgaW50ZWdyaXR5IGlzc3VlcykgYXJlIGZhdGFsIGFuZFxuICAgICAgICAgICAgICAgIC8vIHByb2R1Y2UgcnVuX2ZhaWxlZCBzaW5jZSByZXRyeWluZyB3b24ndCBmaXggdGhlbS5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fc3RhcnRlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIHRoZSBzcGVjIHZlcnNpb24gZnJvbSB0aGUgb3JpZ2luYWwgc3RhcnQoKSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gd2hlbiBhdmFpbGFibGUsIHNvIHRoZSByZXNpbGllbnQgc3RhcnQgcGF0aCBjcmVhdGVzXG4gICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHJ1biB3aXRoIHRoZSBjb3JyZWN0IHZlcnNpb24gKG5vdCBhbHdheXMgY3VycmVudCkuXG4gICAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5JbnB1dD8uc3BlY1ZlcnNpb24gPz8gU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gUGFzcyBydW4gaW5wdXQgZnJvbSBxdWV1ZSBzbyB0aGUgc2VydmVyIGNhblxuICAgICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgcnVuIGlmIHJ1bl9jcmVhdGVkIHdhcyBtaXNzZWQuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gVWludDhBcnJheSB2YWx1ZXMgc3Vydml2ZSB0aGUgcXVldWUgbmF0aXZlbHlcbiAgICAgICAgICAgICAgICAgICAgICAvLyAoQ0JPUiBvbiB3b3JsZC12ZXJjZWwsIEpTT04gcmV2aXZlciBvbiB3b3JsZC1sb2NhbCkuXG4gICAgICAgICAgICAgICAgICAgICAgLi4uKHJ1bklucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiBydW5JbnB1dC5pbnB1dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcGxveW1lbnRJZDogcnVuSW5wdXQuZGVwbG95bWVudElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dOYW1lOiBydW5JbnB1dC53b3JrZmxvd05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRpb25Db250ZXh0OiBydW5JbnB1dC5leGVjdXRpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDoge30pLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQucnVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBXb3JrZmxvd1J1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICBgRXZlbnQgY3JlYXRpb24gZm9yICdydW5fc3RhcnRlZCcgZGlkIG5vdCByZXR1cm4gdGhlIHJ1biBlbnRpdHkgZm9yIHJ1biBcIiR7cnVuSWR9XCJgXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1biA9IHJlc3VsdC5ydW47XG5cbiAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSByZXNwb25zZSBpbmNsdWRlcyBldmVudHMsIHVzZSB0aGVtIHRvIHNraXBcbiAgICAgICAgICAgICAgICAgIC8vIHRoZSBpbml0aWFsIGV2ZW50cy5saXN0IGNhbGwgYW5kIHJlZHVjZSBUVEZCLlxuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZXZlbnRzICYmXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ldmVudHMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuaGFzTW9yZSAhPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWxvYWRlZEV2ZW50cyA9IHJlc3VsdC5ldmVudHM7XG4gICAgICAgICAgICAgICAgICAgIHByZWxvYWRlZEV2ZW50c0N1cnNvciA9IHJlc3VsdC5jdXJzb3I7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmICghd29ya2Zsb3dSdW4uc3RhcnRlZEF0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBXb3JrZmxvd1J1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICBgV29ya2Zsb3cgcnVuIFwiJHtydW5JZH1cIiBoYXMgbm8gXCJzdGFydGVkQXRcIiB0aW1lc3RhbXBgXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAvLyBSdW4gd2FzIGNvbmN1cnJlbnRseSBjb21wbGV0ZWQvZmFpbGVkL2NhbmNlbGxlZFxuICAgICAgICAgICAgICAgICAgaWYgKEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZXJyKSB8fCBSdW5FeHBpcmVkRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBFbnRpdHlDb25mbGljdEVycm9yOiBydW4gd2FzIGNvbmN1cnJlbnRseVxuICAgICAgICAgICAgICAgICAgICAvLyBjb21wbGV0ZWQvZmFpbGVkL2NhbmNlbGxlZCBkdXJpbmcgc2V0dXAuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJ1bkV4cGlyZWRFcnJvcjogcnVuIGFscmVhZHkgaW4gdGVybWluYWwgc3RhdGUuXG4gICAgICAgICAgICAgICAgICAgIC8vIEluIGJvdGggY2FzZXMsIHNraXAgcHJvY2Vzc2luZyB0aGlzIG1lc3NhZ2UuXG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICAgICAgICAgICAnUnVuIGFscmVhZHkgZmluaXNoZWQgZHVyaW5nIHNldHVwLCBza2lwcGluZycsXG4gICAgICAgICAgICAgICAgICAgICAgeyB3b3JrZmxvd1J1bklkOiBydW5JZCwgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVyciBpbnN0YW5jZW9mIFdvcmtmbG93UnVudGltZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgJ0ZhdGFsIHJ1bnRpbWUgZXJyb3IgZHVyaW5nIHdvcmtmbG93IHNldHVwJyxcbiAgICAgICAgICAgICAgICAgICAgICB7IHdvcmtmbG93UnVuSWQ6IHJ1bklkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHdvcmxkLmV2ZW50cy5jcmVhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiAncnVuX2ZhaWxlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNWZXJzaW9uOiBTUEVDX1ZFUlNJT05fQ1VSUkVOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnREYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2s6IGVyci5zdGFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZTogUlVOX0VSUk9SX0NPREVTLlJVTlRJTUVfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyByZXF1ZXN0SWQgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGZhaWxFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBFbnRpdHlDb25mbGljdEVycm9yLmlzKGZhaWxFcnIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBSdW5FeHBpcmVkRXJyb3IuaXMoZmFpbEVycilcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29ybGRDb250cmFjdEVycm9yKGZhaWxFcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3Igd2hpbGUgcmVjb3JkaW5nIHdvcmtmbG93IGZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsRXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmYWlsRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBTdHJpbmcoZmFpbEVyciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRocm93IGZhaWxFcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1dvcmxkQ29udHJhY3RFcnJvcihlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgJ0ZhdGFsIHdvcmxkIGNvbnRyYWN0IGVycm9yIGR1cmluZyB3b3JrZmxvdyBzZXR1cCcsXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjazogZXJyLnN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyByZXF1ZXN0SWQgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGZhaWxFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBFbnRpdHlDb25mbGljdEVycm9yLmlzKGZhaWxFcnIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBSdW5FeHBpcmVkRXJyb3IuaXMoZmFpbEVycilcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29ybGRDb250cmFjdEVycm9yKGZhaWxFcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3Igd2hpbGUgcmVjb3JkaW5nIHdvcmtmbG93IGZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsRXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmYWlsRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBTdHJpbmcoZmFpbEVyciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRocm93IGZhaWxFcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdvcmtmbG93U3RhcnRlZEF0ID0gK3dvcmtmbG93UnVuLnN0YXJ0ZWRBdDtcblxuICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93UnVuU3RhdHVzKHdvcmtmbG93UnVuLnN0YXR1cyksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dTdGFydGVkQXQod29ya2Zsb3dTdGFydGVkQXQpLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHdvcmtmbG93UnVuLnN0YXR1cyAhPT0gJ3J1bm5pbmcnKSB7XG4gICAgICAgICAgICAgICAgICAvLyBXb3JrZmxvdyBoYXMgYWxyZWFkeSBjb21wbGV0ZWQgb3IgZmFpbGVkLCBzbyB3ZSBjYW4gc2tpcCBpdFxuICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5pbmZvKFxuICAgICAgICAgICAgICAgICAgICAnV29ya2Zsb3cgYWxyZWFkeSBjb21wbGV0ZWQgb3IgZmFpbGVkLCBza2lwcGluZycsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHdvcmtmbG93UnVuLnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgLy8gVE9ETzogZm9yIGBjYW5jZWxgLCB3ZSBhY3R1YWxseSB3YW50IHRvIHByb3BhZ2F0ZSBhIFdvcmtmbG93Q2FuY2VsbGVkIGV2ZW50XG4gICAgICAgICAgICAgICAgICAvLyBpbnNpZGUgdGhlIHdvcmtmbG93IGNvbnRleHQgc28gdGhlIHVzZXIgY2FuIGdyYWNlZnVsbHkgZXhpdC4gdGhpcyBpcyBTSUdURVJNXG4gICAgICAgICAgICAgICAgICAvLyBUT0RPOiBmdXJ0aGVybW9yZSwgdGhlcmUgc2hvdWxkIGJlIGEgdGltZW91dCBvciBhIHdheSB0byBmb3JjZSBjYW5jZWwgU0lHS0lMTFxuICAgICAgICAgICAgICAgICAgLy8gc28gdGhhdCB3ZSBhY3R1YWxseSBleGl0IGhlcmUgd2l0aG91dCByZXBsYXlpbmcgdGhlIHdvcmtmbG93IGF0IGFsbCwgaW4gdGhlIGNhc2VcbiAgICAgICAgICAgICAgICAgIC8vIHRoZSByZXBsYXlpbmcgdGhlIHdvcmtmbG93IGlzIGl0c2VsZiBmYWlsaW5nLlxuXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTG9hZCBhbGwgZXZlbnRzIGludG8gbWVtb3J5IGJlZm9yZSBydW5uaW5nLlxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGdvdCBwcmUtbG9hZGVkIGV2ZW50cyBmcm9tIHRoZSBydW5fc3RhcnRlZCByZXNwb25zZSxcbiAgICAgICAgICAgICAgICAvLyBza2lwIHRoZSBldmVudHMubGlzdCByb3VuZC10cmlwIHRvIHJlZHVjZSBUVEZCLlxuICAgICAgICAgICAgICAgIGxldCBldmVudHM6IEV2ZW50W107XG4gICAgICAgICAgICAgICAgbGV0IGV2ZW50c0N1cnNvcjogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgaWYgKHByZWxvYWRlZEV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICBldmVudHMgPSBwcmVsb2FkZWRFdmVudHM7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50c0N1cnNvciA9IHByZWxvYWRlZEV2ZW50c0N1cnNvcjtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYWRlZEV2ZW50cyA9IGF3YWl0IGdldFdvcmtmbG93UnVuRXZlbnRzKFxuICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLnJ1bklkXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cyA9IGxvYWRlZEV2ZW50cy5ldmVudHM7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50c0N1cnNvciA9IGxvYWRlZEV2ZW50cy5jdXJzb3I7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoaXNXb3JsZENvbnRyYWN0RXJyb3IoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICdGYXRhbCB3b3JsZCBjb250cmFjdCBlcnJvciB3aGlsZSBsb2FkaW5nIHdvcmtmbG93IGV2ZW50cycsXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjazogZXJyLnN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyByZXF1ZXN0SWQgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGZhaWxFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBFbnRpdHlDb25mbGljdEVycm9yLmlzKGZhaWxFcnIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBSdW5FeHBpcmVkRXJyb3IuaXMoZmFpbEVycilcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29ybGRDb250cmFjdEVycm9yKGZhaWxFcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3Igd2hpbGUgcmVjb3JkaW5nIHdvcmtmbG93IGZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsRXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmYWlsRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBTdHJpbmcoZmFpbEVyciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRocm93IGZhaWxFcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFRoZSBtYXRlcmlhbGl6ZWQgcnVuIHJldHVybmVkIGJ5IHJ1bl9zdGFydGVkIGNhbiByYWNlIGFcbiAgICAgICAgICAgICAgICAvLyB0ZXJtaW5hbCBldmVudCBpbiB0aGUgbG9hZGVkIHNuYXBzaG90LiBEbyBub3QgcmVwbGF5IGEgcnVuXG4gICAgICAgICAgICAgICAgLy8gd2hvc2UgZXZlbnQgbG9nIGFscmVhZHkgZXN0YWJsaXNoZXMgaXRzIHRlcm1pbmFsIG91dGNvbWUuXG4gICAgICAgICAgICAgICAgaWYgKGhhc1JlY29yZGVkVGVybWluYWxSdW5FdmVudChldmVudHMsIHJ1bklkKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBhbnkgZWxhcHNlZCB3YWl0cyBhbmQgY3JlYXRlIHdhaXRfY29tcGxldGVkIGV2ZW50c1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG5cbiAgICAgICAgICAgICAgICAvLyBQcmUtY29tcHV0ZSBjb21wbGV0ZWQgY29ycmVsYXRpb24gSURzIGZvciBPKG4pIGxvb2t1cCBpbnN0ZWFkIG9mIE8obsKyKVxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBsZXRlZFdhaXRJZHMgPSBuZXcgU2V0KFxuICAgICAgICAgICAgICAgICAgZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUuZXZlbnRUeXBlID09PSAnd2FpdF9jb21wbGV0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChlKSA9PiBlLmNvcnJlbGF0aW9uSWQpXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIC8vIENvbGxlY3QgYWxsIHdhaXRzIHRoYXQgbmVlZCBjb21wbGV0aW9uXG4gICAgICAgICAgICAgICAgY29uc3Qgd2FpdHNUb0NvbXBsZXRlID0gZXZlbnRzXG4gICAgICAgICAgICAgICAgICAuZmlsdGVyKFxuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgZVxuICAgICAgICAgICAgICAgICAgICApOiBlIGlzIEV4dHJhY3Q8RXZlbnQsIHsgZXZlbnRUeXBlOiAnd2FpdF9jcmVhdGVkJyB9PiAmIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb3JyZWxhdGlvbklkOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIH0gPT5cbiAgICAgICAgICAgICAgICAgICAgICBlLmV2ZW50VHlwZSA9PT0gJ3dhaXRfY3JlYXRlZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICBlLmNvcnJlbGF0aW9uSWQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICAgICAgICFjb21wbGV0ZWRXYWl0SWRzLmhhcyhlLmNvcnJlbGF0aW9uSWQpICYmXG4gICAgICAgICAgICAgICAgICAgICAgbm93ID49IChlLmV2ZW50RGF0YS5yZXN1bWVBdCBhcyBEYXRlKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIC5tYXAoKGUpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogJ3dhaXRfY29tcGxldGVkJyBhcyBjb25zdCxcbiAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgICAgICBjb3JyZWxhdGlvbklkOiBlLmNvcnJlbGF0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgIHJlc3VtZUF0OiBlLmV2ZW50RGF0YS5yZXN1bWVBdCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbGwgd2FpdF9jb21wbGV0ZWQgZXZlbnRzXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB3YWl0RXZlbnQgb2Ygd2FpdHNUb0NvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB3YWl0TG9nOiBNdXRhYmxlRXZlbnRMb2cgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cyxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiBldmVudHNDdXJzb3IgPz8gbnVsbCxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB3aXRoUHJlY29uZGl0aW9uUmV0cnkoXG4gICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgd2FpdExvZyxcbiAgICAgICAgICAgICAgICAgICAgICAoc3RhdGVVcGRhdGVkQXQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JsZC5ldmVudHMuY3JlYXRlKHJ1bklkLCB3YWl0RXZlbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVVwZGF0ZWRBdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuaW5mbygnV2FpdCBhbHJlYWR5IGNvbXBsZXRlZCwgc2tpcHBpbmcnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvcnJlbGF0aW9uSWQ6IHdhaXRFdmVudC5jb3JyZWxhdGlvbklkLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbG9hZHMgaW5zaWRlIHRoZSBndWFyZCBtYXkgaGF2ZSBhZHZhbmNlZCB0aGUgY3Vyc29yLlxuICAgICAgICAgICAgICAgICAgICBldmVudHNDdXJzb3IgPSB3YWl0TG9nLmN1cnNvcjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAod2FpdHNUb0NvbXBsZXRlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBldmVudCBsaXN0IGFib3ZlIG1heSBiZSBzdGFsZSBieSB0aGUgdGltZSBhbiBlbGFwc2VkXG4gICAgICAgICAgICAgICAgICAvLyB3YWl0IGlzIGNvbW1pdHRlZC4gTG9hZCBvbmx5IGV2ZW50cyBhZnRlciB0aGUgb3JpZ2luYWxcbiAgICAgICAgICAgICAgICAgIC8vIHNuYXBzaG90IGN1cnNvciBzbyBjb25jdXJyZW50IGR1cmFibGUgZXZlbnRzLCBzdWNoIGFzXG4gICAgICAgICAgICAgICAgICAvLyBob29rX3JlY2VpdmVkLCBrZWVwIHRoZWlyIG9yZGVyaW5nIHJlbGF0aXZlIHRvXG4gICAgICAgICAgICAgICAgICAvLyB3YWl0X2NvbXBsZXRlZC4gRmFsbCBiYWNrIHRvIGEgZnVsbCByZWxvYWQgZm9yIG9sZGVyIHdvcmxkc1xuICAgICAgICAgICAgICAgICAgLy8gdGhhdCBjYW5ub3QgZ2l2ZSB1cyBhIHN0YWJsZSBjdXJzb3IuXG4gICAgICAgICAgICAgICAgICBpZiAoZXZlbnRzQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0V2ZW50cyA9IGF3YWl0IGdldFdvcmtmbG93UnVuRXZlbnRzKFxuICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50c0N1cnNvclxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wbGV0ZWRXYWl0SWRzQWZ0ZXJDdXJzb3IgPSBuZXcgU2V0KFxuICAgICAgICAgICAgICAgICAgICAgIG5ld0V2ZW50cy5ldmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUuZXZlbnRUeXBlID09PSAnd2FpdF9jb21wbGV0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZSkgPT4gZS5jb3JyZWxhdGlvbklkKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzYXdBbGxXYWl0Q29tcGxldGlvbnMgPSB3YWl0c1RvQ29tcGxldGUuZXZlcnkoXG4gICAgICAgICAgICAgICAgICAgICAgKHdhaXRFdmVudCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlZFdhaXRJZHNBZnRlckN1cnNvci5oYXMod2FpdEV2ZW50LmNvcnJlbGF0aW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNhd0FsbFdhaXRDb21wbGV0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5tYXAoKGV2ZW50KSA9PiBldmVudC5ldmVudElkKVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBldmVudCBvZiBuZXdFdmVudHMuZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0aW5nSWRzLmhhcyhldmVudC5ldmVudElkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ0lkcy5hZGQoZXZlbnQuZXZlbnRJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZGVkRXZlbnRzID0gYXdhaXQgZ2V0V29ya2Zsb3dSdW5FdmVudHMoXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bi5ydW5JZFxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnRzID0gbG9hZGVkRXZlbnRzLmV2ZW50cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZGVkRXZlbnRzID0gYXdhaXQgZ2V0V29ya2Zsb3dSdW5FdmVudHMoXG4gICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWRcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzID0gbG9hZGVkRXZlbnRzLmV2ZW50cztcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgLy8gQSBjb25jdXJyZW50IHRlcm1pbmFsIHdyaXRlIG1heSBoYXZlIGxhbmRlZCB3aGlsZVxuICAgICAgICAgICAgICAgICAgLy8gY29tbWl0dGluZyBhbiBlbGFwc2VkIHdhaXQgYW5kIHJlZnJlc2hpbmcgdGhlIHNuYXBzaG90LlxuICAgICAgICAgICAgICAgICAgaWYgKGhhc1JlY29yZGVkVGVybWluYWxSdW5FdmVudChldmVudHMsIHJ1bklkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSB0aGUgZW5jcnlwdGlvbiBrZXkgZm9yIHRoaXMgcnVuJ3MgZGVwbG95bWVudFxuICAgICAgICAgICAgICAgIGNvbnN0IHJhd0tleSA9XG4gICAgICAgICAgICAgICAgICBhd2FpdCB3b3JsZC5nZXRFbmNyeXB0aW9uS2V5Rm9yUnVuPy4od29ya2Zsb3dSdW4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuY3J5cHRpb25LZXkgPSByYXdLZXlcbiAgICAgICAgICAgICAgICAgID8gYXdhaXQgaW1wb3J0S2V5KHJhd0tleSlcbiAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIFVzZXIgY29kZSBleGVjdXRpb24gLS0tXG4gICAgICAgICAgICAgICAgLy8gT25seSBlcnJvcnMgZnJvbSBydW5Xb3JrZmxvdygpICh1c2VyIHdvcmtmbG93IGNvZGUpIHNob3VsZFxuICAgICAgICAgICAgICAgIC8vIHByb2R1Y2UgcnVuX2ZhaWxlZC4gSW5mcmFzdHJ1Y3R1cmUgZXJyb3JzIChuZXR3b3JrLCBzZXJ2ZXIpXG4gICAgICAgICAgICAgICAgLy8gbXVzdCBwcm9wYWdhdGUgdG8gdGhlIHF1ZXVlIGhhbmRsZXIgZm9yIGF1dG9tYXRpYyByZXRyeS5cbiAgICAgICAgICAgICAgICBsZXQgd29ya2Zsb3dSZXN1bHQ6IHVua25vd247XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIHdvcmtmbG93UmVzdWx0ID0gYXdhaXQgdHJhY2UoXG4gICAgICAgICAgICAgICAgICAgICd3b3JrZmxvdy5yZXBsYXknLFxuICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgKHJlcGxheVNwYW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICByZXBsYXlTcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0V2ZW50c0NvdW50KGV2ZW50cy5sZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBydW5Xb3JrZmxvdyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93Q29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5jcnlwdGlvbktleVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAvLyBXb3JrZmxvd1N1c3BlbnNpb24gaXMgbm9ybWFsIGNvbnRyb2wgZmxvdyDigJQgbm90IGFuIGVycm9yXG4gICAgICAgICAgICAgICAgICBpZiAoV29ya2Zsb3dTdXNwZW5zaW9uLmlzKGVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VzcGVuc2lvbk1lc3NhZ2UgPSBidWlsZFdvcmtmbG93U3VzcGVuc2lvbk1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgZXJyLnN0ZXBDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICBlcnIuaG9va0NvdW50LFxuICAgICAgICAgICAgICAgICAgICAgIGVyci53YWl0Q291bnRcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1c3BlbnNpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5kZWJ1ZyhzdXNwZW5zaW9uTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBFYWNoIGV2ZW50IGNyZWF0aW9uIGluc2lkZSBoYW5kbGVTdXNwZW5zaW9uIGNhcnJpZXMgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIGxvYWRlZCBzbmFwc2hvdCdzIGBzdGF0ZVVwZGF0ZWRBdGA7IG9uIGEgc3RhbGUgKDQxMilcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVqZWN0aW9uIHRoZSBndWFyZCByZWxvYWRzIHRoaXMgbG9nIGluIHBsYWNlIGFuZCByZXRyaWVzLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdXNwZW5zaW9uTG9nOiBNdXRhYmxlRXZlbnRMb2cgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogZXZlbnRzQ3Vyc29yID8/IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgaGFuZGxlU3VzcGVuc2lvbj4+O1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZVN1c3BlbnNpb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VzcGVuc2lvbjogZXJyLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ybGQsXG4gICAgICAgICAgICAgICAgICAgICAgICBydW46IHdvcmtmbG93UnVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3BhbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50TG9nOiBzdXNwZW5zaW9uTG9nLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChzdXNwZW5zaW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgZ3VhcmQgZXhoYXVzdGVkIGl0cyByZWxvYWRzIG9uIGEgc3RhbGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGlvbi4gU2NoZWR1bGUgYW4gZXhwbGljaXQgaW1tZWRpYXRlIHJlLWludm9jYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAvLyAoYSByZXRocm93IHJlbGllcyBvbiBxdWV1ZSByZWRlbGl2ZXJ5KSBzbyBhIGZyZXNoXG4gICAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGF5IG9ic2VydmVzIHRoZSBuZXdlciBldmVudC5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IuaXMoc3VzcGVuc2lvbkVycm9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5pbmZvKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnU3VzcGVuc2lvbiBldmVudCBjcmVhdGlvbiBleGhhdXN0ZWQgcHJlY29uZGl0aW9uIHJldHJpZXM7IHJlLWludm9raW5nIHdpdGggYSBmcmVzaCByZXBsYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7IHdvcmtmbG93UnVuSWQ6IHJ1bklkIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aW1lb3V0U2Vjb25kczogMCB9O1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBzdXNwZW5zaW9uRXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVvdXRTZWNvbmRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aW1lb3V0U2Vjb25kczogcmVzdWx0LnRpbWVvdXRTZWNvbmRzIH07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBTdXNwZW5zaW9uIGhhbmRsZWQsIG5vIGZ1cnRoZXIgd29yayBuZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAvLyBUcmFuc2llbnQgaW5mcmFzdHJ1Y3R1cmUgZmFpbHVyZXMgdGFsa2luZyB0byB0aGVcbiAgICAgICAgICAgICAgICAgIC8vIHdvcmxkICh3b3JrZmxvdy1zZXJ2ZXIpIOKAlCBhbiBleGhhdXN0ZWQgUmV0cnlBZ2VudFxuICAgICAgICAgICAgICAgICAgLy8gKFVORF9FUlJfUkVRX1JFVFJZIGZyb20gYSBzdXN0YWluZWQgNDI5LzUwMyBzdG9ybSksXG4gICAgICAgICAgICAgICAgICAvLyBhIGRyb3BwZWQgc29ja2V0LCBhIGNvbm5lY3QvRE5TIGZhaWx1cmUsIG9yIGEgY2xpZW50XG4gICAgICAgICAgICAgICAgICAvLyB0aW1lb3V0IOKAlCBtdXN0IE5PVCBmYWlsIHRoZSBydW4uIFJldGhyb3cgc28gdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAvLyByZWRlbGl2ZXJzIGFuZCBhIGZyZXNoIGludm9jYXRpb24gcmV0cmllcyB0aGUgcmVwbGF5XG4gICAgICAgICAgICAgICAgICAvLyBvbmNlIHRoZSBiYWNrZW5kIHJlY292ZXJzLiBUaGUgQHZlcmNlbC9xdWV1ZSBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAvLyBhcHBsaWVzIGEgZmFzdCAoMXPihpI2MHMpIGJhY2tvZmYgYnkgZGVsaXZlcnkgY291bnQsXG4gICAgICAgICAgICAgICAgICAvLyBhdm9pZGluZyB0aGUgfjVtaW4gZGVmYXVsdCB2aXNpYmlsaXR5LXRpbWVvdXQgcmVkcml2ZVxuICAgICAgICAgICAgICAgICAgLy8gKGFuZCBuZXZlciBraWxsaW5nIHRoZSBwcm9jZXNzIHZpYSBydW5fZmFpbGVkKS5cbiAgICAgICAgICAgICAgICAgIGlmIChpc1JldHJ5YWJsZVdvcmxkRXJyb3IoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgJ1RyYW5zaWVudCB3b3JsZCBlcnJvciBkdXJpbmcgcmVwbGF5OyByZWRlbGl2ZXJpbmcgdmlhIHF1ZXVlIGluc3RlYWQgb2YgZmFpbGluZyB0aGUgcnVuJyxcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvck5hbWU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm5hbWUgOiAnVW5rbm93bkVycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsaXZlcnlBdHRlbXB0OiBtZXRhZGF0YS5hdHRlbXB0LFxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBsZXQgdGVybWluYWxFcnJvciA9IGVycjtcbiAgICAgICAgICAgICAgICAgIGlmIChSZXBsYXlEaXZlcmdlbmNlRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXZlcmdlbmNlQ291bnQgPSAocmVwbGF5RGl2ZXJnZW5jZT8uY291bnQgPz8gMCkgKyAxO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXZlcmdlbmNlQ291bnQgPD0gUkVQTEFZX0RJVkVSR0VOQ0VfTUFYX1JFVFJJRVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAnV29ya2Zsb3cgcmVwbGF5IGRpdmVyZ2VkOyBxdWV1ZWluZyBhIHJlY292ZXJ5IHJlcGxheSBiZWZvcmUgZGVjbGFyaW5nIHRoZSBldmVudCBsb2cgY29ycnVwdGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZTogUlVOX0VSUk9SX0NPREVTLlJFUExBWV9ESVZFUkdFTkNFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXZlcmdlbmNlRXZlbnRJZDogZXJyLmV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHByaW9yRGl2ZXJnZW5jZUV2ZW50SWQ6IHJlcGxheURpdmVyZ2VuY2U/LmV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpdmVyZ2VuY2VDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaXZlcnlBdHRlbXB0OiBtZXRhZGF0YS5hdHRlbXB0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhSZWNvdmVyeVJlcGxheXM6IFJFUExBWV9ESVZFUkdFTkNFX01BWF9SRVRSSUVTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgcXVldWVNZXNzYWdlKFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ybGQsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRXb3JrZmxvd1F1ZXVlTmFtZSh3b3JrZmxvd05hbWUsIG5hbWVzcGFjZSksXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFjZUNhcnJpZXI6IHRyYWNlQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxheURpdmVyZ2VuY2U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudElkOiBlcnIuZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogZGl2ZXJnZW5jZUNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwbG95bWVudElkOiB3b3JrZmxvd1J1bi5kZXBsb3ltZW50SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNWZXJzaW9uOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLnNwZWNWZXJzaW9uID8/IFNQRUNfVkVSU0lPTl9MRUdBQ1ksXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hbEVycm9yID0gbmV3IENvcnJ1cHRlZEV2ZW50TG9nRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgYFdvcmtmbG93IHJlcGxheSBkaXZlcmdlZCAke2RpdmVyZ2VuY2VDb3VudH0gdGltZXMgYWZ0ZXIgJHtSRVBMQVlfRElWRVJHRU5DRV9NQVhfUkVUUklFU30gcmVjb3ZlcnkgcmVwbGF5czsgbGF0ZXN0IGRpdmVyZ2VudCBldmVudCB3YXMgJHtlcnIuZXZlbnRJZH0uIExhc3QgZGl2ZXJnZW5jZTogJHtlcnIubWVzc2FnZX1gLFxuICAgICAgICAgICAgICAgICAgICAgIHsgY2F1c2U6IGVyciB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSB1c2VyIGNvZGUgZXJyb3Igb3IgYSB0ZXJtaW5hbFxuICAgICAgICAgICAgICAgICAgLy8gV29ya2Zsb3dSdW50aW1lRXJyb3IuIEZhaWwgdGhlIHdvcmtmbG93IHJ1bi5cblxuICAgICAgICAgICAgICAgICAgLy8gUmVjb3JkIGV4Y2VwdGlvbiBmb3IgT1RFTCBlcnJvciB0cmFja2luZ1xuICAgICAgICAgICAgICAgICAgaWYgKHRlcm1pbmFsRXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBzcGFuPy5yZWNvcmRFeGNlcHRpb24/Lih0ZXJtaW5hbEVycm9yKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZEVycm9yID1cbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbm9ybWFsaXplVW5rbm93bkVycm9yKHRlcm1pbmFsRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JOYW1lID1cbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZEVycm9yLm5hbWUgfHwgZ2V0RXJyb3JOYW1lKHRlcm1pbmFsRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gbm9ybWFsaXplZEVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICBsZXQgZXJyb3JTdGFjayA9XG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRFcnJvci5zdGFjayB8fCBnZXRFcnJvclN0YWNrKHRlcm1pbmFsRXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAvLyBSZW1hcCBlcnJvciBzdGFjayB1c2luZyBzb3VyY2UgbWFwcyB0byBzaG93IG9yaWdpbmFsIHNvdXJjZSBsb2NhdGlvbnNcbiAgICAgICAgICAgICAgICAgIGlmIChlcnJvclN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZE5hbWUgPSBwYXJzZVdvcmtmbG93TmFtZSh3b3JrZmxvd05hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9XG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VkTmFtZT8ubW9kdWxlU3BlY2lmaWVyIHx8IHdvcmtmbG93TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JTdGFjayA9IHJlbWFwRXJyb3JTdGFjayhcbiAgICAgICAgICAgICAgICAgICAgICBlcnJvclN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93Q29kZVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAvLyBDbGFzc2lmeSB0aGUgZXJyb3I6IFdvcmtmbG93UnVudGltZUVycm9yIGluZGljYXRlc1xuICAgICAgICAgICAgICAgICAgLy8gYW4gU0RLL3J1bnRpbWUgaXNzdWUsIGFuZCBzZWxlY3RlZCBzdWJjbGFzc2VzIHVzZVxuICAgICAgICAgICAgICAgICAgLy8gbW9yZSBzcGVjaWZpYyBjb2RlcyBmb3IgYmFja2VuZCB0cmFja2luZy5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yQ29kZSA9IGNsYXNzaWZ5UnVuRXJyb3IodGVybWluYWxFcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoJ0Vycm9yIHdoaWxlIHJ1bm5pbmcgd29ya2Zsb3cnLCB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGUsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JTdGFjayxcbiAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAvLyBGYWlsIHRoZSB3b3JrZmxvdyBydW4gdmlhIGV2ZW50IChldmVudC1zb3VyY2VkIGFyY2hpdGVjdHVyZSlcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHdvcmxkLmV2ZW50cy5jcmVhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiAncnVuX2ZhaWxlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvck1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2s6IGVycm9yU3RhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChmYWlsRXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICBFbnRpdHlDb25mbGljdEVycm9yLmlzKGZhaWxFcnIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgUnVuRXhwaXJlZEVycm9yLmlzKGZhaWxFcnIpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICAgICAgICAgICAgICdUcmllZCBmYWlsaW5nIHdvcmtmbG93IHJ1biwgYnV0IHJ1biBoYXMgYWxyZWFkeSBmaW5pc2hlZC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZmFpbEVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dFcnJvckNvZGUoZXJyb3JDb2RlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0Vycm9yTmFtZShlcnJvck5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93RXJyb3JNZXNzYWdlKGVycm9yTWVzc2FnZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuRXJyb3JUeXBlKGVycm9yTmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1dvcmxkQ29udHJhY3RFcnJvcihmYWlsRXJyKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3Igd2hpbGUgcmVjb3JkaW5nIHdvcmtmbG93IGZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxFcnIgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmYWlsRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogU3RyaW5nKGZhaWxFcnIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGZhaWxFcnI7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5TdGF0dXMoJ2ZhaWxlZCcpLFxuICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dFcnJvckNvZGUoZXJyb3JDb2RlKSxcbiAgICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93RXJyb3JOYW1lKGVycm9yTmFtZSksXG4gICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0Vycm9yTWVzc2FnZShlcnJvck1lc3NhZ2UpLFxuICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuRXJyb3JUeXBlKGVycm9yTmFtZSksXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gSW5mcmFzdHJ1Y3R1cmU6IGNvbXBsZXRlIHRoZSBydW4gLS0tXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBvdXRzaWRlIHRoZSB1c2VyLWNvZGUgdHJ5L2NhdGNoIHNvIHRoYXQgZmFpbHVyZXNcbiAgICAgICAgICAgICAgICAvLyBoZXJlIChlLmcuLCBuZXR3b3JrIGVycm9ycykgcHJvcGFnYXRlIHRvIHRoZSBxdWV1ZSBoYW5kbGVyLlxuICAgICAgICAgICAgICAgIC8vIHJ1bl9jb21wbGV0ZWQgY2FycmllcyB0aGUgbG9hZGVkIHNuYXBzaG90J3MgYHN0YXRlVXBkYXRlZEF0YCxcbiAgICAgICAgICAgICAgICAvLyBidXQgaXMgaW50ZW50aW9uYWxseSBOT1QgcmV0cmllZCBpbiBwbGFjZSAobm9cbiAgICAgICAgICAgICAgICAvLyB3aXRoUHJlY29uZGl0aW9uUmV0cnkpIG9uIGEgc3RhbGUgKDQxMikgcmVqZWN0aW9uOiBgcmVzdWx0YFxuICAgICAgICAgICAgICAgIC8vIHdhcyBjb21wdXRlZCBieSB0aGlzIHJlcGxheSwgc28gYSBuZXdlciBvdXQtb2YtYmFuZCBldmVudFxuICAgICAgICAgICAgICAgIC8vIGxhbmRpbmcgYWZ0ZXIgdGhlIHNuYXBzaG90IG11c3QgZm9yY2UgYSAqZnJlc2ggcmVwbGF5KlxuICAgICAgICAgICAgICAgIC8vICh3aGljaCBtYXkgb2JzZXJ2ZSBpdCBhbmQgcHJvZHVjZSBhIGRpZmZlcmVudCByZXN1bHQpLCBub3RcbiAgICAgICAgICAgICAgICAvLyByZS1jb21taXQgdGhlIHN0YWxlIHJlc3VsdC4gT24gNDEyIHRoZSBjYXRjaCBiZWxvdyBzY2hlZHVsZXNcbiAgICAgICAgICAgICAgICAvLyBhbiBleHBsaWNpdCBpbW1lZGlhdGUgcmUtaW52b2NhdGlvbiBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIC8vIChydW5fZmFpbGVkIGlzIGRlbGliZXJhdGVseSBsZWZ0IHVuZ3VhcmRlZCBhbmQgZmFpbHMgb3BlbjpcbiAgICAgICAgICAgICAgICAvLyBhIHNwdXJpb3VzIHJlLXJ1biBpcyBzYWZlLCBhIHNwdXJpb3VzIGNvbXBsZXRpb24gaXMgbm90LCBhbmRcbiAgICAgICAgICAgICAgICAvLyB0aGUgbG9hZGVkIGV2ZW50IGxvZyBpcyBub3QgaW4gc2NvcGUgb24gdGhhdCBjYXRjaCBwYXRoLilcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fY29tcGxldGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnREYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQ6IHdvcmtmbG93UmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGVVcGRhdGVkQXQ6IHN0YXRlVXBkYXRlZEF0Rm9yQ3JlYXRlKGV2ZW50cyksXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAgICAgICAgICAgJ3J1bl9jb21wbGV0ZWQgcmVqZWN0ZWQgYXMgc3RhbGU7IHJlLWludm9raW5nIHdpdGggYSBmcmVzaCByZXBsYXknLFxuICAgICAgICAgICAgICAgICAgICAgIHsgd29ya2Zsb3dSdW5JZDogcnVuSWQgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aW1lb3V0U2Vjb25kczogMCB9O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZXJyKSB8fCBSdW5FeHBpcmVkRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAgICAgICAgICAgJ1RyaWVkIGNvbXBsZXRpbmcgd29ya2Zsb3cgcnVuLCBidXQgcnVuIGhhcyBhbHJlYWR5IGZpbmlzaGVkLicsXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd1J1blN0YXR1cygnY29tcGxldGVkJyksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dFdmVudHNDb3VudChldmVudHMubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTsgLy8gRW5kIHRyYWNlXG4gICAgICAgICAgfVxuICAgICAgICApOyAvLyBFbmQgd2l0aFdvcmtmbG93QmFnZ2FnZVxuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIGlmIChyZXBsYXlUaW1lb3V0KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHJlcGxheVRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICB9KTsgLy8gRW5kIHdpdGhUcmFjZUNvbnRleHRcbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIHdpdGhIZWFsdGhDaGVjayhoYW5kbGVyLCB3b3JsZFNwZWNWZXJzaW9uKTtcbn1cblxuLy8gdGhpcyBpcyBhIG5vLW9wIHBsYWNlaG9sZGVyIGFzIHRoZSBjbGllbnQgaXNcbi8vIGV4cGVjdGluZyB0aGlzIHRvIGJlIHByZXNlbnQgYnV0IHdlIGFyZW4ndCBhY3R1YWxseSB1c2luZyBpdFxuZXhwb3J0IGZ1bmN0aW9uIHJ1blN0ZXAoKSB7fVxuIiwgImltcG9ydCB7XG4gIEVSUk9SX1NMVUdTLFxuICBSZXBsYXlEaXZlcmdlbmNlRXJyb3IsXG4gIFdvcmtmbG93Tm90UmVnaXN0ZXJlZEVycm9yLFxuICBXb3JrZmxvd1J1bnRpbWVFcnJvcixcbn0gZnJvbSAnQHdvcmtmbG93L2Vycm9ycyc7XG5pbXBvcnQgeyBjcmVhdGVXb3JrZmxvd0Jhc2VVcmwsIHdpdGhSZXNvbHZlcnMgfSBmcm9tICdAd29ya2Zsb3cvdXRpbHMnO1xuaW1wb3J0IHsgcGFyc2VXb3JrZmxvd05hbWUgfSBmcm9tICdAd29ya2Zsb3cvdXRpbHMvcGFyc2UtbmFtZSc7XG5pbXBvcnQgdHlwZSB7IEV2ZW50LCBXb3JrZmxvd1J1biB9IGZyb20gJ0B3b3JrZmxvdy93b3JsZCc7XG5pbXBvcnQgKiBhcyBuYW5vaWQgZnJvbSAnbmFub2lkJztcbmltcG9ydCB7IG1vbm90b25pY0ZhY3RvcnkgfSBmcm9tICd1bGlkJztcbmltcG9ydCB0eXBlIHsgQ3J5cHRvS2V5IH0gZnJvbSAnLi9lbmNyeXB0aW9uLmpzJztcbmltcG9ydCB7IEV2ZW50Q29uc3VtZXJSZXN1bHQsIEV2ZW50c0NvbnN1bWVyIH0gZnJvbSAnLi9ldmVudHMtY29uc3VtZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBRdWV1ZUl0ZW0gfSBmcm9tICcuL2dsb2JhbC5qcyc7XG5pbXBvcnQgeyBFTk9UU1VQLCBXb3JrZmxvd1N1c3BlbnNpb24gfSBmcm9tICcuL2dsb2JhbC5qcyc7XG5pbXBvcnQgeyBydW50aW1lTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBXb3JrZmxvd09yY2hlc3RyYXRvckNvbnRleHQgfSBmcm9tICcuL3ByaXZhdGUuanMnO1xuaW1wb3J0IHsgZ2V0UG9ydExhenkgfSBmcm9tICcuL3J1bnRpbWUvZ2V0LXBvcnQtbGF6eS5qcyc7XG5pbXBvcnQge1xuICBkZWh5ZHJhdGVXb3JrZmxvd1JldHVyblZhbHVlLFxuICBoeWRyYXRlV29ya2Zsb3dBcmd1bWVudHMsXG59IGZyb20gJy4vc2VyaWFsaXphdGlvbi5qcyc7XG5pbXBvcnQgeyBjcmVhdGVVc2VTdGVwIH0gZnJvbSAnLi9zdGVwLmpzJztcbmltcG9ydCB0eXBlIHsgU3RlcEh5ZHJhdGlvbkNhY2hlIH0gZnJvbSAnLi9zdGVwLWh5ZHJhdGlvbi1jYWNoZS5qcyc7XG5pbXBvcnQge1xuICBCT0RZX0lOSVRfU1lNQk9MLFxuICBTVEFCTEVfVUxJRCxcbiAgV09SS0ZMT1dfQ1JFQVRFX0hPT0ssXG4gIFdPUktGTE9XX0dFVF9TVFJFQU1fSUQsXG4gIFdPUktGTE9XX1NMRUVQLFxuICBXT1JLRkxPV19VU0VfU1RFUCxcbn0gZnJvbSAnLi9zeW1ib2xzLmpzJztcbmltcG9ydCAqIGFzIEF0dHJpYnV0ZSBmcm9tICcuL3RlbGVtZXRyeS9zZW1hbnRpYy1jb252ZW50aW9ucy5qcyc7XG5pbXBvcnQgeyB0cmFjZSB9IGZyb20gJy4vdGVsZW1ldHJ5LmpzJztcbmltcG9ydCB7IGdldFdvcmtmbG93UnVuU3RyZWFtSWQgfSBmcm9tICcuL3V0aWwuanMnO1xuaW1wb3J0IHsgY3JlYXRlQ29udGV4dCB9IGZyb20gJy4vdm0vaW5kZXguanMnO1xuaW1wb3J0IHsgcnVuQ2FjaGVkV29ya2Zsb3dTY3JpcHQgfSBmcm9tICcuL3ZtL3NjcmlwdC1jYWNoZS5qcyc7XG5pbXBvcnQgdHlwZSB7IFdvcmtmbG93TWV0YWRhdGEgfSBmcm9tICcuL3dvcmtmbG93L2dldC13b3JrZmxvdy1tZXRhZGF0YS5qcyc7XG5pbXBvcnQgeyBXT1JLRkxPV19DT05URVhUX1NZTUJPTCB9IGZyb20gJy4vd29ya2Zsb3cvZ2V0LXdvcmtmbG93LW1ldGFkYXRhLmpzJztcbmltcG9ydCB7IGNyZWF0ZUNyZWF0ZUhvb2sgfSBmcm9tICcuL3dvcmtmbG93L2hvb2suanMnO1xuaW1wb3J0IHsgY3JlYXRlU2xlZXAgfSBmcm9tICcuL3dvcmtmbG93L3NsZWVwLmpzJztcblxuLyoqXG4gKiBMb2dzIGEgd2FybmluZyB3aGVuIGEgd29ya2Zsb3cgcnVuIGNvbXBsZXRlcyBvciBmYWlscyB3aXRoIHVuY29tbWl0dGVkXG4gKiBvcGVyYXRpb25zIHN0aWxsIGluIHRoZSBpbnZvY2F0aW9ucyBxdWV1ZS4gVGhpcyB0eXBpY2FsbHkgaW5kaWNhdGVzIHRoZVxuICogdXNlciBmb3Jnb3QgdG8gYGF3YWl0YCBhIHN0ZXAsIGhvb2ssIG9yIHNsZWVwIGNhbGwuXG4gKi9cbmZ1bmN0aW9uIHdhcm5QZW5kaW5nUXVldWVJdGVtcyhcbiAgcnVuSWQ6IHN0cmluZyxcbiAgcGVuZGluZ1F1ZXVlOiBNYXA8c3RyaW5nLCBRdWV1ZUl0ZW0+LFxuICBvdXRjb21lOiAnY29tcGxldGVkJyB8ICdmYWlsZWQnXG4pOiB2b2lkIHtcbiAgLy8gRmlsdGVyIG91dCBob29rcyB0aGF0IGFyZSBlaXRoZXIgYWxyZWFkeSBjcmVhdGVkIChhbGl2ZSwgd2FpdGluZyBmb3IgcGF5bG9hZHMpXG4gIC8vIG9yIGV4cGxpY2l0bHkgZGlzcG9zZWQg4oCUIGJvdGggYXJlIGJlbmlnbiBzaW5jZSB0aGUgYmFja2VuZCBhdXRvLWRpc3Bvc2VzXG4gIC8vIGFsbCBob29rcyB3aGVuIGEgcnVuIHJlYWNoZXMgYSB0ZXJtaW5hbCBzdGF0ZVxuICBjb25zdCBpdGVtcyA9IFsuLi5wZW5kaW5nUXVldWUudmFsdWVzKCldLmZpbHRlcihcbiAgICAoaXRlbSkgPT4gIShpdGVtLnR5cGUgPT09ICdob29rJyAmJiAoaXRlbS5oYXNDcmVhdGVkRXZlbnQgfHwgaXRlbS5kaXNwb3NlZCkpXG4gICk7XG4gIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCBkZXRhaWxzID0gaXRlbXMubWFwKChpdGVtKSA9PiB7XG4gICAgc3dpdGNoIChpdGVtLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3N0ZXAnOlxuICAgICAgICByZXR1cm4gYHN0ZXAgXCIke2l0ZW0uc3RlcE5hbWV9XCJgO1xuICAgICAgY2FzZSAnaG9vayc6XG4gICAgICAgIHJldHVybiBgaG9vayBcIiR7aXRlbS50b2tlbn1cImA7XG4gICAgICBjYXNlICd3YWl0JzpcbiAgICAgICAgcmV0dXJuICdzbGVlcCc7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gYHVua25vd24gKCR7KGl0ZW0gYXMgeyB0eXBlOiBzdHJpbmcgfSkudHlwZX0pYDtcbiAgICB9XG4gIH0pO1xuXG4gIHJ1bnRpbWVMb2dnZXIud2FybihcbiAgICBgV29ya2Zsb3cgcnVuICR7b3V0Y29tZX0gd2l0aCAke2l0ZW1zLmxlbmd0aH0gdW5jb21taXR0ZWQgb3BlcmF0aW9uKHMpOiAke2RldGFpbHMuam9pbignLCAnKX0uIGAgK1xuICAgICAgJ0RpZCB5b3UgZm9yZ2V0IHRvIGBhd2FpdGAgYSBzdGVwLCBob29rLCBvciBzbGVlcCBjYWxsPycsXG4gICAgeyB3b3JrZmxvd1J1bklkOiBydW5JZCB9XG4gICk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Xb3JrZmxvdyhcbiAgd29ya2Zsb3dDb2RlOiBzdHJpbmcsXG4gIHdvcmtmbG93UnVuOiBXb3JrZmxvd1J1bixcbiAgZXZlbnRzOiBFdmVudFtdLFxuICBlbmNyeXB0aW9uS2V5OiBDcnlwdG9LZXkgfCB1bmRlZmluZWQsXG4gIC8qKlxuICAgKiBPcHRpb25hbCBwZXItcnVuIGNhY2hlIGZvciBoeWRyYXRlZCBzdGVwIHJldHVybiB2YWx1ZXMsIG93bmVkIGJ5IHRoZSBpbmxpbmVcbiAgICogcmVwbGF5IGxvb3Agc28gaXQgc3Vydml2ZXMgYWNyb3NzIHRoZSBsb29wJ3MgaXRlcmF0aW9ucyAoZWFjaCBvZiB3aGljaFxuICAgKiBjcmVhdGVzIGEgZnJlc2ggY29udGV4dCkuIE1lbW9pemVzIHRoZSBkZWNyeXB0ICsgZGV2YWx1ZS1wYXJzZSBvZiBjb21wbGV0ZWRcbiAgICogc3RlcCByZXN1bHRzIHRvIHR1cm4gTyhOwrIpIHJlcGxheSBoeWRyYXRpb24gaW50byBPKE4pLiBPbWl0dGVkIGJ5IGNhbGxlcnNcbiAgICogdGhhdCByZXBsYXkgb25seSBvbmNlICh0aGVuIHRoZXJlIGlzIG5vdGhpbmcgdG8gcmV1c2UpLlxuICAgKi9cbiAgc3RlcEh5ZHJhdGlvbkNhY2hlPzogU3RlcEh5ZHJhdGlvbkNhY2hlXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCB1bmtub3duPiB7XG4gIHJldHVybiB0cmFjZShgd29ya2Zsb3cucnVuICR7d29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lfWAsIGFzeW5jIChzcGFuKSA9PiB7XG4gICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dOYW1lKHdvcmtmbG93UnVuLndvcmtmbG93TmFtZSksXG4gICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5JZCh3b3JrZmxvd1J1bi5ydW5JZCksXG4gICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5TdGF0dXMod29ya2Zsb3dSdW4uc3RhdHVzKSxcbiAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0V2ZW50c0NvdW50KGV2ZW50cy5sZW5ndGgpLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhcnRlZEF0ID0gd29ya2Zsb3dSdW4uc3RhcnRlZEF0O1xuICAgIGlmICghc3RhcnRlZEF0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBXb3JrZmxvdyBydW4gXCIke3dvcmtmbG93UnVuLnJ1bklkfVwiIGhhcyBubyBcInN0YXJ0ZWRBdFwiIHRpbWVzdGFtcCAoc2hvdWxkIG5vdCBoYXBwZW4pYFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIHBvcnQgYmVmb3JlIGNyZWF0aW5nIFZNIGNvbnRleHQgdG8gYXZvaWQgYXN5bmMgb3BlcmF0aW9uc1xuICAgIC8vIGFmZmVjdGluZyB0aGUgZGV0ZXJtaW5pc3RpYyB0aW1lc3RhbXBcbiAgICBjb25zdCBpc1ZlcmNlbCA9IHByb2Nlc3MuZW52LlZFUkNFTF9VUkwgIT09IHVuZGVmaW5lZDtcbiAgICAvLyBMb2FkIGdldFBvcnQgbGF6aWx5IHRvIHByZXZlbnQgVHVyYm9wYWNrIGZyb20gdHJhY2luZyBnZXQtcG9ydCdzXG4gICAgLy8gZnMgb3BzIChyZWFkZGlyLCByZWFkRmlsZSkgaW50byB0aGUgZmxvdyByb3V0ZSBidW5kbGUuIFRoZSByZXNvbHZlZFxuICAgIC8vIHBvcnQgaXMgY2FjaGVkIHBlciBwcm9jZXNzIChzZWUgZ2V0LXBvcnQtbGF6eS50cyksIHNvIHRoaXMgaXMgY2hlYXBcbiAgICAvLyBvbiByZXBsYXlzIGFmdGVyIHRoZSBmaXJzdCDigJQgYGdldFBvcnQoKWAgb3RoZXJ3aXNlIHJlLXJ1bnMgT1MgcG9ydFxuICAgIC8vIGRpc2NvdmVyeSAoc3Bhd25pbmcgYGxzb2ZgIG9uIG1hY09TLCB+NjBtcykgb24gZXZlcnkgcmVwbGF5LlxuICAgIGNvbnN0IHdvcmtmbG93QmFzZVVybCA9IGNyZWF0ZVdvcmtmbG93QmFzZVVybChcbiAgICAgIGlzVmVyY2VsXG4gICAgICAgID8gYGh0dHBzOi8vJHtwcm9jZXNzLmVudi5WRVJDRUxfVVJMfWBcbiAgICAgICAgOiBgaHR0cDovL2xvY2FsaG9zdDokeyhhd2FpdCBnZXRQb3J0TGF6eSgpKSA/PyAzMDAwfWBcbiAgICApO1xuXG4gICAgY29uc3Qge1xuICAgICAgY29udGV4dCxcbiAgICAgIGdsb2JhbFRoaXM6IHZtR2xvYmFsVGhpcyxcbiAgICAgIHVwZGF0ZVRpbWVzdGFtcCxcbiAgICB9ID0gY3JlYXRlQ29udGV4dCh7XG4gICAgICBzZWVkOiBgJHt3b3JrZmxvd1J1bi5ydW5JZH06JHt3b3JrZmxvd1J1bi53b3JrZmxvd05hbWV9OiR7K3N0YXJ0ZWRBdH1gLFxuICAgICAgZml4ZWRUaW1lc3RhbXA6ICtzdGFydGVkQXQsXG4gICAgfSk7XG5cbiAgICBjb25zdCB3b3JrZmxvd0Rpc2NvbnRpbnVhdGlvbiA9IHdpdGhSZXNvbHZlcnM8dm9pZD4oKTtcblxuICAgIGNvbnN0IHVsaWQgPSBtb25vdG9uaWNGYWN0b3J5KCgpID0+IHZtR2xvYmFsVGhpcy5NYXRoLnJhbmRvbSgpKTtcbiAgICBjb25zdCBnZW5lcmF0ZU5hbm9pZCA9IG5hbm9pZC5jdXN0b21SYW5kb20obmFub2lkLnVybEFscGhhYmV0LCAyMSwgKHNpemUpID0+XG4gICAgICBuZXcgVWludDhBcnJheShzaXplKS5tYXAoKCkgPT4gMjU2ICogdm1HbG9iYWxUaGlzLk1hdGgucmFuZG9tKCkpXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBhIG11dGFibGUgaG9sZGVyIGZvciB0aGUgcHJvbWlzZSBxdWV1ZSBzbyB0aGUgRXZlbnRzQ29uc3VtZXJcbiAgICAvLyBjYW4gYWNjZXNzIHRoZSBjdXJyZW50IHF1ZXVlIHN0YXRlIHZpYSBhIGdldHRlci4gVGhlIHF1ZXVlIGlzIG11dGF0ZWRcbiAgICAvLyBieSBzdGVwL2hvb2svc2xlZXAgY2FsbGJhY2tzIGFzIGV2ZW50cyBhcmUgcHJvY2Vzc2VkLlxuICAgIGNvbnN0IHByb21pc2VRdWV1ZUhvbGRlciA9IHsgY3VycmVudDogUHJvbWlzZS5yZXNvbHZlKCkgfTtcblxuICAgIGNvbnN0IGV2ZW50c0NvbnN1bWVyID0gbmV3IEV2ZW50c0NvbnN1bWVyKGV2ZW50cywge1xuICAgICAgb25Db25zdW1lZEV2ZW50OiAoZXZlbnQpID0+IHtcbiAgICAgICAgdXBkYXRlVGltZXN0YW1wKCtldmVudC5jcmVhdGVkQXQpO1xuICAgICAgfSxcbiAgICAgIG9uVW5jb25zdW1lZEV2ZW50OiAoZXZlbnQpID0+IHtcbiAgICAgICAgd29ya2Zsb3dEaXNjb250aW51YXRpb24ucmVqZWN0KFxuICAgICAgICAgIG5ldyBSZXBsYXlEaXZlcmdlbmNlRXJyb3IoXG4gICAgICAgICAgICBgUmVwbGF5IGNvdWxkIG5vdCBjb25zdW1lIGV2ZW50OiBldmVudFR5cGU9JHtldmVudC5ldmVudFR5cGV9LCBjb3JyZWxhdGlvbklkPSR7ZXZlbnQuY29ycmVsYXRpb25JZH0sIGV2ZW50SWQ9JHtldmVudC5ldmVudElkfS5gLFxuICAgICAgICAgICAgeyBldmVudElkOiBldmVudC5ldmVudElkIH1cbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgZ2V0UHJvbWlzZVF1ZXVlOiAoKSA9PiBwcm9taXNlUXVldWVIb2xkZXIuY3VycmVudCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHdvcmtmbG93Q29udGV4dDogV29ya2Zsb3dPcmNoZXN0cmF0b3JDb250ZXh0ID0ge1xuICAgICAgcnVuSWQ6IHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgZW5jcnlwdGlvbktleSxcbiAgICAgIGdsb2JhbFRoaXM6IHZtR2xvYmFsVGhpcyxcbiAgICAgIG9uV29ya2Zsb3dFcnJvcjogd29ya2Zsb3dEaXNjb250aW51YXRpb24ucmVqZWN0LFxuICAgICAgZXZlbnRzQ29uc3VtZXIsXG4gICAgICBnZW5lcmF0ZVVsaWQ6ICgpID0+IHVsaWQoK3N0YXJ0ZWRBdCksXG4gICAgICBnZW5lcmF0ZU5hbm9pZCxcbiAgICAgIGludm9jYXRpb25zUXVldWU6IG5ldyBNYXAoKSxcbiAgICAgIC8vIFVzZSBnZXR0ZXIvc2V0dGVyIHNvIHRoZSBFdmVudHNDb25zdW1lcidzIGdldFByb21pc2VRdWV1ZSgpIGFsd2F5c1xuICAgICAgLy8gc2VlcyB0aGUgbGF0ZXN0IHF1ZXVlIHN0YXRlIGFzIGl0J3MgbXV0YXRlZCBieSBzdGVwL2hvb2svc2xlZXAgY2FsbGJhY2tzLlxuICAgICAgZ2V0IHByb21pc2VRdWV1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2VRdWV1ZUhvbGRlci5jdXJyZW50O1xuICAgICAgfSxcbiAgICAgIHNldCBwcm9taXNlUXVldWUodmFsdWU6IFByb21pc2U8dm9pZD4pIHtcbiAgICAgICAgcHJvbWlzZVF1ZXVlSG9sZGVyLmN1cnJlbnQgPSB2YWx1ZTtcbiAgICAgIH0sXG4gICAgICBwZW5kaW5nRGVsaXZlcmllczogMCxcbiAgICAgIHBlbmRpbmdEZWxpdmVyeUJhcnJpZXJzOiBuZXcgTWFwKCksXG4gICAgICBzdGVwSHlkcmF0aW9uQ2FjaGUsXG4gICAgfTtcblxuICAgIC8vIENvbnN1bWUgcnVuIGxpZmVjeWNsZSBldmVudHMgLSB0aGVzZSBhcmUgc3RydWN0dXJhbCBldmVudHMgdGhhdCBkb24ndFxuICAgIC8vIG5lZWQgc3BlY2lhbCBoYW5kbGluZyBpbiB0aGUgd29ya2Zsb3csIGJ1dCBtdXN0IGJlIGNvbnN1bWVkIHRvIGFkdmFuY2VcbiAgICAvLyBwYXN0IHRoZW0gaW4gdGhlIGV2ZW50IGxvZ1xuICAgIHdvcmtmbG93Q29udGV4dC5ldmVudHNDb25zdW1lci5zdWJzY3JpYmUoKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWV2ZW50KSB7XG4gICAgICAgIHJldHVybiBFdmVudENvbnN1bWVyUmVzdWx0Lk5vdENvbnN1bWVkO1xuICAgICAgfVxuXG4gICAgICAvLyBDb25zdW1lIHJ1bl9jcmVhdGVkIC0gZXZlcnkgcnVuIGhhcyBleGFjdGx5IG9uZVxuICAgICAgaWYgKGV2ZW50LmV2ZW50VHlwZSA9PT0gJ3J1bl9jcmVhdGVkJykge1xuICAgICAgICByZXR1cm4gRXZlbnRDb25zdW1lclJlc3VsdC5Db25zdW1lZDtcbiAgICAgIH1cblxuICAgICAgLy8gQ29uc3VtZSBydW5fc3RhcnRlZCAtIGV2ZXJ5IHJ1biBoYXMgZXhhY3RseSBvbmVcbiAgICAgIGlmIChldmVudC5ldmVudFR5cGUgPT09ICdydW5fc3RhcnRlZCcpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50Q29uc3VtZXJSZXN1bHQuQ29uc3VtZWQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBFdmVudENvbnN1bWVyUmVzdWx0Lk5vdENvbnN1bWVkO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlU3RlcCA9IGNyZWF0ZVVzZVN0ZXAod29ya2Zsb3dDb250ZXh0KTtcbiAgICBjb25zdCBjcmVhdGVIb29rID0gY3JlYXRlQ3JlYXRlSG9vayh3b3JrZmxvd0NvbnRleHQpO1xuICAgIGNvbnN0IHNsZWVwID0gY3JlYXRlU2xlZXAod29ya2Zsb3dDb250ZXh0KTtcblxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBgQHR5cGVzL25vZGVgIHNheXMgc3ltYm9sIGlzIG5vdCB2YWxpZCwgYnV0IGl0IGRvZXMgd29ya1xuICAgIHZtR2xvYmFsVGhpc1tXT1JLRkxPV19VU0VfU1RFUF0gPSB1c2VTdGVwO1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBgQHR5cGVzL25vZGVgIHNheXMgc3ltYm9sIGlzIG5vdCB2YWxpZCwgYnV0IGl0IGRvZXMgd29ya1xuICAgIHZtR2xvYmFsVGhpc1tXT1JLRkxPV19DUkVBVEVfSE9PS10gPSBjcmVhdGVIb29rO1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBgQHR5cGVzL25vZGVgIHNheXMgc3ltYm9sIGlzIG5vdCB2YWxpZCwgYnV0IGl0IGRvZXMgd29ya1xuICAgIHZtR2xvYmFsVGhpc1tXT1JLRkxPV19TTEVFUF0gPSBzbGVlcDtcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gYEB0eXBlcy9ub2RlYCBzYXlzIHN5bWJvbCBpcyBub3QgdmFsaWQsIGJ1dCBpdCBkb2VzIHdvcmtcbiAgICB2bUdsb2JhbFRoaXNbV09SS0ZMT1dfR0VUX1NUUkVBTV9JRF0gPSAobmFtZXNwYWNlPzogc3RyaW5nKSA9PlxuICAgICAgZ2V0V29ya2Zsb3dSdW5TdHJlYW1JZCh3b3JrZmxvd1J1bi5ydW5JZCwgbmFtZXNwYWNlKTtcblxuICAgIC8vIEZvciB0aGUgd29ya2Zsb3cgVk0sIHdlIHN0b3JlIHRoZSBjb250ZXh0IGluIGEgc3ltYm9sIG9uIHRoZSBgZ2xvYmFsVGhpc2Agb2JqZWN0XG4gICAgY29uc3QgY3R4OiBXb3JrZmxvd01ldGFkYXRhID0ge1xuICAgICAgd29ya2Zsb3dOYW1lOiB3b3JrZmxvd1J1bi53b3JrZmxvd05hbWUsXG4gICAgICB3b3JrZmxvd1J1bklkOiB3b3JrZmxvd1J1bi5ydW5JZCxcbiAgICAgIHdvcmtmbG93U3RhcnRlZEF0OiBuZXcgdm1HbG9iYWxUaGlzLkRhdGUoK3N0YXJ0ZWRBdCksXG4gICAgICB1cmw6IHdvcmtmbG93QmFzZVVybCxcbiAgICB9O1xuXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGBAdHlwZXMvbm9kZWAgc2F5cyBzeW1ib2wgaXMgbm90IHZhbGlkLCBidXQgaXQgZG9lcyB3b3JrXG4gICAgdm1HbG9iYWxUaGlzW1dPUktGTE9XX0NPTlRFWFRfU1lNQk9MXSA9IGN0eDtcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gYEB0eXBlcy9ub2RlYCBzYXlzIHN5bWJvbCBpcyBub3QgdmFsaWQsIGJ1dCBpdCBkb2VzIHdvcmtcbiAgICB2bUdsb2JhbFRoaXNbU1RBQkxFX1VMSURdID0gdWxpZDtcblxuICAgIC8vIE5PVEU6IFdpbGwgaGF2ZSBhIGNvbmZpZyBvdmVycmlkZSB0byB1c2UgdGhlIGN1c3RvbSBmZXRjaCBzdGVwLlxuICAgIC8vICAgICAgIEZvciBub3cgYGZldGNoYCBtdXN0IGJlIGV4cGxpY2l0bHkgaW1wb3J0ZWQgZnJvbSBgd29ya2Zsb3dgLlxuICAgIHZtR2xvYmFsVGhpcy5mZXRjaCA9ICgpID0+IHtcbiAgICAgIHRocm93IG5ldyB2bUdsb2JhbFRoaXMuRXJyb3IoXG4gICAgICAgIGBHbG9iYWwgXCJmZXRjaFwiIGlzIHVuYXZhaWxhYmxlIGluIHdvcmtmbG93IGZ1bmN0aW9ucy4gVXNlIHRoZSBcImZldGNoXCIgc3RlcCBmdW5jdGlvbiBmcm9tIFwid29ya2Zsb3dcIiB0byBtYWtlIEhUVFAgcmVxdWVzdHMuXFxuXFxuTGVhcm4gbW9yZTogaHR0cHM6Ly91c2V3b3JrZmxvdy5kZXYvZXJyLyR7RVJST1JfU0xVR1MuRkVUQ0hfSU5fV09SS0ZMT1dfRlVOQ1RJT059YFxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgLy8gT3ZlcnJpZGUgdGltZW91dC9pbnRlcnZhbCBmdW5jdGlvbnMgdG8gdGhyb3cgaGVscGZ1bCBlcnJvcnNcbiAgICAvLyBUaGVzZSBhcmUgbm90IHN1cHBvcnRlZCBpbiB3b3JrZmxvdyBmdW5jdGlvbnMgYmVjYXVzZSB0aGV5IHJlbHkgb25cbiAgICAvLyBhc3luY2hyb25vdXMgc2NoZWR1bGluZyB3aGljaCBicmVha3MgZGV0ZXJtaW5pc3RpYyByZXBsYXlcbiAgICBjb25zdCB0aW1lb3V0RXJyb3JNZXNzYWdlID1cbiAgICAgICdUaW1lb3V0IGZ1bmN0aW9ucyBsaWtlIFwic2V0VGltZW91dFwiIGFuZCBcInNldEludGVydmFsXCIgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gd29ya2Zsb3cgZnVuY3Rpb25zLiBVc2UgdGhlIFwic2xlZXBcIiBmdW5jdGlvbiBmcm9tIFwid29ya2Zsb3dcIiBmb3IgdGltZS1iYXNlZCBkZWxheXMuJztcblxuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5zZXRUaW1lb3V0ID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5zZXRJbnRlcnZhbCA9ICgpID0+IHtcbiAgICAgIHRocm93IG5ldyBXb3JrZmxvd1J1bnRpbWVFcnJvcih0aW1lb3V0RXJyb3JNZXNzYWdlLCB7XG4gICAgICAgIHNsdWc6IEVSUk9SX1NMVUdTLlRJTUVPVVRfRlVOQ1RJT05TX0lOX1dPUktGTE9XLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICAodm1HbG9iYWxUaGlzIGFzIGFueSkuY2xlYXJUaW1lb3V0ID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5jbGVhckludGVydmFsID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5zZXRJbW1lZGlhdGUgPSAoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IodGltZW91dEVycm9yTWVzc2FnZSwge1xuICAgICAgICBzbHVnOiBFUlJPUl9TTFVHUy5USU1FT1VUX0ZVTkNUSU9OU19JTl9XT1JLRkxPVyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgKHZtR2xvYmFsVGhpcyBhcyBhbnkpLmNsZWFySW1tZWRpYXRlID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gYFJlcXVlc3RgIGFuZCBgUmVzcG9uc2VgIGFyZSBzcGVjaWFsIGJ1aWx0LWluIGNsYXNzZXMgdGhhdCBpbnZva2Ugc3RlcHNcbiAgICAvLyBmb3IgdGhlIGBqc29uKClgLCBgdGV4dCgpYCBhbmQgYGFycmF5QnVmZmVyKClgIGluc3RhbmNlIG1ldGhvZHNcbiAgICBjbGFzcyBSZXF1ZXN0IGltcGxlbWVudHMgZ2xvYmFsVGhpcy5SZXF1ZXN0IHtcbiAgICAgIGNhY2hlITogZ2xvYmFsVGhpcy5SZXF1ZXN0WydjYWNoZSddO1xuICAgICAgY3JlZGVudGlhbHMhOiBnbG9iYWxUaGlzLlJlcXVlc3RbJ2NyZWRlbnRpYWxzJ107XG4gICAgICBkZXN0aW5hdGlvbiE6IGdsb2JhbFRoaXMuUmVxdWVzdFsnZGVzdGluYXRpb24nXTtcbiAgICAgIGhlYWRlcnMhOiBIZWFkZXJzO1xuICAgICAgaW50ZWdyaXR5ITogc3RyaW5nO1xuICAgICAgbWV0aG9kITogc3RyaW5nO1xuICAgICAgbW9kZSE6IGdsb2JhbFRoaXMuUmVxdWVzdFsnbW9kZSddO1xuICAgICAgcmVkaXJlY3QhOiBnbG9iYWxUaGlzLlJlcXVlc3RbJ3JlZGlyZWN0J107XG4gICAgICByZWZlcnJlciE6IHN0cmluZztcbiAgICAgIHJlZmVycmVyUG9saWN5ITogZ2xvYmFsVGhpcy5SZXF1ZXN0WydyZWZlcnJlclBvbGljeSddO1xuICAgICAgdXJsITogc3RyaW5nO1xuICAgICAga2VlcGFsaXZlITogYm9vbGVhbjtcbiAgICAgIHNpZ25hbCE6IEFib3J0U2lnbmFsO1xuICAgICAgZHVwbGV4ITogJ2hhbGYnO1xuICAgICAgYm9keSE6IFJlYWRhYmxlU3RyZWFtPGFueT4gfCBudWxsO1xuXG4gICAgICBjb25zdHJ1Y3RvcihpbnB1dDogYW55LCBpbml0PzogUmVxdWVzdEluaXQpIHtcbiAgICAgICAgLy8gSGFuZGxlIFVSTCBpbnB1dFxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJyB8fCBpbnB1dCBpbnN0YW5jZW9mIHZtR2xvYmFsVGhpcy5VUkwpIHtcbiAgICAgICAgICBjb25zdCB1cmxTdHJpbmcgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgICAgIC8vIFZhbGlkYXRlIFVSTCBmb3JtYXRcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbmV3IHZtR2xvYmFsVGhpcy5VUkwodXJsU3RyaW5nKTtcbiAgICAgICAgICAgIHRoaXMudXJsID0gdXJsU3RyaW5nO1xuICAgICAgICAgIH0gY2F0Y2ggKGNhdXNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBGYWlsZWQgdG8gcGFyc2UgVVJMIGZyb20gJHt1cmxTdHJpbmd9YCwge1xuICAgICAgICAgICAgICBjYXVzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJbnB1dCBpcyBhIFJlcXVlc3Qgb2JqZWN0IC0gY2xvbmUgaXRzIHByb3BlcnRpZXNcbiAgICAgICAgICB0aGlzLnVybCA9IGlucHV0LnVybDtcbiAgICAgICAgICBpZiAoIWluaXQpIHtcbiAgICAgICAgICAgIHRoaXMubWV0aG9kID0gaW5wdXQubWV0aG9kO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IHZtR2xvYmFsVGhpcy5IZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgICAgICAgdGhpcy5ib2R5ID0gaW5wdXQuYm9keTtcbiAgICAgICAgICAgIHRoaXMubW9kZSA9IGlucHV0Lm1vZGU7XG4gICAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICAgICAgICB0aGlzLmNhY2hlID0gaW5wdXQuY2FjaGU7XG4gICAgICAgICAgICB0aGlzLnJlZGlyZWN0ID0gaW5wdXQucmVkaXJlY3Q7XG4gICAgICAgICAgICB0aGlzLnJlZmVycmVyID0gaW5wdXQucmVmZXJyZXI7XG4gICAgICAgICAgICB0aGlzLnJlZmVycmVyUG9saWN5ID0gaW5wdXQucmVmZXJyZXJQb2xpY3k7XG4gICAgICAgICAgICB0aGlzLmludGVncml0eSA9IGlucHV0LmludGVncml0eTtcbiAgICAgICAgICAgIHRoaXMua2VlcGFsaXZlID0gaW5wdXQua2VlcGFsaXZlO1xuICAgICAgICAgICAgdGhpcy5zaWduYWwgPSBpbnB1dC5zaWduYWw7XG4gICAgICAgICAgICB0aGlzLmR1cGxleCA9IGlucHV0LmR1cGxleDtcbiAgICAgICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBpbnB1dC5kZXN0aW5hdGlvbjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gSWYgaW5pdCBpcyBwcm92aWRlZCwgbWVyZ2U6IHVzZSBzb3VyY2UgcHJvcGVydGllcywgdGhlbiBvdmVycmlkZSB3aXRoIGluaXRcbiAgICAgICAgICAvLyBDb3B5IGFsbCBwcm9wZXJ0aWVzIGZyb20gdGhlIHNvdXJjZSBSZXF1ZXN0IGZpcnN0XG4gICAgICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IHZtR2xvYmFsVGhpcy5IZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgICAgIHRoaXMuYm9keSA9IGlucHV0LmJvZHk7XG4gICAgICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICAgICAgdGhpcy5jYWNoZSA9IGlucHV0LmNhY2hlO1xuICAgICAgICAgIHRoaXMucmVkaXJlY3QgPSBpbnB1dC5yZWRpcmVjdDtcbiAgICAgICAgICB0aGlzLnJlZmVycmVyID0gaW5wdXQucmVmZXJyZXI7XG4gICAgICAgICAgdGhpcy5yZWZlcnJlclBvbGljeSA9IGlucHV0LnJlZmVycmVyUG9saWN5O1xuICAgICAgICAgIHRoaXMuaW50ZWdyaXR5ID0gaW5wdXQuaW50ZWdyaXR5O1xuICAgICAgICAgIHRoaXMua2VlcGFsaXZlID0gaW5wdXQua2VlcGFsaXZlO1xuICAgICAgICAgIHRoaXMuc2lnbmFsID0gaW5wdXQuc2lnbmFsO1xuICAgICAgICAgIHRoaXMuZHVwbGV4ID0gaW5wdXQuZHVwbGV4O1xuICAgICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBpbnB1dC5kZXN0aW5hdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE92ZXJyaWRlIHdpdGggaW5pdCBvcHRpb25zIGlmIHByb3ZpZGVkXG4gICAgICAgIC8vIFNldCBtZXRob2RcbiAgICAgICAgaWYgKGluaXQ/Lm1ldGhvZCkge1xuICAgICAgICAgIHRoaXMubWV0aG9kID0gaW5pdC5tZXRob2QudG9VcHBlckNhc2UoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5tZXRob2QgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgLy8gRmFsbGJhY2sgdG8gZGVmYXVsdCBmb3Igc3RyaW5nIGlucHV0IGNhc2VcbiAgICAgICAgICB0aGlzLm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IGhlYWRlcnNcbiAgICAgICAgaWYgKGluaXQ/LmhlYWRlcnMpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgdm1HbG9iYWxUaGlzLkhlYWRlcnMoaW5pdC5oZWFkZXJzKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICB0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICAgaW5wdXQgaW5zdGFuY2VvZiB2bUdsb2JhbFRoaXMuVVJMXG4gICAgICAgICkge1xuICAgICAgICAgIC8vIEZvciBzdHJpbmcvVVJMIGlucHV0LCBjcmVhdGUgZW1wdHkgaGVhZGVyc1xuICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyB2bUdsb2JhbFRoaXMuSGVhZGVycygpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IG90aGVyIHByb3BlcnRpZXMgd2l0aCBpbml0IHZhbHVlcyBvciBkZWZhdWx0c1xuICAgICAgICBpZiAoaW5pdD8ubW9kZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5tb2RlID0gaW5pdC5tb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLm1vZGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5tb2RlID0gJ2NvcnMnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluaXQ/LmNyZWRlbnRpYWxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5pdC5jcmVkZW50aWFscztcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5jcmVkZW50aWFscyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gJ3NhbWUtb3JpZ2luJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGBhbnlgIGNhc3QgaGVyZSBiZWNhdXNlIEB0eXBlcy9ub2RlIHYyMiBkb2VzIG5vdCB5ZXQgaGF2ZSBgY2FjaGVgXG4gICAgICAgIGlmICgoaW5pdCBhcyBhbnkpPy5jYWNoZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5jYWNoZSA9IChpbml0IGFzIGFueSkuY2FjaGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuY2FjaGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5jYWNoZSA9ICdkZWZhdWx0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbml0Py5yZWRpcmVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5yZWRpcmVjdCA9IGluaXQucmVkaXJlY3Q7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMucmVkaXJlY3QgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5yZWRpcmVjdCA9ICdmb2xsb3cnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluaXQ/LnJlZmVycmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLnJlZmVycmVyID0gaW5pdC5yZWZlcnJlcjtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5yZWZlcnJlciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLnJlZmVycmVyID0gJ2Fib3V0OmNsaWVudCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5pdD8ucmVmZXJyZXJQb2xpY3kgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMucmVmZXJyZXJQb2xpY3kgPSBpbml0LnJlZmVycmVyUG9saWN5O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLnJlZmVycmVyUG9saWN5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMucmVmZXJyZXJQb2xpY3kgPSAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbml0Py5pbnRlZ3JpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuaW50ZWdyaXR5ID0gaW5pdC5pbnRlZ3JpdHk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuaW50ZWdyaXR5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMuaW50ZWdyaXR5ID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5pdD8ua2VlcGFsaXZlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLmtlZXBhbGl2ZSA9IGluaXQua2VlcGFsaXZlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLmtlZXBhbGl2ZSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgdGhpcy5rZWVwYWxpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbml0Py5zaWduYWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBBYm9ydFNpZ25hbCBzdHViXG4gICAgICAgICAgdGhpcy5zaWduYWwgPSBpbml0LnNpZ25hbDtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5zaWduYWwpIHtcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gQWJvcnRTaWduYWwgc3R1YlxuICAgICAgICAgIHRoaXMuc2lnbmFsID0geyBhYm9ydGVkOiBmYWxzZSB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmR1cGxleCkge1xuICAgICAgICAgIHRoaXMuZHVwbGV4ID0gJ2hhbGYnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9ICdkb2N1bWVudCc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBib2R5ID0gaW5pdD8uYm9keTtcblxuICAgICAgICAvLyBWYWxpZGF0ZSB0aGF0IEdFVC9IRUFEIG1ldGhvZHMgZG9uJ3QgaGF2ZSBhIGJvZHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGJvZHkgIT09IG51bGwgJiZcbiAgICAgICAgICBib2R5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFJlcXVlc3Qgd2l0aCBHRVQvSEVBRCBtZXRob2QgY2Fubm90IGhhdmUgYm9keS5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0b3JlIHRoZSBvcmlnaW5hbCBCb2R5SW5pdCBmb3Igc2VyaWFsaXphdGlvblxuICAgICAgICBpZiAoYm9keSAhPT0gbnVsbCAmJiBib2R5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBDcmVhdGUgYSBcImZha2VcIiBSZWFkYWJsZVN0cmVhbSB0aGF0IHN0b3JlcyB0aGUgb3JpZ2luYWwgYm9keVxuICAgICAgICAgIC8vIFRoaXMgYXZvaWRzIGRvaW5nIGFzeW5jIHdvcmsgZHVyaW5nIHdvcmtmbG93IHJlcGxheVxuICAgICAgICAgIHRoaXMuYm9keSA9IE9iamVjdC5jcmVhdGUodm1HbG9iYWxUaGlzLlJlYWRhYmxlU3RyZWFtLnByb3RvdHlwZSwge1xuICAgICAgICAgICAgW0JPRFlfSU5JVF9TWU1CT0xdOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBib2R5LFxuICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuYm9keSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY2xvbmUoKTogUmVxdWVzdCB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0IGJvZHlVc2VkKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IGltcGxlbWVudCB0aGVzZVxuICAgICAgYmxvYiE6ICgpID0+IFByb21pc2U8QmxvYj47XG4gICAgICBmb3JtRGF0YSE6ICgpID0+IFByb21pc2U8Rm9ybURhdGE+O1xuXG4gICAgICBhcnJheUJ1ZmZlciE6ICgpID0+IFByb21pc2U8QXJyYXlCdWZmZXI+O1xuICAgICAganNvbiE6ICgpID0+IFByb21pc2U8YW55PjtcbiAgICAgIHRleHQhOiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG5cbiAgICAgIGFzeW5jIGJ5dGVzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgdGhpcy5hcnJheUJ1ZmZlcigpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdm1HbG9iYWxUaGlzLlJlcXVlc3QgPSBSZXF1ZXN0O1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoUmVxdWVzdC5wcm90b3R5cGUsIHtcbiAgICAgIGFycmF5QnVmZmVyOiB7XG4gICAgICAgIHZhbHVlOiB1c2VTdGVwPFtdLCBBcnJheUJ1ZmZlcj4oJ19fYnVpbHRpbl9yZXNwb25zZV9hcnJheV9idWZmZXInKSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBqc29uOiB7XG4gICAgICAgIHZhbHVlOiB1c2VTdGVwPFtdLCBhbnk+KCdfX2J1aWx0aW5fcmVzcG9uc2VfanNvbicpLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHRleHQ6IHtcbiAgICAgICAgdmFsdWU6IHVzZVN0ZXA8W10sIHN0cmluZz4oJ19fYnVpbHRpbl9yZXNwb25zZV90ZXh0JyksXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY2xhc3MgUmVzcG9uc2UgaW1wbGVtZW50cyBnbG9iYWxUaGlzLlJlc3BvbnNlIHtcbiAgICAgIHR5cGUhOiBnbG9iYWxUaGlzLlJlc3BvbnNlWyd0eXBlJ107XG4gICAgICB1cmwhOiBzdHJpbmc7XG4gICAgICBzdGF0dXMhOiBudW1iZXI7XG4gICAgICBzdGF0dXNUZXh0ITogc3RyaW5nO1xuICAgICAgYm9keSE6IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHwgbnVsbDtcbiAgICAgIGhlYWRlcnMhOiBIZWFkZXJzO1xuICAgICAgcmVkaXJlY3RlZCE6IGJvb2xlYW47XG5cbiAgICAgIGNvbnN0cnVjdG9yKGJvZHk/OiBhbnksIGluaXQ/OiBSZXNwb25zZUluaXQpIHtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBpbml0Py5zdGF0dXMgPz8gMjAwO1xuICAgICAgICB0aGlzLnN0YXR1c1RleHQgPSBpbml0Py5zdGF0dXNUZXh0ID8/ICcnO1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgdm1HbG9iYWxUaGlzLkhlYWRlcnMoaW5pdD8uaGVhZGVycyk7XG4gICAgICAgIHRoaXMudHlwZSA9ICdkZWZhdWx0JztcbiAgICAgICAgdGhpcy51cmwgPSAnJztcbiAgICAgICAgdGhpcy5yZWRpcmVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgdGhhdCBudWxsLWJvZHkgc3RhdHVzIGNvZGVzIGRvbid0IGhhdmUgYSBib2R5XG4gICAgICAgIC8vIFBlciBIVFRQIHNwZWM6IDIwNCAoTm8gQ29udGVudCksIDIwNSAoUmVzZXQgQ29udGVudCksIGFuZCAzMDQgKE5vdCBNb2RpZmllZClcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGJvZHkgIT09IG51bGwgJiZcbiAgICAgICAgICBib2R5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAodGhpcy5zdGF0dXMgPT09IDIwNCB8fCB0aGlzLnN0YXR1cyA9PT0gMjA1IHx8IHRoaXMuc3RhdHVzID09PSAzMDQpXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBgUmVzcG9uc2UgY29uc3RydWN0b3I6IEludmFsaWQgcmVzcG9uc2Ugc3RhdHVzIGNvZGUgJHt0aGlzLnN0YXR1c31gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0b3JlIHRoZSBvcmlnaW5hbCBCb2R5SW5pdCBmb3Igc2VyaWFsaXphdGlvblxuICAgICAgICBpZiAoYm9keSAhPT0gbnVsbCAmJiBib2R5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBDcmVhdGUgYSBcImZha2VcIiBSZWFkYWJsZVN0cmVhbSB0aGF0IHN0b3JlcyB0aGUgb3JpZ2luYWwgYm9keVxuICAgICAgICAgIC8vIFRoaXMgYXZvaWRzIGRvaW5nIGFzeW5jIHdvcmsgZHVyaW5nIHdvcmtmbG93IHJlcGxheVxuICAgICAgICAgIHRoaXMuYm9keSA9IE9iamVjdC5jcmVhdGUodm1HbG9iYWxUaGlzLlJlYWRhYmxlU3RyZWFtLnByb3RvdHlwZSwge1xuICAgICAgICAgICAgW0JPRFlfSU5JVF9TWU1CT0xdOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBib2R5LFxuICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuYm9keSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogaW1wbGVtZW50IHRoZXNlXG4gICAgICBjbG9uZSE6ICgpID0+IFJlc3BvbnNlO1xuICAgICAgYmxvYiE6ICgpID0+IFByb21pc2U8Z2xvYmFsVGhpcy5CbG9iPjtcbiAgICAgIGZvcm1EYXRhITogKCkgPT4gUHJvbWlzZTxnbG9iYWxUaGlzLkZvcm1EYXRhPjtcblxuICAgICAgZ2V0IG9rKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwO1xuICAgICAgfVxuXG4gICAgICBnZXQgYm9keVVzZWQoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgYXJyYXlCdWZmZXIhOiAoKSA9PiBQcm9taXNlPEFycmF5QnVmZmVyPjtcbiAgICAgIGpzb24hOiAoKSA9PiBQcm9taXNlPGFueT47XG4gICAgICB0ZXh0ITogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuXG4gICAgICBhc3luYyBieXRlcygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGF3YWl0IHRoaXMuYXJyYXlCdWZmZXIoKSk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyBqc29uKGRhdGE6IGFueSwgaW5pdD86IFJlc3BvbnNlSW5pdCk6IFJlc3BvbnNlIHtcbiAgICAgICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuICAgICAgICBjb25zdCBoZWFkZXJzID0gbmV3IHZtR2xvYmFsVGhpcy5IZWFkZXJzKGluaXQ/LmhlYWRlcnMpO1xuICAgICAgICBpZiAoIWhlYWRlcnMuaGFzKCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICAgIGhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwgeyAuLi5pbml0LCBoZWFkZXJzIH0pO1xuICAgICAgfVxuXG4gICAgICBzdGF0aWMgZXJyb3IoKTogUmVzcG9uc2Uge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyByZWRpcmVjdCh1cmw6IHN0cmluZyB8IFVSTCwgc3RhdHVzOiBudW1iZXIgPSAzMDIpOiBSZXNwb25zZSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIHN0YXR1cyBjb2RlIC0gb25seSBzcGVjaWZpYyByZWRpcmVjdCBjb2RlcyBhcmUgYWxsb3dlZFxuICAgICAgICBpZiAoIVszMDEsIDMwMiwgMzAzLCAzMDcsIDMwOF0uaW5jbHVkZXMoc3RhdHVzKSkge1xuICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFxuICAgICAgICAgICAgYEludmFsaWQgcmVkaXJlY3Qgc3RhdHVzIGNvZGU6ICR7c3RhdHVzfS4gTXVzdCBiZSBvbmUgb2Y6IDMwMSwgMzAyLCAzMDMsIDMwNywgMzA4YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgcmVzcG9uc2Ugd2l0aCBMb2NhdGlvbiBoZWFkZXJcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IG5ldyB2bUdsb2JhbFRoaXMuSGVhZGVycygpO1xuICAgICAgICBoZWFkZXJzLnNldCgnTG9jYXRpb24nLCBTdHJpbmcodXJsKSk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBPYmplY3QuY3JlYXRlKFJlc3BvbnNlLnByb3RvdHlwZSk7XG4gICAgICAgIHJlc3BvbnNlLnN0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgcmVzcG9uc2Uuc3RhdHVzVGV4dCA9ICcnO1xuICAgICAgICByZXNwb25zZS5oZWFkZXJzID0gaGVhZGVycztcbiAgICAgICAgcmVzcG9uc2UuYm9keSA9IG51bGw7XG4gICAgICAgIHJlc3BvbnNlLnR5cGUgPSAnZGVmYXVsdCc7XG4gICAgICAgIHJlc3BvbnNlLnVybCA9ICcnO1xuICAgICAgICByZXNwb25zZS5yZWRpcmVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfVxuICAgIH1cbiAgICB2bUdsb2JhbFRoaXMuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFJlc3BvbnNlLnByb3RvdHlwZSwge1xuICAgICAgYXJyYXlCdWZmZXI6IHtcbiAgICAgICAgdmFsdWU6IHVzZVN0ZXA8W10sIEFycmF5QnVmZmVyPignX19idWlsdGluX3Jlc3BvbnNlX2FycmF5X2J1ZmZlcicpLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGpzb246IHtcbiAgICAgICAgdmFsdWU6IHVzZVN0ZXA8W10sIGFueT4oJ19fYnVpbHRpbl9yZXNwb25zZV9qc29uJyksXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgICAgdGV4dDoge1xuICAgICAgICB2YWx1ZTogdXNlU3RlcDxbXSwgc3RyaW5nPignX19idWlsdGluX3Jlc3BvbnNlX3RleHQnKSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjbGFzcyBSZWFkYWJsZVN0cmVhbTxUPiBpbXBsZW1lbnRzIGdsb2JhbFRoaXMuUmVhZGFibGVTdHJlYW08VD4ge1xuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0IGxvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjYW5jZWwoKTogYW55IHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBnZXRSZWFkZXIoKTogYW55IHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBwaXBlVGhyb3VnaCgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHBpcGVUbygpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHRlZSgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHZhbHVlcygpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyBmcm9tKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZtR2xvYmFsVGhpcy5SZWFkYWJsZVN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtO1xuXG4gICAgY2xhc3MgV3JpdGFibGVTdHJlYW08VD4gaW1wbGVtZW50cyBnbG9iYWxUaGlzLldyaXRhYmxlU3RyZWFtPFQ+IHtcbiAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIGdldCBsb2NrZWQoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgYWJvcnQoKTogYW55IHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBjbG9zZSgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIGdldFdyaXRlcigpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZtR2xvYmFsVGhpcy5Xcml0YWJsZVN0cmVhbSA9IFdyaXRhYmxlU3RyZWFtO1xuXG4gICAgY2xhc3MgVHJhbnNmb3JtU3RyZWFtPEksIE8+IGltcGxlbWVudHMgZ2xvYmFsVGhpcy5UcmFuc2Zvcm1TdHJlYW08SSwgTz4ge1xuICAgICAgcmVhZGFibGU6IGdsb2JhbFRoaXMuUmVhZGFibGVTdHJlYW08Tz47XG4gICAgICB3cml0YWJsZTogZ2xvYmFsVGhpcy5Xcml0YWJsZVN0cmVhbTxJPjtcblxuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdm1HbG9iYWxUaGlzLlRyYW5zZm9ybVN0cmVhbSA9IFRyYW5zZm9ybVN0cmVhbTtcblxuICAgIC8vIEV2ZW50dWFsbHkgd2UnbGwgcHJvYmFibHkgd2FudCB0byBwcm92aWRlIG91ciBvd24gYGNvbnNvbGVgIG9iamVjdCxcbiAgICAvLyBidXQgZm9yIG5vdyB3ZSdsbCBqdXN0IGV4cG9zZSB0aGUgZ2xvYmFsIG9uZS5cbiAgICB2bUdsb2JhbFRoaXMuY29uc29sZSA9IGdsb2JhbFRoaXMuY29uc29sZTtcblxuICAgIC8vIEhBQ0s6IHByb3BhZ2F0ZSBzeW1ib2wgbmVlZGVkIGZvciBBSSBnYXRld2F5IHVzYWdlXG4gICAgY29uc3QgU1lNQk9MX0ZPUl9SRVFfQ09OVEVYVCA9IFN5bWJvbC5mb3IoJ0B2ZXJjZWwvcmVxdWVzdC1jb250ZXh0Jyk7XG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGBAdHlwZXMvbm9kZWAgc2F5cyBzeW1ib2wgaXMgbm90IHZhbGlkLCBidXQgaXQgZG9lcyB3b3JrXG4gICAgdm1HbG9iYWxUaGlzW1NZTUJPTF9GT1JfUkVRX0NPTlRFWFRdID0gKGdsb2JhbFRoaXMgYXMgYW55KVtcbiAgICAgIFNZTUJPTF9GT1JfUkVRX0NPTlRFWFRcbiAgICBdO1xuXG4gICAgLy8gR2V0IGEgcmVmZXJlbmNlIHRvIHRoZSB1c2VyLWRlZmluZWQgd29ya2Zsb3cgZnVuY3Rpb24uXG4gICAgLy8gVGhlIGZpbGVuYW1lIHBhcmFtZXRlciBlbnN1cmVzIHN0YWNrIHRyYWNlcyBzaG93IGEgbWVhbmluZ2Z1bCBuYW1lXG4gICAgLy8gKGUuZy4sIFwiZXhhbXBsZS93b3JrZmxvd3MvOTlfZTJlLnRzXCIpIGluc3RlYWQgb2YgXCJldmFsbWFjaGluZS48YW5vbnltb3VzPlwiLlxuICAgIGNvbnN0IHBhcnNlZE5hbWUgPSBwYXJzZVdvcmtmbG93TmFtZSh3b3JrZmxvd1J1bi53b3JrZmxvd05hbWUpO1xuICAgIGNvbnN0IGZpbGVuYW1lID0gcGFyc2VkTmFtZT8ubW9kdWxlU3BlY2lmaWVyIHx8IHdvcmtmbG93UnVuLndvcmtmbG93TmFtZTtcblxuICAgIC8vIEV2YWx1YXRlIHRoZSB3b3JrZmxvdyBidW5kbGUgYWdhaW5zdCB0aGUgZnJlc2ggY29udGV4dCB1c2luZyBhXG4gICAgLy8gcHJvY2Vzcy13aWRlIGNhY2hlIG9mIHRoZSBjb21waWxlZCBgdm0uU2NyaXB0YC4gVGhlIGJ1bmRsZSBpcyB0aGUgc2FtZVxuICAgIC8vIHN0cmluZyBmb3IgZXZlcnkgcmVwbGF5IGFuZCBldmVyeSBpbnZvY2F0aW9uIGluIHRoaXMgcHJvY2VzcywgYW5kXG4gICAgLy8gY29tcGlsYXRpb24gaXMgYSBwdXJlIGZ1bmN0aW9uIG9mIGAoY29kZSwgZmlsZW5hbWUpYCwgc28gcmV1c2luZyB0aGVcbiAgICAvLyBjb21waWxlZCBTY3JpcHQgYWNyb3NzIHJlcGxheXMgaXMgZGV0ZXJtaW5pc20tc2FmZTogaXQgcHJvZHVjZXMgdGhlIHNhbWVcbiAgICAvLyB3b3JrZmxvdyBmdW5jdGlvbiBhbmQgdGhlIHNhbWUgYGZpbGVuYW1lYCBzb3VyY2UgYXR0cmlidXRpb24gYXNcbiAgICAvLyByZS1wYXJzaW5nIHRoZSBidW5kbGUgZXZlcnkgdGltZSwgYnV0IHNraXBzIHRoZSAoZXhwZW5zaXZlKSByZS1wYXJzZS5cbiAgICAvLyBFdmFsdWF0aW5nIHRoZSBidW5kbGUgcmVnaXN0ZXJzIGV2ZXJ5IHdvcmtmbG93IG9uXG4gICAgLy8gYGdsb2JhbFRoaXMuX19wcml2YXRlX3dvcmtmbG93c2A7IHRoZSB0cmFpbGluZyBsb29rdXAgZXhwcmVzc2lvbiB0aGVuXG4gICAgLy8gcmV0cmlldmVzIHRoZSByZXF1ZXN0ZWQgd29ya2Zsb3cgZnVuY3Rpb24uIFRoZSBsb29rdXAgaXMgZXZhbHVhdGVkIGFzIGFcbiAgICAvLyBzZXBhcmF0ZSBjYWNoZWQgU2NyaXB0IHVuZGVyIHRoZSBzYW1lIGBmaWxlbmFtZWAsIHNvIGVycm9yIHN0YWNrIGZyYW1lc1xuICAgIC8vIHN0aWxsIGF0dHJpYnV0ZSB0byB0aGUgd29ya2Zsb3cncyBzb3VyY2UgZmlsZSAoYHJlbWFwRXJyb3JTdGFja2Aga2V5cyBvblxuICAgIC8vIGBmaWxlbmFtZWApLiBUaGUgb25lIGJlaGF2aW91cmFsIGRpZmZlcmVuY2UgZnJvbSB0aGUgcHJldmlvdXNcbiAgICAvLyBzaW5nbGUtY29tYmluZWQtc3RyaW5nIGFwcHJvYWNoIGlzIHRoZSAqbGluZSBudW1iZXIqIG9mIGFuIGVycm9yIHRocm93blxuICAgIC8vIGJ5IHRoZSBsb29rdXAgZXhwcmVzc2lvbiBpdHNlbGY6IGl0IG5vdyByZXBvcnRzIGxpbmUgMSBvZiB0aGUgbG9va3VwXG4gICAgLy8gU2NyaXB0IHJhdGhlciB0aGFuIHRoZSBsaW5lIGp1c3QgcGFzdCB0aGUgZW5kIG9mIHRoZSBidW5kbGUuIFRoYXQgcGF0aFxuICAgIC8vIGlzIHJhcmUgKGl0IHJlcXVpcmVzIHRoZSBsb29rdXAgYD8uZ2V0KC4uLilgIGV4cHJlc3Npb24gdG8gdGhyb3cpIGFuZFxuICAgIC8vIGRvZXMgbm90IGFmZmVjdCB0aGUgd29ya2Zsb3cgZnVuY3Rpb24gb3IgcmVwbGF5IGRldGVybWluaXNtLlxuICAgIHJ1bkNhY2hlZFdvcmtmbG93U2NyaXB0KHdvcmtmbG93Q29kZSwgZmlsZW5hbWUsIGNvbnRleHQpO1xuICAgIGNvbnN0IHdvcmtmbG93Rm4gPSBydW5DYWNoZWRXb3JrZmxvd1NjcmlwdChcbiAgICAgIGBnbG9iYWxUaGlzLl9fcHJpdmF0ZV93b3JrZmxvd3M/LmdldCgke0pTT04uc3RyaW5naWZ5KHdvcmtmbG93UnVuLndvcmtmbG93TmFtZSl9KWAsXG4gICAgICBmaWxlbmFtZSxcbiAgICAgIGNvbnRleHRcbiAgICApO1xuXG4gICAgaWYgKHR5cGVvZiB3b3JrZmxvd0ZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dOb3RSZWdpc3RlcmVkRXJyb3Iod29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lKTtcbiAgICB9XG5cbiAgICAvLyBDaGFpbiB3b3JrZmxvdyBhcmd1bWVudCBoeWRyYXRpb24gb250byB0aGUgcHJvbWlzZVF1ZXVlIHNvIHRoYXQgdGhlXG4gICAgLy8gdW5jb25zdW1lZCBldmVudCBjaGVjayAod2hpY2ggd2FpdHMgZm9yIHRoZSBxdWV1ZSB0byBkcmFpbikgZG9lc24ndFxuICAgIC8vIGZpcmUgZHVyaW5nIHRoZSBhc3luYyBnYXAgYmV0d2VlbiBydW5fc3RhcnRlZCBjb25zdW1wdGlvbiBhbmQgdGhlXG4gICAgLy8gd29ya2Zsb3cgZnVuY3Rpb24gc3Vic2NyaWJpbmcgaXRzIGZpcnN0IHN0ZXAgY2FsbGJhY2tzLlxuICAgIGxldCBhcmdzOiB1bmtub3duW10gPSBbXTtcbiAgICB3b3JrZmxvd0NvbnRleHQucHJvbWlzZVF1ZXVlID0gd29ya2Zsb3dDb250ZXh0LnByb21pc2VRdWV1ZS50aGVuKFxuICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhcmdzID0gYXdhaXQgaHlkcmF0ZVdvcmtmbG93QXJndW1lbnRzKFxuICAgICAgICAgIHdvcmtmbG93UnVuLmlucHV0LFxuICAgICAgICAgIHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgICAgIGVuY3J5cHRpb25LZXksXG4gICAgICAgICAgdm1HbG9iYWxUaGlzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgKTtcbiAgICBhd2FpdCB3b3JrZmxvd0NvbnRleHQucHJvbWlzZVF1ZXVlO1xuXG4gICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dBcmd1bWVudHNDb3VudChhcmdzLmxlbmd0aCksXG4gICAgfSk7XG5cbiAgICAvLyBJbnZva2UgdXNlciB3b3JrZmxvd1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICB3b3JrZmxvd0ZuKC4uLmFyZ3MpLFxuICAgICAgICB3b3JrZmxvd0Rpc2NvbnRpbnVhdGlvbi5wcm9taXNlLFxuICAgICAgXSk7XG5cbiAgICAgIGNvbnN0IGRlaHlkcmF0ZWQgPSBhd2FpdCBkZWh5ZHJhdGVXb3JrZmxvd1JldHVyblZhbHVlKFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgICBlbmNyeXB0aW9uS2V5LFxuICAgICAgICB2bUdsb2JhbFRoaXNcbiAgICAgICk7XG5cbiAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSZXN1bHRUeXBlKHR5cGVvZiByZXN1bHQpLFxuICAgICAgfSk7XG5cbiAgICAgIHdhcm5QZW5kaW5nUXVldWVJdGVtcyhcbiAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWQsXG4gICAgICAgIHdvcmtmbG93Q29udGV4dC5pbnZvY2F0aW9uc1F1ZXVlLFxuICAgICAgICAnY29tcGxldGVkJ1xuICAgICAgKTtcblxuICAgICAgcmV0dXJuIGRlaHlkcmF0ZWQ7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBDb250cm9sLWZsb3cgc2lnbmFscyBhcmUgaGFuZGxlZCBieSB0aGUgcnVudGltZSBhbmQgZG8gbm90IG1lYW4gdGhlXG4gICAgICAvLyB3b3JrZmxvdyBoYXMgdGVybWluYWxseSBmYWlsZWQuXG4gICAgICBpZiAoV29ya2Zsb3dTdXNwZW5zaW9uLmlzKGVycikgfHwgUmVwbGF5RGl2ZXJnZW5jZUVycm9yLmlzKGVycikpIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICB3YXJuUGVuZGluZ1F1ZXVlSXRlbXMoXG4gICAgICAgIHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgICB3b3JrZmxvd0NvbnRleHQuaW52b2NhdGlvbnNRdWV1ZSxcbiAgICAgICAgJ2ZhaWxlZCdcbiAgICAgICk7XG5cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufVxuIiwgImltcG9ydCB7XG4gIEVSUk9SX1NMVUdTLFxuICBIb29rTm90Rm91bmRFcnJvcixcbiAgV29ya2Zsb3dSdW50aW1lRXJyb3IsXG59IGZyb20gJ0B3b3JrZmxvdy9lcnJvcnMnO1xuaW1wb3J0IHtcbiAgdHlwZSBIb29rLFxuICBpc0xlZ2FjeVNwZWNWZXJzaW9uLFxuICBTUEVDX1ZFUlNJT05fQ1VSUkVOVCxcbiAgU1BFQ19WRVJTSU9OX0xFR0FDWSxcbiAgdHlwZSBXb3JrZmxvd0ludm9rZVBheWxvYWQsXG4gIHR5cGUgV29ya2Zsb3dSdW4sXG59IGZyb20gJ0B3b3JrZmxvdy93b3JsZCc7XG5pbXBvcnQgeyBnZXRSdW5DYXBhYmlsaXRpZXMgfSBmcm9tICcuLi9jYXBhYmlsaXRpZXMuanMnO1xuaW1wb3J0IHsgdHlwZSBDcnlwdG9LZXksIGltcG9ydEtleSB9IGZyb20gJy4uL2VuY3J5cHRpb24uanMnO1xuaW1wb3J0IHsgcnVudGltZUxvZ2dlciB9IGZyb20gJy4uL2xvZ2dlci5qcyc7XG5pbXBvcnQge1xuICBkZWh5ZHJhdGVTdGVwUmV0dXJuVmFsdWUsXG4gIGh5ZHJhdGVTdGVwQXJndW1lbnRzLFxuICBTZXJpYWxpemF0aW9uRm9ybWF0LFxufSBmcm9tICcuLi9zZXJpYWxpemF0aW9uLmpzJztcbmltcG9ydCB7IFdFQkhPT0tfUkVTUE9OU0VfV1JJVEFCTEUgfSBmcm9tICcuLi9zeW1ib2xzLmpzJztcbmltcG9ydCAqIGFzIEF0dHJpYnV0ZSBmcm9tICcuLi90ZWxlbWV0cnkvc2VtYW50aWMtY29udmVudGlvbnMuanMnO1xuaW1wb3J0IHsgZ2V0U3BhbkNvbnRleHRGb3JUcmFjZUNhcnJpZXIsIHRyYWNlIH0gZnJvbSAnLi4vdGVsZW1ldHJ5LmpzJztcbmltcG9ydCB7IGdldFdvcmtmbG93UXVldWVOYW1lIH0gZnJvbSAnLi9oZWxwZXJzLmpzJztcbmltcG9ydCB7IHNhZmVXYWl0VW50aWwsIHdhaXRlZFVudGlsIH0gZnJvbSAnLi93YWl0LXVudGlsLmpzJztcbmltcG9ydCB7IGdldFdvcmxkIH0gZnJvbSAnLi93b3JsZC5qcyc7XG5cbmFzeW5jIGZ1bmN0aW9uIG1hdGVyaWFsaXplUmVzcG9uc2VCb2R5KHJlc3BvbnNlOiBSZXNwb25zZSk6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgaWYgKCFyZXNwb25zZS5ib2R5KSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKCk7XG4gIHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwge1xuICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxuICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG4gICAgaGVhZGVyczogcmVzcG9uc2UuaGVhZGVycyxcbiAgfSk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIHRoYXQgcmV0dXJucyB0aGUgaG9vaywgdGhlIGFzc29jaWF0ZWQgd29ya2Zsb3cgcnVuLFxuICogYW5kIHRoZSByZXNvbHZlZCBlbmNyeXB0aW9uIGtleS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0SG9va0J5VG9rZW5XaXRoS2V5KHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgaG9vazogSG9vaztcbiAgcnVuOiBXb3JrZmxvd1J1bjtcbiAgZW5jcnlwdGlvbktleTogQ3J5cHRvS2V5IHwgdW5kZWZpbmVkO1xufT4ge1xuICBjb25zdCB3b3JsZCA9IGdldFdvcmxkKCk7XG4gIGNvbnN0IGhvb2sgPSBhd2FpdCB3b3JsZC5ob29rcy5nZXRCeVRva2VuKHRva2VuKTtcbiAgY29uc3QgcnVuID0gYXdhaXQgd29ybGQucnVucy5nZXQoaG9vay5ydW5JZCk7XG4gIGNvbnN0IHJhd0tleSA9IGF3YWl0IHdvcmxkLmdldEVuY3J5cHRpb25LZXlGb3JSdW4/LihydW4pO1xuICBjb25zdCBlbmNyeXB0aW9uS2V5ID0gcmF3S2V5ID8gYXdhaXQgaW1wb3J0S2V5KHJhd0tleSkgOiB1bmRlZmluZWQ7XG4gIGlmICh0eXBlb2YgaG9vay5tZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBob29rLm1ldGFkYXRhID0gYXdhaXQgaHlkcmF0ZVN0ZXBBcmd1bWVudHMoXG4gICAgICBob29rLm1ldGFkYXRhIGFzIGFueSxcbiAgICAgIGhvb2sucnVuSWQsXG4gICAgICBlbmNyeXB0aW9uS2V5XG4gICAgKTtcbiAgfVxuICByZXR1cm4geyBob29rLCBydW4sIGVuY3J5cHRpb25LZXkgfTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGhvb2sgYnkgdG9rZW4gdG8gZmluZCB0aGUgYXNzb2NpYXRlZCB3b3JrZmxvdyBydW4sXG4gKiBhbmQgaHlkcmF0ZSB0aGUgYG1ldGFkYXRhYCBwcm9wZXJ0eSBpZiBpdCB3YXMgc2V0IGZyb20gd2l0aGluXG4gKiB0aGUgd29ya2Zsb3cgcnVuLlxuICpcbiAqIEBwYXJhbSB0b2tlbiAtIFRoZSB1bmlxdWUgdG9rZW4gaWRlbnRpZnlpbmcgdGhlIGhvb2tcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEhvb2tCeVRva2VuKHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPEhvb2s+IHtcbiAgY29uc3QgeyBob29rIH0gPSBhd2FpdCBnZXRIb29rQnlUb2tlbldpdGhLZXkodG9rZW4pO1xuICByZXR1cm4gaG9vaztcbn1cblxuLyoqXG4gKiBSZXN1bWVzIGEgd29ya2Zsb3cgcnVuIGJ5IHNlbmRpbmcgYSBwYXlsb2FkIHRvIGEgaG9vayBpZGVudGlmaWVkIGJ5IGl0cyB0b2tlbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBleHRlcm5hbGx5IChlLmcuLCBmcm9tIGFuIEFQSSByb3V0ZSBvciBzZXJ2ZXIgYWN0aW9uKVxuICogdG8gc2VuZCBkYXRhIHRvIGEgaG9vayBhbmQgcmVzdW1lIHRoZSBhc3NvY2lhdGVkIHdvcmtmbG93IHJ1bi5cbiAqXG4gKiBAcGFyYW0gdG9rZW5Pckhvb2sgLSBUaGUgdW5pcXVlIHRva2VuIGlkZW50aWZ5aW5nIHRoZSBob29rLCBvciB0aGUgaG9vayBvYmplY3QgaXRzZWxmXG4gKiBAcGFyYW0gcGF5bG9hZCAtIFRoZSBkYXRhIHBheWxvYWQgdG8gc2VuZCB0byB0aGUgaG9va1xuICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIGhvb2tcbiAqIEB0aHJvd3MgRXJyb3IgaWYgdGhlIGhvb2sgaXMgbm90IGZvdW5kIG9yIGlmIHRoZXJlJ3MgYW4gZXJyb3IgZHVyaW5nIHRoZSBwcm9jZXNzXG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiBgYGB0c1xuICogLy8gSW4gYW4gQVBJIHJvdXRlXG4gKiBpbXBvcnQgeyByZXN1bWVIb29rIH0gZnJvbSAnQHdvcmtmbG93L2NvcmUvcnVudGltZSc7XG4gKlxuICogZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxdWVzdDogUmVxdWVzdCkge1xuICogICBjb25zdCB7IHRva2VuLCBkYXRhIH0gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTtcbiAqXG4gKiAgIHRyeSB7XG4gKiAgICAgY29uc3QgaG9vayA9IGF3YWl0IHJlc3VtZUhvb2sodG9rZW4sIGRhdGEpO1xuICogICAgIHJldHVybiBSZXNwb25zZS5qc29uKHsgcnVuSWQ6IGhvb2sucnVuSWQgfSk7XG4gKiAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnSG9vayBub3QgZm91bmQnLCB7IHN0YXR1czogNDA0IH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3VtZUhvb2s8VCA9IGFueT4oXG4gIHRva2VuT3JIb29rOiBzdHJpbmcgfCBIb29rLFxuICBwYXlsb2FkOiBULFxuICBlbmNyeXB0aW9uS2V5T3ZlcnJpZGU/OiBDcnlwdG9LZXlcbik6IFByb21pc2U8SG9vaz4ge1xuICByZXR1cm4gYXdhaXQgd2FpdGVkVW50aWwoKCkgPT4ge1xuICAgIHJldHVybiB0cmFjZSgnaG9vay5yZXN1bWUnLCBhc3luYyAoc3BhbikgPT4ge1xuICAgICAgY29uc3Qgd29ybGQgPSBnZXRXb3JsZCgpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBsZXQgaG9vazogSG9vaztcbiAgICAgICAgbGV0IHdvcmtmbG93UnVuOiBXb3JrZmxvd1J1bjtcbiAgICAgICAgbGV0IGVuY3J5cHRpb25LZXk6IENyeXB0b0tleSB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiB0b2tlbk9ySG9vayA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRIb29rQnlUb2tlbldpdGhLZXkodG9rZW5Pckhvb2spO1xuICAgICAgICAgIGhvb2sgPSByZXN1bHQuaG9vaztcbiAgICAgICAgICB3b3JrZmxvd1J1biA9IHJlc3VsdC5ydW47XG4gICAgICAgICAgZW5jcnlwdGlvbktleSA9IGVuY3J5cHRpb25LZXlPdmVycmlkZSA/PyByZXN1bHQuZW5jcnlwdGlvbktleTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBob29rID0gdG9rZW5Pckhvb2s7XG4gICAgICAgICAgd29ya2Zsb3dSdW4gPSBhd2FpdCB3b3JsZC5ydW5zLmdldChob29rLnJ1bklkKTtcbiAgICAgICAgICBpZiAoZW5jcnlwdGlvbktleU92ZXJyaWRlKSB7XG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5ID0gZW5jcnlwdGlvbktleU92ZXJyaWRlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCByYXdLZXkgPSBhd2FpdCB3b3JsZC5nZXRFbmNyeXB0aW9uS2V5Rm9yUnVuPy4od29ya2Zsb3dSdW4pO1xuICAgICAgICAgICAgZW5jcnlwdGlvbktleSA9IHJhd0tleSA/IGF3YWl0IGltcG9ydEtleShyYXdLZXkpIDogdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Ib29rVG9rZW4oaG9vay50b2tlbiksXG4gICAgICAgICAgLi4uQXR0cmlidXRlLkhvb2tJZChob29rLmhvb2tJZCksXG4gICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93UnVuSWQoaG9vay5ydW5JZCksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENoZWNrIHRoZSB0YXJnZXQgcnVuJ3MgY2FwYWJpbGl0aWVzIHRvIGVuc3VyZSB3ZSBlbmNvZGUgdGhlXG4gICAgICAgIC8vIHBheWxvYWQgaW4gYSBmb3JtYXQgdGhlIHJ1bidzIGRlcGxveW1lbnQgY2FuIGRlY29kZS4gRm9yIGV4YW1wbGUsXG4gICAgICAgIC8vIHJ1bnMgY3JlYXRlZCBiZWZvcmUgZW5jcnlwdGlvbiBzdXBwb3J0IHdhcyBhZGRlZCBjYW5ub3QgZGVjb2RlXG4gICAgICAgIC8vIHRoZSAnZW5jcicgc2VyaWFsaXphdGlvbiBmb3JtYXQsIGFuZCBydW5zIGNyZWF0ZWQgYmVmb3JlXG4gICAgICAgIC8vIGJ5dGUtc3RyZWFtIGZyYW1pbmcgc3VwcG9ydCBjYW5ub3QgZGVjb2RlIGZyYW1lZCBieXRlIHN0cmVhbXMuXG4gICAgICAgIGNvbnN0IHJhd1ZlcnNpb24gPSB3b3JrZmxvd1J1bi5leGVjdXRpb25Db250ZXh0Py53b3JrZmxvd0NvcmVWZXJzaW9uO1xuICAgICAgICBjb25zdCBjYXBhYmlsaXRpZXMgPSBnZXRSdW5DYXBhYmlsaXRpZXMoXG4gICAgICAgICAgdHlwZW9mIHJhd1ZlcnNpb24gPT09ICdzdHJpbmcnID8gcmF3VmVyc2lvbiA6IHVuZGVmaW5lZFxuICAgICAgICApO1xuICAgICAgICBpZiAoIWNhcGFiaWxpdGllcy5zdXBwb3J0ZWRGb3JtYXRzLmhhcyhTZXJpYWxpemF0aW9uRm9ybWF0LkVOQ1JZUFRFRCkpIHtcbiAgICAgICAgICBlbmNyeXB0aW9uS2V5ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVoeWRyYXRlIHRoZSBwYXlsb2FkIGZvciBzdG9yYWdlXG4gICAgICAgIGNvbnN0IG9wczogUHJvbWlzZTxhbnk+W10gPSBbXTtcbiAgICAgICAgY29uc3QgdjFDb21wYXQgPSBpc0xlZ2FjeVNwZWNWZXJzaW9uKGhvb2suc3BlY1ZlcnNpb24pO1xuICAgICAgICBjb25zdCBkZWh5ZHJhdGVkUGF5bG9hZCA9IGF3YWl0IGRlaHlkcmF0ZVN0ZXBSZXR1cm5WYWx1ZShcbiAgICAgICAgICBwYXlsb2FkLFxuICAgICAgICAgIGhvb2sucnVuSWQsXG4gICAgICAgICAgZW5jcnlwdGlvbktleSxcbiAgICAgICAgICBvcHMsXG4gICAgICAgICAgZ2xvYmFsVGhpcyxcbiAgICAgICAgICB2MUNvbXBhdCxcbiAgICAgICAgICBjYXBhYmlsaXRpZXMuZnJhbWVkQnl0ZVN0cmVhbXNcbiAgICAgICAgKTtcbiAgICAgICAgLy8gVGhlc2UgcGF5bG9hZC1zdHJlYW0gb3BzIGFyZSBmbHVzaGVkIGluIHRoZSBiYWNrZ3JvdW5kOyB0aGVcbiAgICAgICAgLy8gcHJvbWlzZSBoYW5kZWQgdG8gd2FpdFVudGlsIG11c3QgbmV2ZXIgcmVqZWN0IChhbiB1bmNvbnN1bWVkXG4gICAgICAgIC8vIHdhaXRVbnRpbCByZWplY3Rpb24gY3Jhc2hlcyB0aGUgcHJvY2VzcyBhcyB1bmhhbmRsZWRSZWplY3Rpb24pLFxuICAgICAgICAvLyBzbyB1bmV4cGVjdGVkIGZhaWx1cmVzIGFyZSBsb2dnZWQgaW5zdGVhZC5cbiAgICAgICAgLy8gTk9URTogcmVqZWN0aW9ucyB3aXRoIGB1bmRlZmluZWRgIGFyZSBhbiBleHBlY3RlZCBhcnRpZmFjdCBvZiB0aGVcbiAgICAgICAgLy8gd2ViaG9vayBidW5kbGUgYW5kIGFyZSBpZ25vcmVkIGVudGlyZWx5LlxuICAgICAgICBzYWZlV2FpdFVudGlsKFByb21pc2UuYWxsKG9wcyksIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICBydW50aW1lTG9nZ2VyLndhcm4oJ0JhY2tncm91bmQgZmx1c2ggb2YgaG9vayBwYXlsb2FkIG9wcyBmYWlsZWQnLCB7XG4gICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBob29rLnJ1bklkLFxuICAgICAgICAgICAgaG9va0lkOiBob29rLmhvb2tJZCxcbiAgICAgICAgICAgIGVycm9yOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIGhvb2tfcmVjZWl2ZWQgZXZlbnQgd2l0aCB0aGUgcGF5bG9hZFxuICAgICAgICBhd2FpdCB3b3JsZC5ldmVudHMuY3JlYXRlKFxuICAgICAgICAgIGhvb2sucnVuSWQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXZlbnRUeXBlOiAnaG9va19yZWNlaXZlZCcsXG4gICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICBjb3JyZWxhdGlvbklkOiBob29rLmhvb2tJZCxcbiAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAuLi4odjFDb21wYXQgPyB7fSA6IHsgdG9rZW46IGhvb2sudG9rZW4gfSksXG4gICAgICAgICAgICAgIHBheWxvYWQ6IGRlaHlkcmF0ZWRQYXlsb2FkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgdjFDb21wYXQgfVxuICAgICAgICApO1xuXG4gICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd05hbWUod29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdHJhY2VDYXJyaWVyID0gd29ya2Zsb3dSdW4uZXhlY3V0aW9uQ29udGV4dD8udHJhY2VDYXJyaWVyO1xuXG4gICAgICAgIGlmICh0cmFjZUNhcnJpZXIpIHtcbiAgICAgICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgZ2V0U3BhbkNvbnRleHRGb3JUcmFjZUNhcnJpZXIodHJhY2VDYXJyaWVyKTtcbiAgICAgICAgICBpZiAoY29udGV4dCkge1xuICAgICAgICAgICAgc3Bhbj8uYWRkTGluaz8uKHsgY29udGV4dCB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZS10cmlnZ2VyIHRoZSB3b3JrZmxvdyBhZ2FpbnN0IHRoZSBkZXBsb3ltZW50IElEIGFzc29jaWF0ZWRcbiAgICAgICAgLy8gd2l0aCB0aGUgd29ya2Zsb3cgcnVuIHRoYXQgdGhlIGhvb2sgYmVsb25ncyB0b1xuICAgICAgICBhd2FpdCB3b3JsZC5xdWV1ZShcbiAgICAgICAgICBnZXRXb3JrZmxvd1F1ZXVlTmFtZSh3b3JrZmxvd1J1bi53b3JrZmxvd05hbWUpLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJ1bklkOiBob29rLnJ1bklkLFxuICAgICAgICAgICAgLy8gYXR0YWNoIHRoZSB0cmFjZSBjYXJyaWVyIGZyb20gdGhlIHdvcmtmbG93IHJ1blxuICAgICAgICAgICAgdHJhY2VDYXJyaWVyOlxuICAgICAgICAgICAgICB3b3JrZmxvd1J1bi5leGVjdXRpb25Db250ZXh0Py50cmFjZUNhcnJpZXIgPz8gdW5kZWZpbmVkLFxuICAgICAgICAgIH0gc2F0aXNmaWVzIFdvcmtmbG93SW52b2tlUGF5bG9hZCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkZXBsb3ltZW50SWQ6IHdvcmtmbG93UnVuLmRlcGxveW1lbnRJZCxcbiAgICAgICAgICAgIHNwZWNWZXJzaW9uOiB3b3JrZmxvd1J1bi5zcGVjVmVyc2lvbiA/PyBTUEVDX1ZFUlNJT05fTEVHQUNZLFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gaG9vaztcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBzcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAuLi5BdHRyaWJ1dGUuSG9va1Rva2VuKFxuICAgICAgICAgICAgdHlwZW9mIHRva2VuT3JIb29rID09PSAnc3RyaW5nJyA/IHRva2VuT3JIb29rIDogdG9rZW5Pckhvb2sudG9rZW5cbiAgICAgICAgICApLFxuICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Ib29rRm91bmQoZmFsc2UpLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cblxuLyoqXG4gKiBSZXN1bWVzIGEgd2ViaG9vayBieSBzZW5kaW5nIGEge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9SZXF1ZXN0IHwgUmVxdWVzdH1cbiAqIG9iamVjdCB0byBhIGhvb2sgaWRlbnRpZmllZCBieSBpdHMgdG9rZW4uXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZXh0ZXJuYWxseSAoZS5nLiwgZnJvbSBhbiBBUEkgcm91dGUgb3Igc2VydmVyIGFjdGlvbilcbiAqIHRvIHNlbmQgYSByZXF1ZXN0IHRvIGEgd2ViaG9vayBhbmQgcmVzdW1lIHRoZSBhc3NvY2lhdGVkIHdvcmtmbG93IHJ1bi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gLSBUaGUgdW5pcXVlIHRva2VuIGlkZW50aWZ5aW5nIHRoZSBob29rXG4gKiBAcGFyYW0gcmVxdWVzdCAtIFRoZSByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIGhvb2tcbiAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSByZXNwb25zZVxuICogQHRocm93cyBFcnJvciBpZiB0aGUgaG9vayBpcyBub3QgZm91bmQgb3IgaWYgdGhlcmUncyBhbiBlcnJvciBkdXJpbmcgdGhlIHByb2Nlc3NcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYHRzXG4gKiAvLyBJbiBhbiBBUEkgcm91dGVcbiAqIGltcG9ydCB7IHJlc3VtZVdlYmhvb2sgfSBmcm9tICdAd29ya2Zsb3cvY29yZS9ydW50aW1lJztcbiAqXG4gKiBleHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gKiAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuICogICBjb25zdCB0b2tlbiA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCd0b2tlbicpO1xuICpcbiAqICAgaWYgKCF0b2tlbikge1xuICogICAgIHJldHVybiBuZXcgUmVzcG9uc2UoJ01pc3NpbmcgdG9rZW4nLCB7IHN0YXR1czogNDAwIH0pO1xuICogICB9XG4gKlxuICogICB0cnkge1xuICogICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVzdW1lV2ViaG9vayh0b2tlbiwgcmVxdWVzdCk7XG4gKiAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICogICB9IGNhdGNoIChlcnJvcikge1xuICogICAgIHJldHVybiBuZXcgUmVzcG9uc2UoJ1dlYmhvb2sgbm90IGZvdW5kJywgeyBzdGF0dXM6IDQwNCB9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXN1bWVXZWJob29rKFxuICB0b2tlbjogc3RyaW5nLFxuICByZXF1ZXN0OiBSZXF1ZXN0XG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHsgaG9vaywgZW5jcnlwdGlvbktleSB9ID0gYXdhaXQgZ2V0SG9va0J5VG9rZW5XaXRoS2V5KHRva2VuKTtcblxuICAvLyBPbmx5IHdlYmhvb2tzIGNhbiBiZSByZXN1bWVkIHZpYSB0aGUgcHVibGljIGVuZHBvaW50LlxuICAvLyBJZiB0aGUgaG9vayB3YXMgY3JlYXRlZCB2aWEgY3JlYXRlSG9vaygpIChpc1dlYmhvb2sgIT09IHRydWUpLFxuICAvLyB0aHJvdyB0aGUgc2FtZSBcIm5vdCBmb3VuZFwiIGVycm9yIHRoZSB3b3JsZCB3b3VsZCB0aHJvdyBmb3IgYSBtaXNzaW5nXG4gIC8vIHRva2VuLiBUaGlzIHByZXZlbnRzIGxlYWtpbmcgdGhhdCB0aGUgdG9rZW4gaXMgdmFsaWQuXG4gIGlmIChob29rLmlzV2ViaG9vayA9PT0gZmFsc2UpIHtcbiAgICB0aHJvdyBuZXcgSG9va05vdEZvdW5kRXJyb3IodG9rZW4pO1xuICB9XG5cbiAgbGV0IHJlc3BvbnNlOiBSZXNwb25zZSB8IHVuZGVmaW5lZDtcbiAgbGV0IHJlc3BvbnNlUmVhZGFibGU6IFJlYWRhYmxlU3RyZWFtPFJlc3BvbnNlPiB8IHVuZGVmaW5lZDtcbiAgaWYgKFxuICAgIGhvb2subWV0YWRhdGEgJiZcbiAgICB0eXBlb2YgaG9vay5tZXRhZGF0YSA9PT0gJ29iamVjdCcgJiZcbiAgICAncmVzcG9uZFdpdGgnIGluIGhvb2subWV0YWRhdGFcbiAgKSB7XG4gICAgaWYgKGhvb2subWV0YWRhdGEucmVzcG9uZFdpdGggPT09ICdtYW51YWwnKSB7XG4gICAgICBjb25zdCB7IHJlYWRhYmxlLCB3cml0YWJsZSB9ID0gbmV3IFRyYW5zZm9ybVN0cmVhbTxSZXNwb25zZSwgUmVzcG9uc2U+KCk7XG4gICAgICByZXNwb25zZVJlYWRhYmxlID0gcmVhZGFibGU7XG5cbiAgICAgIC8vIFRoZSByZXF1ZXN0IGluc3RhbmNlIGluY2x1ZGVzIHRoZSB3cml0YWJsZSBzdHJlYW0gd2hpY2ggd2lsbCBiZSB1c2VkXG4gICAgICAvLyB0byB3cml0ZSB0aGUgcmVzcG9uc2UgdG8gdGhlIGNsaWVudCBmcm9tIHdpdGhpbiB0aGUgd29ya2Zsb3cgcnVuXG4gICAgICAocmVxdWVzdCBhcyBhbnkpW1dFQkhPT0tfUkVTUE9OU0VfV1JJVEFCTEVdID0gd3JpdGFibGU7XG4gICAgfSBlbHNlIGlmIChob29rLm1ldGFkYXRhLnJlc3BvbmRXaXRoIGluc3RhbmNlb2YgUmVzcG9uc2UpIHtcbiAgICAgIHJlc3BvbnNlID0gaG9vay5tZXRhZGF0YS5yZXNwb25kV2l0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKFxuICAgICAgICBgSW52YWxpZCBcXGByZXNwb25kV2l0aFxcYCB2YWx1ZTogJHtob29rLm1ldGFkYXRhLnJlc3BvbmRXaXRofWAsXG4gICAgICAgIHsgc2x1ZzogRVJST1JfU0xVR1MuV0VCSE9PS19JTlZBTElEX1JFU1BPTkRfV0lUSF9WQUxVRSB9XG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBObyBgcmVzcG9uZFdpdGhgIHZhbHVlIGltcGxpZXMgdGhlIGRlZmF1bHQgYmVoYXZpb3Igb2YgcmV0dXJuaW5nIGEgMjAyXG4gICAgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDIwMiB9KTtcbiAgfVxuXG4gIGF3YWl0IHJlc3VtZUhvb2soaG9vaywgcmVxdWVzdCwgZW5jcnlwdGlvbktleSk7XG5cbiAgaWYgKHJlc3BvbnNlUmVhZGFibGUpIHtcbiAgICAvLyBXYWl0IGZvciB0aGUgcmVhZGFibGUgc3RyZWFtIHRvIGVtaXQgb25lIGNodW5rLFxuICAgIC8vIHdoaWNoIGlzIHRoZSBgUmVzcG9uc2VgIG9iamVjdFxuICAgIGNvbnN0IHJlYWRlciA9IHJlc3BvbnNlUmVhZGFibGUuZ2V0UmVhZGVyKCk7XG4gICAgY29uc3QgY2h1bmsgPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgIGlmIChjaHVuay52YWx1ZSkge1xuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBtYXRlcmlhbGl6ZVJlc3BvbnNlQm9keShjaHVuay52YWx1ZSk7XG4gICAgfVxuICAgIGF3YWl0IHJlYWRlci5jYW5jZWwoKTtcbiAgfVxuXG4gIGlmICghcmVzcG9uc2UpIHtcbiAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IoJ1dvcmtmbG93IHJ1biBkaWQgbm90IHNlbmQgYSByZXNwb25zZScsIHtcbiAgICAgIHNsdWc6IEVSUk9SX1NMVUdTLldFQkhPT0tfUkVTUE9OU0VfTk9UX1NFTlQsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcmVzcG9uc2U7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFTLFlBQVksVUFBVTtBQUMvQixPQUFPLFVBQVU7QUFFVixTQUFTLGlCQUFpQixJQUFJO0FBQ2pDLFNBQU8sUUFBUSxLQUFLLEVBQUU7QUFDMUI7QUFDQSxTQUFTLFNBQVMsSUFBSTtBQUNsQixNQUFJLENBQUMsaUJBQWlCLEVBQUUsR0FBRztBQUN2QixVQUFNLElBQUksTUFBTSx1QkFBdUIsR0FBRyxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUU7QUFBQSxFQUM1RDtBQUNKO0FBeUZBLFNBQVMsYUFBYSxLQUFLO0FBQ3ZCLFNBQU87QUFBQSxJQUNILElBQUksSUFBSTtBQUFBLElBQ1IsUUFBUSxJQUFJLFdBQVc7QUFBQSxJQUN2QixPQUFPLElBQUk7QUFBQSxJQUNYLGdCQUFnQixJQUFJO0FBQUEsSUFDcEIsTUFBTSxJQUFJLFFBQVE7QUFBQSxJQUNsQixTQUFTLElBQUksV0FBVztBQUFBLElBQ3hCLFlBQVksSUFBSSxlQUFlO0FBQUEsSUFDL0IsUUFBUSxJQUFJO0FBQUEsSUFDWixPQUFPLElBQUksU0FBUztBQUFBLElBQ3BCLFdBQVcsSUFBSTtBQUFBLElBQ2YsWUFBWSxJQUFJLGVBQWU7QUFBQSxJQUMvQixnQkFBZ0IsSUFBSSxtQkFBbUI7QUFBQSxJQUN2QyxRQUFRLElBQUksVUFBVTtBQUFBLElBQ3RCLGVBQWUsSUFBSSxtQkFBbUI7QUFBQSxJQUN0QyxpQkFBaUIsSUFBSSxvQkFBb0I7QUFBQSxJQUN6QyxXQUFXLElBQUksYUFBYTtBQUFBLEVBQ2hDO0FBQ0o7QUFDQSxTQUFTLGFBQWEsUUFBUTtBQUMxQixRQUFNLE1BQU0sQ0FBQztBQUNiLE1BQUksT0FBTyxPQUFPLE9BQVcsS0FBSSxLQUFLLE9BQU87QUFDN0MsTUFBSSxPQUFPLFdBQVcsT0FBVyxLQUFJLFVBQVUsT0FBTztBQUN0RCxNQUFJLE9BQU8sVUFBVSxPQUFXLEtBQUksUUFBUSxPQUFPO0FBQ25ELE1BQUksT0FBTyxtQkFBbUIsT0FBVyxLQUFJLGtCQUFrQixPQUFPO0FBQ3RFLE1BQUksT0FBTyxTQUFTLE9BQVcsS0FBSSxPQUFPLE9BQU87QUFDakQsTUFBSSxPQUFPLFlBQVksT0FBVyxLQUFJLFVBQVUsT0FBTztBQUN2RCxNQUFJLE9BQU8sZUFBZSxPQUFXLEtBQUksY0FBYyxPQUFPLGNBQWM7QUFDNUUsTUFBSSxPQUFPLFdBQVcsT0FBVyxLQUFJLFNBQVMsT0FBTztBQUNyRCxNQUFJLE9BQU8sVUFBVSxPQUFXLEtBQUksUUFBUSxPQUFPO0FBQ25ELE1BQUksT0FBTyxjQUFjLE9BQVcsS0FBSSxhQUFhLE9BQU87QUFDNUQsTUFBSSxPQUFPLGVBQWUsT0FBVyxLQUFJLGNBQWMsT0FBTztBQUM5RCxNQUFJLE9BQU8sbUJBQW1CLE9BQVcsS0FBSSxrQkFBa0IsT0FBTztBQUN0RSxNQUFJLE9BQU8sV0FBVyxPQUFXLEtBQUksU0FBUyxPQUFPO0FBQ3JELE1BQUksT0FBTyxrQkFBa0IsT0FBVyxLQUFJLGtCQUFrQixPQUFPO0FBQ3JFLE1BQUksT0FBTyxvQkFBb0IsT0FBVyxLQUFJLG1CQUFtQixPQUFPO0FBQ3hFLE1BQUksT0FBTyxjQUFjLE9BQVcsS0FBSSxZQUFZLE9BQU87QUFDM0QsU0FBTztBQUNYO0FBcUVBLFNBQVMsV0FBVyxNQUFNLFVBQVUsT0FBTztBQUN2QyxRQUFNLFFBQVEsS0FBSztBQUNuQixRQUFNLE9BQU87QUFBQSxJQUNULGdCQUFnQjtBQUFBLElBQ2hCLGlCQUFpQjtBQUFBLElBQ2pCLGlCQUFpQjtBQUFBLEVBQ3JCO0FBQ0EsUUFBTSxRQUFRLFFBQVEsb0JBQW9CLEtBQUssS0FBSyxJQUFJO0FBQ3hELE1BQUksVUFBVSxNQUFNLENBQUMsS0FBSyxNQUFNLENBQUMsSUFBSTtBQUNqQyxRQUFJQTtBQUNKLFFBQUk7QUFDSixRQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7QUFDWCxZQUFNLFNBQVMsS0FBSyxJQUFJLFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUs7QUFDckQsTUFBQUEsU0FBUSxRQUFRO0FBQ2hCLFlBQU0sUUFBUTtBQUFBLElBQ2xCLE9BQU87QUFDSCxNQUFBQSxTQUFRLFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRTtBQUM3QixZQUFNLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxRQUFRO0FBQUEsSUFDM0U7QUFDQSxRQUFJQSxVQUFTLE9BQU9BLFNBQVEsT0FBTztBQUMvQixZQUFNLFFBQVEsS0FBSyxNQUFNQSxRQUFPLE1BQU0sQ0FBQztBQUN2QyxhQUFPO0FBQUEsUUFDSCxRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsVUFDTCxHQUFHO0FBQUEsVUFDSCxpQkFBaUIsU0FBU0EsTUFBSyxJQUFJLEdBQUcsSUFBSSxLQUFLO0FBQUEsVUFDL0Msa0JBQWtCLE9BQU8sTUFBTSxVQUFVO0FBQUEsUUFDN0M7QUFBQSxRQUNBLE1BQU07QUFBQSxNQUNWO0FBQUEsSUFDSjtBQUNBLFdBQU87QUFBQSxNQUNILFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxRQUNMLGlCQUFpQjtBQUFBLFFBQ2pCLGlCQUFpQixXQUFXLEtBQUs7QUFBQSxNQUNyQztBQUFBLE1BQ0EsTUFBTSxJQUFJLFdBQVcsQ0FBQztBQUFBLElBQzFCO0FBQUEsRUFDSjtBQUNBLFNBQU87QUFBQSxJQUNILFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxNQUNMLEdBQUc7QUFBQSxNQUNILGtCQUFrQixPQUFPLEtBQUs7QUFBQSxJQUNsQztBQUFBLElBQ0EsTUFBTTtBQUFBLEVBQ1Y7QUFDSjtBQW1PTyxTQUFTLFdBQVc7QUFDdkIsTUFBSSxDQUFDLE9BQU87QUFDUixVQUFNLGNBQWMsUUFBUSxRQUFRLElBQUksZ0JBQWdCLFFBQVEsSUFBSSxtQkFBbUI7QUFDdkYsVUFBTSxVQUFVLFFBQVEsUUFBUSxJQUFJLHFCQUFxQjtBQUN6RCxRQUFJLFFBQVEsSUFBSSxXQUFXLENBQUMsZUFBZSxDQUFDLFVBQVU7QUFDbEQsWUFBTSxJQUFJLE1BQU0sb0lBQW9JO0FBQUEsSUFDeEo7QUFDQSxVQUFNLFdBQVcsS0FBSyxLQUFLLFFBQVEsSUFBSSxHQUFHLE9BQU87QUFDakQsWUFBUSxJQUFJLGVBQWUsY0FBYyxJQUFJLGFBQWEsSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFVBQVUsVUFBVSxDQUFDLEdBQUcsVUFBVSxJQUFJLFdBQVcsSUFBSSxJQUFJLFNBQVMsUUFBUSxDQUFDO0FBQUEsRUFDbEs7QUFDQSxTQUFPO0FBQ1g7QUE3ZUEsSUFFTSxTQVNBLFdBSUEsUUE0SEEsY0FxSEEsVUE4REEsWUFpR0EsZ0JBa0VGO0FBamVKO0FBQUE7QUFBQTtBQUVBLElBQU0sVUFBVTtBQUNBO0FBR1A7QUFLVCxJQUFNLFlBQVk7QUFBQSxNQUNkLGFBQWE7QUFBQSxNQUNiLGNBQWM7QUFBQSxJQUNsQjtBQUNBLElBQU0sU0FBTixNQUFhO0FBQUEsTUFmYixPQWVhO0FBQUE7QUFBQTtBQUFBLE1BQ1Q7QUFBQSxNQUNBLFlBQVksS0FBSTtBQUNaLGFBQUssTUFBTTtBQUFBLE1BQ2Y7QUFBQSxNQUNBLEtBQUssSUFBSTtBQUNMLGVBQU8sS0FBSyxLQUFLLEtBQUssS0FBSyxHQUFHLEVBQUUsT0FBTztBQUFBLE1BQzNDO0FBQUEsTUFDQSxNQUFNLE1BQU0sU0FBUztBQUNqQixjQUFNLEdBQUcsTUFBTSxLQUFLLEtBQUs7QUFBQSxVQUNyQixXQUFXO0FBQUEsUUFDZixDQUFDO0FBQ0QsY0FBTSxTQUFTLEtBQUssS0FBSyxRQUFRLEVBQUU7QUFDbkMsY0FBTSxNQUFNLEdBQUcsTUFBTTtBQUNyQixjQUFNLEdBQUcsVUFBVSxLQUFLLEtBQUssVUFBVSxTQUFTLE1BQU0sQ0FBQyxDQUFDO0FBQ3hELGNBQU0sR0FBRyxPQUFPLEtBQUssTUFBTTtBQUFBLE1BQy9CO0FBQUEsTUFDQSxNQUFNLEtBQUssUUFBUTtBQUNmLGNBQU0sR0FBRyxNQUFNLEtBQUssS0FBSztBQUFBLFVBQ3JCLFdBQVc7QUFBQSxRQUNmLENBQUM7QUFDRCxjQUFNLFFBQVEsTUFBTSxHQUFHLFFBQVEsS0FBSyxHQUFHO0FBQ3ZDLGNBQU0sV0FBVyxDQUFDO0FBQ2xCLG1CQUFXLEtBQUssT0FBTTtBQUNsQixjQUFJLENBQUMsRUFBRSxTQUFTLE9BQU8sRUFBRztBQUMxQixjQUFJO0FBQ0EscUJBQVMsS0FBSyxLQUFLLE1BQU0sTUFBTSxHQUFHLFNBQVMsS0FBSyxLQUFLLEtBQUssS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7QUFBQSxVQUMvRSxRQUFTO0FBQUEsVUFFVDtBQUFBLFFBQ0o7QUFDQSxjQUFNLFVBQVUsU0FBUyxTQUFTLE9BQU8sQ0FBQyxNQUFJLEVBQUUsV0FBVyxPQUFPLFVBQVUsT0FBTyxrQkFBa0IsRUFBRSxXQUFXLE1BQVMsSUFBSTtBQUMvSCxlQUFPLFFBQVEsS0FBSyxDQUFDLEdBQUcsTUFBSSxFQUFFLFVBQVUsY0FBYyxFQUFFLFNBQVMsQ0FBQztBQUFBLE1BQ3RFO0FBQUEsTUFDQSxNQUFNLElBQUksSUFBSTtBQUNWLFlBQUk7QUFDQSxpQkFBTyxLQUFLLE1BQU0sTUFBTSxHQUFHLFNBQVMsS0FBSyxLQUFLLEVBQUUsR0FBRyxNQUFNLENBQUM7QUFBQSxRQUM5RCxRQUFTO0FBQ0wsaUJBQU87QUFBQSxRQUNYO0FBQUEsTUFDSjtBQUFBLE1BQ0EsTUFBTSxnQkFBZ0IsT0FBTztBQUN6QixjQUFNLE1BQU0sTUFBTSxLQUFLLEtBQUs7QUFDNUIsZUFBTyxJQUFJLEtBQUssQ0FBQyxNQUFJLEVBQUUsZUFBZSxLQUFLLEtBQUs7QUFBQSxNQUNwRDtBQUFBLE1BQ0EsTUFBTSxjQUFjLElBQUksT0FBTztBQUMzQixjQUFNLFdBQVcsTUFBTSxLQUFLLElBQUksRUFBRTtBQUNsQyxZQUFJLENBQUMsU0FBVTtBQUNmLGNBQU0sS0FBSyxNQUFNO0FBQUEsVUFDYixHQUFHO0FBQUEsVUFDSCxZQUFZLFNBQVM7QUFBQSxRQUN6QixDQUFDO0FBQUEsTUFDTDtBQUFBLE1BQ0EsTUFBTSxPQUFPLFNBQVM7QUFDbEIsY0FBTSxLQUFLLE1BQU0sT0FBTztBQUFBLE1BQzVCO0FBQUEsTUFDQSxNQUFNLE1BQU0sSUFBSSxRQUFRO0FBQ3BCLGNBQU0sV0FBVyxNQUFNLEtBQUssSUFBSSxFQUFFO0FBQ2xDLFlBQUksQ0FBQyxTQUFVLFFBQU87QUFDdEIsY0FBTSxVQUFVO0FBQUEsVUFDWixHQUFHO0FBQUEsVUFDSCxHQUFHO0FBQUEsVUFDSDtBQUFBLFFBQ0o7QUFDQSxjQUFNLEtBQUssTUFBTSxPQUFPO0FBQ3hCLGVBQU87QUFBQSxNQUNYO0FBQUEsTUFDQSxNQUFNLFFBQVEsSUFBSSxnQkFBZ0IsUUFBUTtBQUN0QyxjQUFNLFdBQVcsTUFBTSxLQUFLLElBQUksRUFBRTtBQUNsQyxZQUFJLENBQUMsWUFBWSxTQUFTLFdBQVcsZUFBZ0IsUUFBTztBQUM1RCxjQUFNLFVBQVU7QUFBQSxVQUNaLEdBQUc7QUFBQSxVQUNILEdBQUc7QUFBQSxVQUNIO0FBQUEsUUFDSjtBQUNBLGNBQU0sS0FBSyxNQUFNLE9BQU87QUFDeEIsZUFBTztBQUFBLE1BQ1g7QUFBQSxNQUNBLE1BQU0sT0FBTyxJQUFJO0FBQ2IsY0FBTSxHQUFHLEdBQUcsS0FBSyxLQUFLLEVBQUUsR0FBRztBQUFBLFVBQ3ZCLE9BQU87QUFBQSxRQUNYLENBQUM7QUFBQSxNQUNMO0FBQUEsSUFDSjtBQUNTO0FBb0JBO0FBb0JULElBQU0sZUFBTixNQUFtQjtBQUFBLE1BM0luQixPQTJJbUI7QUFBQTtBQUFBO0FBQUEsTUFDZixnQkFBZ0I7QUFBQSxNQUNoQixTQUFTO0FBQ0wsWUFBSSxDQUFDLEtBQUssZUFBZTtBQUNyQixlQUFLLGdCQUFnQixPQUFPLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxFQUFFLGFBQWEsTUFBSSxhQUFhLFFBQVEsSUFBSSxjQUFjLFFBQVEsSUFBSSxxQkFBcUI7QUFBQSxZQUM5SSxNQUFNO0FBQUEsY0FDRixnQkFBZ0I7QUFBQSxZQUNwQjtBQUFBLFVBQ0osQ0FBQyxDQUFDO0FBQUEsUUFDVjtBQUNBLGVBQU8sS0FBSztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxNQUFNLEtBQUssUUFBUTtBQUNmLGNBQU0sV0FBVyxNQUFNLEtBQUssT0FBTztBQUNuQyxZQUFJLFFBQVEsU0FBUyxLQUFLLFVBQVUsRUFBRSxPQUFPLEdBQUcsRUFBRSxNQUFNLGNBQWM7QUFBQSxVQUNsRSxXQUFXO0FBQUEsUUFDZixDQUFDO0FBQ0QsWUFBSSxRQUFRO0FBQ1Isa0JBQVEsT0FBTyxpQkFBaUIsTUFBTSxHQUFHLGNBQWMsT0FBTyxNQUFNLGtCQUFrQixJQUFJLE1BQU0sR0FBRyxXQUFXLE9BQU8sTUFBTTtBQUFBLFFBQy9IO0FBQ0EsY0FBTSxFQUFFLE1BQU0sTUFBTSxJQUFJLE1BQU07QUFDOUIsWUFBSSxNQUFPLE9BQU0sSUFBSSxNQUFNLHlCQUF5QixNQUFNLE9BQU8sRUFBRTtBQUNuRSxlQUFPLEtBQUssSUFBSSxZQUFZO0FBQUEsTUFDaEM7QUFBQSxNQUNBLE1BQU0sSUFBSSxJQUFJO0FBQ1YsY0FBTSxXQUFXLE1BQU0sS0FBSyxPQUFPO0FBQ25DLGNBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLFNBQVMsS0FBSyxVQUFVLEVBQUUsT0FBTyxHQUFHLEVBQUUsR0FBRyxNQUFNLEVBQUUsRUFBRSxZQUFZO0FBQzdGLFlBQUksTUFBTyxPQUFNLElBQUksTUFBTSx1QkFBdUIsTUFBTSxPQUFPLEVBQUU7QUFDakUsZUFBTyxPQUFPLGFBQWEsSUFBSSxJQUFJO0FBQUEsTUFDdkM7QUFBQSxNQUNBLE1BQU0sZ0JBQWdCLE9BQU87QUFDekIsY0FBTSxXQUFXLE1BQU0sS0FBSyxPQUFPO0FBQ25DLGNBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLFNBQVMsS0FBSyxVQUFVLEVBQUUsT0FBTyxHQUFHLEVBQUUsR0FBRyxlQUFlLEtBQUssRUFBRSxZQUFZO0FBQ3pHLFlBQUksTUFBTyxPQUFNLElBQUksTUFBTSxnQ0FBZ0MsTUFBTSxPQUFPLEVBQUU7QUFDMUUsZUFBTyxPQUFPLGFBQWEsSUFBSSxJQUFJO0FBQUEsTUFDdkM7QUFBQSxNQUNBLE1BQU0sY0FBYyxJQUFJLE9BQU87QUFDM0IsY0FBTSxXQUFXLE1BQU0sS0FBSyxPQUFPO0FBQ25DLGNBQU0sRUFBRSxNQUFNLElBQUksTUFBTSxTQUFTLEtBQUssVUFBVSxFQUFFLE9BQU87QUFBQSxVQUNyRCxhQUFhO0FBQUEsUUFDakIsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFO0FBQ2QsWUFBSSxNQUFPLE9BQU0sSUFBSSxNQUFNLDJCQUEyQixNQUFNLE9BQU8sRUFBRTtBQUFBLE1BQ3pFO0FBQUEsTUFDQSxNQUFNLE9BQU8sU0FBUztBQUNsQixjQUFNLFdBQVcsTUFBTSxLQUFLLE9BQU87QUFDbkMsY0FBTSxFQUFFLE1BQU0sSUFBSSxNQUFNLFNBQVMsS0FBSyxVQUFVLEVBQUUsT0FBTyxhQUFhLE9BQU8sQ0FBQztBQUM5RSxZQUFJLE1BQU8sT0FBTSxJQUFJLE1BQU0sMEJBQTBCLE1BQU0sT0FBTyxFQUFFO0FBQUEsTUFDeEU7QUFBQSxNQUNBLE1BQU0sTUFBTSxJQUFJLFFBQVE7QUFDcEIsY0FBTSxXQUFXLE1BQU0sS0FBSyxPQUFPO0FBQ25DLGNBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLFNBQVMsS0FBSyxVQUFVLEVBQUUsT0FBTyxhQUFhLE1BQU0sQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLFlBQVk7QUFDdkgsWUFBSSxNQUFPLE9BQU0sSUFBSSxNQUFNLHlCQUF5QixNQUFNLE9BQU8sRUFBRTtBQUNuRSxlQUFPLE9BQU8sYUFBYSxJQUFJLElBQUk7QUFBQSxNQUN2QztBQUFBLE1BQ0EsTUFBTSxRQUFRLElBQUksZ0JBQWdCLFFBQVE7QUFDdEMsY0FBTSxXQUFXLE1BQU0sS0FBSyxPQUFPO0FBR25DLGNBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLFNBQVMsS0FBSyxVQUFVLEVBQUUsT0FBTyxhQUFhLE1BQU0sQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUUsR0FBRyxVQUFVLGNBQWMsRUFBRSxPQUFPLEVBQUUsWUFBWTtBQUNwSixZQUFJLE1BQU8sT0FBTSxJQUFJLE1BQU0sMkJBQTJCLE1BQU0sT0FBTyxFQUFFO0FBQ3JFLGVBQU8sT0FBTyxhQUFhLElBQUksSUFBSTtBQUFBLE1BQ3ZDO0FBQUEsTUFDQSxNQUFNLE9BQU8sSUFBSTtBQUNiLGNBQU0sV0FBVyxNQUFNLEtBQUssT0FBTztBQUNuQyxjQUFNLEVBQUUsTUFBTSxJQUFJLE1BQU0sU0FBUyxLQUFLLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLEVBQUU7QUFDdEUsWUFBSSxNQUFPLE9BQU0sSUFBSSxNQUFNLDBCQUEwQixNQUFNLE9BQU8sRUFBRTtBQUFBLE1BQ3hFO0FBQUEsSUFDSjtBQUNTO0FBaURULElBQU0sV0FBTixNQUFlO0FBQUEsTUFoUWYsT0FnUWU7QUFBQTtBQUFBO0FBQUEsTUFDWDtBQUFBLE1BQ0EsWUFBWSxNQUFLO0FBQ2IsYUFBSyxPQUFPO0FBQUEsTUFDaEI7QUFBQSxNQUNBLE1BQU0sSUFBSSxLQUFLO0FBQ1gsY0FBTSxJQUFJLEtBQUssS0FBSyxLQUFLLE1BQU0sR0FBRztBQUNsQyxjQUFNLEdBQUcsTUFBTSxHQUFHO0FBQUEsVUFDZCxXQUFXO0FBQUEsUUFDZixDQUFDO0FBQ0QsZUFBTztBQUFBLE1BQ1g7QUFBQSxNQUNBLE1BQU0sV0FBVyxJQUFJLE1BQU07QUFDdkIsY0FBTSxHQUFHLFVBQVUsS0FBSyxLQUFLLE1BQU0sS0FBSyxJQUFJLFNBQVMsR0FBRyxHQUFHLEVBQUUsTUFBTSxHQUFHLElBQUk7QUFBQSxNQUM5RTtBQUFBLE1BQ0EsTUFBTSxVQUFVLElBQUk7QUFDaEIsWUFBSTtBQUNBLGlCQUFPLElBQUksV0FBVyxNQUFNLEdBQUcsU0FBUyxLQUFLLEtBQUssS0FBSyxNQUFNLFdBQVcsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQUEsUUFDekYsUUFBUztBQUNMLGlCQUFPO0FBQUEsUUFDWDtBQUFBLE1BQ0o7QUFBQSxNQUNBLE1BQU0sZUFBZSxJQUFJLE1BQU07QUFDM0IsY0FBTSxHQUFHLFVBQVUsS0FBSyxLQUFLLE1BQU0sS0FBSyxJQUFJLFNBQVMsR0FBRyxHQUFHLEVBQUUsTUFBTSxHQUFHLElBQUk7QUFBQSxNQUM5RTtBQUFBLE1BQ0EsTUFBTSxjQUFjLElBQUk7QUFDcEIsWUFBSTtBQUNBLGlCQUFPLE1BQU0sR0FBRyxTQUFTLEtBQUssS0FBSyxLQUFLLE1BQU0sV0FBVyxHQUFHLEVBQUUsTUFBTSxHQUFHLE1BQU07QUFBQSxRQUNqRixRQUFTO0FBQ0wsaUJBQU87QUFBQSxRQUNYO0FBQUEsTUFDSjtBQUFBLE1BQ0EsTUFBTSxVQUFVLElBQUksTUFBTSxVQUFVO0FBQ2hDLGNBQU0sTUFBTSxVQUFVLFFBQVEsS0FBSztBQUNuQyxjQUFNLEdBQUcsVUFBVSxLQUFLLEtBQUssTUFBTSxLQUFLLElBQUksT0FBTyxHQUFHLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxHQUFHLElBQUk7QUFBQSxNQUMvRTtBQUFBLE1BQ0EsTUFBTSxVQUFVLElBQUksVUFBVSxPQUFPO0FBQ2pDLGNBQU0sTUFBTSxVQUFVLFFBQVEsS0FBSztBQUNuQyxZQUFJO0FBQ0EsZ0JBQU0sT0FBTyxJQUFJLFdBQVcsTUFBTSxHQUFHLFNBQVMsS0FBSyxLQUFLLEtBQUssTUFBTSxTQUFTLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDNUYsaUJBQU8sV0FBVyxNQUFNLFVBQVUsS0FBSztBQUFBLFFBQzNDLFFBQVM7QUFDTCxpQkFBTztBQUFBLFFBQ1g7QUFBQSxNQUNKO0FBQUEsTUFDQSxNQUFNLE9BQU8sSUFBSSxVQUFVO0FBQ3ZCLGNBQU0sR0FBRyxHQUFHLEtBQUssS0FBSyxLQUFLLE1BQU0sV0FBVyxHQUFHLEVBQUUsTUFBTSxHQUFHO0FBQUEsVUFDdEQsT0FBTztBQUFBLFFBQ1gsQ0FBQztBQUNELGNBQU0sR0FBRyxHQUFHLEtBQUssS0FBSyxLQUFLLE1BQU0sV0FBVyxHQUFHLEVBQUUsTUFBTSxHQUFHO0FBQUEsVUFDdEQsT0FBTztBQUFBLFFBQ1gsQ0FBQztBQUNELGNBQU0sT0FBTyxXQUFXO0FBQUEsVUFDcEIsVUFBVSxRQUFRLEtBQUs7QUFBQSxRQUMzQixJQUFJLE9BQU8sT0FBTyxTQUFTO0FBQzNCLG1CQUFXLE9BQU8sTUFBSztBQUNuQixnQkFBTSxHQUFHLEdBQUcsS0FBSyxLQUFLLEtBQUssTUFBTSxTQUFTLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxHQUFHO0FBQUEsWUFDdkQsT0FBTztBQUFBLFVBQ1gsQ0FBQztBQUFBLFFBQ0w7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUNBLElBQU0sYUFBTixNQUFpQjtBQUFBLE1BOVRqQixPQThUaUI7QUFBQTtBQUFBO0FBQUEsTUFDYixPQUFPO0FBQ0gsZUFBTyxPQUFPLGNBQWM7QUFBQSxNQUNoQztBQUFBLE1BQ0EsTUFBTSxXQUFXLElBQUksTUFBTTtBQUN2QixjQUFNLEVBQUUsSUFBSSxJQUFJLE1BQU0sS0FBSyxLQUFLO0FBQ2hDLGNBQU0sSUFBSSxXQUFXLEVBQUUsUUFBUSxPQUFPLEtBQUssSUFBSSxHQUFHO0FBQUEsVUFDOUMsUUFBUTtBQUFBLFVBQ1IsaUJBQWlCO0FBQUEsVUFDakIsZ0JBQWdCO0FBQUEsVUFDaEIsYUFBYTtBQUFBLFFBQ2pCLENBQUM7QUFBQSxNQUNMO0FBQUEsTUFDQSxNQUFNLFVBQVUsSUFBSTtBQUNoQixjQUFNLEVBQUUsSUFBSSxJQUFJLE1BQU0sS0FBSyxLQUFLO0FBQ2hDLGNBQU0sU0FBUyxNQUFNLElBQUksV0FBVyxFQUFFLFFBQVE7QUFBQSxVQUMxQyxRQUFRO0FBQUEsUUFDWixDQUFDO0FBQ0QsWUFBSSxDQUFDLFFBQVEsT0FBUSxRQUFPO0FBQzVCLGVBQU8sSUFBSSxXQUFXLE1BQU0sSUFBSSxTQUFTLE9BQU8sTUFBTSxFQUFFLFlBQVksQ0FBQztBQUFBLE1BQ3pFO0FBQUEsTUFDQSxNQUFNLGVBQWUsSUFBSSxNQUFNO0FBQzNCLGNBQU0sRUFBRSxJQUFJLElBQUksTUFBTSxLQUFLLEtBQUs7QUFDaEMsY0FBTSxJQUFJLFdBQVcsRUFBRSxRQUFRLE9BQU8sS0FBSyxNQUFNLE1BQU0sR0FBRztBQUFBLFVBQ3RELFFBQVE7QUFBQSxVQUNSLGlCQUFpQjtBQUFBLFVBQ2pCLGdCQUFnQjtBQUFBLFVBQ2hCLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQUEsTUFDTDtBQUFBLE1BQ0EsTUFBTSxjQUFjLElBQUk7QUFDcEIsY0FBTSxFQUFFLElBQUksSUFBSSxNQUFNLEtBQUssS0FBSztBQUNoQyxjQUFNLFNBQVMsTUFBTSxJQUFJLFdBQVcsRUFBRSxRQUFRO0FBQUEsVUFDMUMsUUFBUTtBQUFBLFFBQ1osQ0FBQztBQUNELFlBQUksQ0FBQyxRQUFRLE9BQVEsUUFBTztBQUM1QixlQUFPLE1BQU0sSUFBSSxTQUFTLE9BQU8sTUFBTSxFQUFFLEtBQUs7QUFBQSxNQUNsRDtBQUFBLE1BQ0EsTUFBTSxVQUFVLElBQUksTUFBTSxVQUFVO0FBQ2hDLGNBQU0sRUFBRSxJQUFJLElBQUksTUFBTSxLQUFLLEtBQUs7QUFDaEMsY0FBTSxNQUFNLFVBQVUsUUFBUSxLQUFLO0FBQ25DLGNBQU0sSUFBSSxTQUFTLEVBQUUsSUFBSSxHQUFHLElBQUksT0FBTyxLQUFLLElBQUksR0FBRztBQUFBLFVBQy9DLFFBQVE7QUFBQSxVQUNSLGlCQUFpQjtBQUFBLFVBQ2pCLGdCQUFnQjtBQUFBLFVBQ2hCLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQUEsTUFDTDtBQUFBLE1BQ0EsTUFBTSxVQUFVLElBQUksVUFBVSxPQUFPO0FBQ2pDLGNBQU0sRUFBRSxJQUFJLElBQUksTUFBTSxLQUFLLEtBQUs7QUFDaEMsY0FBTSxNQUFNLFVBQVUsUUFBUSxLQUFLO0FBR25DLGNBQU0sU0FBUyxNQUFNLElBQUksU0FBUyxFQUFFLElBQUksR0FBRyxJQUFJO0FBQUEsVUFDM0MsUUFBUTtBQUFBLFVBQ1IsR0FBRyxRQUFRO0FBQUEsWUFDUCxTQUFTO0FBQUEsY0FDTCxPQUFPO0FBQUEsWUFDWDtBQUFBLFVBQ0osSUFBSSxDQUFDO0FBQUEsUUFDVCxDQUFDO0FBQ0QsWUFBSSxDQUFDLFFBQVEsT0FBUSxRQUFPO0FBQzVCLGNBQU0sTUFBTSxPQUFPO0FBQ25CLGNBQU0sVUFBVTtBQUFBLFVBQ1osZ0JBQWdCLElBQUksSUFBSSxjQUFjLEtBQUs7QUFBQSxVQUMzQyxpQkFBaUI7QUFBQSxVQUNqQixpQkFBaUI7QUFBQSxRQUNyQjtBQUNBLGNBQU0sZUFBZSxJQUFJLElBQUksZUFBZTtBQUM1QyxjQUFNLGdCQUFnQixJQUFJLElBQUksZ0JBQWdCO0FBQzlDLFlBQUksYUFBYyxTQUFRLGVBQWUsSUFBSTtBQUM3QyxZQUFJLGNBQWUsU0FBUSxnQkFBZ0IsSUFBSTtBQUMvQyxlQUFPO0FBQUEsVUFDSCxRQUFRLFNBQVMsZUFBZSxNQUFNO0FBQUEsVUFDdEM7QUFBQSxVQUNBLE1BQU0sT0FBTztBQUFBLFFBQ2pCO0FBQUEsTUFDSjtBQUFBLE1BQ0EsTUFBTSxPQUFPLElBQUksVUFBVTtBQUN2QixjQUFNLEVBQUUsTUFBTSxJQUFJLElBQUksTUFBTSxLQUFLLEtBQUs7QUFDdEMsY0FBTSxPQUFPLFdBQVc7QUFBQSxVQUNwQixVQUFVLFFBQVEsS0FBSztBQUFBLFFBQzNCLElBQUksT0FBTyxPQUFPLFNBQVM7QUFDM0IsY0FBTSxXQUFXO0FBQUEsVUFDYixXQUFXLEVBQUU7QUFBQSxVQUNiLFdBQVcsRUFBRTtBQUFBLFVBQ2IsR0FBRyxLQUFLLElBQUksQ0FBQyxRQUFNLFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUFBLFFBQzNDO0FBQ0EsbUJBQVcsVUFBVSxVQUFTO0FBQzFCLGdCQUFNLEVBQUUsTUFBTSxJQUFJLE1BQU0sS0FBSztBQUFBLFlBQ3pCO0FBQUEsVUFDSixDQUFDO0FBQ0QsY0FBSSxNQUFNLFNBQVMsRUFBRyxPQUFNLElBQUksTUFBTSxJQUFJLENBQUMsTUFBSSxFQUFFLEdBQUcsQ0FBQztBQUFBLFFBQ3pEO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFFQSxJQUFNLGlCQUFOLE1BQXFCO0FBQUEsTUEvWnJCLE9BK1pxQjtBQUFBO0FBQUE7QUFBQSxNQUNqQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLFlBQVksTUFBTSxRQUFPO0FBQ3JCLGFBQUssT0FBTztBQUNaLGFBQUssU0FBUztBQUFBLE1BQ2xCO0FBQUEsTUFDQSxLQUFLLFFBQVE7QUFDVCxlQUFPLEtBQUssS0FBSyxLQUFLLE1BQU07QUFBQSxNQUNoQztBQUFBLE1BQ0EsSUFBSSxJQUFJO0FBQ0osaUJBQVMsRUFBRTtBQUNYLGVBQU8sS0FBSyxLQUFLLElBQUksRUFBRTtBQUFBLE1BQzNCO0FBQUEsTUFDQSxnQkFBZ0IsT0FBTztBQUNuQixlQUFPLEtBQUssS0FBSyxnQkFBZ0IsS0FBSztBQUFBLE1BQzFDO0FBQUEsTUFDQSxjQUFjLElBQUksT0FBTztBQUNyQixpQkFBUyxFQUFFO0FBQ1gsZUFBTyxLQUFLLEtBQUssY0FBYyxJQUFJLEtBQUs7QUFBQSxNQUM1QztBQUFBLE1BQ0EsT0FBTyxTQUFTO0FBQ1osaUJBQVMsUUFBUSxFQUFFO0FBQ25CLGVBQU8sS0FBSyxLQUFLLE9BQU8sT0FBTztBQUFBLE1BQ25DO0FBQUEsTUFDQSxNQUFNLElBQUksUUFBUTtBQUNkLGlCQUFTLEVBQUU7QUFDWCxlQUFPLEtBQUssS0FBSyxNQUFNLElBQUksTUFBTTtBQUFBLE1BQ3JDO0FBQUEsTUFDQSxRQUFRLElBQUksZ0JBQWdCLFFBQVE7QUFDaEMsaUJBQVMsRUFBRTtBQUNYLGVBQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxnQkFBZ0IsTUFBTTtBQUFBLE1BQ3ZEO0FBQUEsTUFDQSxNQUFNLE9BQU8sSUFBSTtBQUNiLGlCQUFTLEVBQUU7QUFDWCxjQUFNLFVBQVUsTUFBTSxLQUFLLEtBQUssSUFBSSxFQUFFO0FBQ3RDLGNBQU0sS0FBSyxLQUFLLE9BQU8sRUFBRTtBQUN6QixjQUFNLEtBQUssT0FBTyxPQUFPLElBQUksU0FBUyxhQUFhO0FBQUEsTUFDdkQ7QUFBQSxNQUNBLFdBQVcsSUFBSSxNQUFNO0FBQ2pCLGlCQUFTLEVBQUU7QUFDWCxlQUFPLEtBQUssT0FBTyxXQUFXLElBQUksSUFBSTtBQUFBLE1BQzFDO0FBQUEsTUFDQSxVQUFVLElBQUk7QUFDVixpQkFBUyxFQUFFO0FBQ1gsZUFBTyxLQUFLLE9BQU8sVUFBVSxFQUFFO0FBQUEsTUFDbkM7QUFBQSxNQUNBLGVBQWUsSUFBSSxNQUFNO0FBQ3JCLGlCQUFTLEVBQUU7QUFDWCxlQUFPLEtBQUssT0FBTyxlQUFlLElBQUksSUFBSTtBQUFBLE1BQzlDO0FBQUEsTUFDQSxjQUFjLElBQUk7QUFDZCxpQkFBUyxFQUFFO0FBQ1gsZUFBTyxLQUFLLE9BQU8sY0FBYyxFQUFFO0FBQUEsTUFDdkM7QUFBQSxNQUNBLFVBQVUsSUFBSSxNQUFNLFVBQVU7QUFDMUIsaUJBQVMsRUFBRTtBQUNYLGVBQU8sS0FBSyxPQUFPLFVBQVUsSUFBSSxNQUFNLFFBQVE7QUFBQSxNQUNuRDtBQUFBLE1BQ0EsTUFBTSxVQUFVLElBQUksT0FBTztBQUN2QixpQkFBUyxFQUFFO0FBQ1gsY0FBTSxVQUFVLE1BQU0sS0FBSyxLQUFLLElBQUksRUFBRTtBQUN0QyxZQUFJLENBQUMsUUFBUyxRQUFPO0FBQ3JCLGVBQU8sS0FBSyxPQUFPLFVBQVUsSUFBSSxRQUFRLGlCQUFpQixhQUFhLEtBQUs7QUFBQSxNQUNoRjtBQUFBLElBQ0o7QUFDQSxJQUFJLFFBQVE7QUFDSTtBQUFBO0FBQUE7OztBQ2xlaEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFTLGFBQWEsd0JBQXdCO0FBRW9DLFNBQVMsZ0JBQWdCLE1BQU07QUFDN0csTUFBSSxFQUFFLGdCQUFnQixPQUFPO0FBQ3pCLFdBQU87QUFBQSxNQUNILElBQUk7QUFBQSxNQUNKLFFBQVE7QUFBQSxNQUNSLE9BQU87QUFBQSxJQUNYO0FBQUEsRUFDSjtBQUNBLE1BQUksS0FBSyxPQUFPLGVBQWU7QUFDM0IsV0FBTztBQUFBLE1BQ0gsSUFBSTtBQUFBLE1BQ0osUUFBUTtBQUFBLE1BQ1IsT0FBTztBQUFBLElBQ1g7QUFBQSxFQUNKO0FBQ0EsU0FBTztBQUFBLElBQ0gsSUFBSTtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0o7QUFDTyxTQUFTLGFBQWEsTUFBTSxVQUFVO0FBQ3pDLFFBQU0sUUFBUSxLQUFLLFNBQVMsS0FBSyxLQUFLLENBQUMsTUFBTSxNQUFRLEtBQUssQ0FBQyxNQUFNLE1BQVEsS0FBSyxDQUFDLE1BQU0sTUFBUSxLQUFLLENBQUMsTUFBTTtBQUN6RyxTQUFPLFNBQVMsU0FBUyxZQUFZLEVBQUUsU0FBUyxNQUFNO0FBQzFEO0FBR0EsZUFBc0IsWUFBWSxTQUFTO0FBQ3ZDLFFBQU0sUUFBUSxDQUFDO0FBQ2YsYUFBVyxTQUFTLFNBQVE7QUFDeEIsUUFBSSxpQkFBaUIsUUFBUSxNQUFNLE9BQU8sRUFBRyxPQUFNLEtBQUssS0FBSztBQUFBLEVBQ2pFO0FBQ0EsTUFBSSxNQUFNLFdBQVcsR0FBRztBQUNwQixXQUFPO0FBQUEsTUFDSCxJQUFJO0FBQUEsTUFDSixRQUFRO0FBQUEsTUFDUixPQUFPO0FBQUEsSUFDWDtBQUFBLEVBQ0o7QUFDQSxNQUFJLE1BQU0sU0FBUyxrQkFBa0I7QUFDakMsV0FBTztBQUFBLE1BQ0gsSUFBSTtBQUFBLE1BQ0osUUFBUTtBQUFBLE1BQ1IsT0FBTyx1QkFBdUIsZ0JBQWdCO0FBQUEsSUFDbEQ7QUFBQSxFQUNKO0FBQ0EsUUFBTSxTQUFTLENBQUM7QUFDaEIsYUFBVyxRQUFRLE9BQU07QUFDckIsVUFBTSxRQUFRLGdCQUFnQixJQUFJO0FBQ2xDLFFBQUksQ0FBQyxNQUFNLEdBQUksUUFBTztBQUN0QixVQUFNLE9BQU8sSUFBSSxXQUFXLE1BQU0sS0FBSyxZQUFZLENBQUM7QUFDcEQsUUFBSSxDQUFDLGFBQWEsTUFBTSxLQUFLLElBQUksR0FBRztBQUNoQyxhQUFPO0FBQUEsUUFDSCxJQUFJO0FBQUEsUUFDSixRQUFRO0FBQUEsUUFDUixPQUFPO0FBQUEsTUFDWDtBQUFBLElBQ0o7QUFDQSxXQUFPLEtBQUs7QUFBQSxNQUNSLE1BQU0sS0FBSztBQUFBLE1BQ1g7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNMO0FBQ0EsTUFBSTtBQUNBLFVBQU0sRUFBRSxNQUFNLFdBQVcsSUFBSSxNQUFNLFlBQVksTUFBTTtBQUNyRCxVQUFNLGlCQUFpQixPQUFPLFdBQVcsSUFBSSxPQUFPLENBQUMsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLEVBQUUsSUFBSSxLQUFLLE9BQU8sU0FBUyxDQUFDO0FBQ3JHLFdBQU87QUFBQSxNQUNILElBQUk7QUFBQSxNQUNKO0FBQUEsTUFDQSxPQUFPLEtBQUs7QUFBQSxNQUNaO0FBQUEsTUFDQTtBQUFBLElBQ0o7QUFBQSxFQUNKLFFBQVM7QUFDTCxXQUFPO0FBQUEsTUFDSCxJQUFJO0FBQUEsTUFDSixRQUFRO0FBQUEsTUFDUixPQUFPO0FBQUEsSUFDWDtBQUFBLEVBQ0o7QUFDSjtBQUdBLGVBQXNCLFlBQVksT0FBTztBQUNyQyxRQUFNLFFBQVEsQ0FBQztBQUNmLE1BQUksYUFBYTtBQUNqQixhQUFXLFFBQVEsT0FBTTtBQUNyQixVQUFNLEVBQUUsTUFBTSxZQUFZLE1BQU0sSUFBSSxNQUFNLGVBQWUsSUFBSSxXQUFXLEtBQUssSUFBSSxDQUFDO0FBQ2xGLGtCQUFjO0FBQ2QsVUFBTSxLQUFLLE1BQU0sU0FBUyxJQUFJLEtBQUssS0FBSyxLQUFLLFFBQVEsV0FBVyxFQUFFLENBQUM7QUFBQTtBQUFBLEVBQU8sSUFBSSxLQUFLLElBQUk7QUFBQSxFQUMzRjtBQUNBLFNBQU87QUFBQSxJQUNILE1BQU0sTUFBTSxLQUFLLFFBQVE7QUFBQSxJQUN6QjtBQUFBLEVBQ0o7QUFDSjtBQUNBLGVBQXNCLGVBQWUsTUFBTTtBQUN2QyxRQUFNLE1BQU0sTUFBTSxpQkFBaUIsSUFBSTtBQUN2QyxRQUFNLEVBQUUsWUFBWSxLQUFLLElBQUksTUFBTSxZQUFZLEtBQUs7QUFBQSxJQUNoRCxZQUFZO0FBQUEsRUFDaEIsQ0FBQztBQUNELFFBQU0sVUFBVSxLQUFLLFFBQVEsUUFBUSxHQUFHLEVBQUUsS0FBSztBQUMvQyxNQUFJLENBQUMsU0FBUztBQUNWLFVBQU0sSUFBSSxNQUFNLDhGQUE4RjtBQUFBLEVBQ2xIO0FBQ0EsU0FBTztBQUFBLElBQ0gsTUFBTTtBQUFBLElBQ047QUFBQSxFQUNKO0FBQ0o7QUE5R0EsSUFDYSxlQXlCQTtBQTFCYjtBQUFBO0FBQUE7QUFDTyxJQUFNLGdCQUFnQixJQUFJLE9BQU87QUFDbUQ7QUFvQjNFO0FBSVQsSUFBTSxtQkFBbUI7QUFFVjtBQXdEQTtBQWFBO0FBQUE7QUFBQTs7O0FDcERmLFNBQVMsZUFBZSxJQUFJLFVBQVU7QUFDekMsU0FBTyxPQUFPLE9BQU8sWUFBWSxVQUFVLElBQUksRUFBRSxJQUFJLEtBQUs7QUFDOUQ7QUEvQ0EsSUFDYSxRQXFDUCxXQUNPLG9CQUNBLHFCQUNBO0FBekNiO0FBQUE7QUFBQTtBQUNPLElBQU0sU0FBUztBQUFBLE1BQ2xCO0FBQUEsUUFDSSxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsUUFDUCxhQUFhO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsUUFDSSxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsUUFDUCxhQUFhO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsUUFDSSxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsUUFDUCxhQUFhO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsUUFDSSxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsUUFDUCxhQUFhO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsUUFDSSxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsUUFDUCxhQUFhO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsUUFDSSxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsUUFDUCxhQUFhO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsUUFDSSxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsUUFDUCxhQUFhO0FBQUEsTUFDakI7QUFBQSxJQUNKO0FBQ0EsSUFBTSxZQUFZLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxNQUFJLEVBQUUsRUFBRSxDQUFDO0FBQ3hDLElBQU0scUJBQXFCO0FBQzNCLElBQU0sc0JBQXNCO0FBQzVCLElBQU0sdUJBQXVCO0FBSXBCO0FBQUE7QUFBQTs7O0FDN0NoQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBc0NBLFNBQVMsS0FBSyxPQUFPLFNBQVMsVUFBVTtBQUNwQyxTQUFPLFFBQVEsU0FBUyxLQUFLLElBQUksUUFBUTtBQUM3QztBQUMwRixTQUFTLGlCQUFpQixPQUFPO0FBQ3ZILFFBQU0sSUFBSSxTQUFTLENBQUM7QUFDcEIsU0FBTztBQUFBLElBQ0gsUUFBUSxLQUFLLEVBQUUsUUFBUSxTQUFTLFVBQVU7QUFBQSxJQUMxQyxRQUFRLEtBQUssRUFBRSxRQUFRLFNBQVMsWUFBWTtBQUFBLElBQzVDLFVBQVUsS0FBSyxFQUFFLFVBQVUsV0FBVyxVQUFVO0FBQUEsSUFDaEQsV0FBVyxlQUFlLEVBQUUsV0FBVyxrQkFBa0I7QUFBQSxJQUN6RCxZQUFZLGVBQWUsRUFBRSxZQUFZLG1CQUFtQjtBQUFBLElBQzVELGFBQWEsZUFBZSxFQUFFLGFBQWEsb0JBQW9CO0FBQUEsSUFDL0QsY0FBYyxFQUFFLGlCQUFpQjtBQUFBLEVBQ3JDO0FBQ0o7QUFHTyxTQUFTLFlBQVksUUFBUTtBQUNoQyxTQUFPLE9BQU8sTUFBTSxPQUFPLENBQUMsR0FBRyxNQUFJLElBQUksRUFBRSxLQUFLLEtBQUssRUFBRSxRQUFRLENBQUM7QUFDbEU7QUFFeUYsU0FBUyxlQUFlLGVBQWU7QUFDNUgsU0FBTyxLQUFLLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSTtBQUM3QztBQUdPLFNBQVMscUJBQXFCLE9BQU8sVUFBVTtBQUNsRCxRQUFNLE1BQU07QUFDWixNQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sUUFBUSxJQUFJLEtBQUssR0FBRztBQUNuQyxXQUFPO0FBQUEsTUFDSCxJQUFJO0FBQUEsTUFDSixPQUFPO0FBQUEsSUFDWDtBQUFBLEVBQ0o7QUFDQSxNQUFJLElBQUksTUFBTSxXQUFXLEdBQUc7QUFDeEIsV0FBTztBQUFBLE1BQ0gsSUFBSTtBQUFBLE1BQ0osT0FBTztBQUFBLElBQ1g7QUFBQSxFQUNKO0FBQ0EsTUFBSSxJQUFJLE1BQU0sU0FBUyxrQkFBa0I7QUFDckMsV0FBTztBQUFBLE1BQ0gsSUFBSTtBQUFBLE1BQ0osT0FBTyx1QkFBdUIsZ0JBQWdCO0FBQUEsSUFDbEQ7QUFBQSxFQUNKO0FBQ0EsUUFBTSxRQUFRLENBQUM7QUFDZixNQUFJLFFBQVE7QUFDWixhQUFXLFNBQVMsSUFBSSxPQUFNO0FBQzFCLFVBQU0sT0FBTztBQUNiLFFBQUksS0FBSyxZQUFZLFVBQVUsS0FBSyxZQUFZLFNBQVM7QUFDckQsYUFBTztBQUFBLFFBQ0gsSUFBSTtBQUFBLFFBQ0osT0FBTztBQUFBLE1BQ1g7QUFBQSxJQUNKO0FBQ0EsUUFBSSxPQUFPLEtBQUssU0FBUyxVQUFVO0FBQy9CLGFBQU87QUFBQSxRQUNILElBQUk7QUFBQSxRQUNKLE9BQU87QUFBQSxNQUNYO0FBQUEsSUFDSjtBQUNBLFVBQU0sT0FBTyxLQUFLLEtBQUssS0FBSztBQUM1QixRQUFJLEtBQUssV0FBVyxFQUFHO0FBQ3ZCLFFBQUksS0FBSyxTQUFTLGdCQUFnQjtBQUM5QixhQUFPO0FBQUEsUUFDSCxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsTUFDWDtBQUFBLElBQ0o7QUFDQSxhQUFTLEtBQUs7QUFDZCxVQUFNLEtBQUs7QUFBQSxNQUNQLFNBQVMsS0FBSztBQUFBLE1BQ2Q7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNMO0FBQ0EsTUFBSSxNQUFNLFdBQVcsR0FBRztBQUNwQixXQUFPO0FBQUEsTUFDSCxJQUFJO0FBQUEsTUFDSixPQUFPO0FBQUEsSUFDWDtBQUFBLEVBQ0o7QUFDQSxNQUFJLFFBQVEsVUFBVTtBQUNsQixXQUFPO0FBQUEsTUFDSCxJQUFJO0FBQUEsTUFDSixPQUFPO0FBQUEsSUFDWDtBQUFBLEVBQ0o7QUFDQSxRQUFNLFFBQVEsT0FBTyxJQUFJLFVBQVUsWUFBWSxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUcsSUFBSTtBQUNuRyxTQUFPO0FBQUEsSUFDSCxJQUFJO0FBQUEsSUFDSixRQUFRO0FBQUEsTUFDSjtBQUFBLE1BQ0E7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKO0FBQ08sU0FBUyxvQkFBb0IsUUFBUTtBQUN4QyxTQUFPLHFCQUFxQixTQUFTLE1BQU07QUFDL0M7QUFDc0YsU0FBUyxlQUFlLE1BQU0sUUFBUTtBQUN4SCxTQUFPLFNBQVMsWUFBWSxlQUFlLE1BQU0sRUFBRSxZQUFZLGVBQWUsTUFBTSxFQUFFO0FBQzFGO0FBNUlBLElBQ00sU0FLQSxTQU1BLFdBS08sc0JBSUEsZ0JBZ0NQLGtCQUNBO0FBdEROO0FBQUE7QUFBQTtBQUFBO0FBQ0EsSUFBTSxVQUFVO0FBQUEsTUFDWjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDSjtBQUNBLElBQU0sVUFBVTtBQUFBLE1BQ1o7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNKO0FBQ0EsSUFBTSxZQUFZO0FBQUEsTUFDZDtBQUFBLE1BQ0E7QUFBQSxJQUNKO0FBRU8sSUFBTSx1QkFBdUI7QUFBQSxNQUNoQztBQUFBLE1BQ0E7QUFBQSxJQUNKO0FBQ08sSUFBTSxpQkFBaUI7QUFBQSxNQUMxQixPQUFPO0FBQUEsUUFDSCxhQUFhO0FBQUEsUUFDYixXQUFXO0FBQUEsUUFDWCxlQUFlO0FBQUEsTUFDbkI7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNOLGFBQWE7QUFBQSxRQUNiLFdBQVc7QUFBQSxRQUNYLGVBQWU7QUFBQSxNQUNuQjtBQUFBLE1BQ0EsTUFBTTtBQUFBLFFBQ0YsYUFBYTtBQUFBLFFBQ2IsV0FBVztBQUFBLFFBQ1gsZUFBZTtBQUFBLE1BQ25CO0FBQUEsSUFDSjtBQUNTO0FBRzBGO0FBWW5HLElBQU0sbUJBQW1CO0FBQ3pCLElBQU0saUJBQWlCO0FBQ1A7QUFJa0Y7QUFLbEY7QUF1RUE7QUFHK0U7QUFBQTtBQUFBOzs7QUMxSS9GO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQVMsU0FBUztBQW1CbEIsU0FBUyxhQUFhLFNBQVM7QUFDM0IsUUFBTSxTQUFTLGVBQWUsUUFBUSxNQUFNO0FBQzVDLFFBQU0sV0FBVyxRQUFRLGFBQWEsV0FBVyxvRUFBb0U7QUFDckgsU0FBTywrREFBK0QsYUFBYSxRQUFRLE1BQU0sQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLbEcsUUFBUTtBQUFBO0FBQUEsc0NBRTBCLE9BQU8sV0FBVyxzQkFBc0IsT0FBTyxhQUFhO0FBQ2xHO0FBRU8sU0FBUyxxQkFBcUI7QUFDakMsTUFBSSxlQUFnQixRQUFPO0FBQzNCLFNBQU8scUJBQXFCLElBQUksUUFBUSxJQUFJLHdCQUF3Qiw4QkFBOEI7QUFDdEc7QUFDQSxTQUFTLHVCQUF1QjtBQUM1QixTQUFPLFFBQVEsUUFBUSxJQUFJLHNCQUFzQixRQUFRLElBQUkscUJBQXFCLFFBQVEsSUFBSSxNQUFNO0FBQ3hHO0FBQ0EsZUFBc0Isc0JBQXNCLFlBQVksZ0JBQWdCLFNBQVM7QUFDN0UsUUFBTSxPQUFPLFdBQVcsTUFBTSxHQUFHLGdCQUFnQjtBQUNqRCxNQUFJLENBQUMscUJBQXFCLEdBQUc7QUFDekIsV0FBTyxXQUFXLE1BQU0sZ0JBQWdCLE9BQU87QUFBQSxFQUNuRDtBQUNBLE1BQUk7QUFDQSxVQUFNLEVBQUUsY0FBYyxPQUFPLElBQUksTUFBTSxPQUFPLElBQUk7QUFDbEQsVUFBTSxFQUFFLE9BQU8sSUFBSSxNQUFNLGFBQWE7QUFBQSxNQUNsQyxPQUFPLG1CQUFtQjtBQUFBLE1BQzFCLFFBQVEsYUFBYSxPQUFPO0FBQUEsTUFDNUIsUUFBUSxPQUFPLE9BQU87QUFBQSxRQUNsQixRQUFRO0FBQUEsTUFDWixDQUFDO0FBQUEsTUFDRCxRQUFRLGlDQUFpQyxjQUFjO0FBQUE7QUFBQTtBQUFBLEVBQTRDLElBQUk7QUFBQTtBQUFBLElBQzNHLENBQUM7QUFDRCxVQUFNLFNBQVM7QUFFZixRQUFJLG9CQUFvQixRQUFRLE1BQU0sR0FBRztBQUNyQyxhQUFPLFFBQVEsT0FBTyxNQUFNLElBQUksQ0FBQyxPQUFLO0FBQUEsUUFDOUIsR0FBRztBQUFBLFFBQ0gsU0FBUztBQUFBLE1BQ2IsRUFBRTtBQUFBLElBQ1Y7QUFDQSxXQUFPO0FBQUEsRUFDWCxTQUFTLEtBQUs7QUFDVixZQUFRLE1BQU0sa0VBQWtFLGVBQWUsUUFBUSxJQUFJLFVBQVUsR0FBRztBQUN4SCxxQkFBaUI7QUFDakIsV0FBTyxXQUFXLE1BQU0sZ0JBQWdCLE9BQU87QUFBQSxFQUNuRDtBQUNKO0FBS08sU0FBUyxlQUFlLFlBQVksZ0JBQWdCLFVBQVU7QUFDakUsUUFBTSxRQUFRLGVBQWUsUUFBUSxXQUFXLEVBQUUsRUFBRSxRQUFRLFVBQVUsR0FBRztBQUN6RSxRQUFNLE9BQU8sV0FBVyxNQUFNLEdBQUcsUUFBUTtBQUN6QyxRQUFNLFlBQVksS0FBSyxNQUFNLGVBQWU7QUFDNUMsUUFBTSxRQUFRLENBQUM7QUFDZixNQUFJLFVBQVU7QUFDZCxhQUFXLFlBQVksV0FBVTtBQUM3QixRQUFJLFdBQVcsUUFBUSxTQUFTLFNBQVMsU0FBUyxJQUFJLGtCQUFrQjtBQUNwRSxZQUFNLEtBQUs7QUFBQSxRQUNQLFNBQVM7QUFBQSxRQUNULE1BQU07QUFBQSxNQUNWLENBQUM7QUFDRCxnQkFBVTtBQUFBLElBQ2QsT0FBTztBQUNILGdCQUFVLFVBQVUsR0FBRyxPQUFPLElBQUksUUFBUSxLQUFLO0FBQUEsSUFDbkQ7QUFBQSxFQUNKO0FBQ0EsTUFBSSxRQUFTLE9BQU0sS0FBSztBQUFBLElBQ3BCLFNBQVM7QUFBQSxJQUNULE1BQU07QUFBQSxFQUNWLENBQUM7QUFDRCxTQUFPO0FBQUEsSUFDSDtBQUFBLElBQ0E7QUFBQSxFQUNKO0FBQ0o7QUFDQSxTQUFTLFdBQVcsTUFBTSxnQkFBZ0IsU0FBUztBQUMvQyxRQUFNLFNBQVMsb0JBQW9CLFFBQVEsTUFBTTtBQUNqRCxRQUFNLE1BQU0sS0FBSyxNQUFNLGVBQWUsRUFBRSxPQUFPLENBQUMsTUFBSSxFQUFFLFNBQVMsRUFBRTtBQUNqRSxRQUFNLFNBQVMsS0FBSyxJQUFJLEdBQUcsS0FBSyxNQUFNLGVBQWUsUUFBUSxNQUFNLEVBQUUsY0FBYyxHQUFHLENBQUM7QUFDdkYsUUFBTSxPQUFPLEtBQUssSUFBSSxHQUFHLEtBQUssTUFBTSxJQUFJLFNBQVMsTUFBTSxDQUFDO0FBQ3hELFFBQU0sWUFBWSxJQUFJLE9BQU8sQ0FBQyxHQUFHLE1BQUksSUFBSSxTQUFTLENBQUMsRUFBRSxNQUFNLEdBQUcsTUFBTTtBQUNwRSxRQUFNLFFBQVEsZUFBZSxRQUFRLFdBQVcsRUFBRSxFQUFFLFFBQVEsVUFBVSxHQUFHO0FBQ3pFLFFBQU0sUUFBUTtBQUFBLElBQ1Y7QUFBQSxNQUNJLFNBQVM7QUFBQSxNQUNULE1BQU0sc0RBQXNELEtBQUs7QUFBQSxJQUNyRTtBQUFBLEVBQ0o7QUFDQSxNQUFJLENBQUMsUUFBUTtBQUNULFVBQU0sS0FBSztBQUFBLE1BQ1AsU0FBUztBQUFBLE1BQ1QsTUFBTTtBQUFBLElBQ1YsQ0FBQztBQUFBLEVBQ0w7QUFDQSxZQUFVLFFBQVEsQ0FBQyxVQUFVLE1BQUk7QUFDN0IsVUFBTSxLQUFLO0FBQUEsTUFDUCxTQUFTLFVBQVUsSUFBSSxNQUFNLElBQUksU0FBUztBQUFBLE1BQzFDLE1BQU0sU0FBUyxLQUFLO0FBQUEsSUFDeEIsQ0FBQztBQUFBLEVBQ0wsQ0FBQztBQUNELFFBQU0sS0FBSztBQUFBLElBQ1AsU0FBUztBQUFBLElBQ1QsTUFBTTtBQUFBLEVBQ1YsQ0FBQztBQUNELFNBQU87QUFBQSxJQUNIO0FBQUEsSUFDQTtBQUFBLEVBQ0o7QUFDSjtBQXBJQSxJQUVNLGtCQUNBLGNBVUEsY0FrQkYsZ0JBeUNFO0FBeEVOO0FBQUE7QUFBQTtBQUNBO0FBQ0EsSUFBTSxtQkFBbUI7QUFDekIsSUFBTSxlQUFlLEVBQUUsT0FBTztBQUFBLE1BQzFCLE9BQU8sRUFBRSxPQUFPLEVBQUUsU0FBUyxxREFBcUQ7QUFBQSxNQUNoRixPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU87QUFBQSxRQUNwQixTQUFTLEVBQUUsS0FBSztBQUFBLFVBQ1o7QUFBQSxVQUNBO0FBQUEsUUFDSixDQUFDO0FBQUEsUUFDRCxNQUFNLEVBQUUsT0FBTztBQUFBLE1BQ25CLENBQUMsQ0FBQyxFQUFFLFNBQVMsc0RBQXNEO0FBQUEsSUFDdkUsQ0FBQztBQUNELElBQU0sZUFBZTtBQUFBLE1BQ2pCLFlBQVk7QUFBQSxNQUNaLE9BQU87QUFBQSxNQUNQLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxJQUNiO0FBQ1M7QUFZVCxJQUFJLGlCQUFpQjtBQUNMO0FBSVA7QUFHYTtBQWlDdEIsSUFBTSxtQkFBbUI7QUFDVDtBQTBCUDtBQUFBO0FBQUE7OztBQ2xHRixTQUFTLFdBQVcsS0FBSyxZQUFZLFdBQVcsR0FBRztBQUN0RCxRQUFNLFNBQVMsSUFBSSxZQUFZLEVBQUU7QUFDakMsUUFBTSxPQUFPLElBQUksU0FBUyxNQUFNO0FBQ2hDLFFBQU0sV0FBVyxhQUFhLFdBQVc7QUFDekMsYUFBVyxNQUFNLEdBQUcsTUFBTTtBQUMxQixPQUFLLFVBQVUsR0FBRyxLQUFLLElBQUksWUFBWSxJQUFJO0FBQzNDLGFBQVcsTUFBTSxHQUFHLE1BQU07QUFDMUIsYUFBVyxNQUFNLElBQUksTUFBTTtBQUMzQixPQUFLLFVBQVUsSUFBSSxJQUFJLElBQUk7QUFDM0IsT0FBSyxVQUFVLElBQUksR0FBRyxJQUFJO0FBQzFCLE9BQUssVUFBVSxJQUFJLFVBQVUsSUFBSTtBQUNqQyxPQUFLLFVBQVUsSUFBSSxZQUFZLElBQUk7QUFDbkMsT0FBSyxVQUFVLElBQUksVUFBVSxJQUFJO0FBQ2pDLE9BQUssVUFBVSxJQUFJLFdBQVcsa0JBQWtCLElBQUk7QUFDcEQsT0FBSyxVQUFVLElBQUksSUFBSSxJQUFJO0FBQzNCLGFBQVcsTUFBTSxJQUFJLE1BQU07QUFDM0IsT0FBSyxVQUFVLElBQUksSUFBSSxZQUFZLElBQUk7QUFDdkMsUUFBTSxNQUFNLElBQUksV0FBVyxLQUFLLElBQUksVUFBVTtBQUM5QyxNQUFJLElBQUksSUFBSSxXQUFXLE1BQU0sR0FBRyxDQUFDO0FBQ2pDLE1BQUksSUFBSSxLQUFLLEVBQUU7QUFDZixTQUFPO0FBQ1g7QUFDTyxTQUFTLG1CQUFtQixlQUFlLFlBQVksV0FBVyxHQUFHO0FBQ3hFLFNBQU8saUJBQWlCLGFBQWEsV0FBVztBQUNwRDtBQUNBLFNBQVMsV0FBVyxNQUFNLFFBQVEsTUFBTTtBQUNwQyxXQUFRLElBQUksR0FBRyxJQUFJLEtBQUssUUFBUSxLQUFJO0FBQ2hDLFNBQUssU0FBUyxTQUFTLEdBQUcsS0FBSyxXQUFXLENBQUMsQ0FBQztBQUFBLEVBQ2hEO0FBQ0o7QUE5QkEsSUFBTTtBQUFOO0FBQUE7QUFBQTtBQUFBLElBQU0sbUJBQW1CO0FBQ1Q7QUFzQkE7QUFHUDtBQUFBO0FBQUE7OztBQ3RCVCxlQUFlLFVBQVUsS0FBSyxZQUFZO0FBQ3RDLFFBQU0sRUFBRSxXQUFXLElBQUksTUFBTSxPQUFPLHFCQUFxQjtBQUN6RCxRQUFNLFVBQVUsSUFBSSxXQUFXLEdBQUcsWUFBWSxnQkFBZ0I7QUFDOUQsUUFBTSxVQUFVLElBQUksV0FBVyxJQUFJLFFBQVEsSUFBSSxZQUFZLEtBQUssTUFBTSxJQUFJLGFBQWEsQ0FBQyxDQUFDO0FBQ3pGLFFBQU0sU0FBUyxDQUFDO0FBQ2hCLFdBQVEsSUFBSSxHQUFHLElBQUksUUFBUSxRQUFRLEtBQUssbUJBQWtCO0FBQ3RELFVBQU0sUUFBUSxRQUFRLFNBQVMsR0FBRyxJQUFJLGlCQUFpQjtBQUN2RCxVQUFNLFFBQVEsUUFBUSxhQUFhLEtBQUs7QUFDeEMsUUFBSSxNQUFNLFNBQVMsRUFBRyxRQUFPLEtBQUssSUFBSSxXQUFXLEtBQUssQ0FBQztBQUFBLEVBQzNEO0FBQ0EsUUFBTSxPQUFPLFFBQVEsTUFBTTtBQUMzQixNQUFJLEtBQUssU0FBUyxFQUFHLFFBQU8sS0FBSyxJQUFJLFdBQVcsSUFBSSxDQUFDO0FBQ3JELFFBQU0sUUFBUSxPQUFPLE9BQU8sQ0FBQyxHQUFHLE1BQUksSUFBSSxFQUFFLFlBQVksQ0FBQztBQUN2RCxRQUFNLE1BQU0sSUFBSSxXQUFXLEtBQUs7QUFDaEMsTUFBSSxTQUFTO0FBQ2IsYUFBVyxLQUFLLFFBQU87QUFDbkIsUUFBSSxJQUFJLEdBQUcsTUFBTTtBQUNqQixjQUFVLEVBQUU7QUFBQSxFQUNoQjtBQUNBLFNBQU87QUFDWDtBQUM4RSxlQUFzQixjQUFjLEtBQUssWUFBWTtBQUMvSCxRQUFNLGtCQUFrQixtQkFBbUIsSUFBSSxZQUFZLFVBQVU7QUFDckUsTUFBSTtBQUNBLFVBQU0sUUFBUSxNQUFNLFVBQVUsS0FBSyxVQUFVO0FBQzdDLFFBQUksTUFBTSxhQUFhLEdBQUc7QUFDdEIsYUFBTztBQUFBLFFBQ0g7QUFBQSxRQUNBLFVBQVU7QUFBQSxRQUNWO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxFQUNKLFNBQVMsS0FBSztBQUNWLFlBQVEsTUFBTSwyQ0FBMkMsR0FBRztBQUFBLEVBQ2hFO0FBQ0EsU0FBTztBQUFBLElBQ0gsT0FBTyxXQUFXLEtBQUssVUFBVTtBQUFBLElBQ2pDLFVBQVU7QUFBQSxJQUNWO0FBQUEsRUFDSjtBQUNKO0FBNUNBLElBRU0sa0JBQ0E7QUFITjtBQUFBO0FBQUE7QUFBQTtBQUVBLElBQU0sbUJBQW1CO0FBQ3pCLElBQU0sb0JBQW9CO0FBQ1g7QUFxQnFGO0FBQUE7QUFBQTs7O0FDekJwRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBTUEsU0FBUyxlQUFlO0FBQ3BCLFNBQU8sUUFBUSxJQUFJLGtCQUFrQixRQUFRLElBQUk7QUFDckQ7QUFDTyxTQUFTLGtCQUFrQjtBQUM5QixTQUFPLGFBQWEsSUFBSSxtQkFBbUI7QUFDL0M7QUFDQSxlQUFzQixtQkFBbUIsUUFBUSxPQUFPLGdCQUFnQixTQUFTO0FBQzdFLE1BQUksQ0FBQyxhQUFhLEVBQUcsUUFBTyxjQUFjLEdBQUcsUUFBUSxNQUFNLENBQUM7QUFDNUQsUUFBTSxjQUFjLFNBQVMsZUFBZTtBQUM1QyxRQUFNLFlBQVksU0FBUyxhQUFhO0FBQ3hDLFFBQU0sYUFBYSxTQUFTLGNBQWM7QUFDMUMsTUFBSSxTQUFTLFdBQVc7QUFDcEIsV0FBTyxrQkFBa0IsUUFBUSxhQUFhLGtGQUFrRjtBQUFBLEVBQ3BJO0FBQ0EsTUFBSSxXQUFXLG9CQUFvQixRQUFRLE1BQU0sR0FBRztBQUNoRCxXQUFPLGtCQUFrQixRQUFRLFdBQVcsbURBQW1EO0FBQUEsRUFDbkc7QUFDQSxTQUFPLFVBQVUsUUFBUSxXQUFXLFVBQVU7QUFDbEQ7QUFHQSxlQUFlLGtCQUFrQixRQUFRLFdBQVcsYUFBYTtBQUM3RCxRQUFNLFNBQVMsQ0FBQztBQUNoQixNQUFJLFVBQVU7QUFDZCxhQUFXLFFBQVEsT0FBTyxPQUFNO0FBQzVCLFFBQUksV0FBVyxRQUFRLFNBQVMsS0FBSyxLQUFLLFNBQVMsSUFBSSx3QkFBd0I7QUFDM0UsYUFBTyxLQUFLLE9BQU87QUFDbkIsZ0JBQVUsS0FBSztBQUFBLElBQ25CLE9BQU87QUFDSCxnQkFBVSxVQUFVLEdBQUcsT0FBTztBQUFBLEVBQUssS0FBSyxJQUFJLEtBQUssS0FBSztBQUFBLElBQzFEO0FBQUEsRUFDSjtBQUNBLE1BQUksUUFBUyxRQUFPLEtBQUssT0FBTztBQUNoQyxRQUFNLFdBQVcsQ0FBQztBQUNsQixNQUFJLGFBQWE7QUFDakIsYUFBVyxTQUFTLFFBQU87QUFDdkIsVUFBTSxPQUFPLE1BQU0sZUFBZSxHQUFHLFdBQVc7QUFBQSxFQUFLLEtBQUssSUFBSTtBQUFBLE1BQzFELGFBQWE7QUFBQSxRQUNULHFCQUFxQjtBQUFBLFVBQ2pCO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFBQSxJQUNKLENBQUM7QUFDRCxhQUFTLEtBQUssS0FBSyxHQUFHO0FBQ3RCLGlCQUFhLEtBQUs7QUFBQSxFQUN0QjtBQUNBLFFBQU0sTUFBTSxJQUFJLFdBQVcsT0FBTyxPQUFPLFNBQVMsSUFBSSxDQUFDLE1BQUksT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0UsU0FBTyxjQUFjLEtBQUssVUFBVTtBQUN4QztBQUNBLGVBQWUsVUFBVSxRQUFRLFdBQVcsWUFBWTtBQUNwRCxRQUFNLGFBQWEsT0FBTyxNQUFNLElBQUksQ0FBQyxTQUFPLEdBQUcsS0FBSyxZQUFZLFNBQVMsU0FBUyxPQUFPLEtBQUssS0FBSyxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUk7QUFDcEgsUUFBTSxFQUFFLEtBQUssV0FBVyxJQUFJLE1BQU0sZUFBZTtBQUFBLEVBQW1FLFVBQVUsSUFBSTtBQUFBLElBQzlILHlCQUF5QjtBQUFBLE1BQ3JCLHFCQUFxQjtBQUFBLFFBQ2pCO0FBQUEsVUFDSSxTQUFTO0FBQUEsVUFDVCxhQUFhO0FBQUEsWUFDVCxxQkFBcUI7QUFBQSxjQUNqQixXQUFXO0FBQUEsWUFDZjtBQUFBLFVBQ0o7QUFBQSxRQUNKO0FBQUEsUUFDQTtBQUFBLFVBQ0ksU0FBUztBQUFBLFVBQ1QsYUFBYTtBQUFBLFlBQ1QscUJBQXFCO0FBQUEsY0FDakIsV0FBVztBQUFBLFlBQ2Y7QUFBQSxVQUNKO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsRUFDSixDQUFDO0FBQ0QsU0FBTyxjQUFjLEtBQUssVUFBVTtBQUN4QztBQUNBLGVBQWUsZUFBZSxNQUFNLGNBQWM7QUFDOUMsUUFBTSxNQUFNLE1BQU0sTUFBTSwyREFBMkQsZ0JBQWdCLG9CQUFvQjtBQUFBLElBQ25ILFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxNQUNMLGdCQUFnQjtBQUFBLE1BQ2hCLGtCQUFrQixhQUFhO0FBQUEsSUFDbkM7QUFBQSxJQUNBLE1BQU0sS0FBSyxVQUFVO0FBQUEsTUFDakIsVUFBVTtBQUFBLFFBQ047QUFBQSxVQUNJLE9BQU87QUFBQSxZQUNIO0FBQUEsY0FDSTtBQUFBLFlBQ0o7QUFBQSxVQUNKO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFBQSxNQUNBLGtCQUFrQjtBQUFBLFFBQ2Qsb0JBQW9CO0FBQUEsVUFDaEI7QUFBQSxRQUNKO0FBQUEsUUFDQTtBQUFBLE1BQ0o7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNMLENBQUM7QUFDRCxNQUFJLENBQUMsSUFBSSxJQUFJO0FBQ1QsVUFBTSxRQUFRLE1BQU0sSUFBSSxLQUFLLEdBQUcsTUFBTSxHQUFHLEdBQUc7QUFDNUMsWUFBUSxNQUFNLG9CQUFvQixJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7QUFDdkQsVUFBTSxVQUFVLDRDQUE0QyxJQUFJLE1BQU07QUFDdEUsUUFBSSxJQUFJLFdBQVcsT0FBTyxJQUFJLFVBQVUsS0FBSztBQUN6QyxZQUFNLEVBQUUsZUFBZSxJQUFJLE1BQU0sT0FBTyxVQUFVO0FBQ2xELFlBQU0sSUFBSSxlQUFlLFNBQVM7QUFBQSxRQUM5QixZQUFZO0FBQUEsTUFDaEIsQ0FBQztBQUFBLElBQ0w7QUFDQSxVQUFNLEVBQUUsWUFBQUMsWUFBVyxJQUFJLE1BQU0sT0FBTyxVQUFVO0FBQzlDLFVBQU0sSUFBSUEsWUFBVyxPQUFPO0FBQUEsRUFDaEM7QUFDQSxRQUFNLE9BQU8sTUFBTSxJQUFJLEtBQUs7QUFDNUIsUUFBTSxRQUFRLEtBQUssYUFBYSxDQUFDLEdBQUcsU0FBUyxPQUFPLE9BQU8sQ0FBQyxNQUFJLEVBQUUsWUFBWSxJQUFJLEtBQUssQ0FBQztBQUN4RixNQUFJLE1BQU0sV0FBVyxHQUFHO0FBQ3BCLFVBQU0sRUFBRSxZQUFBQSxZQUFXLElBQUksTUFBTSxPQUFPLFVBQVU7QUFDOUMsVUFBTSxJQUFJQSxZQUFXLHlDQUF5QztBQUFBLEVBQ2xFO0FBRUEsUUFBTSxNQUFNLElBQUksV0FBVyxPQUFPLE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBSSxPQUFPLEtBQUssRUFBRSxXQUFXLE1BQU0sUUFBUSxDQUFDLENBQUMsQ0FBQztBQUNsRyxRQUFNLFlBQVksYUFBYSxLQUFLLE1BQU0sQ0FBQyxFQUFFLFlBQVksWUFBWSxFQUFFO0FBQ3ZFLFFBQU0sYUFBYSxZQUFZLFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJO0FBQzVELFNBQU87QUFBQSxJQUNIO0FBQUEsSUFDQTtBQUFBLEVBQ0o7QUFDSjtBQUdBLFNBQVMsUUFBUSxRQUFRO0FBQ3JCLFFBQU0sYUFBYTtBQUNuQixRQUFNLGNBQWM7QUFDcEIsUUFBTSxpQkFBaUI7QUFDdkIsUUFBTSxhQUFhO0FBQ25CLE1BQUksZUFBZTtBQUNuQixRQUFNLFdBQVcsQ0FBQztBQUNsQixhQUFXLFFBQVEsT0FBTyxPQUFNO0FBQzVCLFVBQU0sUUFBUSxLQUFLLElBQUksR0FBRyxLQUFLLEtBQUssTUFBTSxLQUFLLEVBQUUsTUFBTTtBQUN2RCxVQUFNLFVBQVUsUUFBUSxjQUFjO0FBQ3RDLFFBQUksZUFBZSxVQUFVLFdBQVk7QUFDekMsb0JBQWdCO0FBQ2hCLGFBQVMsS0FBSztBQUFBLE1BQ1YsTUFBTSxLQUFLLFlBQVksU0FBUyxNQUFNO0FBQUEsTUFDdEM7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNMO0FBQ0EsUUFBTSxlQUFlLEtBQUssS0FBSyxlQUFlLFVBQVU7QUFDeEQsUUFBTSxNQUFNLElBQUksV0FBVyxZQUFZO0FBQ3ZDLE1BQUksU0FBUztBQUNiLGFBQVcsV0FBVyxVQUFTO0FBQzNCLGFBQVEsSUFBSSxHQUFHLElBQUksUUFBUSxPQUFPLEtBQUk7QUFDbEMsWUFBTSxjQUFjLEtBQUssTUFBTSxjQUFjLGFBQWEsSUFBSTtBQUM5RCxZQUFNLE9BQU8sUUFBUSxRQUFRLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQztBQUNsRCxlQUFRLElBQUksR0FBRyxJQUFJLGVBQWUsU0FBUyxJQUFJLGNBQWMsS0FBSTtBQUM3RCxjQUFNLElBQUksSUFBSTtBQUNkLGNBQU0sV0FBVyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksV0FBVztBQUNuRCxZQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssTUFBTSxNQUFPLFdBQVcsS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLE9BQU8sQ0FBQyxDQUFDO0FBQUEsTUFDbkY7QUFDQSxnQkFBVSxLQUFLLE1BQU0sY0FBYyxVQUFVO0FBQUEsSUFDakQ7QUFDQSxjQUFVLEtBQUssTUFBTSxpQkFBaUIsVUFBVTtBQUFBLEVBQ3BEO0FBQ0EsUUFBTSxRQUFRLElBQUksV0FBVyxJQUFJLFFBQVEsR0FBRyxlQUFlLENBQUM7QUFDNUQsU0FBTztBQUFBLElBQ0g7QUFBQSxJQUNBO0FBQUEsRUFDSjtBQUNKO0FBOUtBLElBR00sb0JBQ0Esa0JBQ0E7QUFMTjtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQSxJQUFNLHFCQUFxQjtBQUMzQixJQUFNLG1CQUFtQixRQUFRLElBQUkscUJBQXFCO0FBQzFELElBQU0seUJBQXlCO0FBQ3RCO0FBR087QUFHTTtBQWVQO0FBNEJBO0FBMEJBO0FBdUROO0FBQUE7QUFBQTs7O0FDdkk0RixTQUFTLGlCQUFpQjtBQUMzSCxNQUFJLENBQUMsZUFBZTtBQUNoQixvQkFBZ0IsT0FBTyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsRUFBRSxhQUFhLE1BQUksYUFBYSxRQUFRLElBQUksY0FBYyxRQUFRLElBQUkscUJBQXFCO0FBQUEsTUFDekksTUFBTTtBQUFBLFFBQ0YsZ0JBQWdCO0FBQUEsTUFDcEI7QUFBQSxJQUNKLENBQUMsQ0FBQztBQUFBLEVBQ1Y7QUFDQSxTQUFPO0FBQ1g7QUFDTyxTQUFTLHFCQUFxQjtBQUNqQyxTQUFPLFFBQVEsUUFBUSxJQUFJLGdCQUFnQixRQUFRLElBQUksbUJBQW1CO0FBQzlFO0FBYkEsSUFBSTtBQUFKO0FBQUE7QUFBQTtBQUFBLElBQUksZ0JBQWdCO0FBQzBGO0FBVTlGO0FBQUE7QUFBQTs7O0FDWGhCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVE2RSxTQUFTLGNBQWMsZ0JBQWdCLFFBQVE7QUFDeEgsU0FBTyxLQUFLLElBQUksS0FBSyxJQUFJLEdBQUcsY0FBYyxHQUFHLGVBQWUsTUFBTSxFQUFFLFNBQVM7QUFDakY7QUFJTyxTQUFTLFdBQVcsTUFBTSxnQkFBZ0IsU0FBUyxZQUFZO0FBQ2xFLE1BQUksU0FBUyxXQUFXO0FBQ3BCLFVBQU0sUUFBUSxjQUFjLGdCQUFnQixNQUFNO0FBQ2xELFdBQU8sS0FBSyxJQUFJLHlCQUF5QixLQUFLLElBQUksR0FBRyxLQUFLLEtBQUssUUFBUSxxQkFBcUIsQ0FBQyxDQUFDO0FBQUEsRUFDbEc7QUFDQSxTQUFPLEtBQUssSUFBSSx5QkFBeUIsS0FBSyxJQUFJLEdBQUcsS0FBSyxLQUFLLGVBQWUsTUFBTSxFQUFFLGNBQWMsNkJBQTZCLENBQUMsQ0FBQztBQUN2STtBQUNPLFNBQVMsZ0JBQWdCLE1BQU0sZ0JBQWdCLFNBQVMsWUFBWTtBQUN2RSxNQUFJLFNBQVMsV0FBVztBQUNwQixXQUFPLEtBQUssSUFBSSxHQUFHLEtBQUssTUFBTSxjQUFjLGdCQUFnQixNQUFNLElBQUksR0FBSyxDQUFDO0FBQUEsRUFDaEY7QUFDQSxTQUFPLGVBQWUsTUFBTSxFQUFFO0FBQ2xDO0FBQzZGLFNBQVMsaUJBQWlCO0FBQ25ILFNBQU8sbUJBQW1CO0FBQzlCO0FBQ0EsZUFBc0IsV0FBVyxRQUFRO0FBQ3JDLE1BQUksQ0FBQyxlQUFlLEVBQUcsUUFBTztBQUM5QixRQUFNLFdBQVcsTUFBTSxlQUFlO0FBQ3RDLFFBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLFNBQVMsSUFBSSxrQkFBa0I7QUFBQSxJQUN6RCxRQUFRO0FBQUEsRUFDWixDQUFDO0FBQ0QsTUFBSSxNQUFPLE9BQU0sSUFBSSxNQUFNLDBCQUEwQixNQUFNLE9BQU8sRUFBRTtBQUNwRSxTQUFPLE9BQU8sUUFBUSxDQUFDO0FBQzNCO0FBQ0EsZUFBc0IsYUFBYSxRQUFRLFFBQVEsV0FBVztBQUMxRCxNQUFJLENBQUMsZUFBZSxFQUFHLFFBQU87QUFDOUIsUUFBTSxXQUFXLE1BQU0sZUFBZTtBQUN0QyxRQUFNLEVBQUUsTUFBTSxNQUFNLElBQUksTUFBTSxTQUFTLElBQUksaUJBQWlCO0FBQUEsSUFDeEQsUUFBUTtBQUFBLElBQ1IsVUFBVTtBQUFBLElBQ1YsT0FBTyxXQUFXLFNBQVM7QUFBQSxFQUMvQixDQUFDO0FBQ0QsTUFBSSxNQUFPLE9BQU0sSUFBSSxNQUFNLHdCQUF3QixNQUFNLE9BQU8sRUFBRTtBQUNsRSxTQUFPLFNBQVM7QUFDcEI7QUFDQSxlQUFzQixjQUFjLFFBQVEsV0FBVztBQUNuRCxNQUFJLENBQUMsZUFBZSxFQUFHO0FBQ3ZCLFFBQU0sV0FBVyxNQUFNLGVBQWU7QUFDdEMsUUFBTSxFQUFFLE1BQU0sSUFBSSxNQUFNLFNBQVMsSUFBSSxrQkFBa0I7QUFBQSxJQUNuRCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsRUFDZixDQUFDO0FBQ0QsTUFBSSxNQUFPLE9BQU0sSUFBSSxNQUFNLHlCQUF5QixNQUFNLE9BQU8sRUFBRTtBQUN2RTtBQTFEQSxJQUlNLHVCQUdBLHlCQU1BO0FBYk47QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUdBLElBQU0sd0JBQXdCO0FBRzlCLElBQU0sMEJBQTBCO0FBQ3NEO0FBS3RGLElBQU0sZ0NBQWdDLGVBQWUsU0FBUztBQUM5QztBQU9BO0FBTXNGO0FBR2hGO0FBU0E7QUFXQTtBQUFBO0FBQUE7OztBQ2xEdEIsU0FBQSw0QkFBQTtBQVNFLGVBQVcsa0NBQUE7QUFDWCxTQUFPLEtBQUssWUFBVztBQUN6QjtBQUZhO0FBSWIsZUFBc0IsMEJBQXVCO0FBQzNDLFNBQUEsS0FBVyxLQUFBOztBQURTO0FBR3RCLGVBQUMsMEJBQUE7QUFFRCxTQUFPLEtBQUssS0FBQTs7QUFGWDtxQkFJaUIsbUNBQUcsK0JBQUE7QUFDckIscUJBQUMsMkJBQUEsdUJBQUE7Ozs7QUNyQkQsU0FBQSx3QkFBQUMsNkJBQUE7QUFhQSxlQUFzQkMsVUFBa0QsTUFBQTtBQUN0RSxTQUFBLFdBQVcsTUFBQSxHQUFBLElBQUE7O0FBRFMsT0FBQUEsUUFBQTtBQUd0QkMsc0JBQUMsK0JBQUFELE1BQUE7OztBQ2hCRCxTQUFTLHdCQUFBRSw2QkFBNEI7QUFDckMsU0FBUyxZQUFZLGtCQUFrQjtBQUV2QyxlQUFzQixnQkFBZ0IsV0FBVyxlQUFlLE9BQU87QUFDbkUsUUFBTSxJQUFJLE1BQU0sd0lBQXdJO0FBQzVKO0FBRnNCO0FBR3RCLGdCQUFnQixhQUFhO0FBQzdCLGVBQWUsZ0JBQWdCLFdBQVc7QUFDdEMsVUFBUSxJQUFJLHFCQUFxQixTQUFTLDBCQUEwQjtBQUNwRSxRQUFNLEVBQUUsVUFBQUMsVUFBUyxJQUFJLE1BQU07QUFDM0IsTUFBSSxDQUFDLE1BQU1BLFVBQVMsRUFBRSxNQUFNLFdBQVc7QUFBQSxJQUNuQyxRQUFRO0FBQUEsRUFDWixDQUFDLEdBQUc7QUFDQSxVQUFNLElBQUksV0FBVyxxQkFBcUI7QUFBQSxFQUM5QztBQUNKO0FBUmU7QUFTZixlQUFlLFlBQVksV0FBVztBQUNsQyxVQUFRLElBQUkscUJBQXFCLFNBQVMsbUJBQW1CO0FBQzdELFFBQU0sRUFBRSxVQUFBQSxVQUFTLElBQUksTUFBTTtBQUMzQixRQUFNLEVBQUUsZ0JBQUFDLGdCQUFlLElBQUksTUFBTTtBQUNqQyxRQUFNQyxTQUFRRixVQUFTO0FBQ3ZCLFFBQU0sVUFBVSxNQUFNRSxPQUFNLE1BQU0sV0FBVztBQUFBLElBQ3pDLFFBQVE7QUFBQSxFQUNaLENBQUM7QUFDRCxNQUFJLENBQUMsUUFBUyxPQUFNLElBQUksV0FBVyxxQkFBcUI7QUFHeEQsTUFBSTtBQUNKLE1BQUk7QUFDSixRQUFNLGFBQWEsTUFBTUEsT0FBTSxjQUFjLFNBQVM7QUFDdEQsTUFBSSxlQUFlLE1BQU07QUFDckIsV0FBTztBQUNQLGlCQUFhLFFBQVEsY0FBYztBQUFBLEVBQ3ZDLE9BQU87QUFDSCxVQUFNLFNBQVMsTUFBTUEsT0FBTSxVQUFVLFNBQVM7QUFDOUMsUUFBSSxDQUFDLE9BQVEsT0FBTSxJQUFJLFdBQVcsbUJBQW1CO0FBQ3JELFFBQUk7QUFDQSxPQUFDLEVBQUUsTUFBTSxXQUFXLElBQUksTUFBTUQsZ0JBQWUsTUFBTTtBQUFBLElBQ3ZELFNBQVMsS0FBSztBQUNWLFlBQU0sSUFBSSxXQUFXLGVBQWUsUUFBUSxJQUFJLFVBQVUsT0FBTyxHQUFHLENBQUM7QUFBQSxJQUN6RTtBQUFBLEVBQ0o7QUFDQSxRQUFNQyxPQUFNLE1BQU0sV0FBVztBQUFBLElBQ3pCO0FBQUEsSUFDQSxnQkFBZ0IsS0FBSztBQUFBLEVBQ3pCLENBQUM7QUFDRCxTQUFPO0FBQ1g7QUEvQmU7QUFnQ2YsZUFBZSxXQUFXLFdBQVcsTUFBTTtBQUN2QyxVQUFRLElBQUkscUJBQXFCLFNBQVMscUJBQXFCO0FBQy9ELFFBQU0sRUFBRSxVQUFBRixVQUFTLElBQUksTUFBTTtBQUMzQixRQUFNLEVBQUUsdUJBQUFHLHdCQUF1QixnQkFBQUMsaUJBQWdCLG9CQUFBQyxvQkFBbUIsSUFBSSxNQUFNO0FBQzVFLFFBQU0sRUFBRSxrQkFBQUMsbUJBQWtCLGdCQUFBQyxnQkFBZSxJQUFJLE1BQU07QUFDbkQsUUFBTUwsU0FBUUYsVUFBUztBQUN2QixRQUFNLFVBQVUsTUFBTUUsT0FBTSxNQUFNLFdBQVc7QUFBQSxJQUN6QyxRQUFRO0FBQUEsRUFDWixDQUFDO0FBQ0QsTUFBSSxDQUFDLFFBQVMsT0FBTSxJQUFJLFdBQVcscUJBQXFCO0FBQ3hELFFBQU0sVUFBVUksa0JBQWlCLFFBQVEsT0FBTztBQUNoRCxRQUFNLFNBQVMsUUFBUSxTQUFTLFlBQVlGLGdCQUFlLE1BQU0sUUFBUSxnQkFBZ0JHLGdCQUFlLFFBQVEsTUFBTSxFQUFFLFNBQVMsSUFBSSxNQUFNSix1QkFBc0IsTUFBTSxRQUFRLGdCQUFnQixPQUFPO0FBQ3RNLFFBQU1ELE9BQU0sTUFBTSxXQUFXO0FBQUEsSUFDekIsT0FBTyxPQUFPO0FBQUEsSUFDZDtBQUFBLElBQ0EsV0FBVztBQUFBLE1BQ1AsUUFBUSxRQUFRLFNBQVMsWUFBWSxhQUFhRyxvQkFBbUI7QUFBQSxNQUNyRSxLQUFLO0FBQUEsSUFDVDtBQUFBLEVBQ0osQ0FBQztBQUNMO0FBcEJlO0FBcUJmLGVBQWUsZUFBZSxXQUFXO0FBQ3JDLFVBQVEsSUFBSSxxQkFBcUIsU0FBUyxzQkFBc0I7QUFDaEUsUUFBTSxFQUFFLFVBQUFMLFVBQVMsSUFBSSxNQUFNO0FBQzNCLFFBQU0sRUFBRSxvQkFBQVEscUJBQW9CLGlCQUFBQyxpQkFBZ0IsSUFBSSxNQUFNO0FBQ3RELFFBQU0sRUFBRSxrQkFBQUgsa0JBQWlCLElBQUksTUFBTTtBQUNuQyxRQUFNSixTQUFRRixVQUFTO0FBQ3ZCLFFBQU0sVUFBVSxNQUFNRSxPQUFNLE1BQU0sV0FBVztBQUFBLElBQ3pDLFFBQVE7QUFBQSxFQUNaLENBQUM7QUFDRCxNQUFJLENBQUMsUUFBUyxPQUFNLElBQUksV0FBVyxxQkFBcUI7QUFHeEQsUUFBTSxTQUFTLFFBQVE7QUFDdkIsTUFBSSxDQUFDLE9BQVEsT0FBTSxJQUFJLFdBQVcsbUJBQW1CO0FBQ3JELFFBQU0sRUFBRSxPQUFPLFVBQVUsZ0JBQWdCLElBQUksTUFBTU0sb0JBQW1CLFFBQVEsUUFBUSxRQUFRLGdCQUFnQkYsa0JBQWlCLFFBQVEsT0FBTyxDQUFDO0FBQy9JLFFBQU1KLE9BQU0sVUFBVSxXQUFXLE9BQU8sUUFBUTtBQUNoRCxRQUFNQSxPQUFNLE1BQU0sV0FBVztBQUFBLElBQ3pCLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxJQUNmLGlCQUFpQixLQUFLLE1BQU0sZUFBZTtBQUFBLElBQzNDLFdBQVc7QUFBQSxNQUNQLFFBQVEsUUFBUSxXQUFXLFVBQVU7QUFBQSxNQUNyQyxLQUFLTyxpQkFBZ0I7QUFBQSxJQUN6QjtBQUFBLEVBQ0osQ0FBQztBQUNMO0FBekJlO0FBMEJmLGVBQWUsU0FBUyxXQUFXLFNBQVM7QUFDeEMsVUFBUSxNQUFNLHFCQUFxQixTQUFTLGFBQWEsT0FBTyxFQUFFO0FBQ2xFLE1BQUk7QUFDQSxVQUFNLEVBQUUsVUFBQVQsVUFBUyxJQUFJLE1BQU07QUFDM0IsVUFBTSxVQUFVLE1BQU1BLFVBQVMsRUFBRSxNQUFNLFdBQVc7QUFBQSxNQUM5QyxRQUFRO0FBQUEsTUFDUixPQUFPO0FBQUEsSUFDWCxDQUFDO0FBQ0QsUUFBSSxTQUFTLFFBQVE7QUFDakIsWUFBTSxFQUFFLGVBQUFVLGVBQWMsSUFBSSxNQUFNO0FBR2hDLFlBQU1BLGVBQWMsUUFBUSxRQUFRLFNBQVM7QUFBQSxJQUNqRDtBQUFBLEVBQ0osU0FBUyxVQUFVO0FBRWYsWUFBUSxNQUFNLHFCQUFxQixTQUFTLCtCQUErQixRQUFRO0FBQUEsRUFDdkY7QUFDSjtBQWxCZTtBQW1CZkMsc0JBQXFCLHVEQUF1RCxlQUFlO0FBQzNGQSxzQkFBcUIsbURBQW1ELFdBQVc7QUFDbkZBLHNCQUFxQixrREFBa0QsVUFBVTtBQUNqRkEsc0JBQXFCLHNEQUFzRCxjQUFjO0FBQ3pGQSxzQkFBcUIsZ0RBQWdELFFBQVE7OztBQzNHMUUsT0FBQSxvQkFBQTtBQU1ILElBQUEsZUFBQSxlQUFBLEtBQUEsR0FBQTtBQUdBLElBQUEseUJBQUEsSUFBQSxPQUFBLGdDQUF3RSxZQUFBLDBEQUFBLFlBQUEsOEJBQUEsR0FBQTs7O0FDVHJFLE9BQUFDLHFCQUFBO0FBTUgsSUFBQUMsZ0JBQUFDLGdCQUFBLEtBQUEsR0FBQTtBQUdBLElBQUFDLDBCQUFBLElBQUEsT0FBQSxnQ0FBd0VGLGFBQUEsMERBQUFBLGFBQUEsOEJBQUEsR0FBQTs7O0FDcEJ4RSxTQUNFLHdCQUNBLHFCQUNBLHlCQUNBLHlCQUFBRyx3QkFDQSxpQkFDQSxpQkFDQSx3QkFBQUMsNkJBQ0Q7QUFDRCxTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLHFCQUFBQywwQkFBeUI7QUFDbEMsU0FFRSxxQkFDQSx1QkFDQSx3QkFBQUMsdUJBQ0EsdUJBQUFDLHNCQUNBLG1DQUVEO0FBQ0QsU0FDRSxrQkFDQSx1QkFDQSw0QkFDRDtBQUNELFNBQVMsYUFBQUMsa0JBQWlCO0FBQzFCLFNBQVMsc0JBQUFDLDJCQUEwQjtBQUNuQyxTQUFTLGlCQUFBQyxzQkFBcUI7QUFDOUIsU0FDRSxzQkFDQSwrQkFDQSw0QkFDQSx5QkFDRDtBQUNELFNBQ0Usa0JBQ0Esd0JBQUFDLHVCQUNBLHNCQUNBLDBCQUVBLHlCQUNBLGNBQ0EseUJBQ0EsaUJBQ0EsNkJBQ0Q7QUFDRCxTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLFlBQUFDLFdBQVUsd0JBQXdCO0FBQzNDLFNBQVMsdUJBQXVCO0FBQ2hDLFlBQVlDLGdCQUFlO0FBQzNCLFNBQ0Usc0JBQ0EsU0FBQUMsUUFDQSxrQkFDQSwyQkFDRDtBQUNELFNBQVMsY0FBYyxlQUFlLDZCQUE2QjtBQUNuRSxTQUFTLHNDQUFzQzs7O0FDekQvQyxTQUNFLGFBQ0EsdUJBQ0EsNEJBQ0EsNEJBQ0Q7QUFDRCxTQUFTLHVCQUF1QixxQkFBcUI7QUFDckQsU0FBUyx5QkFBeUI7QUFFbEMsWUFBWSxZQUFZO0FBQ3hCLFNBQVMsd0JBQXdCO0FBRWpDLFNBQVMscUJBQXFCLHNCQUFzQjtBQUVwRCxTQUFTLFNBQVMsMEJBQTBCO0FBQzVDLFNBQVMscUJBQXFCO0FBRTlCLFNBQVMsbUJBQW1CO0FBQzVCLFNBQ0UsOEJBQ0EsZ0NBQ0Q7QUFDRCxTQUFTLHFCQUFxQjtBQUU5QixTQUNFLGtCQUNBLGFBQ0Esc0JBQ0Esd0JBQ0EsZ0JBQ0EseUJBQ0Q7QUFDRCxZQUFZLGVBQWU7QUFDM0IsU0FBUyxhQUFhO0FBQ3RCLFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsK0JBQStCO0FBRXhDLFNBQVMsK0JBQStCO0FBQ3hDLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsbUJBQW1COzs7QURxQjVCLFNBQVMsc0JBQUFDLDJCQUEwQjtBQUNuQyxTQUlFLG1CQUNEOzs7QUVuRUQsU0FDRSxlQUFBQyxjQUNBLG1CQUNBLHdCQUFBQyw2QkFDRDtBQUNELFNBRUUscUJBQ0Esc0JBQ0EsMkJBR0Q7QUFDRCxTQUFTLDBCQUEwQjtBQUNuQyxTQUF5QixpQkFBaUI7QUFDMUMsU0FBUyxpQkFBQUMsc0JBQXFCO0FBQzlCLFNBQ0UsMEJBQ0Esc0JBQ0EsMkJBQ0Q7QUFDRCxTQUFTLGlDQUFpQztBQUMxQyxZQUFZQyxnQkFBZTtBQUMzQixTQUFTLCtCQUErQixTQUFBQyxjQUFhO0FBQ3JELFNBQVMsNEJBQTRCO0FBQ3JDLFNBQVMsZUFBZSxtQkFBbUI7QUFDM0MsU0FBUyxnQkFBZ0I7OztBRitDekIsU0FDRSxRQUNBLFdBR0Q7QUFDRCxTQUNFLFdBQ0EsYUFHQSxZQUNBLHlCQUNBLGNBR0EsaUJBQ0Q7QUFDRCxTQUtFLGFBQ0Q7QUFDRCxTQUFTLHNCQUFzQjtBQUMvQixTQUNFLGFBQ0EsWUFBQUMsV0FDQSxvQkFBQUMsbUJBQ0EsZ0JBQ0Q7IiwKICAibmFtZXMiOiBbInN0YXJ0IiwgIkZhdGFsRXJyb3IiLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAiZmV0Y2giLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAiZ2V0U3RvcmUiLCAiZXh0cmFjdFBkZlRleHQiLCAic3RvcmUiLCAiZ2VuZXJhdGVQb2RjYXN0U2NyaXB0IiwgInZlcmJhdGltU2NyaXB0IiwgInNjcmlwdFByb3ZpZGVyTmFtZSIsICJub3JtYWxpemVPcHRpb25zIiwgIkxFTkdUSF9CVURHRVRTIiwgInN5bnRoZXNpemVEaWFsb2d1ZSIsICJ0dHNQcm92aWRlck5hbWUiLCAicmVmdW5kRXBpc29kZSIsICJyZWdpc3RlclN0ZXBGdW5jdGlvbiIsICJidWlsdGluTW9kdWxlcyIsICJub2RlQnVpbHRpbnMiLCAiYnVpbHRpbk1vZHVsZXMiLCAibm9kZUltcG9ydEV4dHJhY3RSZWdleCIsICJSZXBsYXlEaXZlcmdlbmNlRXJyb3IiLCAiV29ya2Zsb3dSdW50aW1lRXJyb3IiLCAicGFyc2VXb3JrZmxvd05hbWUiLCAiU1BFQ19WRVJTSU9OX0NVUlJFTlQiLCAiU1BFQ19WRVJTSU9OX0xFR0FDWSIsICJpbXBvcnRLZXkiLCAiV29ya2Zsb3dTdXNwZW5zaW9uIiwgInJ1bnRpbWVMb2dnZXIiLCAiZ2V0V29ya2Zsb3dRdWV1ZU5hbWUiLCAiZ2V0V29ybGQiLCAiQXR0cmlidXRlIiwgInRyYWNlIiwgIldvcmtmbG93U3VzcGVuc2lvbiIsICJFUlJPUl9TTFVHUyIsICJXb3JrZmxvd1J1bnRpbWVFcnJvciIsICJydW50aW1lTG9nZ2VyIiwgIkF0dHJpYnV0ZSIsICJ0cmFjZSIsICJnZXRXb3JsZCIsICJnZXRXb3JsZEhhbmRsZXJzIl0KfQo=
