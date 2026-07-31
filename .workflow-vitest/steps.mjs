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
      create(episode) {
        assertId(episode.id);
        return this.meta.create(episode);
      }
      patch(id, fields) {
        assertId(id);
        return this.meta.patch(id, fields);
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
  extractPdfText: () => extractPdfText,
  looksLikePdf: () => looksLikePdf,
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
var MAX_PDF_BYTES;
var init_extract = __esm({
  "lib/pipeline/extract.ts"() {
    "use strict";
    MAX_PDF_BYTES = 4 * 1024 * 1024;
    __name(validatePdfFile, "validatePdfFile");
    __name(looksLikePdf, "looksLikePdf");
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
  isSingleVoiceFormat: () => isSingleVoiceFormat,
  normalizeOptions: () => normalizeOptions,
  readCharBudget: () => readCharBudget,
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
function validateEditedScript(input, mode, length) {
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
  const budget = Math.round((mode === "reading" ? LENGTH_BUDGETS[length].readChars : LENGTH_BUDGETS[length].scriptChars) * 1.25);
  if (total > budget) {
    return {
      ok: false,
      error: `Edited script is too long for the ${length} length you chose`
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
  return 1;
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
var READ_CHARS_PER_CREDIT, MAX_CREDITS_PER_EPISODE;
var init_credits = __esm({
  "lib/credits.ts"() {
    "use strict";
    init_admin();
    init_options();
    READ_CHARS_PER_CREDIT = 25e3;
    MAX_CREDITS_PER_EPISODE = 8;
    __name(readableChars, "readableChars");
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
  if (!await store2.patch(episodeId, {
    status: "extracting"
  })) {
    throw new FatalError("Episode was deleted");
  }
  const source = await store2.getSource(episodeId);
  if (!source) throw new FatalError("Source PDF is missing");
  let text;
  let totalPages;
  try {
    ({ text, totalPages } = await extractPdfText2(source));
  } catch (err) {
    throw new FatalError(err instanceof Error ? err.message : String(err));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbGliL3N0b3JlLnRzIiwgIi4uL2xpYi9waXBlbGluZS9leHRyYWN0LnRzIiwgIi4uL2xpYi92b2ljZXMudHMiLCAiLi4vbGliL29wdGlvbnMudHMiLCAiLi4vbGliL3BpcGVsaW5lL3NjcmlwdC50cyIsICIuLi9saWIvYXVkaW8vd2F2LnRzIiwgIi4uL2xpYi9hdWRpby9tcDMudHMiLCAiLi4vbGliL3BpcGVsaW5lL3R0cy50cyIsICIuLi9saWIvc3VwYWJhc2UvYWRtaW4udHMiLCAiLi4vbGliL2NyZWRpdHMudHMiLCAiLi4vbm9kZV9tb2R1bGVzL3dvcmtmbG93L3NyYy9pbnRlcm5hbC9idWlsdGlucy50cyIsICIuLi9ub2RlX21vZHVsZXMvd29ya2Zsb3cvc3JjL3N0ZGxpYi50cyIsICIuLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS50cyIsICIuLi9ub2RlX21vZHVsZXMvQHdvcmtmbG93L2J1aWxkZXJzL3NyYy9zZXJkZS1jaGVja2VyLnRzIiwgIi4uL25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvdml0ZXN0L25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvYnVpbGRlcnMvc3JjL3NlcmRlLWNoZWNrZXIudHMiLCAiLi4vbm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9jb3JlL3NyYy9ydW50aW1lLnRzIiwgIi4uL25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvY29yZS9zcmMvd29ya2Zsb3cudHMiLCAiLi4vbm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9jb3JlL3NyYy9ydW50aW1lL3Jlc3VtZS1ob29rLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmNvbnN0IFVVSURfUkUgPSAvXlswLTlhLWZdezh9LVswLTlhLWZdezR9LVswLTlhLWZdezR9LVswLTlhLWZdezR9LVswLTlhLWZdezEyfSQvaTtcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkRXBpc29kZUlkKGlkKSB7XG4gICAgcmV0dXJuIFVVSURfUkUudGVzdChpZCk7XG59XG5mdW5jdGlvbiBhc3NlcnRJZChpZCkge1xuICAgIGlmICghaXNWYWxpZEVwaXNvZGVJZChpZCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVwaXNvZGUgaWQ6ICR7aWQuc2xpY2UoMCwgNDApfWApO1xuICAgIH1cbn1cbmNvbnN0IEFVRElPX0VYVCA9IHtcbiAgICBcImF1ZGlvL3dhdlwiOiBcIndhdlwiLFxuICAgIFwiYXVkaW8vbXBlZ1wiOiBcIm1wM1wiXG59O1xuY2xhc3MgRnNNZXRhIHtcbiAgICBkaXI7XG4gICAgY29uc3RydWN0b3IoZGlyKXtcbiAgICAgICAgdGhpcy5kaXIgPSBkaXI7XG4gICAgfVxuICAgIGZpbGUoaWQpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbih0aGlzLmRpciwgYCR7aWR9Lmpzb25gKTtcbiAgICB9XG4gICAgYXN5bmMgd3JpdGUoZXBpc29kZSkge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih0aGlzLmRpciwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmZpbGUoZXBpc29kZS5pZCk7XG4gICAgICAgIGNvbnN0IHRtcCA9IGAke3RhcmdldH0udG1wYDtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHRtcCwgSlNPTi5zdHJpbmdpZnkoZXBpc29kZSwgbnVsbCwgMikpO1xuICAgICAgICBhd2FpdCBmcy5yZW5hbWUodG1wLCB0YXJnZXQpO1xuICAgIH1cbiAgICBhc3luYyBsaXN0KGZpbHRlcikge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih0aGlzLmRpciwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnJlYWRkaXIodGhpcy5kaXIpO1xuICAgICAgICBjb25zdCBlcGlzb2RlcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGYgb2YgZmlsZXMpe1xuICAgICAgICAgICAgaWYgKCFmLmVuZHNXaXRoKFwiLmpzb25cIikpIGNvbnRpbnVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlcGlzb2Rlcy5wdXNoKEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKHRoaXMuZGlyLCBmKSwgXCJ1dGY4XCIpKSk7XG4gICAgICAgICAgICB9IGNhdGNoICB7XG4gICAgICAgICAgICAvLyBza2lwIHRvcm4vY29ycnVwdCBlbnRyaWVzIHJhdGhlciB0aGFuIGZhaWxpbmcgdGhlIHdob2xlIGxpc3RpbmdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2aXNpYmxlID0gZmlsdGVyID8gZXBpc29kZXMuZmlsdGVyKChlKT0+ZS51c2VySWQgPT09IGZpbHRlci51c2VySWQgfHwgZmlsdGVyLmluY2x1ZGVVbm93bmVkICYmIGUudXNlcklkID09PSB1bmRlZmluZWQpIDogZXBpc29kZXM7XG4gICAgICAgIHJldHVybiB2aXNpYmxlLnNvcnQoKGEsIGIpPT5iLmNyZWF0ZWRBdC5sb2NhbGVDb21wYXJlKGEuY3JlYXRlZEF0KSk7XG4gICAgfVxuICAgIGFzeW5jIGdldChpZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUodGhpcy5maWxlKGlkKSwgXCJ1dGY4XCIpKTtcbiAgICAgICAgfSBjYXRjaCAge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgY3JlYXRlKGVwaXNvZGUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZShlcGlzb2RlKTtcbiAgICB9XG4gICAgYXN5bmMgcGF0Y2goaWQsIGZpZWxkcykge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKCFleGlzdGluZykgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWQgPSB7XG4gICAgICAgICAgICAuLi5leGlzdGluZyxcbiAgICAgICAgICAgIC4uLmZpZWxkcyxcbiAgICAgICAgICAgIGlkXG4gICAgICAgIH07XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGUodXBkYXRlZCk7XG4gICAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgIH1cbiAgICBhc3luYyBkZWxldGUoaWQpIHtcbiAgICAgICAgYXdhaXQgZnMucm0odGhpcy5maWxlKGlkKSwge1xuICAgICAgICAgICAgZm9yY2U6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gcm93VG9FcGlzb2RlKHJvdykge1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiByb3cuaWQsXG4gICAgICAgIHVzZXJJZDogcm93LnVzZXJfaWQgPz8gdW5kZWZpbmVkLFxuICAgICAgICB0aXRsZTogcm93LnRpdGxlLFxuICAgICAgICBzb3VyY2VGaWxlbmFtZTogcm93LnNvdXJjZV9maWxlbmFtZSxcbiAgICAgICAgbW9kZTogcm93Lm1vZGUgPz8gXCJjb252ZXJzYXRpb25cIixcbiAgICAgICAgb3B0aW9uczogcm93Lm9wdGlvbnMgPz8gdW5kZWZpbmVkLFxuICAgICAgICBzdGF0dXM6IHJvdy5zdGF0dXMsXG4gICAgICAgIGVycm9yOiByb3cuZXJyb3IgPz8gdW5kZWZpbmVkLFxuICAgICAgICBjcmVhdGVkQXQ6IHJvdy5jcmVhdGVkX2F0LFxuICAgICAgICB0b3RhbFBhZ2VzOiByb3cudG90YWxfcGFnZXMgPz8gdW5kZWZpbmVkLFxuICAgICAgICBleHRyYWN0ZWRDaGFyczogcm93LmV4dHJhY3RlZF9jaGFycyA/PyB1bmRlZmluZWQsXG4gICAgICAgIHNjcmlwdDogcm93LnNjcmlwdCA/PyB1bmRlZmluZWQsXG4gICAgICAgIGF1ZGlvTWltZVR5cGU6IHJvdy5hdWRpb19taW1lX3R5cGUgPz8gdW5kZWZpbmVkLFxuICAgICAgICBkdXJhdGlvblNlY29uZHM6IHJvdy5kdXJhdGlvbl9zZWNvbmRzID8/IHVuZGVmaW5lZCxcbiAgICAgICAgcHJvdmlkZXJzOiByb3cucHJvdmlkZXJzID8/IHVuZGVmaW5lZFxuICAgIH07XG59XG5mdW5jdGlvbiBlcGlzb2RlVG9Sb3coZmllbGRzKSB7XG4gICAgY29uc3Qgcm93ID0ge307XG4gICAgaWYgKGZpZWxkcy5pZCAhPT0gdW5kZWZpbmVkKSByb3cuaWQgPSBmaWVsZHMuaWQ7XG4gICAgaWYgKGZpZWxkcy51c2VySWQgIT09IHVuZGVmaW5lZCkgcm93LnVzZXJfaWQgPSBmaWVsZHMudXNlcklkO1xuICAgIGlmIChmaWVsZHMudGl0bGUgIT09IHVuZGVmaW5lZCkgcm93LnRpdGxlID0gZmllbGRzLnRpdGxlO1xuICAgIGlmIChmaWVsZHMuc291cmNlRmlsZW5hbWUgIT09IHVuZGVmaW5lZCkgcm93LnNvdXJjZV9maWxlbmFtZSA9IGZpZWxkcy5zb3VyY2VGaWxlbmFtZTtcbiAgICBpZiAoZmllbGRzLm1vZGUgIT09IHVuZGVmaW5lZCkgcm93Lm1vZGUgPSBmaWVsZHMubW9kZTtcbiAgICBpZiAoZmllbGRzLm9wdGlvbnMgIT09IHVuZGVmaW5lZCkgcm93Lm9wdGlvbnMgPSBmaWVsZHMub3B0aW9ucztcbiAgICBpZiAoZmllbGRzLnN0YXR1cyAhPT0gdW5kZWZpbmVkKSByb3cuc3RhdHVzID0gZmllbGRzLnN0YXR1cztcbiAgICBpZiAoZmllbGRzLmVycm9yICE9PSB1bmRlZmluZWQpIHJvdy5lcnJvciA9IGZpZWxkcy5lcnJvcjtcbiAgICBpZiAoZmllbGRzLmNyZWF0ZWRBdCAhPT0gdW5kZWZpbmVkKSByb3cuY3JlYXRlZF9hdCA9IGZpZWxkcy5jcmVhdGVkQXQ7XG4gICAgaWYgKGZpZWxkcy50b3RhbFBhZ2VzICE9PSB1bmRlZmluZWQpIHJvdy50b3RhbF9wYWdlcyA9IGZpZWxkcy50b3RhbFBhZ2VzO1xuICAgIGlmIChmaWVsZHMuZXh0cmFjdGVkQ2hhcnMgIT09IHVuZGVmaW5lZCkgcm93LmV4dHJhY3RlZF9jaGFycyA9IGZpZWxkcy5leHRyYWN0ZWRDaGFycztcbiAgICBpZiAoZmllbGRzLnNjcmlwdCAhPT0gdW5kZWZpbmVkKSByb3cuc2NyaXB0ID0gZmllbGRzLnNjcmlwdDtcbiAgICBpZiAoZmllbGRzLmF1ZGlvTWltZVR5cGUgIT09IHVuZGVmaW5lZCkgcm93LmF1ZGlvX21pbWVfdHlwZSA9IGZpZWxkcy5hdWRpb01pbWVUeXBlO1xuICAgIGlmIChmaWVsZHMuZHVyYXRpb25TZWNvbmRzICE9PSB1bmRlZmluZWQpIHJvdy5kdXJhdGlvbl9zZWNvbmRzID0gZmllbGRzLmR1cmF0aW9uU2Vjb25kcztcbiAgICBpZiAoZmllbGRzLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSByb3cucHJvdmlkZXJzID0gZmllbGRzLnByb3ZpZGVycztcbiAgICByZXR1cm4gcm93O1xufVxuY2xhc3MgU3VwYWJhc2VNZXRhIHtcbiAgICBjbGllbnRQcm9taXNlID0gbnVsbDtcbiAgICBjbGllbnQoKSB7XG4gICAgICAgIGlmICghdGhpcy5jbGllbnRQcm9taXNlKSB7XG4gICAgICAgICAgICB0aGlzLmNsaWVudFByb21pc2UgPSBpbXBvcnQoXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIikudGhlbigoeyBjcmVhdGVDbGllbnQgfSk9PmNyZWF0ZUNsaWVudChwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFQ1JFVF9LRVksIHtcbiAgICAgICAgICAgICAgICAgICAgYXV0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVyc2lzdFNlc3Npb246IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50UHJvbWlzZTtcbiAgICB9XG4gICAgYXN5bmMgbGlzdChmaWx0ZXIpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBsZXQgcXVlcnkgPSBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikuc2VsZWN0KFwiKlwiKS5vcmRlcihcImNyZWF0ZWRfYXRcIiwge1xuICAgICAgICAgICAgYXNjZW5kaW5nOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgcXVlcnkgPSBmaWx0ZXIuaW5jbHVkZVVub3duZWQgPyBxdWVyeS5vcihgdXNlcl9pZC5lcS4ke2ZpbHRlci51c2VySWR9LHVzZXJfaWQuaXMubnVsbGApIDogcXVlcnkuZXEoXCJ1c2VyX2lkXCIsIGZpbHRlci51c2VySWQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHF1ZXJ5O1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgZXBpc29kZXMgbGlzdCBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgcmV0dXJuIGRhdGEubWFwKHJvd1RvRXBpc29kZSk7XG4gICAgfVxuICAgIGFzeW5jIGdldChpZCkge1xuICAgICAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oXCJlcGlzb2Rlc1wiKS5zZWxlY3QoXCIqXCIpLmVxKFwiaWRcIiwgaWQpLm1heWJlU2luZ2xlKCk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBlcGlzb2RlIGdldCBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgcmV0dXJuIGRhdGEgPyByb3dUb0VwaXNvZGUoZGF0YSkgOiBudWxsO1xuICAgIH1cbiAgICBhc3luYyBjcmVhdGUoZXBpc29kZSkge1xuICAgICAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oXCJlcGlzb2Rlc1wiKS5pbnNlcnQoZXBpc29kZVRvUm93KGVwaXNvZGUpKTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBuZXcgRXJyb3IoYGVwaXNvZGUgY3JlYXRlIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgIH1cbiAgICBhc3luYyBwYXRjaChpZCwgZmllbGRzKSB7XG4gICAgICAgIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuZnJvbShcImVwaXNvZGVzXCIpLnVwZGF0ZShlcGlzb2RlVG9Sb3coZmllbGRzKSkuZXEoXCJpZFwiLCBpZCkuc2VsZWN0KCkubWF5YmVTaW5nbGUoKTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBuZXcgRXJyb3IoYGVwaXNvZGUgcGF0Y2ggZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIHJldHVybiBkYXRhID8gcm93VG9FcGlzb2RlKGRhdGEpIDogbnVsbDtcbiAgICB9XG4gICAgYXN5bmMgZGVsZXRlKGlkKSB7XG4gICAgICAgIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICAgICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuZnJvbShcImVwaXNvZGVzXCIpLmRlbGV0ZSgpLmVxKFwiaWRcIiwgaWQpO1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgZXBpc29kZSBkZWxldGUgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2xpY2VSYW5nZShkYXRhLCBtaW1lVHlwZSwgcmFuZ2UpIHtcbiAgICBjb25zdCB0b3RhbCA9IGRhdGEuYnl0ZUxlbmd0aDtcbiAgICBjb25zdCBiYXNlID0ge1xuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBtaW1lVHlwZSxcbiAgICAgICAgXCJBY2NlcHQtUmFuZ2VzXCI6IFwiYnl0ZXNcIixcbiAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwicHJpdmF0ZSwgbWF4LWFnZT0zMTUzNjAwMCwgaW1tdXRhYmxlXCJcbiAgICB9O1xuICAgIGNvbnN0IG1hdGNoID0gcmFuZ2UgPyAvYnl0ZXM9KFxcZCopLShcXGQqKS8uZXhlYyhyYW5nZSkgOiBudWxsO1xuICAgIGlmIChtYXRjaCAmJiAobWF0Y2hbMV0gfHwgbWF0Y2hbMl0pKSB7XG4gICAgICAgIGxldCBzdGFydDtcbiAgICAgICAgbGV0IGVuZDtcbiAgICAgICAgaWYgKCFtYXRjaFsxXSkge1xuICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gTWF0aC5taW4ocGFyc2VJbnQobWF0Y2hbMl0sIDEwKSwgdG90YWwpO1xuICAgICAgICAgICAgc3RhcnQgPSB0b3RhbCAtIHN1ZmZpeDtcbiAgICAgICAgICAgIGVuZCA9IHRvdGFsIC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXJ0ID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgICAgIGVuZCA9IG1hdGNoWzJdID8gTWF0aC5taW4ocGFyc2VJbnQobWF0Y2hbMl0sIDEwKSwgdG90YWwgLSAxKSA6IHRvdGFsIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnQgPD0gZW5kICYmIHN0YXJ0IDwgdG90YWwpIHtcbiAgICAgICAgICAgIGNvbnN0IGNodW5rID0gZGF0YS5zbGljZShzdGFydCwgZW5kICsgMSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1czogMjA2LFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uYmFzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJDb250ZW50LVJhbmdlXCI6IGBieXRlcyAke3N0YXJ0fS0ke2VuZH0vJHt0b3RhbH1gLFxuICAgICAgICAgICAgICAgICAgICBcIkNvbnRlbnQtTGVuZ3RoXCI6IFN0cmluZyhjaHVuay5ieXRlTGVuZ3RoKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYm9keTogY2h1bmtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXR1czogNDE2LFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIFwiQWNjZXB0LVJhbmdlc1wiOiBcImJ5dGVzXCIsXG4gICAgICAgICAgICAgICAgXCJDb250ZW50LVJhbmdlXCI6IGBieXRlcyAqLyR7dG90YWx9YFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IG5ldyBVaW50OEFycmF5KDApXG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAuLi5iYXNlLFxuICAgICAgICAgICAgXCJDb250ZW50LUxlbmd0aFwiOiBTdHJpbmcodG90YWwpXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IGRhdGFcbiAgICB9O1xufVxuY2xhc3MgRnNCaW5hcnkge1xuICAgIHJvb3Q7XG4gICAgY29uc3RydWN0b3Iocm9vdCl7XG4gICAgICAgIHRoaXMucm9vdCA9IHJvb3Q7XG4gICAgfVxuICAgIGFzeW5jIGRpcihzdWIpIHtcbiAgICAgICAgY29uc3QgcCA9IHBhdGguam9pbih0aGlzLnJvb3QsIHN1Yik7XG4gICAgICAgIGF3YWl0IGZzLm1rZGlyKHAsIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVTb3VyY2UoaWQsIGRhdGEpIHtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHBhdGguam9pbihhd2FpdCB0aGlzLmRpcihcInNvdXJjZXNcIiksIGAke2lkfS5wZGZgKSwgZGF0YSk7XG4gICAgfVxuICAgIGFzeW5jIGdldFNvdXJjZShpZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbih0aGlzLnJvb3QsIFwic291cmNlc1wiLCBgJHtpZH0ucGRmYCkpKTtcbiAgICAgICAgfSBjYXRjaCAge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgc2F2ZUF1ZGlvKGlkLCBkYXRhLCBtaW1lVHlwZSkge1xuICAgICAgICBjb25zdCBleHQgPSBBVURJT19FWFRbbWltZVR5cGVdID8/IFwiYmluXCI7XG4gICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShwYXRoLmpvaW4oYXdhaXQgdGhpcy5kaXIoXCJhdWRpb1wiKSwgYCR7aWR9LiR7ZXh0fWApLCBkYXRhKTtcbiAgICB9XG4gICAgYXN5bmMgb3BlbkF1ZGlvKGlkLCBtaW1lVHlwZSwgcmFuZ2UpIHtcbiAgICAgICAgY29uc3QgZXh0ID0gQVVESU9fRVhUW21pbWVUeXBlXSA/PyBcImJpblwiO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbih0aGlzLnJvb3QsIFwiYXVkaW9cIiwgYCR7aWR9LiR7ZXh0fWApKSk7XG4gICAgICAgICAgICByZXR1cm4gc2xpY2VSYW5nZShkYXRhLCBtaW1lVHlwZSwgcmFuZ2UpO1xuICAgICAgICB9IGNhdGNoICB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBkZWxldGUoaWQsIG1pbWVUeXBlKSB7XG4gICAgICAgIGF3YWl0IGZzLnJtKHBhdGguam9pbih0aGlzLnJvb3QsIFwic291cmNlc1wiLCBgJHtpZH0ucGRmYCksIHtcbiAgICAgICAgICAgIGZvcmNlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBleHRzID0gbWltZVR5cGUgPyBbXG4gICAgICAgICAgICBBVURJT19FWFRbbWltZVR5cGVdID8/IFwiYmluXCJcbiAgICAgICAgXSA6IE9iamVjdC52YWx1ZXMoQVVESU9fRVhUKTtcbiAgICAgICAgZm9yIChjb25zdCBleHQgb2YgZXh0cyl7XG4gICAgICAgICAgICBhd2FpdCBmcy5ybShwYXRoLmpvaW4odGhpcy5yb290LCBcImF1ZGlvXCIsIGAke2lkfS4ke2V4dH1gKSwge1xuICAgICAgICAgICAgICAgIGZvcmNlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmNsYXNzIEJsb2JCaW5hcnkge1xuICAgIGJsb2IoKSB7XG4gICAgICAgIHJldHVybiBpbXBvcnQoXCJAdmVyY2VsL2Jsb2JcIik7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVTb3VyY2UoaWQsIGRhdGEpIHtcbiAgICAgICAgY29uc3QgeyBwdXQgfSA9IGF3YWl0IHRoaXMuYmxvYigpO1xuICAgICAgICBhd2FpdCBwdXQoYHNvdXJjZXMvJHtpZH0ucGRmYCwgQnVmZmVyLmZyb20oZGF0YSksIHtcbiAgICAgICAgICAgIGFjY2VzczogXCJwcml2YXRlXCIsXG4gICAgICAgICAgICBhZGRSYW5kb21TdWZmaXg6IGZhbHNlLFxuICAgICAgICAgICAgYWxsb3dPdmVyd3JpdGU6IHRydWUsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9wZGZcIlxuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0U291cmNlKGlkKSB7XG4gICAgICAgIGNvbnN0IHsgZ2V0IH0gPSBhd2FpdCB0aGlzLmJsb2IoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZ2V0KGBzb3VyY2VzLyR7aWR9LnBkZmAsIHtcbiAgICAgICAgICAgIGFjY2VzczogXCJwcml2YXRlXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghcmVzdWx0Py5zdHJlYW0pIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgbmV3IFJlc3BvbnNlKHJlc3VsdC5zdHJlYW0pLmFycmF5QnVmZmVyKCkpO1xuICAgIH1cbiAgICBhc3luYyBzYXZlQXVkaW8oaWQsIGRhdGEsIG1pbWVUeXBlKSB7XG4gICAgICAgIGNvbnN0IHsgcHV0IH0gPSBhd2FpdCB0aGlzLmJsb2IoKTtcbiAgICAgICAgY29uc3QgZXh0ID0gQVVESU9fRVhUW21pbWVUeXBlXSA/PyBcImJpblwiO1xuICAgICAgICBhd2FpdCBwdXQoYGF1ZGlvLyR7aWR9LiR7ZXh0fWAsIEJ1ZmZlci5mcm9tKGRhdGEpLCB7XG4gICAgICAgICAgICBhY2Nlc3M6IFwicHJpdmF0ZVwiLFxuICAgICAgICAgICAgYWRkUmFuZG9tU3VmZml4OiBmYWxzZSxcbiAgICAgICAgICAgIGFsbG93T3ZlcndyaXRlOiB0cnVlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IG1pbWVUeXBlXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBvcGVuQXVkaW8oaWQsIG1pbWVUeXBlLCByYW5nZSkge1xuICAgICAgICBjb25zdCB7IGdldCB9ID0gYXdhaXQgdGhpcy5ibG9iKCk7XG4gICAgICAgIGNvbnN0IGV4dCA9IEFVRElPX0VYVFttaW1lVHlwZV0gPz8gXCJiaW5cIjtcbiAgICAgICAgLy8gUGFzcyB0aGUgY2xpZW50J3MgUmFuZ2UgdGhyb3VnaCB0byBvcmlnaW4gc28gd2Ugc3RyZWFtIHBhcnRpYWwgY29udGVudFxuICAgICAgICAvLyB3aXRob3V0IGJ1ZmZlcmluZyB0aGUgd2hvbGUgZmlsZSBpbiB0aGUgZnVuY3Rpb24uXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdldChgYXVkaW8vJHtpZH0uJHtleHR9YCwge1xuICAgICAgICAgICAgYWNjZXNzOiBcInByaXZhdGVcIixcbiAgICAgICAgICAgIC4uLnJhbmdlID8ge1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgUmFuZ2U6IHJhbmdlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSA6IHt9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXJlc3VsdD8uc3RyZWFtKSByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3Qgc3JjID0gcmVzdWx0LmhlYWRlcnM7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBzcmMuZ2V0KFwiY29udGVudC10eXBlXCIpID8/IG1pbWVUeXBlLFxuICAgICAgICAgICAgXCJBY2NlcHQtUmFuZ2VzXCI6IFwiYnl0ZXNcIixcbiAgICAgICAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcInByaXZhdGUsIG1heC1hZ2U9MzE1MzYwMDAsIGltbXV0YWJsZVwiXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGNvbnRlbnRSYW5nZSA9IHNyYy5nZXQoXCJjb250ZW50LXJhbmdlXCIpO1xuICAgICAgICBjb25zdCBjb250ZW50TGVuZ3RoID0gc3JjLmdldChcImNvbnRlbnQtbGVuZ3RoXCIpO1xuICAgICAgICBpZiAoY29udGVudFJhbmdlKSBoZWFkZXJzW1wiQ29udGVudC1SYW5nZVwiXSA9IGNvbnRlbnRSYW5nZTtcbiAgICAgICAgaWYgKGNvbnRlbnRMZW5ndGgpIGhlYWRlcnNbXCJDb250ZW50LUxlbmd0aFwiXSA9IGNvbnRlbnRMZW5ndGg7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXM6IHJhbmdlICYmIGNvbnRlbnRSYW5nZSA/IDIwNiA6IDIwMCxcbiAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICBib2R5OiByZXN1bHQuc3RyZWFtXG4gICAgICAgIH07XG4gICAgfVxuICAgIGFzeW5jIGRlbGV0ZShpZCwgbWltZVR5cGUpIHtcbiAgICAgICAgY29uc3QgeyBsaXN0LCBkZWwgfSA9IGF3YWl0IHRoaXMuYmxvYigpO1xuICAgICAgICBjb25zdCBleHRzID0gbWltZVR5cGUgPyBbXG4gICAgICAgICAgICBBVURJT19FWFRbbWltZVR5cGVdID8/IFwiYmluXCJcbiAgICAgICAgXSA6IE9iamVjdC52YWx1ZXMoQVVESU9fRVhUKTtcbiAgICAgICAgY29uc3QgcHJlZml4ZXMgPSBbXG4gICAgICAgICAgICBgc291cmNlcy8ke2lkfS5wZGZgLFxuICAgICAgICAgICAgLi4uZXh0cy5tYXAoKGV4dCk9PmBhdWRpby8ke2lkfS4ke2V4dH1gKVxuICAgICAgICBdO1xuICAgICAgICBmb3IgKGNvbnN0IHByZWZpeCBvZiBwcmVmaXhlcyl7XG4gICAgICAgICAgICBjb25zdCB7IGJsb2JzIH0gPSBhd2FpdCBsaXN0KHtcbiAgICAgICAgICAgICAgICBwcmVmaXhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGJsb2JzLmxlbmd0aCA+IDApIGF3YWl0IGRlbChibG9icy5tYXAoKGIpPT5iLnVybCkpO1xuICAgICAgICB9XG4gICAgfVxufVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBDb21wb3NpdGVTdG9yZSB7XG4gICAgbWV0YTtcbiAgICBiaW5hcnk7XG4gICAgY29uc3RydWN0b3IobWV0YSwgYmluYXJ5KXtcbiAgICAgICAgdGhpcy5tZXRhID0gbWV0YTtcbiAgICAgICAgdGhpcy5iaW5hcnkgPSBiaW5hcnk7XG4gICAgfVxuICAgIGxpc3QoZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEubGlzdChmaWx0ZXIpO1xuICAgIH1cbiAgICBnZXQoaWQpIHtcbiAgICAgICAgYXNzZXJ0SWQoaWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5tZXRhLmdldChpZCk7XG4gICAgfVxuICAgIGNyZWF0ZShlcGlzb2RlKSB7XG4gICAgICAgIGFzc2VydElkKGVwaXNvZGUuaWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5tZXRhLmNyZWF0ZShlcGlzb2RlKTtcbiAgICB9XG4gICAgcGF0Y2goaWQsIGZpZWxkcykge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEucGF0Y2goaWQsIGZpZWxkcyk7XG4gICAgfVxuICAgIGFzeW5jIGRlbGV0ZShpZCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIGNvbnN0IGVwaXNvZGUgPSBhd2FpdCB0aGlzLm1ldGEuZ2V0KGlkKTtcbiAgICAgICAgYXdhaXQgdGhpcy5tZXRhLmRlbGV0ZShpZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYmluYXJ5LmRlbGV0ZShpZCwgZXBpc29kZT8uYXVkaW9NaW1lVHlwZSk7XG4gICAgfVxuICAgIHNhdmVTb3VyY2UoaWQsIGRhdGEpIHtcbiAgICAgICAgYXNzZXJ0SWQoaWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5iaW5hcnkuc2F2ZVNvdXJjZShpZCwgZGF0YSk7XG4gICAgfVxuICAgIGdldFNvdXJjZShpZCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLmJpbmFyeS5nZXRTb3VyY2UoaWQpO1xuICAgIH1cbiAgICBzYXZlQXVkaW8oaWQsIGRhdGEsIG1pbWVUeXBlKSB7XG4gICAgICAgIGFzc2VydElkKGlkKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmluYXJ5LnNhdmVBdWRpbyhpZCwgZGF0YSwgbWltZVR5cGUpO1xuICAgIH1cbiAgICBhc3luYyBvcGVuQXVkaW8oaWQsIHJhbmdlKSB7XG4gICAgICAgIGFzc2VydElkKGlkKTtcbiAgICAgICAgY29uc3QgZXBpc29kZSA9IGF3YWl0IHRoaXMubWV0YS5nZXQoaWQpO1xuICAgICAgICBpZiAoIWVwaXNvZGUpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gdGhpcy5iaW5hcnkub3BlbkF1ZGlvKGlkLCBlcGlzb2RlLmF1ZGlvTWltZVR5cGUgPz8gXCJhdWRpby93YXZcIiwgcmFuZ2UpO1xuICAgIH1cbn1cbmxldCBzdG9yZSA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RvcmUoKSB7XG4gICAgaWYgKCFzdG9yZSkge1xuICAgICAgICBjb25zdCBoYXNTdXBhYmFzZSA9IEJvb2xlYW4ocHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMICYmIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFQ1JFVF9LRVkpO1xuICAgICAgICBjb25zdCBoYXNCbG9iID0gQm9vbGVhbihwcm9jZXNzLmVudi5CTE9CX1JFQURfV1JJVEVfVE9LRU4pO1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuVkVSQ0VMICYmICghaGFzU3VwYWJhc2UgfHwgIWhhc0Jsb2IpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm9kdWN0aW9uIHJlcXVpcmVzIFNVUEFCQVNFX1VSTCArIFNVUEFCQVNFX1NFQ1JFVF9LRVkgYW5kIEJMT0JfUkVBRF9XUklURV9UT0tFTjsgdGhlIGZpbGVzeXN0ZW0gZmFsbGJhY2sgZG9lcyBub3Qgd29yayBvbiBWZXJjZWwuXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGFSb290ID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIFwiLmRhdGFcIik7XG4gICAgICAgIHN0b3JlID0gbmV3IENvbXBvc2l0ZVN0b3JlKGhhc1N1cGFiYXNlID8gbmV3IFN1cGFiYXNlTWV0YSgpIDogbmV3IEZzTWV0YShwYXRoLmpvaW4oZGF0YVJvb3QsIFwiZXBpc29kZXNcIikpLCBoYXNCbG9iID8gbmV3IEJsb2JCaW5hcnkoKSA6IG5ldyBGc0JpbmFyeShkYXRhUm9vdCkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RvcmU7XG59XG4iLCAiaW1wb3J0IHsgZXh0cmFjdFRleHQsIGdldERvY3VtZW50UHJveHkgfSBmcm9tIFwidW5wZGZcIjtcbmV4cG9ydCBjb25zdCBNQVhfUERGX0JZVEVTID0gNCAqIDEwMjQgKiAxMDI0O1xuLyoqIFNpemUvdHlwZSBnYXRlIGZvciBhbiB1cGxvYWRlZCBmaWxlLCBiZWZvcmUgaXQgaXMgcmVhZCBpbnRvIG1lbW9yeS4gKi8gZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUGRmRmlsZShmaWxlKSB7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIEZpbGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgICAgIGVycm9yOiBcIlVwbG9hZCBhIFBERiBpbiB0aGUgJ2ZpbGUnIGZpZWxkXCJcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGZpbGUuc2l6ZSA+IE1BWF9QREZfQllURVMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXR1czogNDEzLFxuICAgICAgICAgICAgZXJyb3I6IFwiUERGIGlzIHRvbyBsYXJnZSAoNCBNQiBtYXgpXCJcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IHRydWUsXG4gICAgICAgIGZpbGVcbiAgICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGxvb2tzTGlrZVBkZihkYXRhLCBmaWxlbmFtZSkge1xuICAgIGNvbnN0IG1hZ2ljID0gZGF0YS5sZW5ndGggPiA0ICYmIGRhdGFbMF0gPT09IDB4MjUgJiYgZGF0YVsxXSA9PT0gMHg1MCAmJiBkYXRhWzJdID09PSAweDQ0ICYmIGRhdGFbM10gPT09IDB4NDY7XG4gICAgcmV0dXJuIG1hZ2ljIHx8IGZpbGVuYW1lLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoXCIucGRmXCIpO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQZGZUZXh0KGRhdGEpIHtcbiAgICBjb25zdCBwZGYgPSBhd2FpdCBnZXREb2N1bWVudFByb3h5KGRhdGEpO1xuICAgIGNvbnN0IHsgdG90YWxQYWdlcywgdGV4dCB9ID0gYXdhaXQgZXh0cmFjdFRleHQocGRmLCB7XG4gICAgICAgIG1lcmdlUGFnZXM6IHRydWVcbiAgICB9KTtcbiAgICBjb25zdCBjbGVhbmVkID0gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHRleHQgY291bGQgYmUgZXh0cmFjdGVkIGZyb20gdGhpcyBQREYuIEl0IG1heSBiZSBhIHNjYW5uZWQgZG9jdW1lbnQgd2l0aG91dCBhIHRleHQgbGF5ZXIuXCIpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICB0b3RhbFBhZ2VzXG4gICAgfTtcbn1cbiIsICIvLyBDdXJhdGVkLCBBUEktdmFsaWRhdGVkIEdlbWluaSBwcmVidWlsdCB2b2ljZXMuXG5leHBvcnQgY29uc3QgVk9JQ0VTID0gW1xuICAgIHtcbiAgICAgICAgaWQ6IFwiS29yZVwiLFxuICAgICAgICBsYWJlbDogXCJLb3JlXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkZpcm0sIGNsZWFyXCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiUHVja1wiLFxuICAgICAgICBsYWJlbDogXCJQdWNrXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlVwYmVhdCwgbGl2ZWx5XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiRW5jZWxhZHVzXCIsXG4gICAgICAgIGxhYmVsOiBcIkVuY2VsYWR1c1wiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTb2Z0LCBicmVhdGh5XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiQ2hhcm9uXCIsXG4gICAgICAgIGxhYmVsOiBcIkNoYXJvblwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJEZWVwLCBpbmZvcm1hdGl2ZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiBcIkFvZWRlXCIsXG4gICAgICAgIGxhYmVsOiBcIkFvZWRlXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkJyZWV6eSwgd2FybVwiXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiBcIkxlZGFcIixcbiAgICAgICAgbGFiZWw6IFwiTGVkYVwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJZb3V0aGZ1bCwgYnJpZ2h0XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiWmVwaHlyXCIsXG4gICAgICAgIGxhYmVsOiBcIlplcGh5clwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJCcmlnaHQsIGNyaXNwXCJcbiAgICB9XG5dO1xuY29uc3QgVk9JQ0VfSURTID0gbmV3IFNldChWT0lDRVMubWFwKCh2KT0+di5pZCkpO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfSE9TVF9WT0lDRSA9IFwiS29yZVwiO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfR1VFU1RfVk9JQ0UgPSBcIlB1Y2tcIjtcbmV4cG9ydCBjb25zdCBERUZBVUxUX1JFQURFUl9WT0lDRSA9IFwiRW5jZWxhZHVzXCI7XG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZFZvaWNlKGlkKSB7XG4gICAgcmV0dXJuIFZPSUNFX0lEUy5oYXMoaWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVZvaWNlKGlkLCBmYWxsYmFjaykge1xuICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwic3RyaW5nXCIgJiYgVk9JQ0VfSURTLmhhcyhpZCkgPyBpZCA6IGZhbGxiYWNrO1xufVxuIiwgImltcG9ydCB7IERFRkFVTFRfR1VFU1RfVk9JQ0UsIERFRkFVTFRfSE9TVF9WT0lDRSwgREVGQVVMVF9SRUFERVJfVk9JQ0UsIG5vcm1hbGl6ZVZvaWNlIH0gZnJvbSBcIi4vdm9pY2VzXCI7XG5jb25zdCBMRU5HVEhTID0gW1xuICAgIFwic2hvcnRcIixcbiAgICBcInN0YW5kYXJkXCIsXG4gICAgXCJkZWVwXCJcbl07XG5jb25zdCBGT1JNQVRTID0gW1xuICAgIFwiZGlzY3Vzc2lvblwiLFxuICAgIFwiYnJpZWZcIixcbiAgICBcImRlYmF0ZVwiLFxuICAgIFwibGVjdHVyZVwiXG5dO1xuY29uc3QgQVVESUVOQ0VTID0gW1xuICAgIFwiYmVnaW5uZXJcIixcbiAgICBcImV4cGVydFwiXG5dO1xuLy8gU2luZ2xlLXZvaWNlIGNvbnZlcnNhdGlvbiBmb3JtYXRzIHNwZWFrIG9ubHkgaW4gdGhlIGhvc3Qgdm9pY2UuXG5leHBvcnQgY29uc3QgU0lOR0xFX1ZPSUNFX0ZPUk1BVFMgPSBbXG4gICAgXCJicmllZlwiLFxuICAgIFwibGVjdHVyZVwiXG5dO1xuZXhwb3J0IGNvbnN0IExFTkdUSF9CVURHRVRTID0ge1xuICAgIHNob3J0OiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiAyXzAwMCxcbiAgICAgICAgcmVhZENoYXJzOiAzMF8wMDAsXG4gICAgICAgIGFwcHJveE1pbnV0ZXM6IDNcbiAgICB9LFxuICAgIHN0YW5kYXJkOiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiA0XzUwMCxcbiAgICAgICAgcmVhZENoYXJzOiAxMDBfMDAwLFxuICAgICAgICBhcHByb3hNaW51dGVzOiA3XG4gICAgfSxcbiAgICBkZWVwOiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiA5XzAwMCxcbiAgICAgICAgcmVhZENoYXJzOiAyMDBfMDAwLFxuICAgICAgICBhcHByb3hNaW51dGVzOiAxNVxuICAgIH1cbn07XG5mdW5jdGlvbiBwaWNrKHZhbHVlLCBhbGxvd2VkLCBmYWxsYmFjaykge1xuICAgIHJldHVybiBhbGxvd2VkLmluY2x1ZGVzKHZhbHVlKSA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG4vKiogVmFsaWRhdGVzL25vcm1hbGl6ZXMgdW50cnVzdGVkIG9wdGlvbiBpbnB1dCBpbnRvIGEgY29tcGxldGUgRXBpc29kZU9wdGlvbnMuICovIGV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVPcHRpb25zKGlucHV0KSB7XG4gICAgY29uc3QgbyA9IGlucHV0ID8/IHt9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGxlbmd0aDogcGljayhvLmxlbmd0aCwgTEVOR1RIUywgXCJzdGFuZGFyZFwiKSxcbiAgICAgICAgZm9ybWF0OiBwaWNrKG8uZm9ybWF0LCBGT1JNQVRTLCBcImRpc2N1c3Npb25cIiksXG4gICAgICAgIGF1ZGllbmNlOiBwaWNrKG8uYXVkaWVuY2UsIEFVRElFTkNFUywgXCJiZWdpbm5lclwiKSxcbiAgICAgICAgaG9zdFZvaWNlOiBub3JtYWxpemVWb2ljZShvLmhvc3RWb2ljZSwgREVGQVVMVF9IT1NUX1ZPSUNFKSxcbiAgICAgICAgZ3Vlc3RWb2ljZTogbm9ybWFsaXplVm9pY2Uoby5ndWVzdFZvaWNlLCBERUZBVUxUX0dVRVNUX1ZPSUNFKSxcbiAgICAgICAgcmVhZGVyVm9pY2U6IG5vcm1hbGl6ZVZvaWNlKG8ucmVhZGVyVm9pY2UsIERFRkFVTFRfUkVBREVSX1ZPSUNFKSxcbiAgICAgICAgcmV2aWV3U2NyaXB0OiBvLnJldmlld1NjcmlwdCA9PT0gdHJ1ZVxuICAgIH07XG59XG5jb25zdCBNQVhfU0NSSVBUX0xJTkVTID0gNjAwO1xuY29uc3QgTUFYX0xJTkVfQ0hBUlMgPSA1XzAwMDtcbi8vIFZhbGlkYXRlcyBhIHVzZXItZWRpdGVkIHNjcmlwdCBhbmQgY2FwcyB0b3RhbCBsZW5ndGggdG8gdGhlIHRpZXIgdGhlIHVzZXJcbi8vIGFscmVhZHkgcGFpZCBmb3IsIHNvIGVkaXRpbmcgY2FuJ3QgaW5mbGF0ZSBUVFMgY29zdCBiZXlvbmQgdGhlIHF1b3RlLlxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRWRpdGVkU2NyaXB0KGlucHV0LCBtb2RlLCBsZW5ndGgpIHtcbiAgICBjb25zdCByYXcgPSBpbnB1dDtcbiAgICBpZiAoIXJhdyB8fCAhQXJyYXkuaXNBcnJheShyYXcubGluZXMpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogXCJTY3JpcHQgbXVzdCBoYXZlIGEgbGluZXMgYXJyYXlcIlxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAocmF3LmxpbmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IFwiU2NyaXB0IGNhbm5vdCBiZSBlbXB0eVwiXG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChyYXcubGluZXMubGVuZ3RoID4gTUFYX1NDUklQVF9MSU5FUykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGBUb28gbWFueSBsaW5lcyAobWF4ICR7TUFYX1NDUklQVF9MSU5FU30pYFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBsaW5lcyA9IFtdO1xuICAgIGxldCB0b3RhbCA9IDA7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiByYXcubGluZXMpe1xuICAgICAgICBjb25zdCBsaW5lID0gZW50cnk7XG4gICAgICAgIGlmIChsaW5lLnNwZWFrZXIgIT09IFwiSE9TVFwiICYmIGxpbmUuc3BlYWtlciAhPT0gXCJHVUVTVFwiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogXCJFYWNoIGxpbmUgbmVlZHMgc3BlYWtlciBIT1NUIG9yIEdVRVNUXCJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBsaW5lLnRleHQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBcIkVhY2ggbGluZSBuZWVkcyB0ZXh0XCJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGxpbmUudGV4dC50cmltKCk7XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkgY29udGludWU7XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IE1BWF9MSU5FX0NIQVJTKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogXCJBIGxpbmUgaXMgdG9vIGxvbmdcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB0b3RhbCArPSB0ZXh0Lmxlbmd0aDtcbiAgICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgICAgICBzcGVha2VyOiBsaW5lLnNwZWFrZXIsXG4gICAgICAgICAgICB0ZXh0XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAobGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogXCJTY3JpcHQgY2Fubm90IGJlIGVtcHR5XCJcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgYnVkZ2V0ID0gTWF0aC5yb3VuZCgobW9kZSA9PT0gXCJyZWFkaW5nXCIgPyBMRU5HVEhfQlVER0VUU1tsZW5ndGhdLnJlYWRDaGFycyA6IExFTkdUSF9CVURHRVRTW2xlbmd0aF0uc2NyaXB0Q2hhcnMpICogMS4yNSk7XG4gICAgaWYgKHRvdGFsID4gYnVkZ2V0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogYEVkaXRlZCBzY3JpcHQgaXMgdG9vIGxvbmcgZm9yIHRoZSAke2xlbmd0aH0gbGVuZ3RoIHlvdSBjaG9zZWBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgdGl0bGUgPSB0eXBlb2YgcmF3LnRpdGxlID09PSBcInN0cmluZ1wiICYmIHJhdy50aXRsZS50cmltKCkgPyByYXcudGl0bGUudHJpbSgpLnNsaWNlKDAsIDIwMCkgOiBcIlVudGl0bGVkIGVwaXNvZGVcIjtcbiAgICByZXR1cm4ge1xuICAgICAgICBvazogdHJ1ZSxcbiAgICAgICAgc2NyaXB0OiB7XG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIGxpbmVzXG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzU2luZ2xlVm9pY2VGb3JtYXQoZm9ybWF0KSB7XG4gICAgcmV0dXJuIFNJTkdMRV9WT0lDRV9GT1JNQVRTLmluY2x1ZGVzKGZvcm1hdCk7XG59XG4vKiogVGhlIGNoYXJhY3RlciBidWRnZXQgdGhhdCBkcml2ZXMgY3JlZGl0IGNvc3QgZm9yIGEgZ2l2ZW4gbW9kZSArIGxlbmd0aC4gKi8gZXhwb3J0IGZ1bmN0aW9uIHJlYWRDaGFyQnVkZ2V0KG1vZGUsIGxlbmd0aCkge1xuICAgIHJldHVybiBtb2RlID09PSBcInJlYWRpbmdcIiA/IExFTkdUSF9CVURHRVRTW2xlbmd0aF0ucmVhZENoYXJzIDogTEVOR1RIX0JVREdFVFNbbGVuZ3RoXS5zY3JpcHRDaGFycztcbn1cbiIsICJpbXBvcnQgeyB6IH0gZnJvbSBcInpvZFwiO1xuaW1wb3J0IHsgaXNTaW5nbGVWb2ljZUZvcm1hdCwgTEVOR1RIX0JVREdFVFMgfSBmcm9tIFwiLi4vb3B0aW9uc1wiO1xuY29uc3QgTUFYX1NPVVJDRV9DSEFSUyA9IDIwMF8wMDA7XG5jb25zdCBzY3JpcHRTY2hlbWEgPSB6Lm9iamVjdCh7XG4gICAgdGl0bGU6IHouc3RyaW5nKCkuZGVzY3JpYmUoXCJBIHNob3J0LCBjYXRjaHkgZXBpc29kZSB0aXRsZSBiYXNlZCBvbiB0aGUgZG9jdW1lbnRcIiksXG4gICAgbGluZXM6IHouYXJyYXkoei5vYmplY3Qoe1xuICAgICAgICBzcGVha2VyOiB6LmVudW0oW1xuICAgICAgICAgICAgXCJIT1NUXCIsXG4gICAgICAgICAgICBcIkdVRVNUXCJcbiAgICAgICAgXSksXG4gICAgICAgIHRleHQ6IHouc3RyaW5nKClcbiAgICB9KSkuZGVzY3JpYmUoXCJUaGUgZGlhbG9ndWUsIGFsdGVybmF0aW5nIG5hdHVyYWxseSBiZXR3ZWVuIHNwZWFrZXJzXCIpXG59KTtcbmNvbnN0IEZPUk1BVF9CUklFRiA9IHtcbiAgICBkaXNjdXNzaW9uOiBcImEgbmF0dXJhbCB0d28tcGVyc29uIGNvbnZlcnNhdGlvbiBiZXR3ZWVuIEhPU1QgKGN1cmlvdXMsIGFza3Mgc2hhcnAgcXVlc3Rpb25zKSBhbmQgR1VFU1QgKGFuIGV4cGVydCB3aG8gZXhwbGFpbnMgdml2aWRseSB3aXRoIGFuYWxvZ2llcykuIFNob3J0IHR1cm5zLCByZWFsIHJlYWN0aW9ucywgbm8gbGlzdHMuXCIsXG4gICAgYnJpZWY6IFwiYSB0aWdodCBzb2xvIGJyaWVmaW5nIGRlbGl2ZXJlZCBlbnRpcmVseSBieSBIT1NUIFx1MjAxNCBhIHNpbmdsZSBjb25maWRlbnQgbmFycmF0b3Igc3VtbWFyaXppbmcgdGhlIGVzc2VudGlhbHMuIEV2ZXJ5IGxpbmUgdXNlcyBzcGVha2VyIEhPU1QuIE5vIHNlY29uZCBzcGVha2VyLlwiLFxuICAgIGRlYmF0ZTogXCJhIGxpdmVseSBkZWJhdGUgYmV0d2VlbiBIT1NUIGFuZCBHVUVTVCB3aG8gdGFrZSBvcHBvc2luZyBwb3NpdGlvbnMgb24gdGhlIGRvY3VtZW50J3Mga2V5IGNsYWltcywgZWFjaCBtYWtpbmcgdGhlaXIgc3Ryb25nZXN0IGNhc2UgYW5kIHJlYnV0dGluZyB0aGUgb3RoZXIuIEtlZXAgaXQgc2hhcnAgYnV0IGZhaXIuXCIsXG4gICAgbGVjdHVyZTogXCJhbiBpbi1kZXB0aCBleHBlcnQgbGVjdHVyZSBkZWxpdmVyZWQgZW50aXJlbHkgYnkgSE9TVCBcdTIwMTQgYSBrbm93bGVkZ2VhYmxlIHRlYWNoZXIgd2Fsa2luZyB0aHJvdWdoIHRoZSBtYXRlcmlhbCB3aXRoIHJpZ29yIGFuZCBzdHJ1Y3R1cmUsIHRoZSBkZXB0aCBvZiBhbiA4MCwwMDAgSG91cnMgYnJpZWZpbmcuIEV2ZXJ5IGxpbmUgdXNlcyBzcGVha2VyIEhPU1QuIE5vIHNlY29uZCBzcGVha2VyLlwiXG59O1xuZnVuY3Rpb24gc3lzdGVtUHJvbXB0KG9wdGlvbnMpIHtcbiAgICBjb25zdCBidWRnZXQgPSBMRU5HVEhfQlVER0VUU1tvcHRpb25zLmxlbmd0aF07XG4gICAgY29uc3QgYXVkaWVuY2UgPSBvcHRpb25zLmF1ZGllbmNlID09PSBcImV4cGVydFwiID8gXCJBc3N1bWUgYW4gZXhwZXJ0IGxpc3RlbmVyOyB1c2UgcHJlY2lzZSB0ZXJtaW5vbG9neSBhbmQgZ28gZGVlcC5cIiA6IFwiQXNzdW1lIGEgY3VyaW91cyBuZXdjb21lcjsgZXhwbGFpbiBqYXJnb24gaW4gcGxhaW4gbGFuZ3VhZ2UuXCI7XG4gICAgcmV0dXJuIGBZb3UgYXJlIGEgd29ybGQtY2xhc3MgcG9kY2FzdCBwcm9kdWNlci4gVHVybiBkb2N1bWVudHMgaW50byAke0ZPUk1BVF9CUklFRltvcHRpb25zLmZvcm1hdF19XG5cblJ1bGVzOlxuLSBPcGVuIGJ5IHdlbGNvbWluZyBsaXN0ZW5lcnMgYW5kIG5hbWluZyB0aGUgdG9waWMgaW4gb25lIG9yIHR3byBzZW50ZW5jZXMuXG4tIENvdmVyIHRoZSBkb2N1bWVudCdzIG1vc3QgaW1wb3J0YW50IGlkZWFzIGFjY3VyYXRlbHk7IGRvIG5vdCBpbnZlbnQgZmFjdHMuXG4tICR7YXVkaWVuY2V9XG4tIENsb3NlIHdpdGggdGhlIHNpbmdsZSBiaWdnZXN0IHRha2Vhd2F5IGFuZCBhIHNpZ24tb2ZmLlxuLSBUb3RhbCBzcG9rZW4gdGV4dCBtdXN0IHN0YXkgdW5kZXIgJHtidWRnZXQuc2NyaXB0Q2hhcnN9IGNoYXJhY3RlcnMgKGFib3V0ICR7YnVkZ2V0LmFwcHJveE1pbnV0ZXN9IG1pbnV0ZXMpLmA7XG59XG5sZXQgc2NyaXB0RmVsbEJhY2sgPSBmYWxzZTtcbmV4cG9ydCBmdW5jdGlvbiBzY3JpcHRQcm92aWRlck5hbWUoKSB7XG4gICAgaWYgKHNjcmlwdEZlbGxCYWNrKSByZXR1cm4gXCJtb2NrIChnYXRld2F5IHVuYXZhaWxhYmxlKVwiO1xuICAgIHJldHVybiBoYXNTY3JpcHRDcmVkZW50aWFscygpID8gcHJvY2Vzcy5lbnYuUE9EQ0FTVF9TQ1JJUFRfTU9ERUwgPz8gXCJhbnRocm9waWMvY2xhdWRlLXNvbm5ldC01XCIgOiBcIm1vY2tcIjtcbn1cbmZ1bmN0aW9uIGhhc1NjcmlwdENyZWRlbnRpYWxzKCkge1xuICAgIHJldHVybiBCb29sZWFuKHByb2Nlc3MuZW52LkFJX0dBVEVXQVlfQVBJX0tFWSB8fCBwcm9jZXNzLmVudi5WRVJDRUxfT0lEQ19UT0tFTiB8fCBwcm9jZXNzLmVudi5WRVJDRUwpO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUG9kY2FzdFNjcmlwdChzb3VyY2VUZXh0LCBzb3VyY2VGaWxlbmFtZSwgb3B0aW9ucykge1xuICAgIGNvbnN0IHRleHQgPSBzb3VyY2VUZXh0LnNsaWNlKDAsIE1BWF9TT1VSQ0VfQ0hBUlMpO1xuICAgIGlmICghaGFzU2NyaXB0Q3JlZGVudGlhbHMoKSkge1xuICAgICAgICByZXR1cm4gbW9ja1NjcmlwdCh0ZXh0LCBzb3VyY2VGaWxlbmFtZSwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgZ2VuZXJhdGVUZXh0LCBPdXRwdXQgfSA9IGF3YWl0IGltcG9ydChcImFpXCIpO1xuICAgICAgICBjb25zdCB7IG91dHB1dCB9ID0gYXdhaXQgZ2VuZXJhdGVUZXh0KHtcbiAgICAgICAgICAgIG1vZGVsOiBzY3JpcHRQcm92aWRlck5hbWUoKSxcbiAgICAgICAgICAgIHN5c3RlbTogc3lzdGVtUHJvbXB0KG9wdGlvbnMpLFxuICAgICAgICAgICAgb3V0cHV0OiBPdXRwdXQub2JqZWN0KHtcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHNjcmlwdFNjaGVtYVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBwcm9tcHQ6IGBUdXJuIHRoZSBmb2xsb3dpbmcgZG9jdW1lbnQgKFwiJHtzb3VyY2VGaWxlbmFtZX1cIikgaW50byBhIHBvZGNhc3Qgc2NyaXB0Llxcblxcbjxkb2N1bWVudD5cXG4ke3RleHR9XFxuPC9kb2N1bWVudD5gXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzY3JpcHQgPSBvdXRwdXQ7XG4gICAgICAgIC8vIFNpbmdsZS12b2ljZSBmb3JtYXRzIG11c3Qgbm90IGNvbnRhaW4gYSBHVUVTVCBzcGVha2VyLlxuICAgICAgICBpZiAoaXNTaW5nbGVWb2ljZUZvcm1hdChvcHRpb25zLmZvcm1hdCkpIHtcbiAgICAgICAgICAgIHNjcmlwdC5saW5lcyA9IHNjcmlwdC5saW5lcy5tYXAoKGwpPT4oe1xuICAgICAgICAgICAgICAgICAgICAuLi5sLFxuICAgICAgICAgICAgICAgICAgICBzcGVha2VyOiBcIkhPU1RcIlxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2NyaXB0O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiU2NyaXB0IGdlbmVyYXRpb24gdmlhIEFJIEdhdGV3YXkgZmFpbGVkLCBmYWxsaW5nIGJhY2sgdG8gbW9jazpcIiwgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IGVycik7XG4gICAgICAgIHNjcmlwdEZlbGxCYWNrID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG1vY2tTY3JpcHQodGV4dCwgc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpO1xuICAgIH1cbn1cbi8vIFwiUmVhZCBhbG91ZFwiIG1vZGU6IG5vIExMTSwgbm8gc3VtbWFyaXppbmcgXHUyMDE0IHRoZSBleHRyYWN0ZWQgdGV4dCBiZWNvbWVzIHRoZVxuLy8gc2NyaXB0IHZlcmJhdGltLCBjaHVua2VkIGludG8gbmFycmF0b3IgbGluZXMgc28gVFRTIHJlcXVlc3RzIHN0YXkgc21hbGwgYW5kXG4vLyB0aGUgdHJhbnNjcmlwdCBzdGF5cyBzY3JvbGxhYmxlLlxuY29uc3QgUkVBRF9DSFVOS19DSEFSUyA9IDkwMDtcbmV4cG9ydCBmdW5jdGlvbiB2ZXJiYXRpbVNjcmlwdChzb3VyY2VUZXh0LCBzb3VyY2VGaWxlbmFtZSwgbWF4Q2hhcnMpIHtcbiAgICBjb25zdCB0aXRsZSA9IHNvdXJjZUZpbGVuYW1lLnJlcGxhY2UoL1xcLnBkZiQvaSwgXCJcIikucmVwbGFjZSgvWy1fXSsvZywgXCIgXCIpO1xuICAgIGNvbnN0IHRleHQgPSBzb3VyY2VUZXh0LnNsaWNlKDAsIG1heENoYXJzKTtcbiAgICBjb25zdCBzZW50ZW5jZXMgPSB0ZXh0LnNwbGl0KC8oPzw9Wy4hP10pXFxzKy8pO1xuICAgIGNvbnN0IGxpbmVzID0gW107XG4gICAgbGV0IGN1cnJlbnQgPSBcIlwiO1xuICAgIGZvciAoY29uc3Qgc2VudGVuY2Ugb2Ygc2VudGVuY2VzKXtcbiAgICAgICAgaWYgKGN1cnJlbnQgJiYgY3VycmVudC5sZW5ndGggKyBzZW50ZW5jZS5sZW5ndGggKyAxID4gUkVBRF9DSFVOS19DSEFSUykge1xuICAgICAgICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgc3BlYWtlcjogXCJIT1NUXCIsXG4gICAgICAgICAgICAgICAgdGV4dDogY3VycmVudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjdXJyZW50ID0gc2VudGVuY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9ICR7c2VudGVuY2V9YCA6IHNlbnRlbmNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjdXJyZW50KSBsaW5lcy5wdXNoKHtcbiAgICAgICAgc3BlYWtlcjogXCJIT1NUXCIsXG4gICAgICAgIHRleHQ6IGN1cnJlbnRcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbGluZXNcbiAgICB9O1xufVxuZnVuY3Rpb24gbW9ja1NjcmlwdCh0ZXh0LCBzb3VyY2VGaWxlbmFtZSwgb3B0aW9ucykge1xuICAgIGNvbnN0IHNpbmdsZSA9IGlzU2luZ2xlVm9pY2VGb3JtYXQob3B0aW9ucy5mb3JtYXQpO1xuICAgIGNvbnN0IGFsbCA9IHRleHQuc3BsaXQoLyg/PD1bLiE/XSlcXHMrLykuZmlsdGVyKChzKT0+cy5sZW5ndGggPiAyMCk7XG4gICAgY29uc3QgdGFyZ2V0ID0gTWF0aC5tYXgoOCwgTWF0aC5yb3VuZChMRU5HVEhfQlVER0VUU1tvcHRpb25zLmxlbmd0aF0uc2NyaXB0Q2hhcnMgLyAxMTApKTtcbiAgICBjb25zdCBzdGVwID0gTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihhbGwubGVuZ3RoIC8gdGFyZ2V0KSk7XG4gICAgY29uc3Qgc2VudGVuY2VzID0gYWxsLmZpbHRlcigoXywgaSk9PmkgJSBzdGVwID09PSAwKS5zbGljZSgwLCB0YXJnZXQpO1xuICAgIGNvbnN0IHRpdGxlID0gc291cmNlRmlsZW5hbWUucmVwbGFjZSgvXFwucGRmJC9pLCBcIlwiKS5yZXBsYWNlKC9bLV9dKy9nLCBcIiBcIik7XG4gICAgY29uc3QgbGluZXMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNwZWFrZXI6IFwiSE9TVFwiLFxuICAgICAgICAgICAgdGV4dDogYFdlbGNvbWUgYmFjayB0byB0aGUgc2hvdy4gVG9kYXkgd2UncmUgZGlnZ2luZyBpbnRvICR7dGl0bGV9LmBcbiAgICAgICAgfVxuICAgIF07XG4gICAgaWYgKCFzaW5nbGUpIHtcbiAgICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgICAgICBzcGVha2VyOiBcIkdVRVNUXCIsXG4gICAgICAgICAgICB0ZXh0OiBcIlRoYW5rcyBmb3IgaGF2aW5nIG1lLiBUaGVyZSdzIGEgbG90IGluIGhlcmUuXCJcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHNlbnRlbmNlcy5mb3JFYWNoKChzZW50ZW5jZSwgaSk9PntcbiAgICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgICAgICBzcGVha2VyOiBzaW5nbGUgfHwgaSAlIDIgPT09IDEgPyBcIkhPU1RcIiA6IFwiR1VFU1RcIixcbiAgICAgICAgICAgIHRleHQ6IHNlbnRlbmNlLnRyaW0oKVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBsaW5lcy5wdXNoKHtcbiAgICAgICAgc3BlYWtlcjogXCJIT1NUXCIsXG4gICAgICAgIHRleHQ6IFwiVGhhdCdzIHRoZSBiaWcgcGljdHVyZS4gVGhhbmtzIGZvciBsaXN0ZW5pbmcsIGFuZCBzZWUgeW91IG5leHQgdGltZS5cIlxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlLFxuICAgICAgICBsaW5lc1xuICAgIH07XG59XG4iLCAiY29uc3QgQllURVNfUEVSX1NBTVBMRSA9IDI7XG5leHBvcnQgZnVuY3Rpb24gcGNtMTZUb1dhdihwY20sIHNhbXBsZVJhdGUsIGNoYW5uZWxzID0gMSkge1xuICAgIGNvbnN0IGhlYWRlciA9IG5ldyBBcnJheUJ1ZmZlcig0NCk7XG4gICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhoZWFkZXIpO1xuICAgIGNvbnN0IGJ5dGVSYXRlID0gc2FtcGxlUmF0ZSAqIGNoYW5uZWxzICogQllURVNfUEVSX1NBTVBMRTtcbiAgICB3cml0ZUFzY2lpKHZpZXcsIDAsIFwiUklGRlwiKTtcbiAgICB2aWV3LnNldFVpbnQzMig0LCAzNiArIHBjbS5ieXRlTGVuZ3RoLCB0cnVlKTtcbiAgICB3cml0ZUFzY2lpKHZpZXcsIDgsIFwiV0FWRVwiKTtcbiAgICB3cml0ZUFzY2lpKHZpZXcsIDEyLCBcImZtdCBcIik7XG4gICAgdmlldy5zZXRVaW50MzIoMTYsIDE2LCB0cnVlKTtcbiAgICB2aWV3LnNldFVpbnQxNigyMCwgMSwgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MTYoMjIsIGNoYW5uZWxzLCB0cnVlKTtcbiAgICB2aWV3LnNldFVpbnQzMigyNCwgc2FtcGxlUmF0ZSwgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MzIoMjgsIGJ5dGVSYXRlLCB0cnVlKTtcbiAgICB2aWV3LnNldFVpbnQxNigzMiwgY2hhbm5lbHMgKiBCWVRFU19QRVJfU0FNUExFLCB0cnVlKTtcbiAgICB2aWV3LnNldFVpbnQxNigzNCwgMTYsIHRydWUpO1xuICAgIHdyaXRlQXNjaWkodmlldywgMzYsIFwiZGF0YVwiKTtcbiAgICB2aWV3LnNldFVpbnQzMig0MCwgcGNtLmJ5dGVMZW5ndGgsIHRydWUpO1xuICAgIGNvbnN0IHdhdiA9IG5ldyBVaW50OEFycmF5KDQ0ICsgcGNtLmJ5dGVMZW5ndGgpO1xuICAgIHdhdi5zZXQobmV3IFVpbnQ4QXJyYXkoaGVhZGVyKSwgMCk7XG4gICAgd2F2LnNldChwY20sIDQ0KTtcbiAgICByZXR1cm4gd2F2O1xufVxuZXhwb3J0IGZ1bmN0aW9uIHdhdkR1cmF0aW9uU2Vjb25kcyhwY21CeXRlTGVuZ3RoLCBzYW1wbGVSYXRlLCBjaGFubmVscyA9IDEpIHtcbiAgICByZXR1cm4gcGNtQnl0ZUxlbmd0aCAvIChzYW1wbGVSYXRlICogY2hhbm5lbHMgKiBCWVRFU19QRVJfU0FNUExFKTtcbn1cbmZ1bmN0aW9uIHdyaXRlQXNjaWkodmlldywgb2Zmc2V0LCB0ZXh0KSB7XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspe1xuICAgICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCArIGksIHRleHQuY2hhckNvZGVBdChpKSk7XG4gICAgfVxufVxuIiwgImltcG9ydCB7IHBjbTE2VG9XYXYsIHdhdkR1cmF0aW9uU2Vjb25kcyB9IGZyb20gXCIuL3dhdlwiO1xuLy8gNjQga2JwcyBtb25vIGlzIHRyYW5zcGFyZW50IGZvciBzcGVlY2ggYW5kIH42eCBzbWFsbGVyIHRoYW4gMTYtYml0IFdBVi5cbmNvbnN0IE1QM19CSVRSQVRFX0tCUFMgPSA2NDtcbmNvbnN0IFNBTVBMRVNfUEVSX0ZSQU1FID0gMTE1MjtcbmFzeW5jIGZ1bmN0aW9uIGVuY29kZU1wMyhwY20sIHNhbXBsZVJhdGUpIHtcbiAgICBjb25zdCB7IE1wM0VuY29kZXIgfSA9IGF3YWl0IGltcG9ydChcIkBicmVlenlzdGFjay9sYW1lanNcIik7XG4gICAgY29uc3QgZW5jb2RlciA9IG5ldyBNcDNFbmNvZGVyKDEsIHNhbXBsZVJhdGUsIE1QM19CSVRSQVRFX0tCUFMpO1xuICAgIGNvbnN0IHNhbXBsZXMgPSBuZXcgSW50MTZBcnJheShwY20uYnVmZmVyLCBwY20uYnl0ZU9mZnNldCwgTWF0aC5mbG9vcihwY20uYnl0ZUxlbmd0aCAvIDIpKTtcbiAgICBjb25zdCBjaHVua3MgPSBbXTtcbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgc2FtcGxlcy5sZW5ndGg7IGkgKz0gU0FNUExFU19QRVJfRlJBTUUpe1xuICAgICAgICBjb25zdCBibG9jayA9IHNhbXBsZXMuc3ViYXJyYXkoaSwgaSArIFNBTVBMRVNfUEVSX0ZSQU1FKTtcbiAgICAgICAgY29uc3QgZnJhbWUgPSBlbmNvZGVyLmVuY29kZUJ1ZmZlcihibG9jayk7XG4gICAgICAgIGlmIChmcmFtZS5sZW5ndGggPiAwKSBjaHVua3MucHVzaChuZXcgVWludDhBcnJheShmcmFtZSkpO1xuICAgIH1cbiAgICBjb25zdCB0YWlsID0gZW5jb2Rlci5mbHVzaCgpO1xuICAgIGlmICh0YWlsLmxlbmd0aCA+IDApIGNodW5rcy5wdXNoKG5ldyBVaW50OEFycmF5KHRhaWwpKTtcbiAgICBjb25zdCB0b3RhbCA9IGNodW5rcy5yZWR1Y2UoKG4sIGMpPT5uICsgYy5ieXRlTGVuZ3RoLCAwKTtcbiAgICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheSh0b3RhbCk7XG4gICAgbGV0IG9mZnNldCA9IDA7XG4gICAgZm9yIChjb25zdCBjIG9mIGNodW5rcyl7XG4gICAgICAgIG91dC5zZXQoYywgb2Zmc2V0KTtcbiAgICAgICAgb2Zmc2V0ICs9IGMuYnl0ZUxlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn1cbi8qKiBFbmNvZGVzIDE2LWJpdCBtb25vIFBDTSB0byBNUDMsIGZhbGxpbmcgYmFjayB0byBXQVYgaWYgZW5jb2RpbmcgZmFpbHMuICovIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaW5hbGl6ZUF1ZGlvKHBjbSwgc2FtcGxlUmF0ZSkge1xuICAgIGNvbnN0IGR1cmF0aW9uU2Vjb25kcyA9IHdhdkR1cmF0aW9uU2Vjb25kcyhwY20uYnl0ZUxlbmd0aCwgc2FtcGxlUmF0ZSk7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYXVkaW8gPSBhd2FpdCBlbmNvZGVNcDMocGNtLCBzYW1wbGVSYXRlKTtcbiAgICAgICAgaWYgKGF1ZGlvLmJ5dGVMZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGF1ZGlvLFxuICAgICAgICAgICAgICAgIG1pbWVUeXBlOiBcImF1ZGlvL21wZWdcIixcbiAgICAgICAgICAgICAgICBkdXJhdGlvblNlY29uZHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1QMyBlbmNvZGUgZmFpbGVkLCBmYWxsaW5nIGJhY2sgdG8gV0FWOlwiLCBlcnIpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBhdWRpbzogcGNtMTZUb1dhdihwY20sIHNhbXBsZVJhdGUpLFxuICAgICAgICBtaW1lVHlwZTogXCJhdWRpby93YXZcIixcbiAgICAgICAgZHVyYXRpb25TZWNvbmRzXG4gICAgfTtcbn1cbiIsICJpbXBvcnQgeyBmaW5hbGl6ZUF1ZGlvIH0gZnJvbSBcIi4uL2F1ZGlvL21wM1wiO1xuaW1wb3J0IHsgaXNTaW5nbGVWb2ljZUZvcm1hdCB9IGZyb20gXCIuLi9vcHRpb25zXCI7XG5pbXBvcnQgeyBERUZBVUxUX0dVRVNUX1ZPSUNFLCBERUZBVUxUX0hPU1RfVk9JQ0UsIERFRkFVTFRfUkVBREVSX1ZPSUNFIH0gZnJvbSBcIi4uL3ZvaWNlc1wiO1xuY29uc3QgR0VNSU5JX1NBTVBMRV9SQVRFID0gMjRfMDAwO1xuY29uc3QgR0VNSU5JX1RUU19NT0RFTCA9IHByb2Nlc3MuZW52LlBPRENBU1RfVFRTX01PREVMID8/IFwiZ2VtaW5pLTIuNS1mbGFzaC1wcmV2aWV3LXR0c1wiO1xuY29uc3QgU0lOR0xFX1RUU19DSFVOS19DSEFSUyA9IDNfNTAwO1xuZnVuY3Rpb24gZ2VtaW5pQXBpS2V5KCkge1xuICAgIHJldHVybiBwcm9jZXNzLmVudi5HRU1JTklfQVBJX0tFWSB8fCBwcm9jZXNzLmVudi5HT09HTEVfR0VORVJBVElWRV9BSV9BUElfS0VZO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHR0c1Byb3ZpZGVyTmFtZSgpIHtcbiAgICByZXR1cm4gZ2VtaW5pQXBpS2V5KCkgPyBHRU1JTklfVFRTX01PREVMIDogXCJtb2NrXCI7XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3ludGhlc2l6ZURpYWxvZ3VlKHNjcmlwdCwgbW9kZSA9IFwiY29udmVyc2F0aW9uXCIsIG9wdGlvbnMpIHtcbiAgICBpZiAoIWdlbWluaUFwaUtleSgpKSByZXR1cm4gZmluYWxpemVBdWRpbyguLi5tb2NrUGNtKHNjcmlwdCkpO1xuICAgIGNvbnN0IHJlYWRlclZvaWNlID0gb3B0aW9ucz8ucmVhZGVyVm9pY2UgPz8gREVGQVVMVF9SRUFERVJfVk9JQ0U7XG4gICAgY29uc3QgaG9zdFZvaWNlID0gb3B0aW9ucz8uaG9zdFZvaWNlID8/IERFRkFVTFRfSE9TVF9WT0lDRTtcbiAgICBjb25zdCBndWVzdFZvaWNlID0gb3B0aW9ucz8uZ3Vlc3RWb2ljZSA/PyBERUZBVUxUX0dVRVNUX1ZPSUNFO1xuICAgIGlmIChtb2RlID09PSBcInJlYWRpbmdcIikge1xuICAgICAgICByZXR1cm4gZ2VtaW5pU2luZ2xlVm9pY2Uoc2NyaXB0LCByZWFkZXJWb2ljZSwgXCJSZWFkIHRoZSBmb2xsb3dpbmcgdGV4dCBhbG91ZCBpbiBhIGNhbG0sIHdhcm0sIHNvb3RoaW5nIHZvaWNlIGF0IGEgcmVsYXhlZCBwYWNlOlwiKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMgJiYgaXNTaW5nbGVWb2ljZUZvcm1hdChvcHRpb25zLmZvcm1hdCkpIHtcbiAgICAgICAgcmV0dXJuIGdlbWluaVNpbmdsZVZvaWNlKHNjcmlwdCwgaG9zdFZvaWNlLCBcIk5hcnJhdGUgdGhlIGZvbGxvd2luZyBpbiBhIGNsZWFyLCBlbmdhZ2luZyB2b2ljZTpcIik7XG4gICAgfVxuICAgIHJldHVybiBnZW1pbmlUdHMoc2NyaXB0LCBob3N0Vm9pY2UsIGd1ZXN0Vm9pY2UpO1xufVxuLy8gT25lIHZvaWNlLCBjaHVua2VkIHRvIGtlZXAgZWFjaCByZXF1ZXN0IHNtYWxsOyBQQ00gY2h1bmtzIHNoYXJlIGEgc2FtcGxlXG4vLyByYXRlIGFuZCBjb25jYXRlbmF0ZSBjbGVhbmx5LiBVc2VkIGJ5IHJlYWQtYWxvdWQgYW5kIHNpbmdsZS12b2ljZSBmb3JtYXRzLlxuYXN5bmMgZnVuY3Rpb24gZ2VtaW5pU2luZ2xlVm9pY2Uoc2NyaXB0LCB2b2ljZU5hbWUsIGluc3RydWN0aW9uKSB7XG4gICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgbGV0IGN1cnJlbnQgPSBcIlwiO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBzY3JpcHQubGluZXMpe1xuICAgICAgICBpZiAoY3VycmVudCAmJiBjdXJyZW50Lmxlbmd0aCArIGxpbmUudGV4dC5sZW5ndGggKyAxID4gU0lOR0xFX1RUU19DSFVOS19DSEFSUykge1xuICAgICAgICAgICAgY2h1bmtzLnB1c2goY3VycmVudCk7XG4gICAgICAgICAgICBjdXJyZW50ID0gbGluZS50ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQgPyBgJHtjdXJyZW50fVxcbiR7bGluZS50ZXh0fWAgOiBsaW5lLnRleHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGN1cnJlbnQpIGNodW5rcy5wdXNoKGN1cnJlbnQpO1xuICAgIGNvbnN0IHBjbVBhcnRzID0gW107XG4gICAgbGV0IHNhbXBsZVJhdGUgPSBHRU1JTklfU0FNUExFX1JBVEU7XG4gICAgZm9yIChjb25zdCBjaHVuayBvZiBjaHVua3Mpe1xuICAgICAgICBjb25zdCBwYXJ0ID0gYXdhaXQgZ2VtaW5pR2VuZXJhdGUoYCR7aW5zdHJ1Y3Rpb259XFxuJHtjaHVua31gLCB7XG4gICAgICAgICAgICB2b2ljZUNvbmZpZzoge1xuICAgICAgICAgICAgICAgIHByZWJ1aWx0Vm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgdm9pY2VOYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcGNtUGFydHMucHVzaChwYXJ0LnBjbSk7XG4gICAgICAgIHNhbXBsZVJhdGUgPSBwYXJ0LnNhbXBsZVJhdGU7XG4gICAgfVxuICAgIGNvbnN0IHBjbSA9IG5ldyBVaW50OEFycmF5KEJ1ZmZlci5jb25jYXQocGNtUGFydHMubWFwKChwKT0+QnVmZmVyLmZyb20ocCkpKSk7XG4gICAgcmV0dXJuIGZpbmFsaXplQXVkaW8ocGNtLCBzYW1wbGVSYXRlKTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGdlbWluaVR0cyhzY3JpcHQsIGhvc3RWb2ljZSwgZ3Vlc3RWb2ljZSkge1xuICAgIGNvbnN0IHRyYW5zY3JpcHQgPSBzY3JpcHQubGluZXMubWFwKChsaW5lKT0+YCR7bGluZS5zcGVha2VyID09PSBcIkhPU1RcIiA/IFwiSG9zdFwiIDogXCJHdWVzdFwifTogJHtsaW5lLnRleHR9YCkuam9pbihcIlxcblwiKTtcbiAgICBjb25zdCB7IHBjbSwgc2FtcGxlUmF0ZSB9ID0gYXdhaXQgZ2VtaW5pR2VuZXJhdGUoYFRUUyB0aGUgZm9sbG93aW5nIHBvZGNhc3QgY29udmVyc2F0aW9uIGJldHdlZW4gSG9zdCBhbmQgR3Vlc3Q6XFxuJHt0cmFuc2NyaXB0fWAsIHtcbiAgICAgICAgbXVsdGlTcGVha2VyVm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgIHNwZWFrZXJWb2ljZUNvbmZpZ3M6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNwZWFrZXI6IFwiSG9zdFwiLFxuICAgICAgICAgICAgICAgICAgICB2b2ljZUNvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlYnVpbHRWb2ljZUNvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZvaWNlTmFtZTogaG9zdFZvaWNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3BlYWtlcjogXCJHdWVzdFwiLFxuICAgICAgICAgICAgICAgICAgICB2b2ljZUNvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlYnVpbHRWb2ljZUNvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZvaWNlTmFtZTogZ3Vlc3RWb2ljZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbmFsaXplQXVkaW8ocGNtLCBzYW1wbGVSYXRlKTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGdlbWluaUdlbmVyYXRlKHRleHQsIHNwZWVjaENvbmZpZykge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGBodHRwczovL2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbS92MWJldGEvbW9kZWxzLyR7R0VNSU5JX1RUU19NT0RFTH06Z2VuZXJhdGVDb250ZW50YCwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgIFwieC1nb29nLWFwaS1rZXlcIjogZ2VtaW5pQXBpS2V5KClcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnRzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGdlbmVyYXRpb25Db25maWc6IHtcbiAgICAgICAgICAgICAgICByZXNwb25zZU1vZGFsaXRpZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJBVURJT1wiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBzcGVlY2hDb25maWdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KTtcbiAgICBpZiAoIXJlcy5vaykge1xuICAgICAgICBjb25zdCBib2R5ID0gKGF3YWl0IHJlcy50ZXh0KCkpLnNsaWNlKDAsIDIwMCk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEdlbWluaSBUVFMgZXJyb3IgJHtyZXMuc3RhdHVzfTogJHtib2R5fWApO1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gYFNwZWVjaCBzeW50aGVzaXMgZmFpbGVkIChHZW1pbmkgcmV0dXJuZWQgJHtyZXMuc3RhdHVzfSlgO1xuICAgICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDI5IHx8IHJlcy5zdGF0dXMgPj0gNTAwKSB7XG4gICAgICAgICAgICBjb25zdCB7IFJldHJ5YWJsZUVycm9yIH0gPSBhd2FpdCBpbXBvcnQoXCJ3b3JrZmxvd1wiKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBSZXRyeWFibGVFcnJvcihtZXNzYWdlLCB7XG4gICAgICAgICAgICAgICAgcmV0cnlBZnRlcjogXCIzMHNcIlxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBGYXRhbEVycm9yIH0gPSBhd2FpdCBpbXBvcnQoXCJ3b3JrZmxvd1wiKTtcbiAgICAgICAgdGhyb3cgbmV3IEZhdGFsRXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXMuanNvbigpO1xuICAgIGNvbnN0IHBhcnRzID0ganNvbi5jYW5kaWRhdGVzPy5bMF0/LmNvbnRlbnQ/LnBhcnRzPy5maWx0ZXIoKHApPT5wLmlubGluZURhdGE/LmRhdGEpID8/IFtdO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc3QgeyBGYXRhbEVycm9yIH0gPSBhd2FpdCBpbXBvcnQoXCJ3b3JrZmxvd1wiKTtcbiAgICAgICAgdGhyb3cgbmV3IEZhdGFsRXJyb3IoXCJTcGVlY2ggc3ludGhlc2lzIHJldHVybmVkIG5vIGF1ZGlvIGRhdGFcIik7XG4gICAgfVxuICAgIC8vIExvbmcgdHJhbnNjcmlwdHMgY29tZSBiYWNrIGFzIG11bHRpcGxlIGlubGluZURhdGEgUENNIGNodW5rcy5cbiAgICBjb25zdCBwY20gPSBuZXcgVWludDhBcnJheShCdWZmZXIuY29uY2F0KHBhcnRzLm1hcCgocCk9PkJ1ZmZlci5mcm9tKHAuaW5saW5lRGF0YS5kYXRhLCBcImJhc2U2NFwiKSkpKTtcbiAgICBjb25zdCByYXRlTWF0Y2ggPSAvcmF0ZT0oXFxkKykvLmV4ZWMocGFydHNbMF0uaW5saW5lRGF0YT8ubWltZVR5cGUgPz8gXCJcIik7XG4gICAgY29uc3Qgc2FtcGxlUmF0ZSA9IHJhdGVNYXRjaCA/IHBhcnNlSW50KHJhdGVNYXRjaFsxXSwgMTApIDogR0VNSU5JX1NBTVBMRV9SQVRFO1xuICAgIHJldHVybiB7XG4gICAgICAgIHBjbSxcbiAgICAgICAgc2FtcGxlUmF0ZVxuICAgIH07XG59XG4vLyBTcGVlY2gtcGFjZWQgdG9uZXMgKGRpc3RpbmN0IHBpdGNoIHBlciBzcGVha2VyKSBzbyB0aGUgZnVsbCBwaXBlbGluZSBhbmRcbi8vIHBsYXllciBhcmUgdGVzdGFibGUgd2l0aG91dCBhbnkgVFRTIGNyZWRlbnRpYWxzLlxuZnVuY3Rpb24gbW9ja1BjbShzY3JpcHQpIHtcbiAgICBjb25zdCBzYW1wbGVSYXRlID0gMjRfMDAwO1xuICAgIGNvbnN0IHdvcmRTZWNvbmRzID0gMC4yMjtcbiAgICBjb25zdCBsaW5lR2FwU2Vjb25kcyA9IDAuNDtcbiAgICBjb25zdCBtYXhTZWNvbmRzID0gMTIwO1xuICAgIGxldCB0b3RhbFNlY29uZHMgPSAwO1xuICAgIGNvbnN0IHNlZ21lbnRzID0gW107XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIHNjcmlwdC5saW5lcyl7XG4gICAgICAgIGNvbnN0IHdvcmRzID0gTWF0aC5tYXgoMSwgbGluZS50ZXh0LnNwbGl0KC9cXHMrLykubGVuZ3RoKTtcbiAgICAgICAgY29uc3Qgc2Vjb25kcyA9IHdvcmRzICogd29yZFNlY29uZHMgKyBsaW5lR2FwU2Vjb25kcztcbiAgICAgICAgaWYgKHRvdGFsU2Vjb25kcyArIHNlY29uZHMgPiBtYXhTZWNvbmRzKSBicmVhaztcbiAgICAgICAgdG90YWxTZWNvbmRzICs9IHNlY29uZHM7XG4gICAgICAgIHNlZ21lbnRzLnB1c2goe1xuICAgICAgICAgICAgZnJlcTogbGluZS5zcGVha2VyID09PSBcIkhPU1RcIiA/IDE5NiA6IDE0NyxcbiAgICAgICAgICAgIHdvcmRzXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCB0b3RhbFNhbXBsZXMgPSBNYXRoLmNlaWwodG90YWxTZWNvbmRzICogc2FtcGxlUmF0ZSk7XG4gICAgY29uc3QgcGNtID0gbmV3IEludDE2QXJyYXkodG90YWxTYW1wbGVzKTtcbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2Ygc2VnbWVudHMpe1xuICAgICAgICBmb3IobGV0IHcgPSAwOyB3IDwgc2VnbWVudC53b3JkczsgdysrKXtcbiAgICAgICAgICAgIGNvbnN0IHdvcmRTYW1wbGVzID0gTWF0aC5mbG9vcih3b3JkU2Vjb25kcyAqIHNhbXBsZVJhdGUgKiAwLjg1KTtcbiAgICAgICAgICAgIGNvbnN0IGZyZXEgPSBzZWdtZW50LmZyZXEgKiAoMSArIDAuMTIgKiBNYXRoLnNpbih3KSk7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgd29yZFNhbXBsZXMgJiYgb2Zmc2V0ICsgaSA8IHRvdGFsU2FtcGxlczsgaSsrKXtcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gaSAvIHNhbXBsZVJhdGU7XG4gICAgICAgICAgICAgICAgY29uc3QgZW52ZWxvcGUgPSBNYXRoLnNpbihNYXRoLlBJICogaSAvIHdvcmRTYW1wbGVzKTtcbiAgICAgICAgICAgICAgICBwY21bb2Zmc2V0ICsgaV0gPSBNYXRoLnJvdW5kKDYwMDAgKiBlbnZlbG9wZSAqIE1hdGguc2luKDIgKiBNYXRoLlBJICogZnJlcSAqIHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9mZnNldCArPSBNYXRoLmZsb29yKHdvcmRTZWNvbmRzICogc2FtcGxlUmF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgb2Zmc2V0ICs9IE1hdGguZmxvb3IobGluZUdhcFNlY29uZHMgKiBzYW1wbGVSYXRlKTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShwY20uYnVmZmVyLCAwLCB0b3RhbFNhbXBsZXMgKiAyKTtcbiAgICByZXR1cm4gW1xuICAgICAgICBieXRlcyxcbiAgICAgICAgc2FtcGxlUmF0ZVxuICAgIF07XG59XG4iLCAibGV0IGNsaWVudFByb21pc2UgPSBudWxsO1xuLyoqIFNlY3JldC1rZXkgY2xpZW50IGZvciBzZXJ2ZXItc2lkZSB3cml0ZXM7IGJ5cGFzc2VzIFJMUy4gTmV2ZXIgaW1wb3J0IGZyb20gY2xpZW50IGNvZGUuICovIGV4cG9ydCBmdW5jdGlvbiBnZXRBZG1pbkNsaWVudCgpIHtcbiAgICBpZiAoIWNsaWVudFByb21pc2UpIHtcbiAgICAgICAgY2xpZW50UHJvbWlzZSA9IGltcG9ydChcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiKS50aGVuKCh7IGNyZWF0ZUNsaWVudCB9KT0+Y3JlYXRlQ2xpZW50KHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VDUkVUX0tFWSwge1xuICAgICAgICAgICAgICAgIGF1dGg6IHtcbiAgICAgICAgICAgICAgICAgICAgcGVyc2lzdFNlc3Npb246IGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgIH1cbiAgICByZXR1cm4gY2xpZW50UHJvbWlzZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzdXBhYmFzZUNvbmZpZ3VyZWQoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4ocHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMICYmIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFQ1JFVF9LRVkpO1xufVxuIiwgImltcG9ydCB7IGdldEFkbWluQ2xpZW50LCBzdXBhYmFzZUNvbmZpZ3VyZWQgfSBmcm9tIFwiLi9zdXBhYmFzZS9hZG1pblwiO1xuaW1wb3J0IHsgTEVOR1RIX0JVREdFVFMgfSBmcm9tIFwiLi9vcHRpb25zXCI7XG4vLyAxIGNyZWRpdCBcdTIyNDggMjUgbWludXRlcyBvZiByZWFkLWFsb3VkIGF1ZGlvOyBjb252ZXJzYXRpb25zIGFyZSBhIGZpeGVkLWxlbmd0aFxuLy8gc3VtbWFyeSByZWdhcmRsZXNzIG9mIGlucHV0IHNpemUuXG5jb25zdCBSRUFEX0NIQVJTX1BFUl9DUkVESVQgPSAyNV8wMDA7XG4vLyBSZWFkLWFsb3VkIGlzIGNhcHBlZCBieSB0aGUgc2VsZWN0ZWQgbGVuZ3RoLCBzbyBjb3N0IHRvcHMgb3V0IGhlcmU7IHRoZSBjYXBcbi8vIGFsc28gZ3VhcmRzIGFnYWluc3QgYW55IGV4dHJhY3Rpb24gYW5vbWFseSBpbmZsYXRpbmcgdGhlIGNoYXJnZS5cbmNvbnN0IE1BWF9DUkVESVRTX1BFUl9FUElTT0RFID0gODtcbi8qKiBDaGFycyBhY3R1YWxseSBzcG9rZW4gPSBtaW4oZXh0cmFjdGVkLCB0aGUgbGVuZ3RoIGJ1ZGdldCdzIHJlYWQgY2FwKS4gKi8gZnVuY3Rpb24gcmVhZGFibGVDaGFycyhleHRyYWN0ZWRDaGFycywgbGVuZ3RoKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KDAsIGV4dHJhY3RlZENoYXJzKSwgTEVOR1RIX0JVREdFVFNbbGVuZ3RoXS5yZWFkQ2hhcnMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWRpdENvc3QobW9kZSwgZXh0cmFjdGVkQ2hhcnMsIGxlbmd0aCA9IFwic3RhbmRhcmRcIikge1xuICAgIGlmIChtb2RlID09PSBcInJlYWRpbmdcIikge1xuICAgICAgICBjb25zdCBjaGFycyA9IHJlYWRhYmxlQ2hhcnMoZXh0cmFjdGVkQ2hhcnMsIGxlbmd0aCk7XG4gICAgICAgIHJldHVybiBNYXRoLm1pbihNQVhfQ1JFRElUU19QRVJfRVBJU09ERSwgTWF0aC5tYXgoMSwgTWF0aC5jZWlsKGNoYXJzIC8gUkVBRF9DSEFSU19QRVJfQ1JFRElUKSkpO1xuICAgIH1cbiAgICByZXR1cm4gMTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBlc3RpbWF0ZU1pbnV0ZXMobW9kZSwgZXh0cmFjdGVkQ2hhcnMsIGxlbmd0aCA9IFwic3RhbmRhcmRcIikge1xuICAgIGlmIChtb2RlID09PSBcInJlYWRpbmdcIikge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMSwgTWF0aC5yb3VuZChyZWFkYWJsZUNoYXJzKGV4dHJhY3RlZENoYXJzLCBsZW5ndGgpIC8gMV8wMDApKTtcbiAgICB9XG4gICAgcmV0dXJuIExFTkdUSF9CVURHRVRTW2xlbmd0aF0uYXBwcm94TWludXRlcztcbn1cbi8qKiBDcmVkaXRzIGFyZSBlbmZvcmNlZCBvbmx5IHdoZW4gU3VwYWJhc2UgaXMgY29uZmlndXJlZCAoYWx3YXlzLCBpbiBwcm9kdWN0aW9uKS4gKi8gZXhwb3J0IGZ1bmN0aW9uIGNyZWRpdHNFbmFibGVkKCkge1xuICAgIHJldHVybiBzdXBhYmFzZUNvbmZpZ3VyZWQoKTtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRCYWxhbmNlKHVzZXJJZCkge1xuICAgIGlmICghY3JlZGl0c0VuYWJsZWQoKSkgcmV0dXJuIEluZmluaXR5O1xuICAgIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgZ2V0QWRtaW5DbGllbnQoKTtcbiAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoXCJjcmVkaXRfYmFsYW5jZVwiLCB7XG4gICAgICAgIHBfdXNlcjogdXNlcklkXG4gICAgfSk7XG4gICAgaWYgKGVycm9yKSB0aHJvdyBuZXcgRXJyb3IoYGNyZWRpdCBiYWxhbmNlIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgIHJldHVybiBOdW1iZXIoZGF0YSA/PyAwKTtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzcGVuZENyZWRpdHModXNlcklkLCBhbW91bnQsIGVwaXNvZGVJZCkge1xuICAgIGlmICghY3JlZGl0c0VuYWJsZWQoKSkgcmV0dXJuIHRydWU7XG4gICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCBnZXRBZG1pbkNsaWVudCgpO1xuICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLnJwYyhcInNwZW5kX2NyZWRpdHNcIiwge1xuICAgICAgICBwX3VzZXI6IHVzZXJJZCxcbiAgICAgICAgcF9hbW91bnQ6IGFtb3VudCxcbiAgICAgICAgcF9yZWY6IGBlcGlzb2RlOiR7ZXBpc29kZUlkfWBcbiAgICB9KTtcbiAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgY3JlZGl0IHNwZW5kIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgIHJldHVybiBkYXRhID09PSB0cnVlO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZnVuZEVwaXNvZGUodXNlcklkLCBlcGlzb2RlSWQpIHtcbiAgICBpZiAoIWNyZWRpdHNFbmFibGVkKCkpIHJldHVybjtcbiAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IGdldEFkbWluQ2xpZW50KCk7XG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKFwicmVmdW5kX2VwaXNvZGVcIiwge1xuICAgICAgICBwX3VzZXI6IHVzZXJJZCxcbiAgICAgICAgcF9lcGlzb2RlOiBlcGlzb2RlSWRcbiAgICB9KTtcbiAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgY3JlZGl0IHJlZnVuZCBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbn1cbiIsICIvKipcbiAqIFRoZXNlIGFyZSB0aGUgYnVpbHQtaW4gc3RlcHMgdGhhdCBhcmUgXCJhdXRvbWF0aWNhbGx5IGF2YWlsYWJsZVwiIGluIHRoZSB3b3JrZmxvdyBzY29wZS4gVGhleSBhcmVcbiAqIHNpbWlsYXIgdG8gXCJzdGRsaWJcIiBleGNlcHQgdGhhdCBhcmUgbm90IG1lYW50IHRvIGJlIGltcG9ydGVkIGJ5IHVzZXJzLCBidXQgYXJlIGluc3RlYWQgXCJqdXN0IGF2YWlsYWJsZVwiXG4gKiBhbG9uZ3NpZGUgdXNlciBkZWZpbmVkIHN0ZXBzLiBUaGV5IGFyZSB1c2VkIGludGVybmFsbHkgYnkgdGhlIHJ1bnRpbWVcbiAqL1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gX19idWlsdGluX3Jlc3BvbnNlX2FycmF5X2J1ZmZlcihcbiAgdGhpczogUmVxdWVzdCB8IFJlc3BvbnNlXG4pIHtcbiAgJ3VzZSBzdGVwJztcbiAgcmV0dXJuIHRoaXMuYXJyYXlCdWZmZXIoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIF9fYnVpbHRpbl9yZXNwb25zZV9qc29uKHRoaXM6IFJlcXVlc3QgfCBSZXNwb25zZSkge1xuICAndXNlIHN0ZXAnO1xuICByZXR1cm4gdGhpcy5qc29uKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBfX2J1aWx0aW5fcmVzcG9uc2VfdGV4dCh0aGlzOiBSZXF1ZXN0IHwgUmVzcG9uc2UpIHtcbiAgJ3VzZSBzdGVwJztcbiAgcmV0dXJuIHRoaXMudGV4dCgpO1xufVxuIiwgIi8qKlxuICogVGhpcyBpcyB0aGUgXCJzdGFuZGFyZCBsaWJyYXJ5XCIgb2Ygc3RlcHMgdGhhdCB3ZSBtYWtlIGF2YWlsYWJsZSB0byBhbGwgd29ya2Zsb3cgdXNlcnMuXG4gKiBUaGUgY2FuIGJlIGltcG9ydGVkIGxpa2Ugc286IGBpbXBvcnQgeyBmZXRjaCB9IGZyb20gJ3dvcmtmbG93J2AuIGFuZCB1c2VkIGluIHdvcmtmbG93LlxuICogVGhlIG5lZWQgdG8gYmUgZXhwb3J0ZWQgZGlyZWN0bHkgaW4gdGhpcyBwYWNrYWdlIGFuZCBjYW5ub3QgbGl2ZSBpbiBgY29yZWAgdG8gcHJldmVudFxuICogY2lyY3VsYXIgZGVwZW5kZW5jaWVzIHBvc3QtY29tcGlsYXRpb24uXG4gKi9cblxuLyoqXG4gKiBBIGhvaXN0ZWQgYGZldGNoKClgIGZ1bmN0aW9uIHRoYXQgaXMgZXhlY3V0ZWQgYXMgYSBcInN0ZXBcIiBmdW5jdGlvbixcbiAqIGZvciB1c2Ugd2l0aGluIHdvcmtmbG93IGZ1bmN0aW9ucy5cbiAqXG4gKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9GZXRjaF9BUElcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoKC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIGdsb2JhbFRoaXMuZmV0Y2g+KSB7XG4gICd1c2Ugc3RlcCc7XG4gIHJldHVybiBnbG9iYWxUaGlzLmZldGNoKC4uLmFyZ3MpO1xufVxuIiwgImltcG9ydCB7IHJlZ2lzdGVyU3RlcEZ1bmN0aW9uIH0gZnJvbSBcIndvcmtmbG93L2ludGVybmFsL3ByaXZhdGVcIjtcbmltcG9ydCB7IGNyZWF0ZUhvb2ssIEZhdGFsRXJyb3IgfSBmcm9tIFwid29ya2Zsb3dcIjtcbi8qKl9faW50ZXJuYWxfd29ya2Zsb3dze1wid29ya2Zsb3dzXCI6e1wid29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUudHNcIjp7XCJnZW5lcmF0ZUVwaXNvZGVcIjp7XCJ3b3JrZmxvd0lkXCI6XCJ3b3JrZmxvdy8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vZ2VuZXJhdGVFcGlzb2RlXCJ9fX0sXCJzdGVwc1wiOntcIndvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLnRzXCI6e1wiZXh0cmFjdFN0ZXBcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL2V4dHJhY3RTdGVwXCJ9LFwiZmFpbFN0ZXBcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL2ZhaWxTdGVwXCJ9LFwibWFya1NjcmlwdFJlYWR5XCI6e1wic3RlcElkXCI6XCJzdGVwLy8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9tYXJrU2NyaXB0UmVhZHlcIn0sXCJzY3JpcHRTdGVwXCI6e1wic3RlcElkXCI6XCJzdGVwLy8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9zY3JpcHRTdGVwXCJ9LFwic3ludGhlc2l6ZVN0ZXBcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL3N5bnRoZXNpemVTdGVwXCJ9fX19Ki87XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVFcGlzb2RlKGVwaXNvZGVJZCwgcmV2aWV3U2NyaXB0ID0gZmFsc2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgYXR0ZW1wdGVkIHRvIGV4ZWN1dGUgd29ya2Zsb3cgZ2VuZXJhdGVFcGlzb2RlIGZ1bmN0aW9uIGRpcmVjdGx5LiBUbyBzdGFydCBhIHdvcmtmbG93LCB1c2Ugc3RhcnQoZ2VuZXJhdGVFcGlzb2RlKSBmcm9tIHdvcmtmbG93L2FwaVwiKTtcbn1cbmdlbmVyYXRlRXBpc29kZS53b3JrZmxvd0lkID0gXCJ3b3JrZmxvdy8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vZ2VuZXJhdGVFcGlzb2RlXCI7XG5hc3luYyBmdW5jdGlvbiBtYXJrU2NyaXB0UmVhZHkoZXBpc29kZUlkKSB7XG4gICAgY29uc29sZS5sb2coYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gYXdhaXRpbmcgc2NyaXB0IHJldmlld2ApO1xuICAgIGNvbnN0IHsgZ2V0U3RvcmUgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL3N0b3JlXCIpO1xuICAgIGlmICghYXdhaXQgZ2V0U3RvcmUoKS5wYXRjaChlcGlzb2RlSWQsIHtcbiAgICAgICAgc3RhdHVzOiBcInNjcmlwdF9yZWFkeVwiXG4gICAgfSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEZhdGFsRXJyb3IoXCJFcGlzb2RlIHdhcyBkZWxldGVkXCIpO1xuICAgIH1cbn1cbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RTdGVwKGVwaXNvZGVJZCkge1xuICAgIGNvbnNvbGUubG9nKGBbZ2VuZXJhdGUtZXBpc29kZToke2VwaXNvZGVJZH1dIGV4dHJhY3RpbmcgdGV4dGApO1xuICAgIGNvbnN0IHsgZ2V0U3RvcmUgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL3N0b3JlXCIpO1xuICAgIGNvbnN0IHsgZXh0cmFjdFBkZlRleHQgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL3BpcGVsaW5lL2V4dHJhY3RcIik7XG4gICAgY29uc3Qgc3RvcmUgPSBnZXRTdG9yZSgpO1xuICAgIGlmICghYXdhaXQgc3RvcmUucGF0Y2goZXBpc29kZUlkLCB7XG4gICAgICAgIHN0YXR1czogXCJleHRyYWN0aW5nXCJcbiAgICB9KSkge1xuICAgICAgICB0aHJvdyBuZXcgRmF0YWxFcnJvcihcIkVwaXNvZGUgd2FzIGRlbGV0ZWRcIik7XG4gICAgfVxuICAgIGNvbnN0IHNvdXJjZSA9IGF3YWl0IHN0b3JlLmdldFNvdXJjZShlcGlzb2RlSWQpO1xuICAgIGlmICghc291cmNlKSB0aHJvdyBuZXcgRmF0YWxFcnJvcihcIlNvdXJjZSBQREYgaXMgbWlzc2luZ1wiKTtcbiAgICBsZXQgdGV4dDtcbiAgICBsZXQgdG90YWxQYWdlcztcbiAgICB0cnkge1xuICAgICAgICAoeyB0ZXh0LCB0b3RhbFBhZ2VzIH0gPSBhd2FpdCBleHRyYWN0UGRmVGV4dChzb3VyY2UpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gVW4tcGFyc2VhYmxlL2VtcHR5IFBERnMgd2lsbCBuZXZlciBzdWNjZWVkIG9uIHJldHJ5LlxuICAgICAgICB0aHJvdyBuZXcgRmF0YWxFcnJvcihlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycikpO1xuICAgIH1cbiAgICBhd2FpdCBzdG9yZS5wYXRjaChlcGlzb2RlSWQsIHtcbiAgICAgICAgdG90YWxQYWdlcyxcbiAgICAgICAgZXh0cmFjdGVkQ2hhcnM6IHRleHQubGVuZ3RoXG4gICAgfSk7XG4gICAgcmV0dXJuIHRleHQ7XG59XG5hc3luYyBmdW5jdGlvbiBzY3JpcHRTdGVwKGVwaXNvZGVJZCwgdGV4dCkge1xuICAgIGNvbnNvbGUubG9nKGBbZ2VuZXJhdGUtZXBpc29kZToke2VwaXNvZGVJZH1dIGdlbmVyYXRpbmcgc2NyaXB0YCk7XG4gICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgY29uc3QgeyBnZW5lcmF0ZVBvZGNhc3RTY3JpcHQsIHZlcmJhdGltU2NyaXB0LCBzY3JpcHRQcm92aWRlck5hbWUgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL3BpcGVsaW5lL3NjcmlwdFwiKTtcbiAgICBjb25zdCB7IG5vcm1hbGl6ZU9wdGlvbnMsIExFTkdUSF9CVURHRVRTIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9vcHRpb25zXCIpO1xuICAgIGNvbnN0IHN0b3JlID0gZ2V0U3RvcmUoKTtcbiAgICBjb25zdCBlcGlzb2RlID0gYXdhaXQgc3RvcmUucGF0Y2goZXBpc29kZUlkLCB7XG4gICAgICAgIHN0YXR1czogXCJzY3JpcHRpbmdcIlxuICAgIH0pO1xuICAgIGlmICghZXBpc29kZSkgdGhyb3cgbmV3IEZhdGFsRXJyb3IoXCJFcGlzb2RlIHdhcyBkZWxldGVkXCIpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBub3JtYWxpemVPcHRpb25zKGVwaXNvZGUub3B0aW9ucyk7XG4gICAgY29uc3Qgc2NyaXB0ID0gZXBpc29kZS5tb2RlID09PSBcInJlYWRpbmdcIiA/IHZlcmJhdGltU2NyaXB0KHRleHQsIGVwaXNvZGUuc291cmNlRmlsZW5hbWUsIExFTkdUSF9CVURHRVRTW29wdGlvbnMubGVuZ3RoXS5yZWFkQ2hhcnMpIDogYXdhaXQgZ2VuZXJhdGVQb2RjYXN0U2NyaXB0KHRleHQsIGVwaXNvZGUuc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpO1xuICAgIGF3YWl0IHN0b3JlLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICB0aXRsZTogc2NyaXB0LnRpdGxlLFxuICAgICAgICBzY3JpcHQsXG4gICAgICAgIHByb3ZpZGVyczoge1xuICAgICAgICAgICAgc2NyaXB0OiBlcGlzb2RlLm1vZGUgPT09IFwicmVhZGluZ1wiID8gXCJ2ZXJiYXRpbVwiIDogc2NyaXB0UHJvdmlkZXJOYW1lKCksXG4gICAgICAgICAgICB0dHM6IFwiXCJcbiAgICAgICAgfVxuICAgIH0pO1xufVxuYXN5bmMgZnVuY3Rpb24gc3ludGhlc2l6ZVN0ZXAoZXBpc29kZUlkKSB7XG4gICAgY29uc29sZS5sb2coYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gc3ludGhlc2l6aW5nIGF1ZGlvYCk7XG4gICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgY29uc3QgeyBzeW50aGVzaXplRGlhbG9ndWUsIHR0c1Byb3ZpZGVyTmFtZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvcGlwZWxpbmUvdHRzXCIpO1xuICAgIGNvbnN0IHsgbm9ybWFsaXplT3B0aW9ucyB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvb3B0aW9uc1wiKTtcbiAgICBjb25zdCBzdG9yZSA9IGdldFN0b3JlKCk7XG4gICAgY29uc3QgZXBpc29kZSA9IGF3YWl0IHN0b3JlLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICBzdGF0dXM6IFwic3ludGhlc2l6aW5nXCJcbiAgICB9KTtcbiAgICBpZiAoIWVwaXNvZGUpIHRocm93IG5ldyBGYXRhbEVycm9yKFwiRXBpc29kZSB3YXMgZGVsZXRlZFwiKTtcbiAgICAvLyBUaGUgc2NyaXB0IGluIHRoZSBEQiBtYXkgaGF2ZSBiZWVuIGVkaXRlZCBkdXJpbmcgcmV2aWV3IFx1MjAxNCBpdCdzIHRoZSBzb3VyY2VcbiAgICAvLyBvZiB0cnV0aCwgbm90IHdoYXRldmVyIHNjcmlwdFN0ZXAgb3JpZ2luYWxseSBwcm9kdWNlZC5cbiAgICBjb25zdCBzY3JpcHQgPSBlcGlzb2RlLnNjcmlwdDtcbiAgICBpZiAoIXNjcmlwdCkgdGhyb3cgbmV3IEZhdGFsRXJyb3IoXCJTY3JpcHQgaXMgbWlzc2luZ1wiKTtcbiAgICBjb25zdCB7IGF1ZGlvLCBtaW1lVHlwZSwgZHVyYXRpb25TZWNvbmRzIH0gPSBhd2FpdCBzeW50aGVzaXplRGlhbG9ndWUoc2NyaXB0LCBlcGlzb2RlLm1vZGUgPz8gXCJjb252ZXJzYXRpb25cIiwgbm9ybWFsaXplT3B0aW9ucyhlcGlzb2RlLm9wdGlvbnMpKTtcbiAgICBhd2FpdCBzdG9yZS5zYXZlQXVkaW8oZXBpc29kZUlkLCBhdWRpbywgbWltZVR5cGUpO1xuICAgIGF3YWl0IHN0b3JlLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICBzdGF0dXM6IFwicmVhZHlcIixcbiAgICAgICAgYXVkaW9NaW1lVHlwZTogbWltZVR5cGUsXG4gICAgICAgIGR1cmF0aW9uU2Vjb25kczogTWF0aC5yb3VuZChkdXJhdGlvblNlY29uZHMpLFxuICAgICAgICBwcm92aWRlcnM6IHtcbiAgICAgICAgICAgIHNjcmlwdDogZXBpc29kZS5wcm92aWRlcnM/LnNjcmlwdCA/PyBcIlwiLFxuICAgICAgICAgICAgdHRzOiB0dHNQcm92aWRlck5hbWUoKVxuICAgICAgICB9XG4gICAgfSk7XG59XG5hc3luYyBmdW5jdGlvbiBmYWlsU3RlcChlcGlzb2RlSWQsIG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbZ2VuZXJhdGUtZXBpc29kZToke2VwaXNvZGVJZH1dIGZhaWxlZDogJHttZXNzYWdlfWApO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgZ2V0U3RvcmUgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL3N0b3JlXCIpO1xuICAgICAgICBjb25zdCBlcGlzb2RlID0gYXdhaXQgZ2V0U3RvcmUoKS5wYXRjaChlcGlzb2RlSWQsIHtcbiAgICAgICAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgICAgICAgZXJyb3I6IG1lc3NhZ2VcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChlcGlzb2RlPy51c2VySWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgcmVmdW5kRXBpc29kZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvY3JlZGl0c1wiKTtcbiAgICAgICAgICAgIC8vIE5vLW9wIHVubGVzcyBhIHNwZW5kIHJvdyBleGlzdHMgZm9yIHRoaXMgZXBpc29kZSwgc28gYWRtaW4gcnVucyBhbmRcbiAgICAgICAgICAgIC8vIHJldHJpZXMgYXJlIHNhZmUuXG4gICAgICAgICAgICBhd2FpdCByZWZ1bmRFcGlzb2RlKGVwaXNvZGUudXNlcklkLCBlcGlzb2RlSWQpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAocGF0Y2hFcnIpIHtcbiAgICAgICAgLy8gTmV2ZXIgbWFzayB0aGUgb3JpZ2luYWwgd29ya2Zsb3cgZXJyb3Igd2l0aCBhIGJvb2trZWVwaW5nIGZhaWx1cmUuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gY291bGQgbm90IHJlY29yZCBmYWlsdXJlOmAsIHBhdGNoRXJyKTtcbiAgICB9XG59XG5yZWdpc3RlclN0ZXBGdW5jdGlvbihcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL21hcmtTY3JpcHRSZWFkeVwiLCBtYXJrU2NyaXB0UmVhZHkpO1xucmVnaXN0ZXJTdGVwRnVuY3Rpb24oXCJzdGVwLy8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9leHRyYWN0U3RlcFwiLCBleHRyYWN0U3RlcCk7XG5yZWdpc3RlclN0ZXBGdW5jdGlvbihcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL3NjcmlwdFN0ZXBcIiwgc2NyaXB0U3RlcCk7XG5yZWdpc3RlclN0ZXBGdW5jdGlvbihcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL3N5bnRoZXNpemVTdGVwXCIsIHN5bnRoZXNpemVTdGVwKTtcbnJlZ2lzdGVyU3RlcEZ1bmN0aW9uKFwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vZmFpbFN0ZXBcIiwgZmFpbFN0ZXApO1xuIiwgIi8qKlxuICogU2VyZGUgY29tcGxpYW5jZSBjaGVja2VyIGZvciB3b3JrZmxvdyBjdXN0b20gY2xhc3Mgc2VyaWFsaXphdGlvbi5cbiAqXG4gKiBBbmFseXplcyBzb3VyY2UgY29kZSB0byBkZXRlcm1pbmUgaWYgY2xhc3NlcyB3aXRoIFdPUktGTE9XX1NFUklBTElaRSAvXG4gKiBXT1JLRkxPV19ERVNFUklBTElaRSBhcmUgY29ycmVjdGx5IHNldCB1cCBmb3IgdGhlIHdvcmtmbG93IHNhbmRib3guXG4gKlxuICogVXNlZCBieTpcbiAqIC0gQ0xJIGB2YWxpZGF0ZWAgY29tbWFuZFxuICogLSBDTEkgYHRyYW5zZm9ybWAgY29tbWFuZCAoLS1jaGVjay1zZXJkZSlcbiAqIC0gU1dDIHBsYXlncm91bmQgc2VyZGUgYW5hbHlzaXMgcGFuZWxcbiAqIC0gQnVpbGQtdGltZSB3YXJuaW5ncyBpbiBCYXNlQnVpbGRlclxuICovXG5cbmltcG9ydCBidWlsdGluTW9kdWxlcyBmcm9tICdidWlsdGluLW1vZHVsZXMnO1xuaW1wb3J0IHR5cGUgeyBXb3JrZmxvd01hbmlmZXN0IH0gZnJvbSAnLi9hcHBseS1zd2MtdHJhbnNmb3JtLmpzJztcblxuLy8gQnVpbGQgYSByZWdleCB0aGF0IG1hdGNoZXMgTm9kZS5qcyBidWlsdC1pbiBtb2R1bGUgaW1wb3J0cyBpbiB0cmFuc2Zvcm1lZCBjb2RlLlxuLy8gSGFuZGxlcyBib3RoIEVTTSAoYGZyb20gJ2ZzJ2AsIGBmcm9tICdub2RlOmZzJ2ApIGFuZCBDSlMgKGByZXF1aXJlKCdmcycpYClcbmNvbnN0IG5vZGVCdWlsdGlucyA9IGJ1aWx0aW5Nb2R1bGVzLmpvaW4oJ3wnKTtcblxuLy8gUmVnZXggdG8gZXh0cmFjdCBzcGVjaWZpYyBtb2R1bGUgbmFtZXMgZnJvbSBpbXBvcnQvcmVxdWlyZSBzdGF0ZW1lbnRzXG5jb25zdCBub2RlSW1wb3J0RXh0cmFjdFJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgYCg/OmZyb21cXFxccytbJ1wiXSg/Om5vZGU6KT8oKD86JHtub2RlQnVpbHRpbnN9KSg/Oi9bXidcIl0qKT8pWydcIl1gICtcbiAgICBgfHJlcXVpcmVcXFxccypcXFxcKFxcXFxzKlsnXCJdKD86bm9kZTopPygoPzoke25vZGVCdWlsdGluc30pKD86L1teJ1wiXSopPylbJ1wiXVxcXFxzKlxcXFwpKWAsXG4gICdnJ1xuKTtcblxuLy8gUmVnZXggdG8gZGV0ZWN0IGNsYXNzIHJlZ2lzdHJhdGlvbiBJSUZFcyBnZW5lcmF0ZWQgYnkgdGhlIFNXQyBwbHVnaW5cbmNvbnN0IHJlZ2lzdHJhdGlvbklpZmVSZWdleCA9XG4gIC9TeW1ib2xcXC5mb3JcXHMqXFwoXFxzKltcIiddd29ya2Zsb3ctY2xhc3MtcmVnaXN0cnlbXCInXVxccypcXCkvO1xuXG4vKipcbiAqIFJlc3VsdCBvZiBjaGVja2luZyBhIHNpbmdsZSBjbGFzcyBmb3Igc2VyZGUgY29tcGxpYW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJkZUNsYXNzQ2hlY2tSZXN1bHQge1xuICAvKiogVGhlIGNsYXNzIG5hbWUgYXMgZGV0ZWN0ZWQgaW4gdGhlIHNvdXJjZSAqL1xuICBjbGFzc05hbWU6IHN0cmluZztcbiAgLyoqIFRoZSBjbGFzc0lkIGFzc2lnbmVkIGJ5IHRoZSBTV0MgcGx1Z2luIChmcm9tIHRoZSBtYW5pZmVzdCkgKi9cbiAgY2xhc3NJZDogc3RyaW5nO1xuICAvKiogV2hldGhlciB0aGUgU1dDIHBsdWdpbiBkZXRlY3RlZCBzZXJkZSBzeW1ib2xzIG9uIHRoaXMgY2xhc3MgKi9cbiAgZGV0ZWN0ZWQ6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIGEgcmVnaXN0cmF0aW9uIElJRkUgd2FzIGdlbmVyYXRlZCBpbiB0aGUgb3V0cHV0ICovXG4gIHJlZ2lzdGVyZWQ6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBOb2RlLmpzIGJ1aWx0LWluIG1vZHVsZSBpbXBvcnRzIHJlbWFpbmluZyBpbiB0aGUgd29ya2Zsb3ctbW9kZSBvdXRwdXQuXG4gICAqIElmIG5vbi1lbXB0eSwgdGhlIGNsYXNzIGlzIE5PVCB3b3JrZmxvdy1zYW5kYm94IGNvbXBsaWFudC5cbiAgICovXG4gIG5vZGVJbXBvcnRzOiBzdHJpbmdbXTtcbiAgLyoqIFdoZXRoZXIgdGhlIGNsYXNzIHBhc3NlcyBhbGwgY29tcGxpYW5jZSBjaGVja3MgKi9cbiAgY29tcGxpYW50OiBib29sZWFuO1xuICAvKiogSHVtYW4tcmVhZGFibGUgZGVzY3JpcHRpb25zIG9mIGFueSBpc3N1ZXMgZm91bmQgKi9cbiAgaXNzdWVzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBGdWxsIHJlc3VsdCBvZiBzZXJkZSBjb21wbGlhbmNlIGFuYWx5c2lzIGZvciBhIHNvdXJjZSBmaWxlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlcmRlQ2hlY2tSZXN1bHQge1xuICAvKiogUGVyLWNsYXNzIGFuYWx5c2lzIHJlc3VsdHMgKi9cbiAgY2xhc3NlczogU2VyZGVDbGFzc0NoZWNrUmVzdWx0W107XG4gIC8qKiBBbGwgTm9kZS5qcyBidWlsdC1pbiBpbXBvcnRzIGZvdW5kIGluIHRoZSB3b3JrZmxvdy1tb2RlIG91dHB1dCAqL1xuICBnbG9iYWxOb2RlSW1wb3J0czogc3RyaW5nW107XG4gIC8qKiBXaGV0aGVyIHRoZSB3b3JrZmxvdy1tb2RlIG91dHB1dCBjb250YWlucyBhbnkgc2VyZGUtcmVsYXRlZCBjbGFzc2VzICovXG4gIGhhc1NlcmRlQ2xhc3NlczogYm9vbGVhbjtcbiAgLyoqIFRoZSByYXcgd29ya2Zsb3cgbWFuaWZlc3QgZXh0cmFjdGVkIGZyb20gdGhlIFNXQyB0cmFuc2Zvcm0gKi9cbiAgbWFuaWZlc3Q6IFdvcmtmbG93TWFuaWZlc3Q7XG59XG5cbi8qKlxuICogTGlnaHR3ZWlnaHQgc2VyZGUgY29tcGxpYW5jZSBjaGVja2VyIHRoYXQgd29ya3Mgd2l0aCBwcmUtY29tcHV0ZWRcbiAqIFNXQyB0cmFuc2Zvcm0gcmVzdWx0cy4gVGhpcyBhdm9pZHMgcmUtcnVubmluZyB0aGUgU1dDIHRyYW5zZm9ybVxuICogd2hlbiB0aGUgY2FsbGVyIGFscmVhZHkgaGFzIHRoZSBvdXRwdXRzIChlLmcuLCB0aGUgcGxheWdyb3VuZCBvciBidWlsZGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVTZXJkZUNvbXBsaWFuY2Uob3B0aW9uczoge1xuICAvKiogU291cmNlIGNvZGUgKHVzZWQgZm9yIHBhdHRlcm4gZGV0ZWN0aW9uKSAqL1xuICBzb3VyY2VDb2RlOiBzdHJpbmc7XG4gIC8qKiBXb3JrZmxvdy1tb2RlIHRyYW5zZm9ybWVkIG91dHB1dCAqL1xuICB3b3JrZmxvd0NvZGU6IHN0cmluZztcbiAgLyoqIE1hbmlmZXN0IGV4dHJhY3RlZCBmcm9tIHRoZSBTV0MgdHJhbnNmb3JtICovXG4gIG1hbmlmZXN0OiBXb3JrZmxvd01hbmlmZXN0O1xufSk6IFNlcmRlQ2hlY2tSZXN1bHQge1xuICBjb25zdCB7IHNvdXJjZUNvZGUsIHdvcmtmbG93Q29kZSwgbWFuaWZlc3QgfSA9IG9wdGlvbnM7XG5cbiAgLy8gMS4gRXh0cmFjdCBhbGwgTm9kZS5qcyBidWlsdC1pbiBpbXBvcnRzIGZyb20gdGhlIHdvcmtmbG93IG91dHB1dFxuICBjb25zdCBnbG9iYWxOb2RlSW1wb3J0cyA9IGV4dHJhY3ROb2RlSW1wb3J0cyh3b3JrZmxvd0NvZGUpO1xuXG4gIC8vIDIuIENoZWNrIGlmIHRoZSBtYW5pZmVzdCBjb250YWlucyBhbnkgc2VyZGUtcmVnaXN0ZXJlZCBjbGFzc2VzXG4gIGNvbnN0IGNsYXNzRW50cmllcyA9IGV4dHJhY3RDbGFzc0VudHJpZXMobWFuaWZlc3QpO1xuICBjb25zdCBoYXNTZXJkZUNsYXNzZXMgPSBjbGFzc0VudHJpZXMubGVuZ3RoID4gMDtcblxuICAvLyAzLiBDaGVjayBpZiB0aGUgd29ya2Zsb3cgb3V0cHV0IGNvbnRhaW5zIHJlZ2lzdHJhdGlvbiBJSUZFc1xuICBjb25zdCBoYXNSZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25JaWZlUmVnZXgudGVzdCh3b3JrZmxvd0NvZGUpO1xuXG4gIC8vIDQuIEFuYWx5emUgZWFjaCBjbGFzc1xuICBjb25zdCBjbGFzc2VzOiBTZXJkZUNsYXNzQ2hlY2tSZXN1bHRbXSA9IGNsYXNzRW50cmllcy5tYXAoKGVudHJ5KSA9PiB7XG4gICAgY29uc3QgaXNzdWVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8gQ2hlY2sgZm9yIE5vZGUuanMgaW1wb3J0cyAodGhlc2Ugd2lsbCBmYWlsIGluIHRoZSB3b3JrZmxvdyBzYW5kYm94KVxuICAgIGlmIChnbG9iYWxOb2RlSW1wb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYFdvcmtmbG93IGJ1bmRsZSBjb250YWlucyBOb2RlLmpzIGJ1aWx0LWluIGltcG9ydHM6ICR7Z2xvYmFsTm9kZUltcG9ydHMuam9pbignLCAnKX0uIGAgK1xuICAgICAgICAgIGBUaGVzZSB3aWxsIGZhaWwgYXQgcnVudGltZSBpbiB0aGUgd29ya2Zsb3cgc2FuZGJveC4gYCArXG4gICAgICAgICAgYEFkZCBcInVzZSBzdGVwXCIgdG8gbWV0aG9kcyB0aGF0IGRlcGVuZCBvbiBOb2RlLmpzIEFQSXMgc28gdGhleSBhcmUgc3RyaXBwZWQgZnJvbSB0aGUgd29ya2Zsb3cgYnVuZGxlLmBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHJlZ2lzdHJhdGlvblxuICAgIGlmICghaGFzUmVnaXN0cmF0aW9uKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYE5vIGNsYXNzIHJlZ2lzdHJhdGlvbiBJSUZFIHdhcyBnZW5lcmF0ZWQuIGAgK1xuICAgICAgICAgIGBFbnN1cmUgV09SS0ZMT1dfU0VSSUFMSVpFIGFuZCBXT1JLRkxPV19ERVNFUklBTElaRSBhcmUgZGVmaW5lZCBhcyBzdGF0aWMgbWV0aG9kcyBgICtcbiAgICAgICAgICBgaW5zaWRlIHRoZSBjbGFzcyBib2R5IHVzaW5nIGNvbXB1dGVkIHByb3BlcnR5IHN5bnRheDogc3RhdGljIFtXT1JLRkxPV19TRVJJQUxJWkVdKC4uLikgeyAuLi4gfWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzTmFtZTogZW50cnkuY2xhc3NOYW1lLFxuICAgICAgY2xhc3NJZDogZW50cnkuY2xhc3NJZCxcbiAgICAgIGRldGVjdGVkOiB0cnVlLFxuICAgICAgcmVnaXN0ZXJlZDogaGFzUmVnaXN0cmF0aW9uLFxuICAgICAgbm9kZUltcG9ydHM6IGdsb2JhbE5vZGVJbXBvcnRzLFxuICAgICAgY29tcGxpYW50OiBnbG9iYWxOb2RlSW1wb3J0cy5sZW5ndGggPT09IDAgJiYgaGFzUmVnaXN0cmF0aW9uLFxuICAgICAgaXNzdWVzLFxuICAgIH07XG4gIH0pO1xuXG4gIC8vIDUuIENoZWNrIGZvciBjbGFzc2VzIHRoYXQgaGF2ZSBzZXJkZSBwYXR0ZXJucyBpbiBzb3VyY2UgYnV0IHdlcmVuJ3QgZGV0ZWN0ZWQgYnkgU1dDXG4gIGNvbnN0IHNvdXJjZUhhc1NlcmRlUGF0dGVybnMgPVxuICAgIC9cXFtcXHMqV09SS0ZMT1dfKD86U0VSSUFMSVpFfERFU0VSSUFMSVpFKVxccypcXF0vLnRlc3Qoc291cmNlQ29kZSkgfHxcbiAgICAvU3ltYm9sXFwuZm9yXFxzKlxcKFxccypbJ1wiXXdvcmtmbG93LSg/OnNlcmlhbGl6ZXxkZXNlcmlhbGl6ZSlbJ1wiXVxccypcXCkvLnRlc3QoXG4gICAgICBzb3VyY2VDb2RlXG4gICAgKTtcblxuICBpZiAoc291cmNlSGFzU2VyZGVQYXR0ZXJucyAmJiBjbGFzc0VudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY2xhc3Nlcy5wdXNoKHtcbiAgICAgIGNsYXNzTmFtZTogJzx1bmtub3duPicsXG4gICAgICBjbGFzc0lkOiAnJyxcbiAgICAgIGRldGVjdGVkOiBmYWxzZSxcbiAgICAgIHJlZ2lzdGVyZWQ6IGZhbHNlLFxuICAgICAgbm9kZUltcG9ydHM6IGdsb2JhbE5vZGVJbXBvcnRzLFxuICAgICAgY29tcGxpYW50OiBmYWxzZSxcbiAgICAgIGlzc3VlczogW1xuICAgICAgICBgU291cmNlIGNvZGUgY29udGFpbnMgV09SS0ZMT1dfU0VSSUFMSVpFL1dPUktGTE9XX0RFU0VSSUFMSVpFIHBhdHRlcm5zIGJ1dCBgICtcbiAgICAgICAgICBgdGhlIFNXQyBwbHVnaW4gZGlkIG5vdCBkZXRlY3QgYW55IHNlcmRlLWVuYWJsZWQgY2xhc3Nlcy4gYCArXG4gICAgICAgICAgYEVuc3VyZSB0aGUgc3ltYm9scyBhcmUgZGVmaW5lZCBhcyBzdGF0aWMgbWV0aG9kcyBJTlNJREUgdGhlIGNsYXNzIGJvZHksIGAgK1xuICAgICAgICAgIGBub3QgYXNzaWduZWQgZXh0ZXJuYWxseSAoZS5nLiwgKE15Q2xhc3MgYXMgYW55KVtXT1JLRkxPV19TRVJJQUxJWkVdID0gLi4uKS5gLFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY2xhc3NlcyxcbiAgICBnbG9iYWxOb2RlSW1wb3J0cyxcbiAgICBoYXNTZXJkZUNsYXNzZXMsXG4gICAgbWFuaWZlc3QsXG4gIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBOb2RlLmpzIGJ1aWx0LWluIG1vZHVsZSBuYW1lcyBmcm9tIHRyYW5zZm9ybWVkIGNvZGUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3ROb2RlSW1wb3J0cyhjb2RlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGltcG9ydHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgLy8gUmVzZXQgcmVnZXggc3RhdGVcbiAgbm9kZUltcG9ydEV4dHJhY3RSZWdleC5sYXN0SW5kZXggPSAwO1xuICBmb3IgKFxuICAgIGxldCBtYXRjaCA9IG5vZGVJbXBvcnRFeHRyYWN0UmVnZXguZXhlYyhjb2RlKTtcbiAgICBtYXRjaCAhPT0gbnVsbDtcbiAgICBtYXRjaCA9IG5vZGVJbXBvcnRFeHRyYWN0UmVnZXguZXhlYyhjb2RlKVxuICApIHtcbiAgICAvLyBtYXRjaFsxXSBpcyBmcm9tIHRoZSBFU00gcGF0dGVybiwgbWF0Y2hbMl0gaXMgZnJvbSB0aGUgQ0pTIHBhdHRlcm5cbiAgICBjb25zdCBtb2R1bGVOYW1lID0gbWF0Y2hbMV0gfHwgbWF0Y2hbMl07XG4gICAgaWYgKG1vZHVsZU5hbWUpIHtcbiAgICAgIC8vIE5vcm1hbGl6ZSB0byBiYXNlIG1vZHVsZSBuYW1lIChlLmcuLCAnZnMvcHJvbWlzZXMnIC0+ICdmcycpXG4gICAgICBpbXBvcnRzLmFkZChtb2R1bGVOYW1lLnNwbGl0KCcvJylbMF0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gWy4uLmltcG9ydHNdLnNvcnQoKTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGNsYXNzIGVudHJpZXMgZnJvbSBhIFdvcmtmbG93TWFuaWZlc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Q2xhc3NFbnRyaWVzKFxuICBtYW5pZmVzdDogV29ya2Zsb3dNYW5pZmVzdFxuKTogQXJyYXk8eyBjbGFzc05hbWU6IHN0cmluZzsgY2xhc3NJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH0+IHtcbiAgY29uc3QgZW50cmllczogQXJyYXk8e1xuICAgIGNsYXNzTmFtZTogc3RyaW5nO1xuICAgIGNsYXNzSWQ6IHN0cmluZztcbiAgICBmaWxlTmFtZTogc3RyaW5nO1xuICB9PiA9IFtdO1xuICBpZiAoIW1hbmlmZXN0LmNsYXNzZXMpIHJldHVybiBlbnRyaWVzO1xuXG4gIGZvciAoY29uc3QgW2ZpbGVOYW1lLCBjbGFzc2VzXSBvZiBPYmplY3QuZW50cmllcyhtYW5pZmVzdC5jbGFzc2VzKSkge1xuICAgIGZvciAoY29uc3QgW2NsYXNzTmFtZSwgeyBjbGFzc0lkIH1dIG9mIE9iamVjdC5lbnRyaWVzKGNsYXNzZXMpKSB7XG4gICAgICBlbnRyaWVzLnB1c2goeyBjbGFzc05hbWUsIGNsYXNzSWQsIGZpbGVOYW1lIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZW50cmllcztcbn1cbiIsICIvKipcbiAqIFNlcmRlIGNvbXBsaWFuY2UgY2hlY2tlciBmb3Igd29ya2Zsb3cgY3VzdG9tIGNsYXNzIHNlcmlhbGl6YXRpb24uXG4gKlxuICogQW5hbHl6ZXMgc291cmNlIGNvZGUgdG8gZGV0ZXJtaW5lIGlmIGNsYXNzZXMgd2l0aCBXT1JLRkxPV19TRVJJQUxJWkUgL1xuICogV09SS0ZMT1dfREVTRVJJQUxJWkUgYXJlIGNvcnJlY3RseSBzZXQgdXAgZm9yIHRoZSB3b3JrZmxvdyBzYW5kYm94LlxuICpcbiAqIFVzZWQgYnk6XG4gKiAtIENMSSBgdmFsaWRhdGVgIGNvbW1hbmRcbiAqIC0gQ0xJIGB0cmFuc2Zvcm1gIGNvbW1hbmQgKC0tY2hlY2stc2VyZGUpXG4gKiAtIFNXQyBwbGF5Z3JvdW5kIHNlcmRlIGFuYWx5c2lzIHBhbmVsXG4gKiAtIEJ1aWxkLXRpbWUgd2FybmluZ3MgaW4gQmFzZUJ1aWxkZXJcbiAqL1xuXG5pbXBvcnQgYnVpbHRpbk1vZHVsZXMgZnJvbSAnYnVpbHRpbi1tb2R1bGVzJztcbmltcG9ydCB0eXBlIHsgV29ya2Zsb3dNYW5pZmVzdCB9IGZyb20gJy4vYXBwbHktc3djLXRyYW5zZm9ybS5qcyc7XG5cbi8vIEJ1aWxkIGEgcmVnZXggdGhhdCBtYXRjaGVzIE5vZGUuanMgYnVpbHQtaW4gbW9kdWxlIGltcG9ydHMgaW4gdHJhbnNmb3JtZWQgY29kZS5cbi8vIEhhbmRsZXMgYm90aCBFU00gKGBmcm9tICdmcydgLCBgZnJvbSAnbm9kZTpmcydgKSBhbmQgQ0pTIChgcmVxdWlyZSgnZnMnKWApXG5jb25zdCBub2RlQnVpbHRpbnMgPSBidWlsdGluTW9kdWxlcy5qb2luKCd8Jyk7XG5cbi8vIFJlZ2V4IHRvIGV4dHJhY3Qgc3BlY2lmaWMgbW9kdWxlIG5hbWVzIGZyb20gaW1wb3J0L3JlcXVpcmUgc3RhdGVtZW50c1xuY29uc3Qgbm9kZUltcG9ydEV4dHJhY3RSZWdleCA9IG5ldyBSZWdFeHAoXG4gIGAoPzpmcm9tXFxcXHMrWydcIl0oPzpub2RlOik/KCg/OiR7bm9kZUJ1aWx0aW5zfSkoPzovW14nXCJdKik/KVsnXCJdYCArXG4gICAgYHxyZXF1aXJlXFxcXHMqXFxcXChcXFxccypbJ1wiXSg/Om5vZGU6KT8oKD86JHtub2RlQnVpbHRpbnN9KSg/Oi9bXidcIl0qKT8pWydcIl1cXFxccypcXFxcKSlgLFxuICAnZydcbik7XG5cbi8vIFJlZ2V4IHRvIGRldGVjdCBjbGFzcyByZWdpc3RyYXRpb24gSUlGRXMgZ2VuZXJhdGVkIGJ5IHRoZSBTV0MgcGx1Z2luXG5jb25zdCByZWdpc3RyYXRpb25JaWZlUmVnZXggPVxuICAvU3ltYm9sXFwuZm9yXFxzKlxcKFxccypbXCInXXdvcmtmbG93LWNsYXNzLXJlZ2lzdHJ5W1wiJ11cXHMqXFwpLztcblxuLyoqXG4gKiBSZXN1bHQgb2YgY2hlY2tpbmcgYSBzaW5nbGUgY2xhc3MgZm9yIHNlcmRlIGNvbXBsaWFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VyZGVDbGFzc0NoZWNrUmVzdWx0IHtcbiAgLyoqIFRoZSBjbGFzcyBuYW1lIGFzIGRldGVjdGVkIGluIHRoZSBzb3VyY2UgKi9cbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIC8qKiBUaGUgY2xhc3NJZCBhc3NpZ25lZCBieSB0aGUgU1dDIHBsdWdpbiAoZnJvbSB0aGUgbWFuaWZlc3QpICovXG4gIGNsYXNzSWQ6IHN0cmluZztcbiAgLyoqIFdoZXRoZXIgdGhlIFNXQyBwbHVnaW4gZGV0ZWN0ZWQgc2VyZGUgc3ltYm9scyBvbiB0aGlzIGNsYXNzICovXG4gIGRldGVjdGVkOiBib29sZWFuO1xuICAvKiogV2hldGhlciBhIHJlZ2lzdHJhdGlvbiBJSUZFIHdhcyBnZW5lcmF0ZWQgaW4gdGhlIG91dHB1dCAqL1xuICByZWdpc3RlcmVkOiBib29sZWFuO1xuICAvKipcbiAgICogTm9kZS5qcyBidWlsdC1pbiBtb2R1bGUgaW1wb3J0cyByZW1haW5pbmcgaW4gdGhlIHdvcmtmbG93LW1vZGUgb3V0cHV0LlxuICAgKiBJZiBub24tZW1wdHksIHRoZSBjbGFzcyBpcyBOT1Qgd29ya2Zsb3ctc2FuZGJveCBjb21wbGlhbnQuXG4gICAqL1xuICBub2RlSW1wb3J0czogc3RyaW5nW107XG4gIC8qKiBXaGV0aGVyIHRoZSBjbGFzcyBwYXNzZXMgYWxsIGNvbXBsaWFuY2UgY2hlY2tzICovXG4gIGNvbXBsaWFudDogYm9vbGVhbjtcbiAgLyoqIEh1bWFuLXJlYWRhYmxlIGRlc2NyaXB0aW9ucyBvZiBhbnkgaXNzdWVzIGZvdW5kICovXG4gIGlzc3Vlczogc3RyaW5nW107XG59XG5cbi8qKlxuICogRnVsbCByZXN1bHQgb2Ygc2VyZGUgY29tcGxpYW5jZSBhbmFseXNpcyBmb3IgYSBzb3VyY2UgZmlsZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJkZUNoZWNrUmVzdWx0IHtcbiAgLyoqIFBlci1jbGFzcyBhbmFseXNpcyByZXN1bHRzICovXG4gIGNsYXNzZXM6IFNlcmRlQ2xhc3NDaGVja1Jlc3VsdFtdO1xuICAvKiogQWxsIE5vZGUuanMgYnVpbHQtaW4gaW1wb3J0cyBmb3VuZCBpbiB0aGUgd29ya2Zsb3ctbW9kZSBvdXRwdXQgKi9cbiAgZ2xvYmFsTm9kZUltcG9ydHM6IHN0cmluZ1tdO1xuICAvKiogV2hldGhlciB0aGUgd29ya2Zsb3ctbW9kZSBvdXRwdXQgY29udGFpbnMgYW55IHNlcmRlLXJlbGF0ZWQgY2xhc3NlcyAqL1xuICBoYXNTZXJkZUNsYXNzZXM6IGJvb2xlYW47XG4gIC8qKiBUaGUgcmF3IHdvcmtmbG93IG1hbmlmZXN0IGV4dHJhY3RlZCBmcm9tIHRoZSBTV0MgdHJhbnNmb3JtICovXG4gIG1hbmlmZXN0OiBXb3JrZmxvd01hbmlmZXN0O1xufVxuXG4vKipcbiAqIExpZ2h0d2VpZ2h0IHNlcmRlIGNvbXBsaWFuY2UgY2hlY2tlciB0aGF0IHdvcmtzIHdpdGggcHJlLWNvbXB1dGVkXG4gKiBTV0MgdHJhbnNmb3JtIHJlc3VsdHMuIFRoaXMgYXZvaWRzIHJlLXJ1bm5pbmcgdGhlIFNXQyB0cmFuc2Zvcm1cbiAqIHdoZW4gdGhlIGNhbGxlciBhbHJlYWR5IGhhcyB0aGUgb3V0cHV0cyAoZS5nLiwgdGhlIHBsYXlncm91bmQgb3IgYnVpbGRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplU2VyZGVDb21wbGlhbmNlKG9wdGlvbnM6IHtcbiAgLyoqIFNvdXJjZSBjb2RlICh1c2VkIGZvciBwYXR0ZXJuIGRldGVjdGlvbikgKi9cbiAgc291cmNlQ29kZTogc3RyaW5nO1xuICAvKiogV29ya2Zsb3ctbW9kZSB0cmFuc2Zvcm1lZCBvdXRwdXQgKi9cbiAgd29ya2Zsb3dDb2RlOiBzdHJpbmc7XG4gIC8qKiBNYW5pZmVzdCBleHRyYWN0ZWQgZnJvbSB0aGUgU1dDIHRyYW5zZm9ybSAqL1xuICBtYW5pZmVzdDogV29ya2Zsb3dNYW5pZmVzdDtcbn0pOiBTZXJkZUNoZWNrUmVzdWx0IHtcbiAgY29uc3QgeyBzb3VyY2VDb2RlLCB3b3JrZmxvd0NvZGUsIG1hbmlmZXN0IH0gPSBvcHRpb25zO1xuXG4gIC8vIDEuIEV4dHJhY3QgYWxsIE5vZGUuanMgYnVpbHQtaW4gaW1wb3J0cyBmcm9tIHRoZSB3b3JrZmxvdyBvdXRwdXRcbiAgY29uc3QgZ2xvYmFsTm9kZUltcG9ydHMgPSBleHRyYWN0Tm9kZUltcG9ydHMod29ya2Zsb3dDb2RlKTtcblxuICAvLyAyLiBDaGVjayBpZiB0aGUgbWFuaWZlc3QgY29udGFpbnMgYW55IHNlcmRlLXJlZ2lzdGVyZWQgY2xhc3Nlc1xuICBjb25zdCBjbGFzc0VudHJpZXMgPSBleHRyYWN0Q2xhc3NFbnRyaWVzKG1hbmlmZXN0KTtcbiAgY29uc3QgaGFzU2VyZGVDbGFzc2VzID0gY2xhc3NFbnRyaWVzLmxlbmd0aCA+IDA7XG5cbiAgLy8gMy4gQ2hlY2sgaWYgdGhlIHdvcmtmbG93IG91dHB1dCBjb250YWlucyByZWdpc3RyYXRpb24gSUlGRXNcbiAgY29uc3QgaGFzUmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uSWlmZVJlZ2V4LnRlc3Qod29ya2Zsb3dDb2RlKTtcblxuICAvLyA0LiBBbmFseXplIGVhY2ggY2xhc3NcbiAgY29uc3QgY2xhc3NlczogU2VyZGVDbGFzc0NoZWNrUmVzdWx0W10gPSBjbGFzc0VudHJpZXMubWFwKChlbnRyeSkgPT4ge1xuICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIENoZWNrIGZvciBOb2RlLmpzIGltcG9ydHMgKHRoZXNlIHdpbGwgZmFpbCBpbiB0aGUgd29ya2Zsb3cgc2FuZGJveClcbiAgICBpZiAoZ2xvYmFsTm9kZUltcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgaXNzdWVzLnB1c2goXG4gICAgICAgIGBXb3JrZmxvdyBidW5kbGUgY29udGFpbnMgTm9kZS5qcyBidWlsdC1pbiBpbXBvcnRzOiAke2dsb2JhbE5vZGVJbXBvcnRzLmpvaW4oJywgJyl9LiBgICtcbiAgICAgICAgICBgVGhlc2Ugd2lsbCBmYWlsIGF0IHJ1bnRpbWUgaW4gdGhlIHdvcmtmbG93IHNhbmRib3guIGAgK1xuICAgICAgICAgIGBBZGQgXCJ1c2Ugc3RlcFwiIHRvIG1ldGhvZHMgdGhhdCBkZXBlbmQgb24gTm9kZS5qcyBBUElzIHNvIHRoZXkgYXJlIHN0cmlwcGVkIGZyb20gdGhlIHdvcmtmbG93IGJ1bmRsZS5gXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciByZWdpc3RyYXRpb25cbiAgICBpZiAoIWhhc1JlZ2lzdHJhdGlvbikge1xuICAgICAgaXNzdWVzLnB1c2goXG4gICAgICAgIGBObyBjbGFzcyByZWdpc3RyYXRpb24gSUlGRSB3YXMgZ2VuZXJhdGVkLiBgICtcbiAgICAgICAgICBgRW5zdXJlIFdPUktGTE9XX1NFUklBTElaRSBhbmQgV09SS0ZMT1dfREVTRVJJQUxJWkUgYXJlIGRlZmluZWQgYXMgc3RhdGljIG1ldGhvZHMgYCArXG4gICAgICAgICAgYGluc2lkZSB0aGUgY2xhc3MgYm9keSB1c2luZyBjb21wdXRlZCBwcm9wZXJ0eSBzeW50YXg6IHN0YXRpYyBbV09SS0ZMT1dfU0VSSUFMSVpFXSguLi4pIHsgLi4uIH1gXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjbGFzc05hbWU6IGVudHJ5LmNsYXNzTmFtZSxcbiAgICAgIGNsYXNzSWQ6IGVudHJ5LmNsYXNzSWQsXG4gICAgICBkZXRlY3RlZDogdHJ1ZSxcbiAgICAgIHJlZ2lzdGVyZWQ6IGhhc1JlZ2lzdHJhdGlvbixcbiAgICAgIG5vZGVJbXBvcnRzOiBnbG9iYWxOb2RlSW1wb3J0cyxcbiAgICAgIGNvbXBsaWFudDogZ2xvYmFsTm9kZUltcG9ydHMubGVuZ3RoID09PSAwICYmIGhhc1JlZ2lzdHJhdGlvbixcbiAgICAgIGlzc3VlcyxcbiAgICB9O1xuICB9KTtcblxuICAvLyA1LiBDaGVjayBmb3IgY2xhc3NlcyB0aGF0IGhhdmUgc2VyZGUgcGF0dGVybnMgaW4gc291cmNlIGJ1dCB3ZXJlbid0IGRldGVjdGVkIGJ5IFNXQ1xuICBjb25zdCBzb3VyY2VIYXNTZXJkZVBhdHRlcm5zID1cbiAgICAvXFxbXFxzKldPUktGTE9XXyg/OlNFUklBTElaRXxERVNFUklBTElaRSlcXHMqXFxdLy50ZXN0KHNvdXJjZUNvZGUpIHx8XG4gICAgL1N5bWJvbFxcLmZvclxccypcXChcXHMqWydcIl13b3JrZmxvdy0oPzpzZXJpYWxpemV8ZGVzZXJpYWxpemUpWydcIl1cXHMqXFwpLy50ZXN0KFxuICAgICAgc291cmNlQ29kZVxuICAgICk7XG5cbiAgaWYgKHNvdXJjZUhhc1NlcmRlUGF0dGVybnMgJiYgY2xhc3NFbnRyaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNsYXNzZXMucHVzaCh7XG4gICAgICBjbGFzc05hbWU6ICc8dW5rbm93bj4nLFxuICAgICAgY2xhc3NJZDogJycsXG4gICAgICBkZXRlY3RlZDogZmFsc2UsXG4gICAgICByZWdpc3RlcmVkOiBmYWxzZSxcbiAgICAgIG5vZGVJbXBvcnRzOiBnbG9iYWxOb2RlSW1wb3J0cyxcbiAgICAgIGNvbXBsaWFudDogZmFsc2UsXG4gICAgICBpc3N1ZXM6IFtcbiAgICAgICAgYFNvdXJjZSBjb2RlIGNvbnRhaW5zIFdPUktGTE9XX1NFUklBTElaRS9XT1JLRkxPV19ERVNFUklBTElaRSBwYXR0ZXJucyBidXQgYCArXG4gICAgICAgICAgYHRoZSBTV0MgcGx1Z2luIGRpZCBub3QgZGV0ZWN0IGFueSBzZXJkZS1lbmFibGVkIGNsYXNzZXMuIGAgK1xuICAgICAgICAgIGBFbnN1cmUgdGhlIHN5bWJvbHMgYXJlIGRlZmluZWQgYXMgc3RhdGljIG1ldGhvZHMgSU5TSURFIHRoZSBjbGFzcyBib2R5LCBgICtcbiAgICAgICAgICBgbm90IGFzc2lnbmVkIGV4dGVybmFsbHkgKGUuZy4sIChNeUNsYXNzIGFzIGFueSlbV09SS0ZMT1dfU0VSSUFMSVpFXSA9IC4uLikuYCxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNsYXNzZXMsXG4gICAgZ2xvYmFsTm9kZUltcG9ydHMsXG4gICAgaGFzU2VyZGVDbGFzc2VzLFxuICAgIG1hbmlmZXN0LFxuICB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgTm9kZS5qcyBidWlsdC1pbiBtb2R1bGUgbmFtZXMgZnJvbSB0cmFuc2Zvcm1lZCBjb2RlLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Tm9kZUltcG9ydHMoY29kZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBpbXBvcnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIC8vIFJlc2V0IHJlZ2V4IHN0YXRlXG4gIG5vZGVJbXBvcnRFeHRyYWN0UmVnZXgubGFzdEluZGV4ID0gMDtcbiAgZm9yIChcbiAgICBsZXQgbWF0Y2ggPSBub2RlSW1wb3J0RXh0cmFjdFJlZ2V4LmV4ZWMoY29kZSk7XG4gICAgbWF0Y2ggIT09IG51bGw7XG4gICAgbWF0Y2ggPSBub2RlSW1wb3J0RXh0cmFjdFJlZ2V4LmV4ZWMoY29kZSlcbiAgKSB7XG4gICAgLy8gbWF0Y2hbMV0gaXMgZnJvbSB0aGUgRVNNIHBhdHRlcm4sIG1hdGNoWzJdIGlzIGZyb20gdGhlIENKUyBwYXR0ZXJuXG4gICAgY29uc3QgbW9kdWxlTmFtZSA9IG1hdGNoWzFdIHx8IG1hdGNoWzJdO1xuICAgIGlmIChtb2R1bGVOYW1lKSB7XG4gICAgICAvLyBOb3JtYWxpemUgdG8gYmFzZSBtb2R1bGUgbmFtZSAoZS5nLiwgJ2ZzL3Byb21pc2VzJyAtPiAnZnMnKVxuICAgICAgaW1wb3J0cy5hZGQobW9kdWxlTmFtZS5zcGxpdCgnLycpWzBdKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFsuLi5pbXBvcnRzXS5zb3J0KCk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBjbGFzcyBlbnRyaWVzIGZyb20gYSBXb3JrZmxvd01hbmlmZXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdENsYXNzRW50cmllcyhcbiAgbWFuaWZlc3Q6IFdvcmtmbG93TWFuaWZlc3Rcbik6IEFycmF5PHsgY2xhc3NOYW1lOiBzdHJpbmc7IGNsYXNzSWQ6IHN0cmluZzsgZmlsZU5hbWU6IHN0cmluZyB9PiB7XG4gIGNvbnN0IGVudHJpZXM6IEFycmF5PHtcbiAgICBjbGFzc05hbWU6IHN0cmluZztcbiAgICBjbGFzc0lkOiBzdHJpbmc7XG4gICAgZmlsZU5hbWU6IHN0cmluZztcbiAgfT4gPSBbXTtcbiAgaWYgKCFtYW5pZmVzdC5jbGFzc2VzKSByZXR1cm4gZW50cmllcztcblxuICBmb3IgKGNvbnN0IFtmaWxlTmFtZSwgY2xhc3Nlc10gb2YgT2JqZWN0LmVudHJpZXMobWFuaWZlc3QuY2xhc3NlcykpIHtcbiAgICBmb3IgKGNvbnN0IFtjbGFzc05hbWUsIHsgY2xhc3NJZCB9XSBvZiBPYmplY3QuZW50cmllcyhjbGFzc2VzKSkge1xuICAgICAgZW50cmllcy5wdXNoKHsgY2xhc3NOYW1lLCBjbGFzc0lkLCBmaWxlTmFtZSB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGVudHJpZXM7XG59XG4iLCAiaW1wb3J0IHtcbiAgQ29ycnVwdGVkRXZlbnRMb2dFcnJvcixcbiAgRW50aXR5Q29uZmxpY3RFcnJvcixcbiAgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IsXG4gIFJlcGxheURpdmVyZ2VuY2VFcnJvcixcbiAgUlVOX0VSUk9SX0NPREVTLFxuICBSdW5FeHBpcmVkRXJyb3IsXG4gIFdvcmtmbG93UnVudGltZUVycm9yLFxufSBmcm9tICdAd29ya2Zsb3cvZXJyb3JzJztcbmltcG9ydCB7IHNldFdvcmtmbG93QmFzZVBhdGggfSBmcm9tICdAd29ya2Zsb3cvdXRpbHMnO1xuaW1wb3J0IHsgcGFyc2VXb3JrZmxvd05hbWUgfSBmcm9tICdAd29ya2Zsb3cvdXRpbHMvcGFyc2UtbmFtZSc7XG5pbXBvcnQge1xuICB0eXBlIEV2ZW50LFxuICBnZXRRdWV1ZVRvcGljUHJlZml4LFxuICByZXNvbHZlUXVldWVOYW1lc3BhY2UsXG4gIFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICBTUEVDX1ZFUlNJT05fTEVHQUNZLFxuICBXb3JrZmxvd0ludm9rZVBheWxvYWRTY2hlbWEsXG4gIHR5cGUgV29ya2Zsb3dSdW4sXG59IGZyb20gJ0B3b3JrZmxvdy93b3JsZCc7XG5pbXBvcnQge1xuICBjbGFzc2lmeVJ1bkVycm9yLFxuICBpc1JldHJ5YWJsZVdvcmxkRXJyb3IsXG4gIGlzV29ybGRDb250cmFjdEVycm9yLFxufSBmcm9tICcuL2NsYXNzaWZ5LWVycm9yLmpzJztcbmltcG9ydCB7IGltcG9ydEtleSB9IGZyb20gJy4vZW5jcnlwdGlvbi5qcyc7XG5pbXBvcnQgeyBXb3JrZmxvd1N1c3BlbnNpb24gfSBmcm9tICcuL2dsb2JhbC5qcyc7XG5pbXBvcnQgeyBydW50aW1lTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXIuanMnO1xuaW1wb3J0IHtcbiAgTUFYX1FVRVVFX0RFTElWRVJJRVMsXG4gIFJFUExBWV9ESVZFUkdFTkNFX01BWF9SRVRSSUVTLFxuICBSRVBMQVlfVElNRU9VVF9NQVhfUkVUUklFUyxcbiAgUkVQTEFZX1RJTUVPVVRfTVMsXG59IGZyb20gJy4vcnVudGltZS9jb25zdGFudHMuanMnO1xuaW1wb3J0IHtcbiAgZ2V0UXVldWVPdmVyaGVhZCxcbiAgZ2V0V29ya2Zsb3dRdWV1ZU5hbWUsXG4gIGdldFdvcmtmbG93UnVuRXZlbnRzLFxuICBoYW5kbGVIZWFsdGhDaGVja01lc3NhZ2UsXG4gIHR5cGUgTXV0YWJsZUV2ZW50TG9nLFxuICBwYXJzZUhlYWx0aENoZWNrUGF5bG9hZCxcbiAgcXVldWVNZXNzYWdlLFxuICBzdGF0ZVVwZGF0ZWRBdEZvckNyZWF0ZSxcbiAgd2l0aEhlYWx0aENoZWNrLFxuICB3aXRoUHJlY29uZGl0aW9uUmV0cnksXG59IGZyb20gJy4vcnVudGltZS9oZWxwZXJzLmpzJztcbmltcG9ydCB7IGhhbmRsZVN1c3BlbnNpb24gfSBmcm9tICcuL3J1bnRpbWUvc3VzcGVuc2lvbi1oYW5kbGVyLmpzJztcbmltcG9ydCB7IGdldFdvcmxkLCBnZXRXb3JsZEhhbmRsZXJzIH0gZnJvbSAnLi9ydW50aW1lL3dvcmxkLmpzJztcbmltcG9ydCB7IHJlbWFwRXJyb3JTdGFjayB9IGZyb20gJy4vc291cmNlLW1hcC5qcyc7XG5pbXBvcnQgKiBhcyBBdHRyaWJ1dGUgZnJvbSAnLi90ZWxlbWV0cnkvc2VtYW50aWMtY29udmVudGlvbnMuanMnO1xuaW1wb3J0IHtcbiAgbGlua1RvQ3VycmVudENvbnRleHQsXG4gIHRyYWNlLFxuICB3aXRoVHJhY2VDb250ZXh0LFxuICB3aXRoV29ya2Zsb3dCYWdnYWdlLFxufSBmcm9tICcuL3RlbGVtZXRyeS5qcyc7XG5pbXBvcnQgeyBnZXRFcnJvck5hbWUsIGdldEVycm9yU3RhY2ssIG5vcm1hbGl6ZVVua25vd25FcnJvciB9IGZyb20gJy4vdHlwZXMuanMnO1xuaW1wb3J0IHsgYnVpbGRXb3JrZmxvd1N1c3BlbnNpb25NZXNzYWdlIH0gZnJvbSAnLi91dGlsLmpzJztcbmltcG9ydCB7IHJ1bldvcmtmbG93IH0gZnJvbSAnLi93b3JrZmxvdy5qcyc7XG5cbmV4cG9ydCB0eXBlIHsgRXZlbnQsIFdvcmtmbG93UnVuIH07XG5leHBvcnQgeyBXb3JrZmxvd1N1c3BlbnNpb24gfSBmcm9tICcuL2dsb2JhbC5qcyc7XG5leHBvcnQge1xuICB0eXBlIEhlYWx0aENoZWNrRW5kcG9pbnQsXG4gIHR5cGUgSGVhbHRoQ2hlY2tPcHRpb25zLFxuICB0eXBlIEhlYWx0aENoZWNrUmVzdWx0LFxuICBoZWFsdGhDaGVjayxcbn0gZnJvbSAnLi9ydW50aW1lL2hlbHBlcnMuanMnO1xuZXhwb3J0IHtcbiAgZ2V0SG9va0J5VG9rZW4sXG4gIHJlc3VtZUhvb2ssXG4gIHJlc3VtZVdlYmhvb2ssXG59IGZyb20gJy4vcnVudGltZS9yZXN1bWUtaG9vay5qcyc7XG5leHBvcnQge1xuICBnZXRSdW4sXG4gIFJ1bixcbiAgdHlwZSBXb3JrZmxvd1JlYWRhYmxlU3RyZWFtLFxuICB0eXBlIFdvcmtmbG93UmVhZGFibGVTdHJlYW1PcHRpb25zLFxufSBmcm9tICcuL3J1bnRpbWUvcnVuLmpzJztcbmV4cG9ydCB7XG4gIGNhbmNlbFJ1bixcbiAgbGlzdFN0cmVhbXMsXG4gIHR5cGUgUmVhZFN0cmVhbU9wdGlvbnMsXG4gIHR5cGUgUmVjcmVhdGVSdW5PcHRpb25zLFxuICByZWFkU3RyZWFtLFxuICByZWNyZWF0ZVJ1bkZyb21FeGlzdGluZyxcbiAgcmVlbnF1ZXVlUnVuLFxuICB0eXBlIFN0b3BTbGVlcE9wdGlvbnMsXG4gIHR5cGUgU3RvcFNsZWVwUmVzdWx0LFxuICB3YWtlVXBSdW4sXG59IGZyb20gJy4vcnVudGltZS9ydW5zLmpzJztcbmV4cG9ydCB7XG4gIHR5cGUgU3RhcnRPcHRpb25zLFxuICB0eXBlIFN0YXJ0T3B0aW9uc0Jhc2UsXG4gIHR5cGUgU3RhcnRPcHRpb25zV2l0aERlcGxveW1lbnRJZCxcbiAgdHlwZSBTdGFydE9wdGlvbnNXaXRob3V0RGVwbG95bWVudElkLFxuICBzdGFydCxcbn0gZnJvbSAnLi9ydW50aW1lL3N0YXJ0LmpzJztcbmV4cG9ydCB7IHN0ZXBFbnRyeXBvaW50IH0gZnJvbSAnLi9ydW50aW1lL3N0ZXAtaGFuZGxlci5qcyc7XG5leHBvcnQge1xuICBjcmVhdGVXb3JsZCxcbiAgZ2V0V29ybGQsXG4gIGdldFdvcmxkSGFuZGxlcnMsXG4gIHNldFdvcmxkLFxufSBmcm9tICcuL3J1bnRpbWUvd29ybGQuanMnO1xuXG5mdW5jdGlvbiBoYXNSZWNvcmRlZFRlcm1pbmFsUnVuRXZlbnQoZXZlbnRzOiBFdmVudFtdLCBydW5JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRlcm1pbmFsRXZlbnQgPSBldmVudHMuZmluZChcbiAgICAoZXZlbnQpID0+XG4gICAgICBldmVudC5ydW5JZCA9PT0gcnVuSWQgJiZcbiAgICAgIChldmVudC5ldmVudFR5cGUgPT09ICdydW5fY29tcGxldGVkJyB8fFxuICAgICAgICBldmVudC5ldmVudFR5cGUgPT09ICdydW5fZmFpbGVkJyB8fFxuICAgICAgICBldmVudC5ldmVudFR5cGUgPT09ICdydW5fY2FuY2VsbGVkJylcbiAgKTtcblxuICBpZiAoIXRlcm1pbmFsRXZlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBydW50aW1lTG9nZ2VyLmluZm8oXG4gICAgJ1dvcmtmbG93IGV2ZW50IGxvZyBhbHJlYWR5IGNvbnRhaW5zIGEgdGVybWluYWwgcnVuIGV2ZW50LCBza2lwcGluZyByZXBsYXknLFxuICAgIHtcbiAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgZXZlbnRUeXBlOiB0ZXJtaW5hbEV2ZW50LmV2ZW50VHlwZSxcbiAgICAgIGV2ZW50SWQ6IHRlcm1pbmFsRXZlbnQuZXZlbnRJZCxcbiAgICB9XG4gICk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBhIHNpbmdsZSByb3V0ZSB3aGljaCBoYW5kbGVzIGFueSB3b3JrZmxvdyBleGVjdXRpb25cbiAqIHJlcXVlc3QgYW5kIHJvdXRlcyB0byB0aGUgYXBwcm9wcmlhdGUgd29ya2Zsb3cgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHdvcmtmbG93Q29kZSAtIFRoZSB3b3JrZmxvdyBidW5kbGUgY29kZSBjb250YWluaW5nIGFsbCB0aGUgd29ya2Zsb3dcbiAqIGZ1bmN0aW9ucyBhdCB0aGUgdG9wIGxldmVsLlxuICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIGFzIGEgVmVyY2VsIEFQSSByb3V0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdvcmtmbG93RW50cnlwb2ludChcbiAgd29ya2Zsb3dDb2RlOiBzdHJpbmcsXG4gIG9wdGlvbnM/OiB7IG5hbWVzcGFjZT86IHN0cmluZzsgYmFzZVBhdGg/OiBzdHJpbmcgfVxuKTogKHJlcTogUmVxdWVzdCkgPT4gUHJvbWlzZTxSZXNwb25zZT4ge1xuICBzZXRXb3JrZmxvd0Jhc2VQYXRoKG9wdGlvbnM/LmJhc2VQYXRoKTtcblxuICBjb25zdCBuYW1lc3BhY2UgPSByZXNvbHZlUXVldWVOYW1lc3BhY2Uob3B0aW9ucz8ubmFtZXNwYWNlKTtcbiAgY29uc3Qgd29ya2Zsb3dQcmVmaXggPSBnZXRRdWV1ZVRvcGljUHJlZml4KCd3b3JrZmxvdycsIG5hbWVzcGFjZSk7XG5cbiAgY29uc3QgeyBjcmVhdGVRdWV1ZUhhbmRsZXIsIHNwZWNWZXJzaW9uOiB3b3JsZFNwZWNWZXJzaW9uIH0gPVxuICAgIGdldFdvcmxkSGFuZGxlcnMoKTtcbiAgY29uc3QgaGFuZGxlciA9IGNyZWF0ZVF1ZXVlSGFuZGxlcihcbiAgICB3b3JrZmxvd1ByZWZpeCxcbiAgICBhc3luYyAobWVzc2FnZV8sIG1ldGFkYXRhKSA9PiB7XG4gICAgICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgaGVhbHRoIGNoZWNrIG1lc3NhZ2VcbiAgICAgIC8vIE5PVEU6IEhlYWx0aCBjaGVjayBtZXNzYWdlcyBhcmUgaW50ZW50aW9uYWxseSB1bmF1dGhlbnRpY2F0ZWQgZm9yIG1vbml0b3JpbmcgcHVycG9zZXMuXG4gICAgICAvLyBUaGV5IG9ubHkgd3JpdGUgYSBzaW1wbGUgc3RhdHVzIHJlc3BvbnNlIHRvIGEgc3RyZWFtIGFuZCBkbyBub3QgZXhwb3NlIHNlbnNpdGl2ZSBkYXRhLlxuICAgICAgLy8gVGhlIHN0cmVhbSBuYW1lIGluY2x1ZGVzIGEgdW5pcXVlIGNvcnJlbGF0aW9uSWQgdGhhdCBtdXN0IGJlIGtub3duIGJ5IHRoZSBjYWxsZXIuXG4gICAgICBjb25zdCBoZWFsdGhDaGVjayA9IHBhcnNlSGVhbHRoQ2hlY2tQYXlsb2FkKG1lc3NhZ2VfKTtcbiAgICAgIGlmIChoZWFsdGhDaGVjaykge1xuICAgICAgICBhd2FpdCBoYW5kbGVIZWFsdGhDaGVja01lc3NhZ2UoXG4gICAgICAgICAgaGVhbHRoQ2hlY2ssXG4gICAgICAgICAgJ3dvcmtmbG93JyxcbiAgICAgICAgICB3b3JsZFNwZWNWZXJzaW9uXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICBydW5JZCxcbiAgICAgICAgdHJhY2VDYXJyaWVyOiB0cmFjZUNvbnRleHQsXG4gICAgICAgIHJlcXVlc3RlZEF0LFxuICAgICAgICByZXBsYXlEaXZlcmdlbmNlLFxuICAgICAgICBydW5JbnB1dCxcbiAgICAgIH0gPSBXb3JrZmxvd0ludm9rZVBheWxvYWRTY2hlbWEucGFyc2UobWVzc2FnZV8pO1xuICAgICAgY29uc3QgeyByZXF1ZXN0SWQgfSA9IG1ldGFkYXRhO1xuICAgICAgLy8gRXh0cmFjdCB0aGUgd29ya2Zsb3cgbmFtZSBmcm9tIHRoZSB0b3BpYyBuYW1lXG4gICAgICBjb25zdCB3b3JrZmxvd05hbWUgPSBtZXRhZGF0YS5xdWV1ZU5hbWUuc2xpY2Uod29ya2Zsb3dQcmVmaXgubGVuZ3RoKTtcblxuICAgICAgLy8gLS0tIE1heCBkZWxpdmVyeSBjaGVjayAtLS1cbiAgICAgIC8vIEVuZm9yY2UgbWF4IGRlbGl2ZXJ5IGxpbWl0IGJlZm9yZSBhbnkgaW5mcmFzdHJ1Y3R1cmUgY2FsbHMuXG4gICAgICAvLyBUaGlzIHByZXZlbnRzIHJ1bmF3YXkgd29ya2Zsb3dzIGZyb20gY29uc3VtaW5nIGluZmluaXRlIHF1ZXVlIGRlbGl2ZXJpZXMuXG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSB3YW50IHRvIGRvIHRoZSBtaW5pbWFsIGFtb3VudCBvZiB3b3JrIChubyBmZXRjaGluZ1xuICAgICAgLy8gb2YgdGhlIHdvcmtmbG93IGV2ZW50cywgZXRjLiBXZSBzaW1wbHkgYXR0ZW1wdCB0byBtYXJrIHRoZSBydW4gYXMgZmFpbGVkXG4gICAgICAvLyBhbmQgaWYgdGhhdCBmYWlscywgdGhlIG1lc3NhZ2UgaXMgc3RpbGwgY29uc3VtZWQgYnV0IHdpdGggYWRlcXVhdGUgbG9nZ2luZ1xuICAgICAgLy8gdGhhdCBhbiBlcnJvciBvY2N1cnJlZCBwcmV2ZW50aW5nIHVzIGZyb20gZmFpbGluZyB0aGUgcnVuLlxuICAgICAgaWYgKG1ldGFkYXRhLmF0dGVtcHQgPiBNQVhfUVVFVUVfREVMSVZFUklFUykge1xuICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgIGBXb3JrZmxvdyBoYW5kbGVyIGV4Y2VlZGVkIG1heCBkZWxpdmVyaWVzICgke21ldGFkYXRhLmF0dGVtcHR9LyR7TUFYX1FVRVVFX0RFTElWRVJJRVN9KWAsXG4gICAgICAgICAgeyB3b3JrZmxvd1J1bklkOiBydW5JZCwgd29ya2Zsb3dOYW1lLCBhdHRlbXB0OiBtZXRhZGF0YS5hdHRlbXB0IH1cbiAgICAgICAgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB3b3JsZCA9IGdldFdvcmxkKCk7XG4gICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFdvcmtmbG93IGV4Y2VlZGVkIG1heGltdW0gcXVldWUgZGVsaXZlcmllcyAoJHttZXRhZGF0YS5hdHRlbXB0fS8ke01BWF9RVUVVRV9ERUxJVkVSSUVTfSlgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuTUFYX0RFTElWRVJJRVNfRVhDRUVERUQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeyByZXF1ZXN0SWQgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmIChFbnRpdHlDb25mbGljdEVycm9yLmlzKGVycikgfHwgUnVuRXhwaXJlZEVycm9yLmlzKGVycikpIHtcbiAgICAgICAgICAgIC8vIFJ1biBhbHJlYWR5IGZpbmlzaGVkLCBjb25zdW1lIHRoZSBtZXNzYWdlIHNpbGVudGx5XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICBgRmFpbGVkIHRvIG1hcmsgcnVuIGFzIGZhaWxlZCBhZnRlciAke21ldGFkYXRhLmF0dGVtcHR9IGRlbGl2ZXJ5IGF0dGVtcHRzLiBgICtcbiAgICAgICAgICAgICAgYEEgcGVyc2lzdGVudCBlcnJvciBpcyBwcmV2ZW50aW5nIHRoZSBydW4gZnJvbSBiZWluZyB0ZXJtaW5hdGVkLiBgICtcbiAgICAgICAgICAgICAgYFRoZSBydW4gd2lsbCByZW1haW4gaW4gaXRzIGN1cnJlbnQgc3RhdGUgdW50aWwgbWFudWFsbHkgcmVzb2x2ZWQuIGAgK1xuICAgICAgICAgICAgICBgVGhpcyBpcyBtb3N0IGxpa2VseSBkdWUgdG8gYSBwZXJzaXN0ZW50IG91dGFnZSBvZiB0aGUgd29ya2Zsb3cgYmFja2VuZCBgICtcbiAgICAgICAgICAgICAgYG9yIGEgYnVnIGluIHRoZSB3b3JrZmxvdyBydW50aW1lIGFuZCBzaG91bGQgYmUgcmVwb3J0ZWQgdG8gdGhlIFdvcmtmbG93IHRlYW0uYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgIGVycm9yOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgICAgICAgICAgIGF0dGVtcHQ6IG1ldGFkYXRhLmF0dGVtcHQsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNwYW5MaW5rcyA9IGF3YWl0IGxpbmtUb0N1cnJlbnRDb250ZXh0KCk7XG5cbiAgICAgIC8vIC0tLSBSZXBsYXkgdGltZW91dCBndWFyZCAtLS1cbiAgICAgIC8vIElmIHRoZSByZXBsYXkgdGFrZXMgbG9uZ2VyIHRoYW4gdGhlIHRpbWVvdXQsIGZhaWwgdGhlIHJ1biBhbmQgZXhpdC5cbiAgICAgIC8vIFRoaXMgbXVzdCBiZSBsb3dlciB0aGFuIHRoZSBmdW5jdGlvbidzIG1heER1cmF0aW9uIHRvIGVuc3VyZVxuICAgICAgLy8gdGhlIGZhaWx1cmUgaXMgcmVjb3JkZWQgYmVmb3JlIHRoZSBwbGF0Zm9ybSBraWxscyB0aGUgZnVuY3Rpb24uXG4gICAgICBsZXQgcmVwbGF5VGltZW91dDogTm9kZUpTLlRpbWVvdXQgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuVkVSQ0VMX1VSTCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlcGxheVRpbWVvdXQgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKCdXb3JrZmxvdyByZXBsYXkgZXhjZWVkZWQgdGltZW91dCcsIHtcbiAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgICAgICAgdGltZW91dE1zOiBSRVBMQVlfVElNRU9VVF9NUyxcbiAgICAgICAgICAgIGF0dGVtcHQ6IG1ldGFkYXRhLmF0dGVtcHQsXG4gICAgICAgICAgICBtYXhSZXRyaWVzOiBSRVBMQVlfVElNRU9VVF9NQVhfUkVUUklFUyxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIEFsbG93IGEgZmV3IHJldHJpZXMgYmVmb3JlIHBlcm1hbmVudGx5IGZhaWxpbmcgdGhlIHJ1bi5cbiAgICAgICAgICAvLyBPbiBlYXJseSBhdHRlbXB0cywganVzdCBleGl0IHNvIHRoZSBxdWV1ZSByZXRyaWVzIHRoZSBtZXNzYWdlLlxuICAgICAgICAgIGlmIChtZXRhZGF0YS5hdHRlbXB0IDw9IFJFUExBWV9USU1FT1VUX01BWF9SRVRSSUVTKSB7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkID0gYXdhaXQgZ2V0V29ybGQoKTtcbiAgICAgICAgICAgIGF3YWl0IHdvcmxkLmV2ZW50cy5jcmVhdGUoXG4gICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZXZlbnRUeXBlOiAncnVuX2ZhaWxlZCcsXG4gICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFdvcmtmbG93IHJlcGxheSBleGNlZWRlZCBtYXhpbXVtIGR1cmF0aW9uICgke1JFUExBWV9USU1FT1VUX01TIC8gMTAwMH1zKSBhZnRlciAke21ldGFkYXRhLmF0dGVtcHR9IGF0dGVtcHRzYCxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5SRVBMQVlfVElNRU9VVCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gQmVzdCBlZmZvcnQg4oCUIHByb2Nlc3MgZXhpdHMgcmVnYXJkbGVzc1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBOb3RlIHRoYXQgdGhpcyBhbHNvIHByZXZlbnRzIHRoZSBydW50aW1lIGZyb20gYWNraW5nIHRoZSBxdWV1ZSBtZXNzYWdlLFxuICAgICAgICAgIC8vIHNvIHRoZSBxdWV1ZSB3aWxsIGNhbGwgYmFjayBvbmNlLCBhZnRlciB3aGljaCBhIDQxMCB3aWxsIGdldCBpdCB0byBleGl0IGVhcmx5LlxuICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfSwgUkVQTEFZX1RJTUVPVVRfTVMpO1xuICAgICAgICByZXBsYXlUaW1lb3V0LnVucmVmKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEludm9rZSB1c2VyIHdvcmtmbG93IHdpdGhpbiB0aGUgcHJvcGFnYXRlZCB0cmFjZSBjb250ZXh0IGFuZCBiYWdnYWdlXG4gICAgICByZXR1cm4gYXdhaXQgd2l0aFRyYWNlQ29udGV4dCh0cmFjZUNvbnRleHQsIGFzeW5jICgpID0+IHtcbiAgICAgICAgLy8gU2V0IHdvcmtmbG93IGNvbnRleHQgYXMgYmFnZ2FnZSBmb3IgYXV0b21hdGljIHByb3BhZ2F0aW9uXG4gICAgICAgIHJldHVybiBhd2FpdCB3aXRoV29ya2Zsb3dCYWdnYWdlKFxuICAgICAgICAgIHsgd29ya2Zsb3dSdW5JZDogcnVuSWQsIHdvcmtmbG93TmFtZSB9LFxuICAgICAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkID0gZ2V0V29ybGQoKTtcbiAgICAgICAgICAgIHJldHVybiB0cmFjZShcbiAgICAgICAgICAgICAgYFdPUktGTE9XICR7d29ya2Zsb3dOYW1lfWAsXG4gICAgICAgICAgICAgIHsgbGlua3M6IHNwYW5MaW5rcyB9LFxuICAgICAgICAgICAgICBhc3luYyAoc3BhbikgPT4ge1xuICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93TmFtZSh3b3JrZmxvd05hbWUpLFxuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93T3BlcmF0aW9uKCdleGVjdXRlJyksXG4gICAgICAgICAgICAgICAgICAvLyBTdGFuZGFyZCBPVEVMIG1lc3NhZ2luZyBjb252ZW50aW9uc1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLk1lc3NhZ2luZ1N5c3RlbSgndmVyY2VsLXF1ZXVlJyksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuTWVzc2FnaW5nRGVzdGluYXRpb25OYW1lKG1ldGFkYXRhLnF1ZXVlTmFtZSksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuTWVzc2FnaW5nTWVzc2FnZUlkKG1ldGFkYXRhLm1lc3NhZ2VJZCksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuTWVzc2FnaW5nT3BlcmF0aW9uVHlwZSgncHJvY2VzcycpLFxuICAgICAgICAgICAgICAgICAgLi4uZ2V0UXVldWVPdmVyaGVhZCh7IHJlcXVlc3RlZEF0IH0pLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogdmFsaWRhdGUgYHdvcmtmbG93TmFtZWAgZXhpc3RzIGJlZm9yZSBjb25zdW1pbmcgbWVzc2FnZT9cblxuICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93UnVuSWQocnVuSWQpLFxuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93VHJhY2VQcm9wYWdhdGVkKCEhdHJhY2VDb250ZXh0KSxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGxldCB3b3JrZmxvd1N0YXJ0ZWRBdCA9IC0xO1xuICAgICAgICAgICAgICAgIGxldCB3b3JrZmxvd1J1bjogV29ya2Zsb3dSdW4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgLy8gUHJlLWxvYWRlZCBldmVudHMgZnJvbSB0aGUgcnVuX3N0YXJ0ZWQgcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgLy8gV2hlbiBwcmVzZW50LCB3ZSBza2lwIHRoZSBldmVudHMubGlzdCBjYWxsLlxuICAgICAgICAgICAgICAgIGxldCBwcmVsb2FkZWRFdmVudHM6IEV2ZW50W10gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbGV0IHByZWxvYWRlZEV2ZW50c0N1cnNvcjogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgIC8vIC0tLSBJbmZyYXN0cnVjdHVyZTogcHJlcGFyZSB0aGUgcnVuIHN0YXRlIC0tLVxuICAgICAgICAgICAgICAgIC8vIEFsd2F5cyBjYWxsIHJ1bl9zdGFydGVkIGRpcmVjdGx5IOKAlCB0aGlzIGJvdGggdHJhbnNpdGlvbnNcbiAgICAgICAgICAgICAgICAvLyB0aGUgcnVuIHRvICdydW5uaW5nJyBBTkQgcmV0dXJucyB0aGUgcnVuIGVudGl0eSwgc2F2aW5nXG4gICAgICAgICAgICAgICAgLy8gYSBzZXBhcmF0ZSBydW5zLmdldCByb3VuZC10cmlwLlxuICAgICAgICAgICAgICAgIC8vIENvbnRyYWN0OiBldmVudHMuY3JlYXRlKCdydW5fc3RhcnRlZCcpIG11c3QgYmUgaWRlbXBvdGVudFxuICAgICAgICAgICAgICAgIC8vIGZvciBydW5zIGFscmVhZHkgaW4gJ3J1bm5pbmcnIHN0YXR1cyAocmV0dXJuIHRoZSBydW5cbiAgICAgICAgICAgICAgICAvLyB3aXRob3V0IGVycm9yKSwgbm90IGp1c3QgZm9yIHBlbmRpbmcg4oaSIHJ1bm5pbmcgdHJhbnNpdGlvbnMuXG4gICAgICAgICAgICAgICAgLy8gTmV0d29yay9zZXJ2ZXIgZXJyb3JzIHByb3BhZ2F0ZSB0byB0aGUgcXVldWUgaGFuZGxlciBmb3IgcmV0cnkuXG4gICAgICAgICAgICAgICAgLy8gV29ya2Zsb3dSdW50aW1lRXJyb3IgKGRhdGEgaW50ZWdyaXR5IGlzc3VlcykgYXJlIGZhdGFsIGFuZFxuICAgICAgICAgICAgICAgIC8vIHByb2R1Y2UgcnVuX2ZhaWxlZCBzaW5jZSByZXRyeWluZyB3b24ndCBmaXggdGhlbS5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fc3RhcnRlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIHRoZSBzcGVjIHZlcnNpb24gZnJvbSB0aGUgb3JpZ2luYWwgc3RhcnQoKSBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gd2hlbiBhdmFpbGFibGUsIHNvIHRoZSByZXNpbGllbnQgc3RhcnQgcGF0aCBjcmVhdGVzXG4gICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHJ1biB3aXRoIHRoZSBjb3JyZWN0IHZlcnNpb24gKG5vdCBhbHdheXMgY3VycmVudCkuXG4gICAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5JbnB1dD8uc3BlY1ZlcnNpb24gPz8gU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gUGFzcyBydW4gaW5wdXQgZnJvbSBxdWV1ZSBzbyB0aGUgc2VydmVyIGNhblxuICAgICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgcnVuIGlmIHJ1bl9jcmVhdGVkIHdhcyBtaXNzZWQuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gVWludDhBcnJheSB2YWx1ZXMgc3Vydml2ZSB0aGUgcXVldWUgbmF0aXZlbHlcbiAgICAgICAgICAgICAgICAgICAgICAvLyAoQ0JPUiBvbiB3b3JsZC12ZXJjZWwsIEpTT04gcmV2aXZlciBvbiB3b3JsZC1sb2NhbCkuXG4gICAgICAgICAgICAgICAgICAgICAgLi4uKHJ1bklucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiBydW5JbnB1dC5pbnB1dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcGxveW1lbnRJZDogcnVuSW5wdXQuZGVwbG95bWVudElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dOYW1lOiBydW5JbnB1dC53b3JrZmxvd05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRpb25Db250ZXh0OiBydW5JbnB1dC5leGVjdXRpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDoge30pLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQucnVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBXb3JrZmxvd1J1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICBgRXZlbnQgY3JlYXRpb24gZm9yICdydW5fc3RhcnRlZCcgZGlkIG5vdCByZXR1cm4gdGhlIHJ1biBlbnRpdHkgZm9yIHJ1biBcIiR7cnVuSWR9XCJgXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1biA9IHJlc3VsdC5ydW47XG5cbiAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSByZXNwb25zZSBpbmNsdWRlcyBldmVudHMsIHVzZSB0aGVtIHRvIHNraXBcbiAgICAgICAgICAgICAgICAgIC8vIHRoZSBpbml0aWFsIGV2ZW50cy5saXN0IGNhbGwgYW5kIHJlZHVjZSBUVEZCLlxuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZXZlbnRzICYmXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ldmVudHMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuaGFzTW9yZSAhPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWxvYWRlZEV2ZW50cyA9IHJlc3VsdC5ldmVudHM7XG4gICAgICAgICAgICAgICAgICAgIHByZWxvYWRlZEV2ZW50c0N1cnNvciA9IHJlc3VsdC5jdXJzb3I7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmICghd29ya2Zsb3dSdW4uc3RhcnRlZEF0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBXb3JrZmxvd1J1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICBgV29ya2Zsb3cgcnVuIFwiJHtydW5JZH1cIiBoYXMgbm8gXCJzdGFydGVkQXRcIiB0aW1lc3RhbXBgXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAvLyBSdW4gd2FzIGNvbmN1cnJlbnRseSBjb21wbGV0ZWQvZmFpbGVkL2NhbmNlbGxlZFxuICAgICAgICAgICAgICAgICAgaWYgKEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZXJyKSB8fCBSdW5FeHBpcmVkRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBFbnRpdHlDb25mbGljdEVycm9yOiBydW4gd2FzIGNvbmN1cnJlbnRseVxuICAgICAgICAgICAgICAgICAgICAvLyBjb21wbGV0ZWQvZmFpbGVkL2NhbmNlbGxlZCBkdXJpbmcgc2V0dXAuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJ1bkV4cGlyZWRFcnJvcjogcnVuIGFscmVhZHkgaW4gdGVybWluYWwgc3RhdGUuXG4gICAgICAgICAgICAgICAgICAgIC8vIEluIGJvdGggY2FzZXMsIHNraXAgcHJvY2Vzc2luZyB0aGlzIG1lc3NhZ2UuXG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICAgICAgICAgICAnUnVuIGFscmVhZHkgZmluaXNoZWQgZHVyaW5nIHNldHVwLCBza2lwcGluZycsXG4gICAgICAgICAgICAgICAgICAgICAgeyB3b3JrZmxvd1J1bklkOiBydW5JZCwgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVyciBpbnN0YW5jZW9mIFdvcmtmbG93UnVudGltZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgJ0ZhdGFsIHJ1bnRpbWUgZXJyb3IgZHVyaW5nIHdvcmtmbG93IHNldHVwJyxcbiAgICAgICAgICAgICAgICAgICAgICB7IHdvcmtmbG93UnVuSWQ6IHJ1bklkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHdvcmxkLmV2ZW50cy5jcmVhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiAncnVuX2ZhaWxlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNWZXJzaW9uOiBTUEVDX1ZFUlNJT05fQ1VSUkVOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnREYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2s6IGVyci5zdGFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZTogUlVOX0VSUk9SX0NPREVTLlJVTlRJTUVfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyByZXF1ZXN0SWQgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGZhaWxFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBFbnRpdHlDb25mbGljdEVycm9yLmlzKGZhaWxFcnIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBSdW5FeHBpcmVkRXJyb3IuaXMoZmFpbEVycilcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29ybGRDb250cmFjdEVycm9yKGZhaWxFcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3Igd2hpbGUgcmVjb3JkaW5nIHdvcmtmbG93IGZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsRXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmYWlsRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBTdHJpbmcoZmFpbEVyciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRocm93IGZhaWxFcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1dvcmxkQ29udHJhY3RFcnJvcihlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgJ0ZhdGFsIHdvcmxkIGNvbnRyYWN0IGVycm9yIGR1cmluZyB3b3JrZmxvdyBzZXR1cCcsXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjazogZXJyLnN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyByZXF1ZXN0SWQgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGZhaWxFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBFbnRpdHlDb25mbGljdEVycm9yLmlzKGZhaWxFcnIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBSdW5FeHBpcmVkRXJyb3IuaXMoZmFpbEVycilcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29ybGRDb250cmFjdEVycm9yKGZhaWxFcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3Igd2hpbGUgcmVjb3JkaW5nIHdvcmtmbG93IGZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsRXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmYWlsRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBTdHJpbmcoZmFpbEVyciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRocm93IGZhaWxFcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdvcmtmbG93U3RhcnRlZEF0ID0gK3dvcmtmbG93UnVuLnN0YXJ0ZWRBdDtcblxuICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93UnVuU3RhdHVzKHdvcmtmbG93UnVuLnN0YXR1cyksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dTdGFydGVkQXQod29ya2Zsb3dTdGFydGVkQXQpLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHdvcmtmbG93UnVuLnN0YXR1cyAhPT0gJ3J1bm5pbmcnKSB7XG4gICAgICAgICAgICAgICAgICAvLyBXb3JrZmxvdyBoYXMgYWxyZWFkeSBjb21wbGV0ZWQgb3IgZmFpbGVkLCBzbyB3ZSBjYW4gc2tpcCBpdFxuICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5pbmZvKFxuICAgICAgICAgICAgICAgICAgICAnV29ya2Zsb3cgYWxyZWFkeSBjb21wbGV0ZWQgb3IgZmFpbGVkLCBza2lwcGluZycsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHdvcmtmbG93UnVuLnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgLy8gVE9ETzogZm9yIGBjYW5jZWxgLCB3ZSBhY3R1YWxseSB3YW50IHRvIHByb3BhZ2F0ZSBhIFdvcmtmbG93Q2FuY2VsbGVkIGV2ZW50XG4gICAgICAgICAgICAgICAgICAvLyBpbnNpZGUgdGhlIHdvcmtmbG93IGNvbnRleHQgc28gdGhlIHVzZXIgY2FuIGdyYWNlZnVsbHkgZXhpdC4gdGhpcyBpcyBTSUdURVJNXG4gICAgICAgICAgICAgICAgICAvLyBUT0RPOiBmdXJ0aGVybW9yZSwgdGhlcmUgc2hvdWxkIGJlIGEgdGltZW91dCBvciBhIHdheSB0byBmb3JjZSBjYW5jZWwgU0lHS0lMTFxuICAgICAgICAgICAgICAgICAgLy8gc28gdGhhdCB3ZSBhY3R1YWxseSBleGl0IGhlcmUgd2l0aG91dCByZXBsYXlpbmcgdGhlIHdvcmtmbG93IGF0IGFsbCwgaW4gdGhlIGNhc2VcbiAgICAgICAgICAgICAgICAgIC8vIHRoZSByZXBsYXlpbmcgdGhlIHdvcmtmbG93IGlzIGl0c2VsZiBmYWlsaW5nLlxuXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTG9hZCBhbGwgZXZlbnRzIGludG8gbWVtb3J5IGJlZm9yZSBydW5uaW5nLlxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGdvdCBwcmUtbG9hZGVkIGV2ZW50cyBmcm9tIHRoZSBydW5fc3RhcnRlZCByZXNwb25zZSxcbiAgICAgICAgICAgICAgICAvLyBza2lwIHRoZSBldmVudHMubGlzdCByb3VuZC10cmlwIHRvIHJlZHVjZSBUVEZCLlxuICAgICAgICAgICAgICAgIGxldCBldmVudHM6IEV2ZW50W107XG4gICAgICAgICAgICAgICAgbGV0IGV2ZW50c0N1cnNvcjogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgaWYgKHByZWxvYWRlZEV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICBldmVudHMgPSBwcmVsb2FkZWRFdmVudHM7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50c0N1cnNvciA9IHByZWxvYWRlZEV2ZW50c0N1cnNvcjtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYWRlZEV2ZW50cyA9IGF3YWl0IGdldFdvcmtmbG93UnVuRXZlbnRzKFxuICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLnJ1bklkXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cyA9IGxvYWRlZEV2ZW50cy5ldmVudHM7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50c0N1cnNvciA9IGxvYWRlZEV2ZW50cy5jdXJzb3I7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoaXNXb3JsZENvbnRyYWN0RXJyb3IoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICdGYXRhbCB3b3JsZCBjb250cmFjdCBlcnJvciB3aGlsZSBsb2FkaW5nIHdvcmtmbG93IGV2ZW50cycsXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjazogZXJyLnN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyByZXF1ZXN0SWQgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGZhaWxFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBFbnRpdHlDb25mbGljdEVycm9yLmlzKGZhaWxFcnIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBSdW5FeHBpcmVkRXJyb3IuaXMoZmFpbEVycilcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29ybGRDb250cmFjdEVycm9yKGZhaWxFcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3Igd2hpbGUgcmVjb3JkaW5nIHdvcmtmbG93IGZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsRXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmYWlsRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBTdHJpbmcoZmFpbEVyciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRocm93IGZhaWxFcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFRoZSBtYXRlcmlhbGl6ZWQgcnVuIHJldHVybmVkIGJ5IHJ1bl9zdGFydGVkIGNhbiByYWNlIGFcbiAgICAgICAgICAgICAgICAvLyB0ZXJtaW5hbCBldmVudCBpbiB0aGUgbG9hZGVkIHNuYXBzaG90LiBEbyBub3QgcmVwbGF5IGEgcnVuXG4gICAgICAgICAgICAgICAgLy8gd2hvc2UgZXZlbnQgbG9nIGFscmVhZHkgZXN0YWJsaXNoZXMgaXRzIHRlcm1pbmFsIG91dGNvbWUuXG4gICAgICAgICAgICAgICAgaWYgKGhhc1JlY29yZGVkVGVybWluYWxSdW5FdmVudChldmVudHMsIHJ1bklkKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBhbnkgZWxhcHNlZCB3YWl0cyBhbmQgY3JlYXRlIHdhaXRfY29tcGxldGVkIGV2ZW50c1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG5cbiAgICAgICAgICAgICAgICAvLyBQcmUtY29tcHV0ZSBjb21wbGV0ZWQgY29ycmVsYXRpb24gSURzIGZvciBPKG4pIGxvb2t1cCBpbnN0ZWFkIG9mIE8obsKyKVxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBsZXRlZFdhaXRJZHMgPSBuZXcgU2V0KFxuICAgICAgICAgICAgICAgICAgZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUuZXZlbnRUeXBlID09PSAnd2FpdF9jb21wbGV0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChlKSA9PiBlLmNvcnJlbGF0aW9uSWQpXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIC8vIENvbGxlY3QgYWxsIHdhaXRzIHRoYXQgbmVlZCBjb21wbGV0aW9uXG4gICAgICAgICAgICAgICAgY29uc3Qgd2FpdHNUb0NvbXBsZXRlID0gZXZlbnRzXG4gICAgICAgICAgICAgICAgICAuZmlsdGVyKFxuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgZVxuICAgICAgICAgICAgICAgICAgICApOiBlIGlzIEV4dHJhY3Q8RXZlbnQsIHsgZXZlbnRUeXBlOiAnd2FpdF9jcmVhdGVkJyB9PiAmIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb3JyZWxhdGlvbklkOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIH0gPT5cbiAgICAgICAgICAgICAgICAgICAgICBlLmV2ZW50VHlwZSA9PT0gJ3dhaXRfY3JlYXRlZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICBlLmNvcnJlbGF0aW9uSWQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICAgICAgICFjb21wbGV0ZWRXYWl0SWRzLmhhcyhlLmNvcnJlbGF0aW9uSWQpICYmXG4gICAgICAgICAgICAgICAgICAgICAgbm93ID49IChlLmV2ZW50RGF0YS5yZXN1bWVBdCBhcyBEYXRlKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIC5tYXAoKGUpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogJ3dhaXRfY29tcGxldGVkJyBhcyBjb25zdCxcbiAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgICAgICBjb3JyZWxhdGlvbklkOiBlLmNvcnJlbGF0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgIHJlc3VtZUF0OiBlLmV2ZW50RGF0YS5yZXN1bWVBdCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbGwgd2FpdF9jb21wbGV0ZWQgZXZlbnRzXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB3YWl0RXZlbnQgb2Ygd2FpdHNUb0NvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB3YWl0TG9nOiBNdXRhYmxlRXZlbnRMb2cgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cyxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiBldmVudHNDdXJzb3IgPz8gbnVsbCxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB3aXRoUHJlY29uZGl0aW9uUmV0cnkoXG4gICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgd2FpdExvZyxcbiAgICAgICAgICAgICAgICAgICAgICAoc3RhdGVVcGRhdGVkQXQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JsZC5ldmVudHMuY3JlYXRlKHJ1bklkLCB3YWl0RXZlbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVVwZGF0ZWRBdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuaW5mbygnV2FpdCBhbHJlYWR5IGNvbXBsZXRlZCwgc2tpcHBpbmcnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvcnJlbGF0aW9uSWQ6IHdhaXRFdmVudC5jb3JyZWxhdGlvbklkLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbG9hZHMgaW5zaWRlIHRoZSBndWFyZCBtYXkgaGF2ZSBhZHZhbmNlZCB0aGUgY3Vyc29yLlxuICAgICAgICAgICAgICAgICAgICBldmVudHNDdXJzb3IgPSB3YWl0TG9nLmN1cnNvcjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAod2FpdHNUb0NvbXBsZXRlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBldmVudCBsaXN0IGFib3ZlIG1heSBiZSBzdGFsZSBieSB0aGUgdGltZSBhbiBlbGFwc2VkXG4gICAgICAgICAgICAgICAgICAvLyB3YWl0IGlzIGNvbW1pdHRlZC4gTG9hZCBvbmx5IGV2ZW50cyBhZnRlciB0aGUgb3JpZ2luYWxcbiAgICAgICAgICAgICAgICAgIC8vIHNuYXBzaG90IGN1cnNvciBzbyBjb25jdXJyZW50IGR1cmFibGUgZXZlbnRzLCBzdWNoIGFzXG4gICAgICAgICAgICAgICAgICAvLyBob29rX3JlY2VpdmVkLCBrZWVwIHRoZWlyIG9yZGVyaW5nIHJlbGF0aXZlIHRvXG4gICAgICAgICAgICAgICAgICAvLyB3YWl0X2NvbXBsZXRlZC4gRmFsbCBiYWNrIHRvIGEgZnVsbCByZWxvYWQgZm9yIG9sZGVyIHdvcmxkc1xuICAgICAgICAgICAgICAgICAgLy8gdGhhdCBjYW5ub3QgZ2l2ZSB1cyBhIHN0YWJsZSBjdXJzb3IuXG4gICAgICAgICAgICAgICAgICBpZiAoZXZlbnRzQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0V2ZW50cyA9IGF3YWl0IGdldFdvcmtmbG93UnVuRXZlbnRzKFxuICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50c0N1cnNvclxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wbGV0ZWRXYWl0SWRzQWZ0ZXJDdXJzb3IgPSBuZXcgU2V0KFxuICAgICAgICAgICAgICAgICAgICAgIG5ld0V2ZW50cy5ldmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUuZXZlbnRUeXBlID09PSAnd2FpdF9jb21wbGV0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZSkgPT4gZS5jb3JyZWxhdGlvbklkKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzYXdBbGxXYWl0Q29tcGxldGlvbnMgPSB3YWl0c1RvQ29tcGxldGUuZXZlcnkoXG4gICAgICAgICAgICAgICAgICAgICAgKHdhaXRFdmVudCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlZFdhaXRJZHNBZnRlckN1cnNvci5oYXMod2FpdEV2ZW50LmNvcnJlbGF0aW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNhd0FsbFdhaXRDb21wbGV0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWRzID0gbmV3IFNldChcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5tYXAoKGV2ZW50KSA9PiBldmVudC5ldmVudElkKVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBldmVudCBvZiBuZXdFdmVudHMuZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0aW5nSWRzLmhhcyhldmVudC5ldmVudElkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ0lkcy5hZGQoZXZlbnQuZXZlbnRJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZGVkRXZlbnRzID0gYXdhaXQgZ2V0V29ya2Zsb3dSdW5FdmVudHMoXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bi5ydW5JZFxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnRzID0gbG9hZGVkRXZlbnRzLmV2ZW50cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZGVkRXZlbnRzID0gYXdhaXQgZ2V0V29ya2Zsb3dSdW5FdmVudHMoXG4gICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWRcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzID0gbG9hZGVkRXZlbnRzLmV2ZW50cztcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgLy8gQSBjb25jdXJyZW50IHRlcm1pbmFsIHdyaXRlIG1heSBoYXZlIGxhbmRlZCB3aGlsZVxuICAgICAgICAgICAgICAgICAgLy8gY29tbWl0dGluZyBhbiBlbGFwc2VkIHdhaXQgYW5kIHJlZnJlc2hpbmcgdGhlIHNuYXBzaG90LlxuICAgICAgICAgICAgICAgICAgaWYgKGhhc1JlY29yZGVkVGVybWluYWxSdW5FdmVudChldmVudHMsIHJ1bklkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSB0aGUgZW5jcnlwdGlvbiBrZXkgZm9yIHRoaXMgcnVuJ3MgZGVwbG95bWVudFxuICAgICAgICAgICAgICAgIGNvbnN0IHJhd0tleSA9XG4gICAgICAgICAgICAgICAgICBhd2FpdCB3b3JsZC5nZXRFbmNyeXB0aW9uS2V5Rm9yUnVuPy4od29ya2Zsb3dSdW4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuY3J5cHRpb25LZXkgPSByYXdLZXlcbiAgICAgICAgICAgICAgICAgID8gYXdhaXQgaW1wb3J0S2V5KHJhd0tleSlcbiAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIFVzZXIgY29kZSBleGVjdXRpb24gLS0tXG4gICAgICAgICAgICAgICAgLy8gT25seSBlcnJvcnMgZnJvbSBydW5Xb3JrZmxvdygpICh1c2VyIHdvcmtmbG93IGNvZGUpIHNob3VsZFxuICAgICAgICAgICAgICAgIC8vIHByb2R1Y2UgcnVuX2ZhaWxlZC4gSW5mcmFzdHJ1Y3R1cmUgZXJyb3JzIChuZXR3b3JrLCBzZXJ2ZXIpXG4gICAgICAgICAgICAgICAgLy8gbXVzdCBwcm9wYWdhdGUgdG8gdGhlIHF1ZXVlIGhhbmRsZXIgZm9yIGF1dG9tYXRpYyByZXRyeS5cbiAgICAgICAgICAgICAgICBsZXQgd29ya2Zsb3dSZXN1bHQ6IHVua25vd247XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIHdvcmtmbG93UmVzdWx0ID0gYXdhaXQgdHJhY2UoXG4gICAgICAgICAgICAgICAgICAgICd3b3JrZmxvdy5yZXBsYXknLFxuICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgKHJlcGxheVNwYW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICByZXBsYXlTcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0V2ZW50c0NvdW50KGV2ZW50cy5sZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBydW5Xb3JrZmxvdyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93Q29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5jcnlwdGlvbktleVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAvLyBXb3JrZmxvd1N1c3BlbnNpb24gaXMgbm9ybWFsIGNvbnRyb2wgZmxvdyDigJQgbm90IGFuIGVycm9yXG4gICAgICAgICAgICAgICAgICBpZiAoV29ya2Zsb3dTdXNwZW5zaW9uLmlzKGVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VzcGVuc2lvbk1lc3NhZ2UgPSBidWlsZFdvcmtmbG93U3VzcGVuc2lvbk1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgZXJyLnN0ZXBDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICBlcnIuaG9va0NvdW50LFxuICAgICAgICAgICAgICAgICAgICAgIGVyci53YWl0Q291bnRcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1c3BlbnNpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5kZWJ1ZyhzdXNwZW5zaW9uTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBFYWNoIGV2ZW50IGNyZWF0aW9uIGluc2lkZSBoYW5kbGVTdXNwZW5zaW9uIGNhcnJpZXMgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIGxvYWRlZCBzbmFwc2hvdCdzIGBzdGF0ZVVwZGF0ZWRBdGA7IG9uIGEgc3RhbGUgKDQxMilcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVqZWN0aW9uIHRoZSBndWFyZCByZWxvYWRzIHRoaXMgbG9nIGluIHBsYWNlIGFuZCByZXRyaWVzLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdXNwZW5zaW9uTG9nOiBNdXRhYmxlRXZlbnRMb2cgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogZXZlbnRzQ3Vyc29yID8/IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgaGFuZGxlU3VzcGVuc2lvbj4+O1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZVN1c3BlbnNpb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VzcGVuc2lvbjogZXJyLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ybGQsXG4gICAgICAgICAgICAgICAgICAgICAgICBydW46IHdvcmtmbG93UnVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3BhbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50TG9nOiBzdXNwZW5zaW9uTG9nLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChzdXNwZW5zaW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgZ3VhcmQgZXhoYXVzdGVkIGl0cyByZWxvYWRzIG9uIGEgc3RhbGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGlvbi4gU2NoZWR1bGUgYW4gZXhwbGljaXQgaW1tZWRpYXRlIHJlLWludm9jYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAvLyAoYSByZXRocm93IHJlbGllcyBvbiBxdWV1ZSByZWRlbGl2ZXJ5KSBzbyBhIGZyZXNoXG4gICAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGF5IG9ic2VydmVzIHRoZSBuZXdlciBldmVudC5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IuaXMoc3VzcGVuc2lvbkVycm9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5pbmZvKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnU3VzcGVuc2lvbiBldmVudCBjcmVhdGlvbiBleGhhdXN0ZWQgcHJlY29uZGl0aW9uIHJldHJpZXM7IHJlLWludm9raW5nIHdpdGggYSBmcmVzaCByZXBsYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7IHdvcmtmbG93UnVuSWQ6IHJ1bklkIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aW1lb3V0U2Vjb25kczogMCB9O1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBzdXNwZW5zaW9uRXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVvdXRTZWNvbmRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aW1lb3V0U2Vjb25kczogcmVzdWx0LnRpbWVvdXRTZWNvbmRzIH07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBTdXNwZW5zaW9uIGhhbmRsZWQsIG5vIGZ1cnRoZXIgd29yayBuZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAvLyBUcmFuc2llbnQgaW5mcmFzdHJ1Y3R1cmUgZmFpbHVyZXMgdGFsa2luZyB0byB0aGVcbiAgICAgICAgICAgICAgICAgIC8vIHdvcmxkICh3b3JrZmxvdy1zZXJ2ZXIpIOKAlCBhbiBleGhhdXN0ZWQgUmV0cnlBZ2VudFxuICAgICAgICAgICAgICAgICAgLy8gKFVORF9FUlJfUkVRX1JFVFJZIGZyb20gYSBzdXN0YWluZWQgNDI5LzUwMyBzdG9ybSksXG4gICAgICAgICAgICAgICAgICAvLyBhIGRyb3BwZWQgc29ja2V0LCBhIGNvbm5lY3QvRE5TIGZhaWx1cmUsIG9yIGEgY2xpZW50XG4gICAgICAgICAgICAgICAgICAvLyB0aW1lb3V0IOKAlCBtdXN0IE5PVCBmYWlsIHRoZSBydW4uIFJldGhyb3cgc28gdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAvLyByZWRlbGl2ZXJzIGFuZCBhIGZyZXNoIGludm9jYXRpb24gcmV0cmllcyB0aGUgcmVwbGF5XG4gICAgICAgICAgICAgICAgICAvLyBvbmNlIHRoZSBiYWNrZW5kIHJlY292ZXJzLiBUaGUgQHZlcmNlbC9xdWV1ZSBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAvLyBhcHBsaWVzIGEgZmFzdCAoMXPihpI2MHMpIGJhY2tvZmYgYnkgZGVsaXZlcnkgY291bnQsXG4gICAgICAgICAgICAgICAgICAvLyBhdm9pZGluZyB0aGUgfjVtaW4gZGVmYXVsdCB2aXNpYmlsaXR5LXRpbWVvdXQgcmVkcml2ZVxuICAgICAgICAgICAgICAgICAgLy8gKGFuZCBuZXZlciBraWxsaW5nIHRoZSBwcm9jZXNzIHZpYSBydW5fZmFpbGVkKS5cbiAgICAgICAgICAgICAgICAgIGlmIChpc1JldHJ5YWJsZVdvcmxkRXJyb3IoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgJ1RyYW5zaWVudCB3b3JsZCBlcnJvciBkdXJpbmcgcmVwbGF5OyByZWRlbGl2ZXJpbmcgdmlhIHF1ZXVlIGluc3RlYWQgb2YgZmFpbGluZyB0aGUgcnVuJyxcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvck5hbWU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm5hbWUgOiAnVW5rbm93bkVycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsaXZlcnlBdHRlbXB0OiBtZXRhZGF0YS5hdHRlbXB0LFxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBsZXQgdGVybWluYWxFcnJvciA9IGVycjtcbiAgICAgICAgICAgICAgICAgIGlmIChSZXBsYXlEaXZlcmdlbmNlRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXZlcmdlbmNlQ291bnQgPSAocmVwbGF5RGl2ZXJnZW5jZT8uY291bnQgPz8gMCkgKyAxO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXZlcmdlbmNlQ291bnQgPD0gUkVQTEFZX0RJVkVSR0VOQ0VfTUFYX1JFVFJJRVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAnV29ya2Zsb3cgcmVwbGF5IGRpdmVyZ2VkOyBxdWV1ZWluZyBhIHJlY292ZXJ5IHJlcGxheSBiZWZvcmUgZGVjbGFyaW5nIHRoZSBldmVudCBsb2cgY29ycnVwdGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZTogUlVOX0VSUk9SX0NPREVTLlJFUExBWV9ESVZFUkdFTkNFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXZlcmdlbmNlRXZlbnRJZDogZXJyLmV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHByaW9yRGl2ZXJnZW5jZUV2ZW50SWQ6IHJlcGxheURpdmVyZ2VuY2U/LmV2ZW50SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpdmVyZ2VuY2VDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaXZlcnlBdHRlbXB0OiBtZXRhZGF0YS5hdHRlbXB0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhSZWNvdmVyeVJlcGxheXM6IFJFUExBWV9ESVZFUkdFTkNFX01BWF9SRVRSSUVTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgcXVldWVNZXNzYWdlKFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ybGQsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRXb3JrZmxvd1F1ZXVlTmFtZSh3b3JrZmxvd05hbWUsIG5hbWVzcGFjZSksXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFjZUNhcnJpZXI6IHRyYWNlQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxheURpdmVyZ2VuY2U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudElkOiBlcnIuZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogZGl2ZXJnZW5jZUNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwbG95bWVudElkOiB3b3JrZmxvd1J1bi5kZXBsb3ltZW50SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNWZXJzaW9uOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLnNwZWNWZXJzaW9uID8/IFNQRUNfVkVSU0lPTl9MRUdBQ1ksXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hbEVycm9yID0gbmV3IENvcnJ1cHRlZEV2ZW50TG9nRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgYFdvcmtmbG93IHJlcGxheSBkaXZlcmdlZCAke2RpdmVyZ2VuY2VDb3VudH0gdGltZXMgYWZ0ZXIgJHtSRVBMQVlfRElWRVJHRU5DRV9NQVhfUkVUUklFU30gcmVjb3ZlcnkgcmVwbGF5czsgbGF0ZXN0IGRpdmVyZ2VudCBldmVudCB3YXMgJHtlcnIuZXZlbnRJZH0uIExhc3QgZGl2ZXJnZW5jZTogJHtlcnIubWVzc2FnZX1gLFxuICAgICAgICAgICAgICAgICAgICAgIHsgY2F1c2U6IGVyciB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSB1c2VyIGNvZGUgZXJyb3Igb3IgYSB0ZXJtaW5hbFxuICAgICAgICAgICAgICAgICAgLy8gV29ya2Zsb3dSdW50aW1lRXJyb3IuIEZhaWwgdGhlIHdvcmtmbG93IHJ1bi5cblxuICAgICAgICAgICAgICAgICAgLy8gUmVjb3JkIGV4Y2VwdGlvbiBmb3IgT1RFTCBlcnJvciB0cmFja2luZ1xuICAgICAgICAgICAgICAgICAgaWYgKHRlcm1pbmFsRXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBzcGFuPy5yZWNvcmRFeGNlcHRpb24/Lih0ZXJtaW5hbEVycm9yKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZEVycm9yID1cbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbm9ybWFsaXplVW5rbm93bkVycm9yKHRlcm1pbmFsRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JOYW1lID1cbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZEVycm9yLm5hbWUgfHwgZ2V0RXJyb3JOYW1lKHRlcm1pbmFsRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gbm9ybWFsaXplZEVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICBsZXQgZXJyb3JTdGFjayA9XG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRFcnJvci5zdGFjayB8fCBnZXRFcnJvclN0YWNrKHRlcm1pbmFsRXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAvLyBSZW1hcCBlcnJvciBzdGFjayB1c2luZyBzb3VyY2UgbWFwcyB0byBzaG93IG9yaWdpbmFsIHNvdXJjZSBsb2NhdGlvbnNcbiAgICAgICAgICAgICAgICAgIGlmIChlcnJvclN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZE5hbWUgPSBwYXJzZVdvcmtmbG93TmFtZSh3b3JrZmxvd05hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9XG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VkTmFtZT8ubW9kdWxlU3BlY2lmaWVyIHx8IHdvcmtmbG93TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JTdGFjayA9IHJlbWFwRXJyb3JTdGFjayhcbiAgICAgICAgICAgICAgICAgICAgICBlcnJvclN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93Q29kZVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAvLyBDbGFzc2lmeSB0aGUgZXJyb3I6IFdvcmtmbG93UnVudGltZUVycm9yIGluZGljYXRlc1xuICAgICAgICAgICAgICAgICAgLy8gYW4gU0RLL3J1bnRpbWUgaXNzdWUsIGFuZCBzZWxlY3RlZCBzdWJjbGFzc2VzIHVzZVxuICAgICAgICAgICAgICAgICAgLy8gbW9yZSBzcGVjaWZpYyBjb2RlcyBmb3IgYmFja2VuZCB0cmFja2luZy5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yQ29kZSA9IGNsYXNzaWZ5UnVuRXJyb3IodGVybWluYWxFcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoJ0Vycm9yIHdoaWxlIHJ1bm5pbmcgd29ya2Zsb3cnLCB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGUsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JTdGFjayxcbiAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAvLyBGYWlsIHRoZSB3b3JrZmxvdyBydW4gdmlhIGV2ZW50IChldmVudC1zb3VyY2VkIGFyY2hpdGVjdHVyZSlcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHdvcmxkLmV2ZW50cy5jcmVhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiAncnVuX2ZhaWxlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvck1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2s6IGVycm9yU3RhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChmYWlsRXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICBFbnRpdHlDb25mbGljdEVycm9yLmlzKGZhaWxFcnIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgUnVuRXhwaXJlZEVycm9yLmlzKGZhaWxFcnIpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICAgICAgICAgICAgICdUcmllZCBmYWlsaW5nIHdvcmtmbG93IHJ1biwgYnV0IHJ1biBoYXMgYWxyZWFkeSBmaW5pc2hlZC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZmFpbEVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dFcnJvckNvZGUoZXJyb3JDb2RlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0Vycm9yTmFtZShlcnJvck5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93RXJyb3JNZXNzYWdlKGVycm9yTWVzc2FnZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuRXJyb3JUeXBlKGVycm9yTmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1dvcmxkQ29udHJhY3RFcnJvcihmYWlsRXJyKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3Igd2hpbGUgcmVjb3JkaW5nIHdvcmtmbG93IGZhaWx1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuV09STERfQ09OVFJBQ1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxFcnIgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBmYWlsRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogU3RyaW5nKGZhaWxFcnIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGZhaWxFcnI7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5TdGF0dXMoJ2ZhaWxlZCcpLFxuICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dFcnJvckNvZGUoZXJyb3JDb2RlKSxcbiAgICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93RXJyb3JOYW1lKGVycm9yTmFtZSksXG4gICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0Vycm9yTWVzc2FnZShlcnJvck1lc3NhZ2UpLFxuICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuRXJyb3JUeXBlKGVycm9yTmFtZSksXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gSW5mcmFzdHJ1Y3R1cmU6IGNvbXBsZXRlIHRoZSBydW4gLS0tXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBvdXRzaWRlIHRoZSB1c2VyLWNvZGUgdHJ5L2NhdGNoIHNvIHRoYXQgZmFpbHVyZXNcbiAgICAgICAgICAgICAgICAvLyBoZXJlIChlLmcuLCBuZXR3b3JrIGVycm9ycykgcHJvcGFnYXRlIHRvIHRoZSBxdWV1ZSBoYW5kbGVyLlxuICAgICAgICAgICAgICAgIC8vIHJ1bl9jb21wbGV0ZWQgY2FycmllcyB0aGUgbG9hZGVkIHNuYXBzaG90J3MgYHN0YXRlVXBkYXRlZEF0YCxcbiAgICAgICAgICAgICAgICAvLyBidXQgaXMgaW50ZW50aW9uYWxseSBOT1QgcmV0cmllZCBpbiBwbGFjZSAobm9cbiAgICAgICAgICAgICAgICAvLyB3aXRoUHJlY29uZGl0aW9uUmV0cnkpIG9uIGEgc3RhbGUgKDQxMikgcmVqZWN0aW9uOiBgcmVzdWx0YFxuICAgICAgICAgICAgICAgIC8vIHdhcyBjb21wdXRlZCBieSB0aGlzIHJlcGxheSwgc28gYSBuZXdlciBvdXQtb2YtYmFuZCBldmVudFxuICAgICAgICAgICAgICAgIC8vIGxhbmRpbmcgYWZ0ZXIgdGhlIHNuYXBzaG90IG11c3QgZm9yY2UgYSAqZnJlc2ggcmVwbGF5KlxuICAgICAgICAgICAgICAgIC8vICh3aGljaCBtYXkgb2JzZXJ2ZSBpdCBhbmQgcHJvZHVjZSBhIGRpZmZlcmVudCByZXN1bHQpLCBub3RcbiAgICAgICAgICAgICAgICAvLyByZS1jb21taXQgdGhlIHN0YWxlIHJlc3VsdC4gT24gNDEyIHRoZSBjYXRjaCBiZWxvdyBzY2hlZHVsZXNcbiAgICAgICAgICAgICAgICAvLyBhbiBleHBsaWNpdCBpbW1lZGlhdGUgcmUtaW52b2NhdGlvbiBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIC8vIChydW5fZmFpbGVkIGlzIGRlbGliZXJhdGVseSBsZWZ0IHVuZ3VhcmRlZCBhbmQgZmFpbHMgb3BlbjpcbiAgICAgICAgICAgICAgICAvLyBhIHNwdXJpb3VzIHJlLXJ1biBpcyBzYWZlLCBhIHNwdXJpb3VzIGNvbXBsZXRpb24gaXMgbm90LCBhbmRcbiAgICAgICAgICAgICAgICAvLyB0aGUgbG9hZGVkIGV2ZW50IGxvZyBpcyBub3QgaW4gc2NvcGUgb24gdGhhdCBjYXRjaCBwYXRoLilcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fY29tcGxldGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnREYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQ6IHdvcmtmbG93UmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGVVcGRhdGVkQXQ6IHN0YXRlVXBkYXRlZEF0Rm9yQ3JlYXRlKGV2ZW50cyksXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAgICAgICAgICAgJ3J1bl9jb21wbGV0ZWQgcmVqZWN0ZWQgYXMgc3RhbGU7IHJlLWludm9raW5nIHdpdGggYSBmcmVzaCByZXBsYXknLFxuICAgICAgICAgICAgICAgICAgICAgIHsgd29ya2Zsb3dSdW5JZDogcnVuSWQgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aW1lb3V0U2Vjb25kczogMCB9O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZXJyKSB8fCBSdW5FeHBpcmVkRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAgICAgICAgICAgJ1RyaWVkIGNvbXBsZXRpbmcgd29ya2Zsb3cgcnVuLCBidXQgcnVuIGhhcyBhbHJlYWR5IGZpbmlzaGVkLicsXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd1J1blN0YXR1cygnY29tcGxldGVkJyksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dFdmVudHNDb3VudChldmVudHMubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTsgLy8gRW5kIHRyYWNlXG4gICAgICAgICAgfVxuICAgICAgICApOyAvLyBFbmQgd2l0aFdvcmtmbG93QmFnZ2FnZVxuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIGlmIChyZXBsYXlUaW1lb3V0KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHJlcGxheVRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICB9KTsgLy8gRW5kIHdpdGhUcmFjZUNvbnRleHRcbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIHdpdGhIZWFsdGhDaGVjayhoYW5kbGVyLCB3b3JsZFNwZWNWZXJzaW9uKTtcbn1cblxuLy8gdGhpcyBpcyBhIG5vLW9wIHBsYWNlaG9sZGVyIGFzIHRoZSBjbGllbnQgaXNcbi8vIGV4cGVjdGluZyB0aGlzIHRvIGJlIHByZXNlbnQgYnV0IHdlIGFyZW4ndCBhY3R1YWxseSB1c2luZyBpdFxuZXhwb3J0IGZ1bmN0aW9uIHJ1blN0ZXAoKSB7fVxuIiwgImltcG9ydCB7XG4gIEVSUk9SX1NMVUdTLFxuICBSZXBsYXlEaXZlcmdlbmNlRXJyb3IsXG4gIFdvcmtmbG93Tm90UmVnaXN0ZXJlZEVycm9yLFxuICBXb3JrZmxvd1J1bnRpbWVFcnJvcixcbn0gZnJvbSAnQHdvcmtmbG93L2Vycm9ycyc7XG5pbXBvcnQgeyBjcmVhdGVXb3JrZmxvd0Jhc2VVcmwsIHdpdGhSZXNvbHZlcnMgfSBmcm9tICdAd29ya2Zsb3cvdXRpbHMnO1xuaW1wb3J0IHsgcGFyc2VXb3JrZmxvd05hbWUgfSBmcm9tICdAd29ya2Zsb3cvdXRpbHMvcGFyc2UtbmFtZSc7XG5pbXBvcnQgdHlwZSB7IEV2ZW50LCBXb3JrZmxvd1J1biB9IGZyb20gJ0B3b3JrZmxvdy93b3JsZCc7XG5pbXBvcnQgKiBhcyBuYW5vaWQgZnJvbSAnbmFub2lkJztcbmltcG9ydCB7IG1vbm90b25pY0ZhY3RvcnkgfSBmcm9tICd1bGlkJztcbmltcG9ydCB0eXBlIHsgQ3J5cHRvS2V5IH0gZnJvbSAnLi9lbmNyeXB0aW9uLmpzJztcbmltcG9ydCB7IEV2ZW50Q29uc3VtZXJSZXN1bHQsIEV2ZW50c0NvbnN1bWVyIH0gZnJvbSAnLi9ldmVudHMtY29uc3VtZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBRdWV1ZUl0ZW0gfSBmcm9tICcuL2dsb2JhbC5qcyc7XG5pbXBvcnQgeyBFTk9UU1VQLCBXb3JrZmxvd1N1c3BlbnNpb24gfSBmcm9tICcuL2dsb2JhbC5qcyc7XG5pbXBvcnQgeyBydW50aW1lTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBXb3JrZmxvd09yY2hlc3RyYXRvckNvbnRleHQgfSBmcm9tICcuL3ByaXZhdGUuanMnO1xuaW1wb3J0IHsgZ2V0UG9ydExhenkgfSBmcm9tICcuL3J1bnRpbWUvZ2V0LXBvcnQtbGF6eS5qcyc7XG5pbXBvcnQge1xuICBkZWh5ZHJhdGVXb3JrZmxvd1JldHVyblZhbHVlLFxuICBoeWRyYXRlV29ya2Zsb3dBcmd1bWVudHMsXG59IGZyb20gJy4vc2VyaWFsaXphdGlvbi5qcyc7XG5pbXBvcnQgeyBjcmVhdGVVc2VTdGVwIH0gZnJvbSAnLi9zdGVwLmpzJztcbmltcG9ydCB0eXBlIHsgU3RlcEh5ZHJhdGlvbkNhY2hlIH0gZnJvbSAnLi9zdGVwLWh5ZHJhdGlvbi1jYWNoZS5qcyc7XG5pbXBvcnQge1xuICBCT0RZX0lOSVRfU1lNQk9MLFxuICBTVEFCTEVfVUxJRCxcbiAgV09SS0ZMT1dfQ1JFQVRFX0hPT0ssXG4gIFdPUktGTE9XX0dFVF9TVFJFQU1fSUQsXG4gIFdPUktGTE9XX1NMRUVQLFxuICBXT1JLRkxPV19VU0VfU1RFUCxcbn0gZnJvbSAnLi9zeW1ib2xzLmpzJztcbmltcG9ydCAqIGFzIEF0dHJpYnV0ZSBmcm9tICcuL3RlbGVtZXRyeS9zZW1hbnRpYy1jb252ZW50aW9ucy5qcyc7XG5pbXBvcnQgeyB0cmFjZSB9IGZyb20gJy4vdGVsZW1ldHJ5LmpzJztcbmltcG9ydCB7IGdldFdvcmtmbG93UnVuU3RyZWFtSWQgfSBmcm9tICcuL3V0aWwuanMnO1xuaW1wb3J0IHsgY3JlYXRlQ29udGV4dCB9IGZyb20gJy4vdm0vaW5kZXguanMnO1xuaW1wb3J0IHsgcnVuQ2FjaGVkV29ya2Zsb3dTY3JpcHQgfSBmcm9tICcuL3ZtL3NjcmlwdC1jYWNoZS5qcyc7XG5pbXBvcnQgdHlwZSB7IFdvcmtmbG93TWV0YWRhdGEgfSBmcm9tICcuL3dvcmtmbG93L2dldC13b3JrZmxvdy1tZXRhZGF0YS5qcyc7XG5pbXBvcnQgeyBXT1JLRkxPV19DT05URVhUX1NZTUJPTCB9IGZyb20gJy4vd29ya2Zsb3cvZ2V0LXdvcmtmbG93LW1ldGFkYXRhLmpzJztcbmltcG9ydCB7IGNyZWF0ZUNyZWF0ZUhvb2sgfSBmcm9tICcuL3dvcmtmbG93L2hvb2suanMnO1xuaW1wb3J0IHsgY3JlYXRlU2xlZXAgfSBmcm9tICcuL3dvcmtmbG93L3NsZWVwLmpzJztcblxuLyoqXG4gKiBMb2dzIGEgd2FybmluZyB3aGVuIGEgd29ya2Zsb3cgcnVuIGNvbXBsZXRlcyBvciBmYWlscyB3aXRoIHVuY29tbWl0dGVkXG4gKiBvcGVyYXRpb25zIHN0aWxsIGluIHRoZSBpbnZvY2F0aW9ucyBxdWV1ZS4gVGhpcyB0eXBpY2FsbHkgaW5kaWNhdGVzIHRoZVxuICogdXNlciBmb3Jnb3QgdG8gYGF3YWl0YCBhIHN0ZXAsIGhvb2ssIG9yIHNsZWVwIGNhbGwuXG4gKi9cbmZ1bmN0aW9uIHdhcm5QZW5kaW5nUXVldWVJdGVtcyhcbiAgcnVuSWQ6IHN0cmluZyxcbiAgcGVuZGluZ1F1ZXVlOiBNYXA8c3RyaW5nLCBRdWV1ZUl0ZW0+LFxuICBvdXRjb21lOiAnY29tcGxldGVkJyB8ICdmYWlsZWQnXG4pOiB2b2lkIHtcbiAgLy8gRmlsdGVyIG91dCBob29rcyB0aGF0IGFyZSBlaXRoZXIgYWxyZWFkeSBjcmVhdGVkIChhbGl2ZSwgd2FpdGluZyBmb3IgcGF5bG9hZHMpXG4gIC8vIG9yIGV4cGxpY2l0bHkgZGlzcG9zZWQg4oCUIGJvdGggYXJlIGJlbmlnbiBzaW5jZSB0aGUgYmFja2VuZCBhdXRvLWRpc3Bvc2VzXG4gIC8vIGFsbCBob29rcyB3aGVuIGEgcnVuIHJlYWNoZXMgYSB0ZXJtaW5hbCBzdGF0ZVxuICBjb25zdCBpdGVtcyA9IFsuLi5wZW5kaW5nUXVldWUudmFsdWVzKCldLmZpbHRlcihcbiAgICAoaXRlbSkgPT4gIShpdGVtLnR5cGUgPT09ICdob29rJyAmJiAoaXRlbS5oYXNDcmVhdGVkRXZlbnQgfHwgaXRlbS5kaXNwb3NlZCkpXG4gICk7XG4gIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCBkZXRhaWxzID0gaXRlbXMubWFwKChpdGVtKSA9PiB7XG4gICAgc3dpdGNoIChpdGVtLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3N0ZXAnOlxuICAgICAgICByZXR1cm4gYHN0ZXAgXCIke2l0ZW0uc3RlcE5hbWV9XCJgO1xuICAgICAgY2FzZSAnaG9vayc6XG4gICAgICAgIHJldHVybiBgaG9vayBcIiR7aXRlbS50b2tlbn1cImA7XG4gICAgICBjYXNlICd3YWl0JzpcbiAgICAgICAgcmV0dXJuICdzbGVlcCc7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gYHVua25vd24gKCR7KGl0ZW0gYXMgeyB0eXBlOiBzdHJpbmcgfSkudHlwZX0pYDtcbiAgICB9XG4gIH0pO1xuXG4gIHJ1bnRpbWVMb2dnZXIud2FybihcbiAgICBgV29ya2Zsb3cgcnVuICR7b3V0Y29tZX0gd2l0aCAke2l0ZW1zLmxlbmd0aH0gdW5jb21taXR0ZWQgb3BlcmF0aW9uKHMpOiAke2RldGFpbHMuam9pbignLCAnKX0uIGAgK1xuICAgICAgJ0RpZCB5b3UgZm9yZ2V0IHRvIGBhd2FpdGAgYSBzdGVwLCBob29rLCBvciBzbGVlcCBjYWxsPycsXG4gICAgeyB3b3JrZmxvd1J1bklkOiBydW5JZCB9XG4gICk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Xb3JrZmxvdyhcbiAgd29ya2Zsb3dDb2RlOiBzdHJpbmcsXG4gIHdvcmtmbG93UnVuOiBXb3JrZmxvd1J1bixcbiAgZXZlbnRzOiBFdmVudFtdLFxuICBlbmNyeXB0aW9uS2V5OiBDcnlwdG9LZXkgfCB1bmRlZmluZWQsXG4gIC8qKlxuICAgKiBPcHRpb25hbCBwZXItcnVuIGNhY2hlIGZvciBoeWRyYXRlZCBzdGVwIHJldHVybiB2YWx1ZXMsIG93bmVkIGJ5IHRoZSBpbmxpbmVcbiAgICogcmVwbGF5IGxvb3Agc28gaXQgc3Vydml2ZXMgYWNyb3NzIHRoZSBsb29wJ3MgaXRlcmF0aW9ucyAoZWFjaCBvZiB3aGljaFxuICAgKiBjcmVhdGVzIGEgZnJlc2ggY29udGV4dCkuIE1lbW9pemVzIHRoZSBkZWNyeXB0ICsgZGV2YWx1ZS1wYXJzZSBvZiBjb21wbGV0ZWRcbiAgICogc3RlcCByZXN1bHRzIHRvIHR1cm4gTyhOwrIpIHJlcGxheSBoeWRyYXRpb24gaW50byBPKE4pLiBPbWl0dGVkIGJ5IGNhbGxlcnNcbiAgICogdGhhdCByZXBsYXkgb25seSBvbmNlICh0aGVuIHRoZXJlIGlzIG5vdGhpbmcgdG8gcmV1c2UpLlxuICAgKi9cbiAgc3RlcEh5ZHJhdGlvbkNhY2hlPzogU3RlcEh5ZHJhdGlvbkNhY2hlXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCB1bmtub3duPiB7XG4gIHJldHVybiB0cmFjZShgd29ya2Zsb3cucnVuICR7d29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lfWAsIGFzeW5jIChzcGFuKSA9PiB7XG4gICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dOYW1lKHdvcmtmbG93UnVuLndvcmtmbG93TmFtZSksXG4gICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5JZCh3b3JrZmxvd1J1bi5ydW5JZCksXG4gICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5TdGF0dXMod29ya2Zsb3dSdW4uc3RhdHVzKSxcbiAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0V2ZW50c0NvdW50KGV2ZW50cy5sZW5ndGgpLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhcnRlZEF0ID0gd29ya2Zsb3dSdW4uc3RhcnRlZEF0O1xuICAgIGlmICghc3RhcnRlZEF0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBXb3JrZmxvdyBydW4gXCIke3dvcmtmbG93UnVuLnJ1bklkfVwiIGhhcyBubyBcInN0YXJ0ZWRBdFwiIHRpbWVzdGFtcCAoc2hvdWxkIG5vdCBoYXBwZW4pYFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIHBvcnQgYmVmb3JlIGNyZWF0aW5nIFZNIGNvbnRleHQgdG8gYXZvaWQgYXN5bmMgb3BlcmF0aW9uc1xuICAgIC8vIGFmZmVjdGluZyB0aGUgZGV0ZXJtaW5pc3RpYyB0aW1lc3RhbXBcbiAgICBjb25zdCBpc1ZlcmNlbCA9IHByb2Nlc3MuZW52LlZFUkNFTF9VUkwgIT09IHVuZGVmaW5lZDtcbiAgICAvLyBMb2FkIGdldFBvcnQgbGF6aWx5IHRvIHByZXZlbnQgVHVyYm9wYWNrIGZyb20gdHJhY2luZyBnZXQtcG9ydCdzXG4gICAgLy8gZnMgb3BzIChyZWFkZGlyLCByZWFkRmlsZSkgaW50byB0aGUgZmxvdyByb3V0ZSBidW5kbGUuIFRoZSByZXNvbHZlZFxuICAgIC8vIHBvcnQgaXMgY2FjaGVkIHBlciBwcm9jZXNzIChzZWUgZ2V0LXBvcnQtbGF6eS50cyksIHNvIHRoaXMgaXMgY2hlYXBcbiAgICAvLyBvbiByZXBsYXlzIGFmdGVyIHRoZSBmaXJzdCDigJQgYGdldFBvcnQoKWAgb3RoZXJ3aXNlIHJlLXJ1bnMgT1MgcG9ydFxuICAgIC8vIGRpc2NvdmVyeSAoc3Bhd25pbmcgYGxzb2ZgIG9uIG1hY09TLCB+NjBtcykgb24gZXZlcnkgcmVwbGF5LlxuICAgIGNvbnN0IHdvcmtmbG93QmFzZVVybCA9IGNyZWF0ZVdvcmtmbG93QmFzZVVybChcbiAgICAgIGlzVmVyY2VsXG4gICAgICAgID8gYGh0dHBzOi8vJHtwcm9jZXNzLmVudi5WRVJDRUxfVVJMfWBcbiAgICAgICAgOiBgaHR0cDovL2xvY2FsaG9zdDokeyhhd2FpdCBnZXRQb3J0TGF6eSgpKSA/PyAzMDAwfWBcbiAgICApO1xuXG4gICAgY29uc3Qge1xuICAgICAgY29udGV4dCxcbiAgICAgIGdsb2JhbFRoaXM6IHZtR2xvYmFsVGhpcyxcbiAgICAgIHVwZGF0ZVRpbWVzdGFtcCxcbiAgICB9ID0gY3JlYXRlQ29udGV4dCh7XG4gICAgICBzZWVkOiBgJHt3b3JrZmxvd1J1bi5ydW5JZH06JHt3b3JrZmxvd1J1bi53b3JrZmxvd05hbWV9OiR7K3N0YXJ0ZWRBdH1gLFxuICAgICAgZml4ZWRUaW1lc3RhbXA6ICtzdGFydGVkQXQsXG4gICAgfSk7XG5cbiAgICBjb25zdCB3b3JrZmxvd0Rpc2NvbnRpbnVhdGlvbiA9IHdpdGhSZXNvbHZlcnM8dm9pZD4oKTtcblxuICAgIGNvbnN0IHVsaWQgPSBtb25vdG9uaWNGYWN0b3J5KCgpID0+IHZtR2xvYmFsVGhpcy5NYXRoLnJhbmRvbSgpKTtcbiAgICBjb25zdCBnZW5lcmF0ZU5hbm9pZCA9IG5hbm9pZC5jdXN0b21SYW5kb20obmFub2lkLnVybEFscGhhYmV0LCAyMSwgKHNpemUpID0+XG4gICAgICBuZXcgVWludDhBcnJheShzaXplKS5tYXAoKCkgPT4gMjU2ICogdm1HbG9iYWxUaGlzLk1hdGgucmFuZG9tKCkpXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBhIG11dGFibGUgaG9sZGVyIGZvciB0aGUgcHJvbWlzZSBxdWV1ZSBzbyB0aGUgRXZlbnRzQ29uc3VtZXJcbiAgICAvLyBjYW4gYWNjZXNzIHRoZSBjdXJyZW50IHF1ZXVlIHN0YXRlIHZpYSBhIGdldHRlci4gVGhlIHF1ZXVlIGlzIG11dGF0ZWRcbiAgICAvLyBieSBzdGVwL2hvb2svc2xlZXAgY2FsbGJhY2tzIGFzIGV2ZW50cyBhcmUgcHJvY2Vzc2VkLlxuICAgIGNvbnN0IHByb21pc2VRdWV1ZUhvbGRlciA9IHsgY3VycmVudDogUHJvbWlzZS5yZXNvbHZlKCkgfTtcblxuICAgIGNvbnN0IGV2ZW50c0NvbnN1bWVyID0gbmV3IEV2ZW50c0NvbnN1bWVyKGV2ZW50cywge1xuICAgICAgb25Db25zdW1lZEV2ZW50OiAoZXZlbnQpID0+IHtcbiAgICAgICAgdXBkYXRlVGltZXN0YW1wKCtldmVudC5jcmVhdGVkQXQpO1xuICAgICAgfSxcbiAgICAgIG9uVW5jb25zdW1lZEV2ZW50OiAoZXZlbnQpID0+IHtcbiAgICAgICAgd29ya2Zsb3dEaXNjb250aW51YXRpb24ucmVqZWN0KFxuICAgICAgICAgIG5ldyBSZXBsYXlEaXZlcmdlbmNlRXJyb3IoXG4gICAgICAgICAgICBgUmVwbGF5IGNvdWxkIG5vdCBjb25zdW1lIGV2ZW50OiBldmVudFR5cGU9JHtldmVudC5ldmVudFR5cGV9LCBjb3JyZWxhdGlvbklkPSR7ZXZlbnQuY29ycmVsYXRpb25JZH0sIGV2ZW50SWQ9JHtldmVudC5ldmVudElkfS5gLFxuICAgICAgICAgICAgeyBldmVudElkOiBldmVudC5ldmVudElkIH1cbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgZ2V0UHJvbWlzZVF1ZXVlOiAoKSA9PiBwcm9taXNlUXVldWVIb2xkZXIuY3VycmVudCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHdvcmtmbG93Q29udGV4dDogV29ya2Zsb3dPcmNoZXN0cmF0b3JDb250ZXh0ID0ge1xuICAgICAgcnVuSWQ6IHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgZW5jcnlwdGlvbktleSxcbiAgICAgIGdsb2JhbFRoaXM6IHZtR2xvYmFsVGhpcyxcbiAgICAgIG9uV29ya2Zsb3dFcnJvcjogd29ya2Zsb3dEaXNjb250aW51YXRpb24ucmVqZWN0LFxuICAgICAgZXZlbnRzQ29uc3VtZXIsXG4gICAgICBnZW5lcmF0ZVVsaWQ6ICgpID0+IHVsaWQoK3N0YXJ0ZWRBdCksXG4gICAgICBnZW5lcmF0ZU5hbm9pZCxcbiAgICAgIGludm9jYXRpb25zUXVldWU6IG5ldyBNYXAoKSxcbiAgICAgIC8vIFVzZSBnZXR0ZXIvc2V0dGVyIHNvIHRoZSBFdmVudHNDb25zdW1lcidzIGdldFByb21pc2VRdWV1ZSgpIGFsd2F5c1xuICAgICAgLy8gc2VlcyB0aGUgbGF0ZXN0IHF1ZXVlIHN0YXRlIGFzIGl0J3MgbXV0YXRlZCBieSBzdGVwL2hvb2svc2xlZXAgY2FsbGJhY2tzLlxuICAgICAgZ2V0IHByb21pc2VRdWV1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2VRdWV1ZUhvbGRlci5jdXJyZW50O1xuICAgICAgfSxcbiAgICAgIHNldCBwcm9taXNlUXVldWUodmFsdWU6IFByb21pc2U8dm9pZD4pIHtcbiAgICAgICAgcHJvbWlzZVF1ZXVlSG9sZGVyLmN1cnJlbnQgPSB2YWx1ZTtcbiAgICAgIH0sXG4gICAgICBwZW5kaW5nRGVsaXZlcmllczogMCxcbiAgICAgIHBlbmRpbmdEZWxpdmVyeUJhcnJpZXJzOiBuZXcgTWFwKCksXG4gICAgICBzdGVwSHlkcmF0aW9uQ2FjaGUsXG4gICAgfTtcblxuICAgIC8vIENvbnN1bWUgcnVuIGxpZmVjeWNsZSBldmVudHMgLSB0aGVzZSBhcmUgc3RydWN0dXJhbCBldmVudHMgdGhhdCBkb24ndFxuICAgIC8vIG5lZWQgc3BlY2lhbCBoYW5kbGluZyBpbiB0aGUgd29ya2Zsb3csIGJ1dCBtdXN0IGJlIGNvbnN1bWVkIHRvIGFkdmFuY2VcbiAgICAvLyBwYXN0IHRoZW0gaW4gdGhlIGV2ZW50IGxvZ1xuICAgIHdvcmtmbG93Q29udGV4dC5ldmVudHNDb25zdW1lci5zdWJzY3JpYmUoKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWV2ZW50KSB7XG4gICAgICAgIHJldHVybiBFdmVudENvbnN1bWVyUmVzdWx0Lk5vdENvbnN1bWVkO1xuICAgICAgfVxuXG4gICAgICAvLyBDb25zdW1lIHJ1bl9jcmVhdGVkIC0gZXZlcnkgcnVuIGhhcyBleGFjdGx5IG9uZVxuICAgICAgaWYgKGV2ZW50LmV2ZW50VHlwZSA9PT0gJ3J1bl9jcmVhdGVkJykge1xuICAgICAgICByZXR1cm4gRXZlbnRDb25zdW1lclJlc3VsdC5Db25zdW1lZDtcbiAgICAgIH1cblxuICAgICAgLy8gQ29uc3VtZSBydW5fc3RhcnRlZCAtIGV2ZXJ5IHJ1biBoYXMgZXhhY3RseSBvbmVcbiAgICAgIGlmIChldmVudC5ldmVudFR5cGUgPT09ICdydW5fc3RhcnRlZCcpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50Q29uc3VtZXJSZXN1bHQuQ29uc3VtZWQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBFdmVudENvbnN1bWVyUmVzdWx0Lk5vdENvbnN1bWVkO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlU3RlcCA9IGNyZWF0ZVVzZVN0ZXAod29ya2Zsb3dDb250ZXh0KTtcbiAgICBjb25zdCBjcmVhdGVIb29rID0gY3JlYXRlQ3JlYXRlSG9vayh3b3JrZmxvd0NvbnRleHQpO1xuICAgIGNvbnN0IHNsZWVwID0gY3JlYXRlU2xlZXAod29ya2Zsb3dDb250ZXh0KTtcblxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBgQHR5cGVzL25vZGVgIHNheXMgc3ltYm9sIGlzIG5vdCB2YWxpZCwgYnV0IGl0IGRvZXMgd29ya1xuICAgIHZtR2xvYmFsVGhpc1tXT1JLRkxPV19VU0VfU1RFUF0gPSB1c2VTdGVwO1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBgQHR5cGVzL25vZGVgIHNheXMgc3ltYm9sIGlzIG5vdCB2YWxpZCwgYnV0IGl0IGRvZXMgd29ya1xuICAgIHZtR2xvYmFsVGhpc1tXT1JLRkxPV19DUkVBVEVfSE9PS10gPSBjcmVhdGVIb29rO1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBgQHR5cGVzL25vZGVgIHNheXMgc3ltYm9sIGlzIG5vdCB2YWxpZCwgYnV0IGl0IGRvZXMgd29ya1xuICAgIHZtR2xvYmFsVGhpc1tXT1JLRkxPV19TTEVFUF0gPSBzbGVlcDtcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gYEB0eXBlcy9ub2RlYCBzYXlzIHN5bWJvbCBpcyBub3QgdmFsaWQsIGJ1dCBpdCBkb2VzIHdvcmtcbiAgICB2bUdsb2JhbFRoaXNbV09SS0ZMT1dfR0VUX1NUUkVBTV9JRF0gPSAobmFtZXNwYWNlPzogc3RyaW5nKSA9PlxuICAgICAgZ2V0V29ya2Zsb3dSdW5TdHJlYW1JZCh3b3JrZmxvd1J1bi5ydW5JZCwgbmFtZXNwYWNlKTtcblxuICAgIC8vIEZvciB0aGUgd29ya2Zsb3cgVk0sIHdlIHN0b3JlIHRoZSBjb250ZXh0IGluIGEgc3ltYm9sIG9uIHRoZSBgZ2xvYmFsVGhpc2Agb2JqZWN0XG4gICAgY29uc3QgY3R4OiBXb3JrZmxvd01ldGFkYXRhID0ge1xuICAgICAgd29ya2Zsb3dOYW1lOiB3b3JrZmxvd1J1bi53b3JrZmxvd05hbWUsXG4gICAgICB3b3JrZmxvd1J1bklkOiB3b3JrZmxvd1J1bi5ydW5JZCxcbiAgICAgIHdvcmtmbG93U3RhcnRlZEF0OiBuZXcgdm1HbG9iYWxUaGlzLkRhdGUoK3N0YXJ0ZWRBdCksXG4gICAgICB1cmw6IHdvcmtmbG93QmFzZVVybCxcbiAgICB9O1xuXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGBAdHlwZXMvbm9kZWAgc2F5cyBzeW1ib2wgaXMgbm90IHZhbGlkLCBidXQgaXQgZG9lcyB3b3JrXG4gICAgdm1HbG9iYWxUaGlzW1dPUktGTE9XX0NPTlRFWFRfU1lNQk9MXSA9IGN0eDtcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gYEB0eXBlcy9ub2RlYCBzYXlzIHN5bWJvbCBpcyBub3QgdmFsaWQsIGJ1dCBpdCBkb2VzIHdvcmtcbiAgICB2bUdsb2JhbFRoaXNbU1RBQkxFX1VMSURdID0gdWxpZDtcblxuICAgIC8vIE5PVEU6IFdpbGwgaGF2ZSBhIGNvbmZpZyBvdmVycmlkZSB0byB1c2UgdGhlIGN1c3RvbSBmZXRjaCBzdGVwLlxuICAgIC8vICAgICAgIEZvciBub3cgYGZldGNoYCBtdXN0IGJlIGV4cGxpY2l0bHkgaW1wb3J0ZWQgZnJvbSBgd29ya2Zsb3dgLlxuICAgIHZtR2xvYmFsVGhpcy5mZXRjaCA9ICgpID0+IHtcbiAgICAgIHRocm93IG5ldyB2bUdsb2JhbFRoaXMuRXJyb3IoXG4gICAgICAgIGBHbG9iYWwgXCJmZXRjaFwiIGlzIHVuYXZhaWxhYmxlIGluIHdvcmtmbG93IGZ1bmN0aW9ucy4gVXNlIHRoZSBcImZldGNoXCIgc3RlcCBmdW5jdGlvbiBmcm9tIFwid29ya2Zsb3dcIiB0byBtYWtlIEhUVFAgcmVxdWVzdHMuXFxuXFxuTGVhcm4gbW9yZTogaHR0cHM6Ly91c2V3b3JrZmxvdy5kZXYvZXJyLyR7RVJST1JfU0xVR1MuRkVUQ0hfSU5fV09SS0ZMT1dfRlVOQ1RJT059YFxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgLy8gT3ZlcnJpZGUgdGltZW91dC9pbnRlcnZhbCBmdW5jdGlvbnMgdG8gdGhyb3cgaGVscGZ1bCBlcnJvcnNcbiAgICAvLyBUaGVzZSBhcmUgbm90IHN1cHBvcnRlZCBpbiB3b3JrZmxvdyBmdW5jdGlvbnMgYmVjYXVzZSB0aGV5IHJlbHkgb25cbiAgICAvLyBhc3luY2hyb25vdXMgc2NoZWR1bGluZyB3aGljaCBicmVha3MgZGV0ZXJtaW5pc3RpYyByZXBsYXlcbiAgICBjb25zdCB0aW1lb3V0RXJyb3JNZXNzYWdlID1cbiAgICAgICdUaW1lb3V0IGZ1bmN0aW9ucyBsaWtlIFwic2V0VGltZW91dFwiIGFuZCBcInNldEludGVydmFsXCIgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gd29ya2Zsb3cgZnVuY3Rpb25zLiBVc2UgdGhlIFwic2xlZXBcIiBmdW5jdGlvbiBmcm9tIFwid29ya2Zsb3dcIiBmb3IgdGltZS1iYXNlZCBkZWxheXMuJztcblxuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5zZXRUaW1lb3V0ID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5zZXRJbnRlcnZhbCA9ICgpID0+IHtcbiAgICAgIHRocm93IG5ldyBXb3JrZmxvd1J1bnRpbWVFcnJvcih0aW1lb3V0RXJyb3JNZXNzYWdlLCB7XG4gICAgICAgIHNsdWc6IEVSUk9SX1NMVUdTLlRJTUVPVVRfRlVOQ1RJT05TX0lOX1dPUktGTE9XLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICAodm1HbG9iYWxUaGlzIGFzIGFueSkuY2xlYXJUaW1lb3V0ID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5jbGVhckludGVydmFsID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5zZXRJbW1lZGlhdGUgPSAoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IodGltZW91dEVycm9yTWVzc2FnZSwge1xuICAgICAgICBzbHVnOiBFUlJPUl9TTFVHUy5USU1FT1VUX0ZVTkNUSU9OU19JTl9XT1JLRkxPVyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgKHZtR2xvYmFsVGhpcyBhcyBhbnkpLmNsZWFySW1tZWRpYXRlID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gYFJlcXVlc3RgIGFuZCBgUmVzcG9uc2VgIGFyZSBzcGVjaWFsIGJ1aWx0LWluIGNsYXNzZXMgdGhhdCBpbnZva2Ugc3RlcHNcbiAgICAvLyBmb3IgdGhlIGBqc29uKClgLCBgdGV4dCgpYCBhbmQgYGFycmF5QnVmZmVyKClgIGluc3RhbmNlIG1ldGhvZHNcbiAgICBjbGFzcyBSZXF1ZXN0IGltcGxlbWVudHMgZ2xvYmFsVGhpcy5SZXF1ZXN0IHtcbiAgICAgIGNhY2hlITogZ2xvYmFsVGhpcy5SZXF1ZXN0WydjYWNoZSddO1xuICAgICAgY3JlZGVudGlhbHMhOiBnbG9iYWxUaGlzLlJlcXVlc3RbJ2NyZWRlbnRpYWxzJ107XG4gICAgICBkZXN0aW5hdGlvbiE6IGdsb2JhbFRoaXMuUmVxdWVzdFsnZGVzdGluYXRpb24nXTtcbiAgICAgIGhlYWRlcnMhOiBIZWFkZXJzO1xuICAgICAgaW50ZWdyaXR5ITogc3RyaW5nO1xuICAgICAgbWV0aG9kITogc3RyaW5nO1xuICAgICAgbW9kZSE6IGdsb2JhbFRoaXMuUmVxdWVzdFsnbW9kZSddO1xuICAgICAgcmVkaXJlY3QhOiBnbG9iYWxUaGlzLlJlcXVlc3RbJ3JlZGlyZWN0J107XG4gICAgICByZWZlcnJlciE6IHN0cmluZztcbiAgICAgIHJlZmVycmVyUG9saWN5ITogZ2xvYmFsVGhpcy5SZXF1ZXN0WydyZWZlcnJlclBvbGljeSddO1xuICAgICAgdXJsITogc3RyaW5nO1xuICAgICAga2VlcGFsaXZlITogYm9vbGVhbjtcbiAgICAgIHNpZ25hbCE6IEFib3J0U2lnbmFsO1xuICAgICAgZHVwbGV4ITogJ2hhbGYnO1xuICAgICAgYm9keSE6IFJlYWRhYmxlU3RyZWFtPGFueT4gfCBudWxsO1xuXG4gICAgICBjb25zdHJ1Y3RvcihpbnB1dDogYW55LCBpbml0PzogUmVxdWVzdEluaXQpIHtcbiAgICAgICAgLy8gSGFuZGxlIFVSTCBpbnB1dFxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJyB8fCBpbnB1dCBpbnN0YW5jZW9mIHZtR2xvYmFsVGhpcy5VUkwpIHtcbiAgICAgICAgICBjb25zdCB1cmxTdHJpbmcgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgICAgIC8vIFZhbGlkYXRlIFVSTCBmb3JtYXRcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbmV3IHZtR2xvYmFsVGhpcy5VUkwodXJsU3RyaW5nKTtcbiAgICAgICAgICAgIHRoaXMudXJsID0gdXJsU3RyaW5nO1xuICAgICAgICAgIH0gY2F0Y2ggKGNhdXNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBGYWlsZWQgdG8gcGFyc2UgVVJMIGZyb20gJHt1cmxTdHJpbmd9YCwge1xuICAgICAgICAgICAgICBjYXVzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJbnB1dCBpcyBhIFJlcXVlc3Qgb2JqZWN0IC0gY2xvbmUgaXRzIHByb3BlcnRpZXNcbiAgICAgICAgICB0aGlzLnVybCA9IGlucHV0LnVybDtcbiAgICAgICAgICBpZiAoIWluaXQpIHtcbiAgICAgICAgICAgIHRoaXMubWV0aG9kID0gaW5wdXQubWV0aG9kO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IHZtR2xvYmFsVGhpcy5IZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgICAgICAgdGhpcy5ib2R5ID0gaW5wdXQuYm9keTtcbiAgICAgICAgICAgIHRoaXMubW9kZSA9IGlucHV0Lm1vZGU7XG4gICAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICAgICAgICB0aGlzLmNhY2hlID0gaW5wdXQuY2FjaGU7XG4gICAgICAgICAgICB0aGlzLnJlZGlyZWN0ID0gaW5wdXQucmVkaXJlY3Q7XG4gICAgICAgICAgICB0aGlzLnJlZmVycmVyID0gaW5wdXQucmVmZXJyZXI7XG4gICAgICAgICAgICB0aGlzLnJlZmVycmVyUG9saWN5ID0gaW5wdXQucmVmZXJyZXJQb2xpY3k7XG4gICAgICAgICAgICB0aGlzLmludGVncml0eSA9IGlucHV0LmludGVncml0eTtcbiAgICAgICAgICAgIHRoaXMua2VlcGFsaXZlID0gaW5wdXQua2VlcGFsaXZlO1xuICAgICAgICAgICAgdGhpcy5zaWduYWwgPSBpbnB1dC5zaWduYWw7XG4gICAgICAgICAgICB0aGlzLmR1cGxleCA9IGlucHV0LmR1cGxleDtcbiAgICAgICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBpbnB1dC5kZXN0aW5hdGlvbjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gSWYgaW5pdCBpcyBwcm92aWRlZCwgbWVyZ2U6IHVzZSBzb3VyY2UgcHJvcGVydGllcywgdGhlbiBvdmVycmlkZSB3aXRoIGluaXRcbiAgICAgICAgICAvLyBDb3B5IGFsbCBwcm9wZXJ0aWVzIGZyb20gdGhlIHNvdXJjZSBSZXF1ZXN0IGZpcnN0XG4gICAgICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IHZtR2xvYmFsVGhpcy5IZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgICAgIHRoaXMuYm9keSA9IGlucHV0LmJvZHk7XG4gICAgICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICAgICAgdGhpcy5jYWNoZSA9IGlucHV0LmNhY2hlO1xuICAgICAgICAgIHRoaXMucmVkaXJlY3QgPSBpbnB1dC5yZWRpcmVjdDtcbiAgICAgICAgICB0aGlzLnJlZmVycmVyID0gaW5wdXQucmVmZXJyZXI7XG4gICAgICAgICAgdGhpcy5yZWZlcnJlclBvbGljeSA9IGlucHV0LnJlZmVycmVyUG9saWN5O1xuICAgICAgICAgIHRoaXMuaW50ZWdyaXR5ID0gaW5wdXQuaW50ZWdyaXR5O1xuICAgICAgICAgIHRoaXMua2VlcGFsaXZlID0gaW5wdXQua2VlcGFsaXZlO1xuICAgICAgICAgIHRoaXMuc2lnbmFsID0gaW5wdXQuc2lnbmFsO1xuICAgICAgICAgIHRoaXMuZHVwbGV4ID0gaW5wdXQuZHVwbGV4O1xuICAgICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBpbnB1dC5kZXN0aW5hdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE92ZXJyaWRlIHdpdGggaW5pdCBvcHRpb25zIGlmIHByb3ZpZGVkXG4gICAgICAgIC8vIFNldCBtZXRob2RcbiAgICAgICAgaWYgKGluaXQ/Lm1ldGhvZCkge1xuICAgICAgICAgIHRoaXMubWV0aG9kID0gaW5pdC5tZXRob2QudG9VcHBlckNhc2UoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5tZXRob2QgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgLy8gRmFsbGJhY2sgdG8gZGVmYXVsdCBmb3Igc3RyaW5nIGlucHV0IGNhc2VcbiAgICAgICAgICB0aGlzLm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IGhlYWRlcnNcbiAgICAgICAgaWYgKGluaXQ/LmhlYWRlcnMpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgdm1HbG9iYWxUaGlzLkhlYWRlcnMoaW5pdC5oZWFkZXJzKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICB0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICAgaW5wdXQgaW5zdGFuY2VvZiB2bUdsb2JhbFRoaXMuVVJMXG4gICAgICAgICkge1xuICAgICAgICAgIC8vIEZvciBzdHJpbmcvVVJMIGlucHV0LCBjcmVhdGUgZW1wdHkgaGVhZGVyc1xuICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyB2bUdsb2JhbFRoaXMuSGVhZGVycygpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IG90aGVyIHByb3BlcnRpZXMgd2l0aCBpbml0IHZhbHVlcyBvciBkZWZhdWx0c1xuICAgICAgICBpZiAoaW5pdD8ubW9kZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5tb2RlID0gaW5pdC5tb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLm1vZGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5tb2RlID0gJ2NvcnMnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluaXQ/LmNyZWRlbnRpYWxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5pdC5jcmVkZW50aWFscztcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5jcmVkZW50aWFscyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gJ3NhbWUtb3JpZ2luJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGBhbnlgIGNhc3QgaGVyZSBiZWNhdXNlIEB0eXBlcy9ub2RlIHYyMiBkb2VzIG5vdCB5ZXQgaGF2ZSBgY2FjaGVgXG4gICAgICAgIGlmICgoaW5pdCBhcyBhbnkpPy5jYWNoZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5jYWNoZSA9IChpbml0IGFzIGFueSkuY2FjaGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuY2FjaGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5jYWNoZSA9ICdkZWZhdWx0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbml0Py5yZWRpcmVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5yZWRpcmVjdCA9IGluaXQucmVkaXJlY3Q7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMucmVkaXJlY3QgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5yZWRpcmVjdCA9ICdmb2xsb3cnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluaXQ/LnJlZmVycmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLnJlZmVycmVyID0gaW5pdC5yZWZlcnJlcjtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5yZWZlcnJlciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLnJlZmVycmVyID0gJ2Fib3V0OmNsaWVudCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5pdD8ucmVmZXJyZXJQb2xpY3kgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMucmVmZXJyZXJQb2xpY3kgPSBpbml0LnJlZmVycmVyUG9saWN5O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLnJlZmVycmVyUG9saWN5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMucmVmZXJyZXJQb2xpY3kgPSAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbml0Py5pbnRlZ3JpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuaW50ZWdyaXR5ID0gaW5pdC5pbnRlZ3JpdHk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuaW50ZWdyaXR5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMuaW50ZWdyaXR5ID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5pdD8ua2VlcGFsaXZlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLmtlZXBhbGl2ZSA9IGluaXQua2VlcGFsaXZlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLmtlZXBhbGl2ZSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgdGhpcy5rZWVwYWxpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbml0Py5zaWduYWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBBYm9ydFNpZ25hbCBzdHViXG4gICAgICAgICAgdGhpcy5zaWduYWwgPSBpbml0LnNpZ25hbDtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5zaWduYWwpIHtcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gQWJvcnRTaWduYWwgc3R1YlxuICAgICAgICAgIHRoaXMuc2lnbmFsID0geyBhYm9ydGVkOiBmYWxzZSB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmR1cGxleCkge1xuICAgICAgICAgIHRoaXMuZHVwbGV4ID0gJ2hhbGYnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9ICdkb2N1bWVudCc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBib2R5ID0gaW5pdD8uYm9keTtcblxuICAgICAgICAvLyBWYWxpZGF0ZSB0aGF0IEdFVC9IRUFEIG1ldGhvZHMgZG9uJ3QgaGF2ZSBhIGJvZHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGJvZHkgIT09IG51bGwgJiZcbiAgICAgICAgICBib2R5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFJlcXVlc3Qgd2l0aCBHRVQvSEVBRCBtZXRob2QgY2Fubm90IGhhdmUgYm9keS5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0b3JlIHRoZSBvcmlnaW5hbCBCb2R5SW5pdCBmb3Igc2VyaWFsaXphdGlvblxuICAgICAgICBpZiAoYm9keSAhPT0gbnVsbCAmJiBib2R5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBDcmVhdGUgYSBcImZha2VcIiBSZWFkYWJsZVN0cmVhbSB0aGF0IHN0b3JlcyB0aGUgb3JpZ2luYWwgYm9keVxuICAgICAgICAgIC8vIFRoaXMgYXZvaWRzIGRvaW5nIGFzeW5jIHdvcmsgZHVyaW5nIHdvcmtmbG93IHJlcGxheVxuICAgICAgICAgIHRoaXMuYm9keSA9IE9iamVjdC5jcmVhdGUodm1HbG9iYWxUaGlzLlJlYWRhYmxlU3RyZWFtLnByb3RvdHlwZSwge1xuICAgICAgICAgICAgW0JPRFlfSU5JVF9TWU1CT0xdOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBib2R5LFxuICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuYm9keSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY2xvbmUoKTogUmVxdWVzdCB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0IGJvZHlVc2VkKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IGltcGxlbWVudCB0aGVzZVxuICAgICAgYmxvYiE6ICgpID0+IFByb21pc2U8QmxvYj47XG4gICAgICBmb3JtRGF0YSE6ICgpID0+IFByb21pc2U8Rm9ybURhdGE+O1xuXG4gICAgICBhcnJheUJ1ZmZlciE6ICgpID0+IFByb21pc2U8QXJyYXlCdWZmZXI+O1xuICAgICAganNvbiE6ICgpID0+IFByb21pc2U8YW55PjtcbiAgICAgIHRleHQhOiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG5cbiAgICAgIGFzeW5jIGJ5dGVzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgdGhpcy5hcnJheUJ1ZmZlcigpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdm1HbG9iYWxUaGlzLlJlcXVlc3QgPSBSZXF1ZXN0O1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoUmVxdWVzdC5wcm90b3R5cGUsIHtcbiAgICAgIGFycmF5QnVmZmVyOiB7XG4gICAgICAgIHZhbHVlOiB1c2VTdGVwPFtdLCBBcnJheUJ1ZmZlcj4oJ19fYnVpbHRpbl9yZXNwb25zZV9hcnJheV9idWZmZXInKSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBqc29uOiB7XG4gICAgICAgIHZhbHVlOiB1c2VTdGVwPFtdLCBhbnk+KCdfX2J1aWx0aW5fcmVzcG9uc2VfanNvbicpLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHRleHQ6IHtcbiAgICAgICAgdmFsdWU6IHVzZVN0ZXA8W10sIHN0cmluZz4oJ19fYnVpbHRpbl9yZXNwb25zZV90ZXh0JyksXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY2xhc3MgUmVzcG9uc2UgaW1wbGVtZW50cyBnbG9iYWxUaGlzLlJlc3BvbnNlIHtcbiAgICAgIHR5cGUhOiBnbG9iYWxUaGlzLlJlc3BvbnNlWyd0eXBlJ107XG4gICAgICB1cmwhOiBzdHJpbmc7XG4gICAgICBzdGF0dXMhOiBudW1iZXI7XG4gICAgICBzdGF0dXNUZXh0ITogc3RyaW5nO1xuICAgICAgYm9keSE6IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHwgbnVsbDtcbiAgICAgIGhlYWRlcnMhOiBIZWFkZXJzO1xuICAgICAgcmVkaXJlY3RlZCE6IGJvb2xlYW47XG5cbiAgICAgIGNvbnN0cnVjdG9yKGJvZHk/OiBhbnksIGluaXQ/OiBSZXNwb25zZUluaXQpIHtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBpbml0Py5zdGF0dXMgPz8gMjAwO1xuICAgICAgICB0aGlzLnN0YXR1c1RleHQgPSBpbml0Py5zdGF0dXNUZXh0ID8/ICcnO1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgdm1HbG9iYWxUaGlzLkhlYWRlcnMoaW5pdD8uaGVhZGVycyk7XG4gICAgICAgIHRoaXMudHlwZSA9ICdkZWZhdWx0JztcbiAgICAgICAgdGhpcy51cmwgPSAnJztcbiAgICAgICAgdGhpcy5yZWRpcmVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgdGhhdCBudWxsLWJvZHkgc3RhdHVzIGNvZGVzIGRvbid0IGhhdmUgYSBib2R5XG4gICAgICAgIC8vIFBlciBIVFRQIHNwZWM6IDIwNCAoTm8gQ29udGVudCksIDIwNSAoUmVzZXQgQ29udGVudCksIGFuZCAzMDQgKE5vdCBNb2RpZmllZClcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGJvZHkgIT09IG51bGwgJiZcbiAgICAgICAgICBib2R5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAodGhpcy5zdGF0dXMgPT09IDIwNCB8fCB0aGlzLnN0YXR1cyA9PT0gMjA1IHx8IHRoaXMuc3RhdHVzID09PSAzMDQpXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBgUmVzcG9uc2UgY29uc3RydWN0b3I6IEludmFsaWQgcmVzcG9uc2Ugc3RhdHVzIGNvZGUgJHt0aGlzLnN0YXR1c31gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0b3JlIHRoZSBvcmlnaW5hbCBCb2R5SW5pdCBmb3Igc2VyaWFsaXphdGlvblxuICAgICAgICBpZiAoYm9keSAhPT0gbnVsbCAmJiBib2R5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBDcmVhdGUgYSBcImZha2VcIiBSZWFkYWJsZVN0cmVhbSB0aGF0IHN0b3JlcyB0aGUgb3JpZ2luYWwgYm9keVxuICAgICAgICAgIC8vIFRoaXMgYXZvaWRzIGRvaW5nIGFzeW5jIHdvcmsgZHVyaW5nIHdvcmtmbG93IHJlcGxheVxuICAgICAgICAgIHRoaXMuYm9keSA9IE9iamVjdC5jcmVhdGUodm1HbG9iYWxUaGlzLlJlYWRhYmxlU3RyZWFtLnByb3RvdHlwZSwge1xuICAgICAgICAgICAgW0JPRFlfSU5JVF9TWU1CT0xdOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBib2R5LFxuICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuYm9keSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogaW1wbGVtZW50IHRoZXNlXG4gICAgICBjbG9uZSE6ICgpID0+IFJlc3BvbnNlO1xuICAgICAgYmxvYiE6ICgpID0+IFByb21pc2U8Z2xvYmFsVGhpcy5CbG9iPjtcbiAgICAgIGZvcm1EYXRhITogKCkgPT4gUHJvbWlzZTxnbG9iYWxUaGlzLkZvcm1EYXRhPjtcblxuICAgICAgZ2V0IG9rKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwO1xuICAgICAgfVxuXG4gICAgICBnZXQgYm9keVVzZWQoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgYXJyYXlCdWZmZXIhOiAoKSA9PiBQcm9taXNlPEFycmF5QnVmZmVyPjtcbiAgICAgIGpzb24hOiAoKSA9PiBQcm9taXNlPGFueT47XG4gICAgICB0ZXh0ITogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuXG4gICAgICBhc3luYyBieXRlcygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGF3YWl0IHRoaXMuYXJyYXlCdWZmZXIoKSk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyBqc29uKGRhdGE6IGFueSwgaW5pdD86IFJlc3BvbnNlSW5pdCk6IFJlc3BvbnNlIHtcbiAgICAgICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuICAgICAgICBjb25zdCBoZWFkZXJzID0gbmV3IHZtR2xvYmFsVGhpcy5IZWFkZXJzKGluaXQ/LmhlYWRlcnMpO1xuICAgICAgICBpZiAoIWhlYWRlcnMuaGFzKCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICAgIGhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwgeyAuLi5pbml0LCBoZWFkZXJzIH0pO1xuICAgICAgfVxuXG4gICAgICBzdGF0aWMgZXJyb3IoKTogUmVzcG9uc2Uge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyByZWRpcmVjdCh1cmw6IHN0cmluZyB8IFVSTCwgc3RhdHVzOiBudW1iZXIgPSAzMDIpOiBSZXNwb25zZSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIHN0YXR1cyBjb2RlIC0gb25seSBzcGVjaWZpYyByZWRpcmVjdCBjb2RlcyBhcmUgYWxsb3dlZFxuICAgICAgICBpZiAoIVszMDEsIDMwMiwgMzAzLCAzMDcsIDMwOF0uaW5jbHVkZXMoc3RhdHVzKSkge1xuICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFxuICAgICAgICAgICAgYEludmFsaWQgcmVkaXJlY3Qgc3RhdHVzIGNvZGU6ICR7c3RhdHVzfS4gTXVzdCBiZSBvbmUgb2Y6IDMwMSwgMzAyLCAzMDMsIDMwNywgMzA4YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgcmVzcG9uc2Ugd2l0aCBMb2NhdGlvbiBoZWFkZXJcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IG5ldyB2bUdsb2JhbFRoaXMuSGVhZGVycygpO1xuICAgICAgICBoZWFkZXJzLnNldCgnTG9jYXRpb24nLCBTdHJpbmcodXJsKSk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBPYmplY3QuY3JlYXRlKFJlc3BvbnNlLnByb3RvdHlwZSk7XG4gICAgICAgIHJlc3BvbnNlLnN0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgcmVzcG9uc2Uuc3RhdHVzVGV4dCA9ICcnO1xuICAgICAgICByZXNwb25zZS5oZWFkZXJzID0gaGVhZGVycztcbiAgICAgICAgcmVzcG9uc2UuYm9keSA9IG51bGw7XG4gICAgICAgIHJlc3BvbnNlLnR5cGUgPSAnZGVmYXVsdCc7XG4gICAgICAgIHJlc3BvbnNlLnVybCA9ICcnO1xuICAgICAgICByZXNwb25zZS5yZWRpcmVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfVxuICAgIH1cbiAgICB2bUdsb2JhbFRoaXMuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFJlc3BvbnNlLnByb3RvdHlwZSwge1xuICAgICAgYXJyYXlCdWZmZXI6IHtcbiAgICAgICAgdmFsdWU6IHVzZVN0ZXA8W10sIEFycmF5QnVmZmVyPignX19idWlsdGluX3Jlc3BvbnNlX2FycmF5X2J1ZmZlcicpLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGpzb246IHtcbiAgICAgICAgdmFsdWU6IHVzZVN0ZXA8W10sIGFueT4oJ19fYnVpbHRpbl9yZXNwb25zZV9qc29uJyksXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgICAgdGV4dDoge1xuICAgICAgICB2YWx1ZTogdXNlU3RlcDxbXSwgc3RyaW5nPignX19idWlsdGluX3Jlc3BvbnNlX3RleHQnKSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjbGFzcyBSZWFkYWJsZVN0cmVhbTxUPiBpbXBsZW1lbnRzIGdsb2JhbFRoaXMuUmVhZGFibGVTdHJlYW08VD4ge1xuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0IGxvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjYW5jZWwoKTogYW55IHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBnZXRSZWFkZXIoKTogYW55IHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBwaXBlVGhyb3VnaCgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHBpcGVUbygpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHRlZSgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHZhbHVlcygpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyBmcm9tKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZtR2xvYmFsVGhpcy5SZWFkYWJsZVN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtO1xuXG4gICAgY2xhc3MgV3JpdGFibGVTdHJlYW08VD4gaW1wbGVtZW50cyBnbG9iYWxUaGlzLldyaXRhYmxlU3RyZWFtPFQ+IHtcbiAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIGdldCBsb2NrZWQoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgYWJvcnQoKTogYW55IHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBjbG9zZSgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIGdldFdyaXRlcigpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZtR2xvYmFsVGhpcy5Xcml0YWJsZVN0cmVhbSA9IFdyaXRhYmxlU3RyZWFtO1xuXG4gICAgY2xhc3MgVHJhbnNmb3JtU3RyZWFtPEksIE8+IGltcGxlbWVudHMgZ2xvYmFsVGhpcy5UcmFuc2Zvcm1TdHJlYW08SSwgTz4ge1xuICAgICAgcmVhZGFibGU6IGdsb2JhbFRoaXMuUmVhZGFibGVTdHJlYW08Tz47XG4gICAgICB3cml0YWJsZTogZ2xvYmFsVGhpcy5Xcml0YWJsZVN0cmVhbTxJPjtcblxuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdm1HbG9iYWxUaGlzLlRyYW5zZm9ybVN0cmVhbSA9IFRyYW5zZm9ybVN0cmVhbTtcblxuICAgIC8vIEV2ZW50dWFsbHkgd2UnbGwgcHJvYmFibHkgd2FudCB0byBwcm92aWRlIG91ciBvd24gYGNvbnNvbGVgIG9iamVjdCxcbiAgICAvLyBidXQgZm9yIG5vdyB3ZSdsbCBqdXN0IGV4cG9zZSB0aGUgZ2xvYmFsIG9uZS5cbiAgICB2bUdsb2JhbFRoaXMuY29uc29sZSA9IGdsb2JhbFRoaXMuY29uc29sZTtcblxuICAgIC8vIEhBQ0s6IHByb3BhZ2F0ZSBzeW1ib2wgbmVlZGVkIGZvciBBSSBnYXRld2F5IHVzYWdlXG4gICAgY29uc3QgU1lNQk9MX0ZPUl9SRVFfQ09OVEVYVCA9IFN5bWJvbC5mb3IoJ0B2ZXJjZWwvcmVxdWVzdC1jb250ZXh0Jyk7XG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGBAdHlwZXMvbm9kZWAgc2F5cyBzeW1ib2wgaXMgbm90IHZhbGlkLCBidXQgaXQgZG9lcyB3b3JrXG4gICAgdm1HbG9iYWxUaGlzW1NZTUJPTF9GT1JfUkVRX0NPTlRFWFRdID0gKGdsb2JhbFRoaXMgYXMgYW55KVtcbiAgICAgIFNZTUJPTF9GT1JfUkVRX0NPTlRFWFRcbiAgICBdO1xuXG4gICAgLy8gR2V0IGEgcmVmZXJlbmNlIHRvIHRoZSB1c2VyLWRlZmluZWQgd29ya2Zsb3cgZnVuY3Rpb24uXG4gICAgLy8gVGhlIGZpbGVuYW1lIHBhcmFtZXRlciBlbnN1cmVzIHN0YWNrIHRyYWNlcyBzaG93IGEgbWVhbmluZ2Z1bCBuYW1lXG4gICAgLy8gKGUuZy4sIFwiZXhhbXBsZS93b3JrZmxvd3MvOTlfZTJlLnRzXCIpIGluc3RlYWQgb2YgXCJldmFsbWFjaGluZS48YW5vbnltb3VzPlwiLlxuICAgIGNvbnN0IHBhcnNlZE5hbWUgPSBwYXJzZVdvcmtmbG93TmFtZSh3b3JrZmxvd1J1bi53b3JrZmxvd05hbWUpO1xuICAgIGNvbnN0IGZpbGVuYW1lID0gcGFyc2VkTmFtZT8ubW9kdWxlU3BlY2lmaWVyIHx8IHdvcmtmbG93UnVuLndvcmtmbG93TmFtZTtcblxuICAgIC8vIEV2YWx1YXRlIHRoZSB3b3JrZmxvdyBidW5kbGUgYWdhaW5zdCB0aGUgZnJlc2ggY29udGV4dCB1c2luZyBhXG4gICAgLy8gcHJvY2Vzcy13aWRlIGNhY2hlIG9mIHRoZSBjb21waWxlZCBgdm0uU2NyaXB0YC4gVGhlIGJ1bmRsZSBpcyB0aGUgc2FtZVxuICAgIC8vIHN0cmluZyBmb3IgZXZlcnkgcmVwbGF5IGFuZCBldmVyeSBpbnZvY2F0aW9uIGluIHRoaXMgcHJvY2VzcywgYW5kXG4gICAgLy8gY29tcGlsYXRpb24gaXMgYSBwdXJlIGZ1bmN0aW9uIG9mIGAoY29kZSwgZmlsZW5hbWUpYCwgc28gcmV1c2luZyB0aGVcbiAgICAvLyBjb21waWxlZCBTY3JpcHQgYWNyb3NzIHJlcGxheXMgaXMgZGV0ZXJtaW5pc20tc2FmZTogaXQgcHJvZHVjZXMgdGhlIHNhbWVcbiAgICAvLyB3b3JrZmxvdyBmdW5jdGlvbiBhbmQgdGhlIHNhbWUgYGZpbGVuYW1lYCBzb3VyY2UgYXR0cmlidXRpb24gYXNcbiAgICAvLyByZS1wYXJzaW5nIHRoZSBidW5kbGUgZXZlcnkgdGltZSwgYnV0IHNraXBzIHRoZSAoZXhwZW5zaXZlKSByZS1wYXJzZS5cbiAgICAvLyBFdmFsdWF0aW5nIHRoZSBidW5kbGUgcmVnaXN0ZXJzIGV2ZXJ5IHdvcmtmbG93IG9uXG4gICAgLy8gYGdsb2JhbFRoaXMuX19wcml2YXRlX3dvcmtmbG93c2A7IHRoZSB0cmFpbGluZyBsb29rdXAgZXhwcmVzc2lvbiB0aGVuXG4gICAgLy8gcmV0cmlldmVzIHRoZSByZXF1ZXN0ZWQgd29ya2Zsb3cgZnVuY3Rpb24uIFRoZSBsb29rdXAgaXMgZXZhbHVhdGVkIGFzIGFcbiAgICAvLyBzZXBhcmF0ZSBjYWNoZWQgU2NyaXB0IHVuZGVyIHRoZSBzYW1lIGBmaWxlbmFtZWAsIHNvIGVycm9yIHN0YWNrIGZyYW1lc1xuICAgIC8vIHN0aWxsIGF0dHJpYnV0ZSB0byB0aGUgd29ya2Zsb3cncyBzb3VyY2UgZmlsZSAoYHJlbWFwRXJyb3JTdGFja2Aga2V5cyBvblxuICAgIC8vIGBmaWxlbmFtZWApLiBUaGUgb25lIGJlaGF2aW91cmFsIGRpZmZlcmVuY2UgZnJvbSB0aGUgcHJldmlvdXNcbiAgICAvLyBzaW5nbGUtY29tYmluZWQtc3RyaW5nIGFwcHJvYWNoIGlzIHRoZSAqbGluZSBudW1iZXIqIG9mIGFuIGVycm9yIHRocm93blxuICAgIC8vIGJ5IHRoZSBsb29rdXAgZXhwcmVzc2lvbiBpdHNlbGY6IGl0IG5vdyByZXBvcnRzIGxpbmUgMSBvZiB0aGUgbG9va3VwXG4gICAgLy8gU2NyaXB0IHJhdGhlciB0aGFuIHRoZSBsaW5lIGp1c3QgcGFzdCB0aGUgZW5kIG9mIHRoZSBidW5kbGUuIFRoYXQgcGF0aFxuICAgIC8vIGlzIHJhcmUgKGl0IHJlcXVpcmVzIHRoZSBsb29rdXAgYD8uZ2V0KC4uLilgIGV4cHJlc3Npb24gdG8gdGhyb3cpIGFuZFxuICAgIC8vIGRvZXMgbm90IGFmZmVjdCB0aGUgd29ya2Zsb3cgZnVuY3Rpb24gb3IgcmVwbGF5IGRldGVybWluaXNtLlxuICAgIHJ1bkNhY2hlZFdvcmtmbG93U2NyaXB0KHdvcmtmbG93Q29kZSwgZmlsZW5hbWUsIGNvbnRleHQpO1xuICAgIGNvbnN0IHdvcmtmbG93Rm4gPSBydW5DYWNoZWRXb3JrZmxvd1NjcmlwdChcbiAgICAgIGBnbG9iYWxUaGlzLl9fcHJpdmF0ZV93b3JrZmxvd3M/LmdldCgke0pTT04uc3RyaW5naWZ5KHdvcmtmbG93UnVuLndvcmtmbG93TmFtZSl9KWAsXG4gICAgICBmaWxlbmFtZSxcbiAgICAgIGNvbnRleHRcbiAgICApO1xuXG4gICAgaWYgKHR5cGVvZiB3b3JrZmxvd0ZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dOb3RSZWdpc3RlcmVkRXJyb3Iod29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lKTtcbiAgICB9XG5cbiAgICAvLyBDaGFpbiB3b3JrZmxvdyBhcmd1bWVudCBoeWRyYXRpb24gb250byB0aGUgcHJvbWlzZVF1ZXVlIHNvIHRoYXQgdGhlXG4gICAgLy8gdW5jb25zdW1lZCBldmVudCBjaGVjayAod2hpY2ggd2FpdHMgZm9yIHRoZSBxdWV1ZSB0byBkcmFpbikgZG9lc24ndFxuICAgIC8vIGZpcmUgZHVyaW5nIHRoZSBhc3luYyBnYXAgYmV0d2VlbiBydW5fc3RhcnRlZCBjb25zdW1wdGlvbiBhbmQgdGhlXG4gICAgLy8gd29ya2Zsb3cgZnVuY3Rpb24gc3Vic2NyaWJpbmcgaXRzIGZpcnN0IHN0ZXAgY2FsbGJhY2tzLlxuICAgIGxldCBhcmdzOiB1bmtub3duW10gPSBbXTtcbiAgICB3b3JrZmxvd0NvbnRleHQucHJvbWlzZVF1ZXVlID0gd29ya2Zsb3dDb250ZXh0LnByb21pc2VRdWV1ZS50aGVuKFxuICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhcmdzID0gYXdhaXQgaHlkcmF0ZVdvcmtmbG93QXJndW1lbnRzKFxuICAgICAgICAgIHdvcmtmbG93UnVuLmlucHV0LFxuICAgICAgICAgIHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgICAgIGVuY3J5cHRpb25LZXksXG4gICAgICAgICAgdm1HbG9iYWxUaGlzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgKTtcbiAgICBhd2FpdCB3b3JrZmxvd0NvbnRleHQucHJvbWlzZVF1ZXVlO1xuXG4gICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dBcmd1bWVudHNDb3VudChhcmdzLmxlbmd0aCksXG4gICAgfSk7XG5cbiAgICAvLyBJbnZva2UgdXNlciB3b3JrZmxvd1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICB3b3JrZmxvd0ZuKC4uLmFyZ3MpLFxuICAgICAgICB3b3JrZmxvd0Rpc2NvbnRpbnVhdGlvbi5wcm9taXNlLFxuICAgICAgXSk7XG5cbiAgICAgIGNvbnN0IGRlaHlkcmF0ZWQgPSBhd2FpdCBkZWh5ZHJhdGVXb3JrZmxvd1JldHVyblZhbHVlKFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgICBlbmNyeXB0aW9uS2V5LFxuICAgICAgICB2bUdsb2JhbFRoaXNcbiAgICAgICk7XG5cbiAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSZXN1bHRUeXBlKHR5cGVvZiByZXN1bHQpLFxuICAgICAgfSk7XG5cbiAgICAgIHdhcm5QZW5kaW5nUXVldWVJdGVtcyhcbiAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWQsXG4gICAgICAgIHdvcmtmbG93Q29udGV4dC5pbnZvY2F0aW9uc1F1ZXVlLFxuICAgICAgICAnY29tcGxldGVkJ1xuICAgICAgKTtcblxuICAgICAgcmV0dXJuIGRlaHlkcmF0ZWQ7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBDb250cm9sLWZsb3cgc2lnbmFscyBhcmUgaGFuZGxlZCBieSB0aGUgcnVudGltZSBhbmQgZG8gbm90IG1lYW4gdGhlXG4gICAgICAvLyB3b3JrZmxvdyBoYXMgdGVybWluYWxseSBmYWlsZWQuXG4gICAgICBpZiAoV29ya2Zsb3dTdXNwZW5zaW9uLmlzKGVycikgfHwgUmVwbGF5RGl2ZXJnZW5jZUVycm9yLmlzKGVycikpIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICB3YXJuUGVuZGluZ1F1ZXVlSXRlbXMoXG4gICAgICAgIHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgICB3b3JrZmxvd0NvbnRleHQuaW52b2NhdGlvbnNRdWV1ZSxcbiAgICAgICAgJ2ZhaWxlZCdcbiAgICAgICk7XG5cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufVxuIiwgImltcG9ydCB7XG4gIEVSUk9SX1NMVUdTLFxuICBIb29rTm90Rm91bmRFcnJvcixcbiAgV29ya2Zsb3dSdW50aW1lRXJyb3IsXG59IGZyb20gJ0B3b3JrZmxvdy9lcnJvcnMnO1xuaW1wb3J0IHtcbiAgdHlwZSBIb29rLFxuICBpc0xlZ2FjeVNwZWNWZXJzaW9uLFxuICBTUEVDX1ZFUlNJT05fQ1VSUkVOVCxcbiAgU1BFQ19WRVJTSU9OX0xFR0FDWSxcbiAgdHlwZSBXb3JrZmxvd0ludm9rZVBheWxvYWQsXG4gIHR5cGUgV29ya2Zsb3dSdW4sXG59IGZyb20gJ0B3b3JrZmxvdy93b3JsZCc7XG5pbXBvcnQgeyBnZXRSdW5DYXBhYmlsaXRpZXMgfSBmcm9tICcuLi9jYXBhYmlsaXRpZXMuanMnO1xuaW1wb3J0IHsgdHlwZSBDcnlwdG9LZXksIGltcG9ydEtleSB9IGZyb20gJy4uL2VuY3J5cHRpb24uanMnO1xuaW1wb3J0IHsgcnVudGltZUxvZ2dlciB9IGZyb20gJy4uL2xvZ2dlci5qcyc7XG5pbXBvcnQge1xuICBkZWh5ZHJhdGVTdGVwUmV0dXJuVmFsdWUsXG4gIGh5ZHJhdGVTdGVwQXJndW1lbnRzLFxuICBTZXJpYWxpemF0aW9uRm9ybWF0LFxufSBmcm9tICcuLi9zZXJpYWxpemF0aW9uLmpzJztcbmltcG9ydCB7IFdFQkhPT0tfUkVTUE9OU0VfV1JJVEFCTEUgfSBmcm9tICcuLi9zeW1ib2xzLmpzJztcbmltcG9ydCAqIGFzIEF0dHJpYnV0ZSBmcm9tICcuLi90ZWxlbWV0cnkvc2VtYW50aWMtY29udmVudGlvbnMuanMnO1xuaW1wb3J0IHsgZ2V0U3BhbkNvbnRleHRGb3JUcmFjZUNhcnJpZXIsIHRyYWNlIH0gZnJvbSAnLi4vdGVsZW1ldHJ5LmpzJztcbmltcG9ydCB7IGdldFdvcmtmbG93UXVldWVOYW1lIH0gZnJvbSAnLi9oZWxwZXJzLmpzJztcbmltcG9ydCB7IHNhZmVXYWl0VW50aWwsIHdhaXRlZFVudGlsIH0gZnJvbSAnLi93YWl0LXVudGlsLmpzJztcbmltcG9ydCB7IGdldFdvcmxkIH0gZnJvbSAnLi93b3JsZC5qcyc7XG5cbmFzeW5jIGZ1bmN0aW9uIG1hdGVyaWFsaXplUmVzcG9uc2VCb2R5KHJlc3BvbnNlOiBSZXNwb25zZSk6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgaWYgKCFyZXNwb25zZS5ib2R5KSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKCk7XG4gIHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwge1xuICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxuICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG4gICAgaGVhZGVyczogcmVzcG9uc2UuaGVhZGVycyxcbiAgfSk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIHRoYXQgcmV0dXJucyB0aGUgaG9vaywgdGhlIGFzc29jaWF0ZWQgd29ya2Zsb3cgcnVuLFxuICogYW5kIHRoZSByZXNvbHZlZCBlbmNyeXB0aW9uIGtleS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0SG9va0J5VG9rZW5XaXRoS2V5KHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgaG9vazogSG9vaztcbiAgcnVuOiBXb3JrZmxvd1J1bjtcbiAgZW5jcnlwdGlvbktleTogQ3J5cHRvS2V5IHwgdW5kZWZpbmVkO1xufT4ge1xuICBjb25zdCB3b3JsZCA9IGdldFdvcmxkKCk7XG4gIGNvbnN0IGhvb2sgPSBhd2FpdCB3b3JsZC5ob29rcy5nZXRCeVRva2VuKHRva2VuKTtcbiAgY29uc3QgcnVuID0gYXdhaXQgd29ybGQucnVucy5nZXQoaG9vay5ydW5JZCk7XG4gIGNvbnN0IHJhd0tleSA9IGF3YWl0IHdvcmxkLmdldEVuY3J5cHRpb25LZXlGb3JSdW4/LihydW4pO1xuICBjb25zdCBlbmNyeXB0aW9uS2V5ID0gcmF3S2V5ID8gYXdhaXQgaW1wb3J0S2V5KHJhd0tleSkgOiB1bmRlZmluZWQ7XG4gIGlmICh0eXBlb2YgaG9vay5tZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBob29rLm1ldGFkYXRhID0gYXdhaXQgaHlkcmF0ZVN0ZXBBcmd1bWVudHMoXG4gICAgICBob29rLm1ldGFkYXRhIGFzIGFueSxcbiAgICAgIGhvb2sucnVuSWQsXG4gICAgICBlbmNyeXB0aW9uS2V5XG4gICAgKTtcbiAgfVxuICByZXR1cm4geyBob29rLCBydW4sIGVuY3J5cHRpb25LZXkgfTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGhvb2sgYnkgdG9rZW4gdG8gZmluZCB0aGUgYXNzb2NpYXRlZCB3b3JrZmxvdyBydW4sXG4gKiBhbmQgaHlkcmF0ZSB0aGUgYG1ldGFkYXRhYCBwcm9wZXJ0eSBpZiBpdCB3YXMgc2V0IGZyb20gd2l0aGluXG4gKiB0aGUgd29ya2Zsb3cgcnVuLlxuICpcbiAqIEBwYXJhbSB0b2tlbiAtIFRoZSB1bmlxdWUgdG9rZW4gaWRlbnRpZnlpbmcgdGhlIGhvb2tcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEhvb2tCeVRva2VuKHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPEhvb2s+IHtcbiAgY29uc3QgeyBob29rIH0gPSBhd2FpdCBnZXRIb29rQnlUb2tlbldpdGhLZXkodG9rZW4pO1xuICByZXR1cm4gaG9vaztcbn1cblxuLyoqXG4gKiBSZXN1bWVzIGEgd29ya2Zsb3cgcnVuIGJ5IHNlbmRpbmcgYSBwYXlsb2FkIHRvIGEgaG9vayBpZGVudGlmaWVkIGJ5IGl0cyB0b2tlbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBleHRlcm5hbGx5IChlLmcuLCBmcm9tIGFuIEFQSSByb3V0ZSBvciBzZXJ2ZXIgYWN0aW9uKVxuICogdG8gc2VuZCBkYXRhIHRvIGEgaG9vayBhbmQgcmVzdW1lIHRoZSBhc3NvY2lhdGVkIHdvcmtmbG93IHJ1bi5cbiAqXG4gKiBAcGFyYW0gdG9rZW5Pckhvb2sgLSBUaGUgdW5pcXVlIHRva2VuIGlkZW50aWZ5aW5nIHRoZSBob29rLCBvciB0aGUgaG9vayBvYmplY3QgaXRzZWxmXG4gKiBAcGFyYW0gcGF5bG9hZCAtIFRoZSBkYXRhIHBheWxvYWQgdG8gc2VuZCB0byB0aGUgaG9va1xuICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIGhvb2tcbiAqIEB0aHJvd3MgRXJyb3IgaWYgdGhlIGhvb2sgaXMgbm90IGZvdW5kIG9yIGlmIHRoZXJlJ3MgYW4gZXJyb3IgZHVyaW5nIHRoZSBwcm9jZXNzXG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiBgYGB0c1xuICogLy8gSW4gYW4gQVBJIHJvdXRlXG4gKiBpbXBvcnQgeyByZXN1bWVIb29rIH0gZnJvbSAnQHdvcmtmbG93L2NvcmUvcnVudGltZSc7XG4gKlxuICogZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxdWVzdDogUmVxdWVzdCkge1xuICogICBjb25zdCB7IHRva2VuLCBkYXRhIH0gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTtcbiAqXG4gKiAgIHRyeSB7XG4gKiAgICAgY29uc3QgaG9vayA9IGF3YWl0IHJlc3VtZUhvb2sodG9rZW4sIGRhdGEpO1xuICogICAgIHJldHVybiBSZXNwb25zZS5qc29uKHsgcnVuSWQ6IGhvb2sucnVuSWQgfSk7XG4gKiAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnSG9vayBub3QgZm91bmQnLCB7IHN0YXR1czogNDA0IH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3VtZUhvb2s8VCA9IGFueT4oXG4gIHRva2VuT3JIb29rOiBzdHJpbmcgfCBIb29rLFxuICBwYXlsb2FkOiBULFxuICBlbmNyeXB0aW9uS2V5T3ZlcnJpZGU/OiBDcnlwdG9LZXlcbik6IFByb21pc2U8SG9vaz4ge1xuICByZXR1cm4gYXdhaXQgd2FpdGVkVW50aWwoKCkgPT4ge1xuICAgIHJldHVybiB0cmFjZSgnaG9vay5yZXN1bWUnLCBhc3luYyAoc3BhbikgPT4ge1xuICAgICAgY29uc3Qgd29ybGQgPSBnZXRXb3JsZCgpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBsZXQgaG9vazogSG9vaztcbiAgICAgICAgbGV0IHdvcmtmbG93UnVuOiBXb3JrZmxvd1J1bjtcbiAgICAgICAgbGV0IGVuY3J5cHRpb25LZXk6IENyeXB0b0tleSB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiB0b2tlbk9ySG9vayA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRIb29rQnlUb2tlbldpdGhLZXkodG9rZW5Pckhvb2spO1xuICAgICAgICAgIGhvb2sgPSByZXN1bHQuaG9vaztcbiAgICAgICAgICB3b3JrZmxvd1J1biA9IHJlc3VsdC5ydW47XG4gICAgICAgICAgZW5jcnlwdGlvbktleSA9IGVuY3J5cHRpb25LZXlPdmVycmlkZSA/PyByZXN1bHQuZW5jcnlwdGlvbktleTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBob29rID0gdG9rZW5Pckhvb2s7XG4gICAgICAgICAgd29ya2Zsb3dSdW4gPSBhd2FpdCB3b3JsZC5ydW5zLmdldChob29rLnJ1bklkKTtcbiAgICAgICAgICBpZiAoZW5jcnlwdGlvbktleU92ZXJyaWRlKSB7XG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5ID0gZW5jcnlwdGlvbktleU92ZXJyaWRlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCByYXdLZXkgPSBhd2FpdCB3b3JsZC5nZXRFbmNyeXB0aW9uS2V5Rm9yUnVuPy4od29ya2Zsb3dSdW4pO1xuICAgICAgICAgICAgZW5jcnlwdGlvbktleSA9IHJhd0tleSA/IGF3YWl0IGltcG9ydEtleShyYXdLZXkpIDogdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Ib29rVG9rZW4oaG9vay50b2tlbiksXG4gICAgICAgICAgLi4uQXR0cmlidXRlLkhvb2tJZChob29rLmhvb2tJZCksXG4gICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93UnVuSWQoaG9vay5ydW5JZCksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENoZWNrIHRoZSB0YXJnZXQgcnVuJ3MgY2FwYWJpbGl0aWVzIHRvIGVuc3VyZSB3ZSBlbmNvZGUgdGhlXG4gICAgICAgIC8vIHBheWxvYWQgaW4gYSBmb3JtYXQgdGhlIHJ1bidzIGRlcGxveW1lbnQgY2FuIGRlY29kZS4gRm9yIGV4YW1wbGUsXG4gICAgICAgIC8vIHJ1bnMgY3JlYXRlZCBiZWZvcmUgZW5jcnlwdGlvbiBzdXBwb3J0IHdhcyBhZGRlZCBjYW5ub3QgZGVjb2RlXG4gICAgICAgIC8vIHRoZSAnZW5jcicgc2VyaWFsaXphdGlvbiBmb3JtYXQsIGFuZCBydW5zIGNyZWF0ZWQgYmVmb3JlXG4gICAgICAgIC8vIGJ5dGUtc3RyZWFtIGZyYW1pbmcgc3VwcG9ydCBjYW5ub3QgZGVjb2RlIGZyYW1lZCBieXRlIHN0cmVhbXMuXG4gICAgICAgIGNvbnN0IHJhd1ZlcnNpb24gPSB3b3JrZmxvd1J1bi5leGVjdXRpb25Db250ZXh0Py53b3JrZmxvd0NvcmVWZXJzaW9uO1xuICAgICAgICBjb25zdCBjYXBhYmlsaXRpZXMgPSBnZXRSdW5DYXBhYmlsaXRpZXMoXG4gICAgICAgICAgdHlwZW9mIHJhd1ZlcnNpb24gPT09ICdzdHJpbmcnID8gcmF3VmVyc2lvbiA6IHVuZGVmaW5lZFxuICAgICAgICApO1xuICAgICAgICBpZiAoIWNhcGFiaWxpdGllcy5zdXBwb3J0ZWRGb3JtYXRzLmhhcyhTZXJpYWxpemF0aW9uRm9ybWF0LkVOQ1JZUFRFRCkpIHtcbiAgICAgICAgICBlbmNyeXB0aW9uS2V5ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVoeWRyYXRlIHRoZSBwYXlsb2FkIGZvciBzdG9yYWdlXG4gICAgICAgIGNvbnN0IG9wczogUHJvbWlzZTxhbnk+W10gPSBbXTtcbiAgICAgICAgY29uc3QgdjFDb21wYXQgPSBpc0xlZ2FjeVNwZWNWZXJzaW9uKGhvb2suc3BlY1ZlcnNpb24pO1xuICAgICAgICBjb25zdCBkZWh5ZHJhdGVkUGF5bG9hZCA9IGF3YWl0IGRlaHlkcmF0ZVN0ZXBSZXR1cm5WYWx1ZShcbiAgICAgICAgICBwYXlsb2FkLFxuICAgICAgICAgIGhvb2sucnVuSWQsXG4gICAgICAgICAgZW5jcnlwdGlvbktleSxcbiAgICAgICAgICBvcHMsXG4gICAgICAgICAgZ2xvYmFsVGhpcyxcbiAgICAgICAgICB2MUNvbXBhdCxcbiAgICAgICAgICBjYXBhYmlsaXRpZXMuZnJhbWVkQnl0ZVN0cmVhbXNcbiAgICAgICAgKTtcbiAgICAgICAgLy8gVGhlc2UgcGF5bG9hZC1zdHJlYW0gb3BzIGFyZSBmbHVzaGVkIGluIHRoZSBiYWNrZ3JvdW5kOyB0aGVcbiAgICAgICAgLy8gcHJvbWlzZSBoYW5kZWQgdG8gd2FpdFVudGlsIG11c3QgbmV2ZXIgcmVqZWN0IChhbiB1bmNvbnN1bWVkXG4gICAgICAgIC8vIHdhaXRVbnRpbCByZWplY3Rpb24gY3Jhc2hlcyB0aGUgcHJvY2VzcyBhcyB1bmhhbmRsZWRSZWplY3Rpb24pLFxuICAgICAgICAvLyBzbyB1bmV4cGVjdGVkIGZhaWx1cmVzIGFyZSBsb2dnZWQgaW5zdGVhZC5cbiAgICAgICAgLy8gTk9URTogcmVqZWN0aW9ucyB3aXRoIGB1bmRlZmluZWRgIGFyZSBhbiBleHBlY3RlZCBhcnRpZmFjdCBvZiB0aGVcbiAgICAgICAgLy8gd2ViaG9vayBidW5kbGUgYW5kIGFyZSBpZ25vcmVkIGVudGlyZWx5LlxuICAgICAgICBzYWZlV2FpdFVudGlsKFByb21pc2UuYWxsKG9wcyksIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICBydW50aW1lTG9nZ2VyLndhcm4oJ0JhY2tncm91bmQgZmx1c2ggb2YgaG9vayBwYXlsb2FkIG9wcyBmYWlsZWQnLCB7XG4gICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBob29rLnJ1bklkLFxuICAgICAgICAgICAgaG9va0lkOiBob29rLmhvb2tJZCxcbiAgICAgICAgICAgIGVycm9yOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIGhvb2tfcmVjZWl2ZWQgZXZlbnQgd2l0aCB0aGUgcGF5bG9hZFxuICAgICAgICBhd2FpdCB3b3JsZC5ldmVudHMuY3JlYXRlKFxuICAgICAgICAgIGhvb2sucnVuSWQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXZlbnRUeXBlOiAnaG9va19yZWNlaXZlZCcsXG4gICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICBjb3JyZWxhdGlvbklkOiBob29rLmhvb2tJZCxcbiAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAuLi4odjFDb21wYXQgPyB7fSA6IHsgdG9rZW46IGhvb2sudG9rZW4gfSksXG4gICAgICAgICAgICAgIHBheWxvYWQ6IGRlaHlkcmF0ZWRQYXlsb2FkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgdjFDb21wYXQgfVxuICAgICAgICApO1xuXG4gICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd05hbWUod29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdHJhY2VDYXJyaWVyID0gd29ya2Zsb3dSdW4uZXhlY3V0aW9uQ29udGV4dD8udHJhY2VDYXJyaWVyO1xuXG4gICAgICAgIGlmICh0cmFjZUNhcnJpZXIpIHtcbiAgICAgICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgZ2V0U3BhbkNvbnRleHRGb3JUcmFjZUNhcnJpZXIodHJhY2VDYXJyaWVyKTtcbiAgICAgICAgICBpZiAoY29udGV4dCkge1xuICAgICAgICAgICAgc3Bhbj8uYWRkTGluaz8uKHsgY29udGV4dCB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZS10cmlnZ2VyIHRoZSB3b3JrZmxvdyBhZ2FpbnN0IHRoZSBkZXBsb3ltZW50IElEIGFzc29jaWF0ZWRcbiAgICAgICAgLy8gd2l0aCB0aGUgd29ya2Zsb3cgcnVuIHRoYXQgdGhlIGhvb2sgYmVsb25ncyB0b1xuICAgICAgICBhd2FpdCB3b3JsZC5xdWV1ZShcbiAgICAgICAgICBnZXRXb3JrZmxvd1F1ZXVlTmFtZSh3b3JrZmxvd1J1bi53b3JrZmxvd05hbWUpLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJ1bklkOiBob29rLnJ1bklkLFxuICAgICAgICAgICAgLy8gYXR0YWNoIHRoZSB0cmFjZSBjYXJyaWVyIGZyb20gdGhlIHdvcmtmbG93IHJ1blxuICAgICAgICAgICAgdHJhY2VDYXJyaWVyOlxuICAgICAgICAgICAgICB3b3JrZmxvd1J1bi5leGVjdXRpb25Db250ZXh0Py50cmFjZUNhcnJpZXIgPz8gdW5kZWZpbmVkLFxuICAgICAgICAgIH0gc2F0aXNmaWVzIFdvcmtmbG93SW52b2tlUGF5bG9hZCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkZXBsb3ltZW50SWQ6IHdvcmtmbG93UnVuLmRlcGxveW1lbnRJZCxcbiAgICAgICAgICAgIHNwZWNWZXJzaW9uOiB3b3JrZmxvd1J1bi5zcGVjVmVyc2lvbiA/PyBTUEVDX1ZFUlNJT05fTEVHQUNZLFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gaG9vaztcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBzcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAuLi5BdHRyaWJ1dGUuSG9va1Rva2VuKFxuICAgICAgICAgICAgdHlwZW9mIHRva2VuT3JIb29rID09PSAnc3RyaW5nJyA/IHRva2VuT3JIb29rIDogdG9rZW5Pckhvb2sudG9rZW5cbiAgICAgICAgICApLFxuICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Ib29rRm91bmQoZmFsc2UpLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cblxuLyoqXG4gKiBSZXN1bWVzIGEgd2ViaG9vayBieSBzZW5kaW5nIGEge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9SZXF1ZXN0IHwgUmVxdWVzdH1cbiAqIG9iamVjdCB0byBhIGhvb2sgaWRlbnRpZmllZCBieSBpdHMgdG9rZW4uXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZXh0ZXJuYWxseSAoZS5nLiwgZnJvbSBhbiBBUEkgcm91dGUgb3Igc2VydmVyIGFjdGlvbilcbiAqIHRvIHNlbmQgYSByZXF1ZXN0IHRvIGEgd2ViaG9vayBhbmQgcmVzdW1lIHRoZSBhc3NvY2lhdGVkIHdvcmtmbG93IHJ1bi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gLSBUaGUgdW5pcXVlIHRva2VuIGlkZW50aWZ5aW5nIHRoZSBob29rXG4gKiBAcGFyYW0gcmVxdWVzdCAtIFRoZSByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIGhvb2tcbiAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSByZXNwb25zZVxuICogQHRocm93cyBFcnJvciBpZiB0aGUgaG9vayBpcyBub3QgZm91bmQgb3IgaWYgdGhlcmUncyBhbiBlcnJvciBkdXJpbmcgdGhlIHByb2Nlc3NcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYHRzXG4gKiAvLyBJbiBhbiBBUEkgcm91dGVcbiAqIGltcG9ydCB7IHJlc3VtZVdlYmhvb2sgfSBmcm9tICdAd29ya2Zsb3cvY29yZS9ydW50aW1lJztcbiAqXG4gKiBleHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gKiAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuICogICBjb25zdCB0b2tlbiA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCd0b2tlbicpO1xuICpcbiAqICAgaWYgKCF0b2tlbikge1xuICogICAgIHJldHVybiBuZXcgUmVzcG9uc2UoJ01pc3NpbmcgdG9rZW4nLCB7IHN0YXR1czogNDAwIH0pO1xuICogICB9XG4gKlxuICogICB0cnkge1xuICogICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVzdW1lV2ViaG9vayh0b2tlbiwgcmVxdWVzdCk7XG4gKiAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICogICB9IGNhdGNoIChlcnJvcikge1xuICogICAgIHJldHVybiBuZXcgUmVzcG9uc2UoJ1dlYmhvb2sgbm90IGZvdW5kJywgeyBzdGF0dXM6IDQwNCB9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXN1bWVXZWJob29rKFxuICB0b2tlbjogc3RyaW5nLFxuICByZXF1ZXN0OiBSZXF1ZXN0XG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHsgaG9vaywgZW5jcnlwdGlvbktleSB9ID0gYXdhaXQgZ2V0SG9va0J5VG9rZW5XaXRoS2V5KHRva2VuKTtcblxuICAvLyBPbmx5IHdlYmhvb2tzIGNhbiBiZSByZXN1bWVkIHZpYSB0aGUgcHVibGljIGVuZHBvaW50LlxuICAvLyBJZiB0aGUgaG9vayB3YXMgY3JlYXRlZCB2aWEgY3JlYXRlSG9vaygpIChpc1dlYmhvb2sgIT09IHRydWUpLFxuICAvLyB0aHJvdyB0aGUgc2FtZSBcIm5vdCBmb3VuZFwiIGVycm9yIHRoZSB3b3JsZCB3b3VsZCB0aHJvdyBmb3IgYSBtaXNzaW5nXG4gIC8vIHRva2VuLiBUaGlzIHByZXZlbnRzIGxlYWtpbmcgdGhhdCB0aGUgdG9rZW4gaXMgdmFsaWQuXG4gIGlmIChob29rLmlzV2ViaG9vayA9PT0gZmFsc2UpIHtcbiAgICB0aHJvdyBuZXcgSG9va05vdEZvdW5kRXJyb3IodG9rZW4pO1xuICB9XG5cbiAgbGV0IHJlc3BvbnNlOiBSZXNwb25zZSB8IHVuZGVmaW5lZDtcbiAgbGV0IHJlc3BvbnNlUmVhZGFibGU6IFJlYWRhYmxlU3RyZWFtPFJlc3BvbnNlPiB8IHVuZGVmaW5lZDtcbiAgaWYgKFxuICAgIGhvb2subWV0YWRhdGEgJiZcbiAgICB0eXBlb2YgaG9vay5tZXRhZGF0YSA9PT0gJ29iamVjdCcgJiZcbiAgICAncmVzcG9uZFdpdGgnIGluIGhvb2subWV0YWRhdGFcbiAgKSB7XG4gICAgaWYgKGhvb2subWV0YWRhdGEucmVzcG9uZFdpdGggPT09ICdtYW51YWwnKSB7XG4gICAgICBjb25zdCB7IHJlYWRhYmxlLCB3cml0YWJsZSB9ID0gbmV3IFRyYW5zZm9ybVN0cmVhbTxSZXNwb25zZSwgUmVzcG9uc2U+KCk7XG4gICAgICByZXNwb25zZVJlYWRhYmxlID0gcmVhZGFibGU7XG5cbiAgICAgIC8vIFRoZSByZXF1ZXN0IGluc3RhbmNlIGluY2x1ZGVzIHRoZSB3cml0YWJsZSBzdHJlYW0gd2hpY2ggd2lsbCBiZSB1c2VkXG4gICAgICAvLyB0byB3cml0ZSB0aGUgcmVzcG9uc2UgdG8gdGhlIGNsaWVudCBmcm9tIHdpdGhpbiB0aGUgd29ya2Zsb3cgcnVuXG4gICAgICAocmVxdWVzdCBhcyBhbnkpW1dFQkhPT0tfUkVTUE9OU0VfV1JJVEFCTEVdID0gd3JpdGFibGU7XG4gICAgfSBlbHNlIGlmIChob29rLm1ldGFkYXRhLnJlc3BvbmRXaXRoIGluc3RhbmNlb2YgUmVzcG9uc2UpIHtcbiAgICAgIHJlc3BvbnNlID0gaG9vay5tZXRhZGF0YS5yZXNwb25kV2l0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKFxuICAgICAgICBgSW52YWxpZCBcXGByZXNwb25kV2l0aFxcYCB2YWx1ZTogJHtob29rLm1ldGFkYXRhLnJlc3BvbmRXaXRofWAsXG4gICAgICAgIHsgc2x1ZzogRVJST1JfU0xVR1MuV0VCSE9PS19JTlZBTElEX1JFU1BPTkRfV0lUSF9WQUxVRSB9XG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBObyBgcmVzcG9uZFdpdGhgIHZhbHVlIGltcGxpZXMgdGhlIGRlZmF1bHQgYmVoYXZpb3Igb2YgcmV0dXJuaW5nIGEgMjAyXG4gICAgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDIwMiB9KTtcbiAgfVxuXG4gIGF3YWl0IHJlc3VtZUhvb2soaG9vaywgcmVxdWVzdCwgZW5jcnlwdGlvbktleSk7XG5cbiAgaWYgKHJlc3BvbnNlUmVhZGFibGUpIHtcbiAgICAvLyBXYWl0IGZvciB0aGUgcmVhZGFibGUgc3RyZWFtIHRvIGVtaXQgb25lIGNodW5rLFxuICAgIC8vIHdoaWNoIGlzIHRoZSBgUmVzcG9uc2VgIG9iamVjdFxuICAgIGNvbnN0IHJlYWRlciA9IHJlc3BvbnNlUmVhZGFibGUuZ2V0UmVhZGVyKCk7XG4gICAgY29uc3QgY2h1bmsgPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgIGlmIChjaHVuay52YWx1ZSkge1xuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBtYXRlcmlhbGl6ZVJlc3BvbnNlQm9keShjaHVuay52YWx1ZSk7XG4gICAgfVxuICAgIGF3YWl0IHJlYWRlci5jYW5jZWwoKTtcbiAgfVxuXG4gIGlmICghcmVzcG9uc2UpIHtcbiAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IoJ1dvcmtmbG93IHJ1biBkaWQgbm90IHNlbmQgYSByZXNwb25zZScsIHtcbiAgICAgIHNsdWc6IEVSUk9SX1NMVUdTLldFQkhPT0tfUkVTUE9OU0VfTk9UX1NFTlQsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcmVzcG9uc2U7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFTLFlBQVksVUFBVTtBQUMvQixPQUFPLFVBQVU7QUFFVixTQUFTLGlCQUFpQixJQUFJO0FBQ2pDLFNBQU8sUUFBUSxLQUFLLEVBQUU7QUFDMUI7QUFDQSxTQUFTLFNBQVMsSUFBSTtBQUNsQixNQUFJLENBQUMsaUJBQWlCLEVBQUUsR0FBRztBQUN2QixVQUFNLElBQUksTUFBTSx1QkFBdUIsR0FBRyxNQUFNLEdBQUcs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QUEwQjtBQUNuQyxTQUF5QixpQkFBaUI7QUFDMUMsU0FBUyxpQkFBQUMsc0JBQXFCO0FBQzlCLFNBQ0UsMEJBQ0Esc0JBQ0EsMkJBQ0Q7QUFDRCxTQUFTLGlDQUFpQztBQUMxQyxZQUFZQyxnQkFBZTtBQUMzQixTQUFTLCtCQUErQixTQUFBQyxjQUFhO0FBQ3JELFNBQVMsNEJBQTRCO0FBQ3JDLFNBQVMsZUFBZSxtQkFBbUI7QUFDM0MsU0FBUyxnQkFBZ0I7OztBRitDekIsU0FDRSxRQUNBLFdBR0Q7QUFDRCxTQUNFLFdBQ0EsYUFHQSxZQUNBLHlCQUNBLGNBR0EsaUJBQ0Q7QUFDRCxTQUtFLGFBQ0Q7QUFDRCxTQUFTLHNCQUFzQjtBQUMvQixTQUNFLGFBQ0EsWUFBQUMsV0FDQSxvQkFBQUMsbUJBQ0EsZ0JBQ0Q7IiwKICAibmFtZXMiOiBbInN0YXJ0IiwgIkZhdGFsRXJyb3IiLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAiZmV0Y2giLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAiZ2V0U3RvcmUiLCAiZXh0cmFjdFBkZlRleHQiLCAic3RvcmUiLCAiZ2VuZXJhdGVQb2RjYXN0U2NyaXB0IiwgInZlcmJhdGltU2NyaXB0IiwgInNjcmlwdFByb3ZpZGVyTmFtZSIsICJub3JtYWxpemVPcHRpb25zIiwgIkxFTkdUSF9CVURHRVRTIiwgInN5bnRoZXNpemVEaWFsb2d1ZSIsICJ0dHNQcm92aWRlck5hbWUiLCAicmVmdW5kRXBpc29kZSIsICJyZWdpc3RlclN0ZXBGdW5jdGlvbiIsICJidWlsdGluTW9kdWxlcyIsICJub2RlQnVpbHRpbnMiLCAiYnVpbHRpbk1vZHVsZXMiLCAibm9kZUltcG9ydEV4dHJhY3RSZWdleCIsICJSZXBsYXlEaXZlcmdlbmNlRXJyb3IiLCAiV29ya2Zsb3dSdW50aW1lRXJyb3IiLCAicGFyc2VXb3JrZmxvd05hbWUiLCAiU1BFQ19WRVJTSU9OX0NVUlJFTlQiLCAiU1BFQ19WRVJTSU9OX0xFR0FDWSIsICJpbXBvcnRLZXkiLCAiV29ya2Zsb3dTdXNwZW5zaW9uIiwgInJ1bnRpbWVMb2dnZXIiLCAiZ2V0V29ya2Zsb3dRdWV1ZU5hbWUiLCAiZ2V0V29ybGQiLCAiQXR0cmlidXRlIiwgInRyYWNlIiwgIldvcmtmbG93U3VzcGVuc2lvbiIsICJFUlJPUl9TTFVHUyIsICJXb3JrZmxvd1J1bnRpbWVFcnJvciIsICJydW50aW1lTG9nZ2VyIiwgIkF0dHJpYnV0ZSIsICJ0cmFjZSIsICJnZXRXb3JsZCIsICJnZXRXb3JsZEhhbmRsZXJzIl0KfQo=
