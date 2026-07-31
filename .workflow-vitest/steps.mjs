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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbGliL3N0b3JlLnRzIiwgIi4uL2xpYi9waXBlbGluZS9leHRyYWN0LnRzIiwgIi4uL2xpYi92b2ljZXMudHMiLCAiLi4vbGliL29wdGlvbnMudHMiLCAiLi4vbGliL3BpcGVsaW5lL3NjcmlwdC50cyIsICIuLi9saWIvYXVkaW8vd2F2LnRzIiwgIi4uL2xpYi9hdWRpby9tcDMudHMiLCAiLi4vbGliL3BpcGVsaW5lL3R0cy50cyIsICIuLi9saWIvc3VwYWJhc2UvYWRtaW4udHMiLCAiLi4vbGliL2NyZWRpdHMudHMiLCAiLi4vbm9kZV9tb2R1bGVzL3dvcmtmbG93L3NyYy9pbnRlcm5hbC9idWlsdGlucy50cyIsICIuLi9ub2RlX21vZHVsZXMvd29ya2Zsb3cvc3JjL3N0ZGxpYi50cyIsICIuLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS50cyIsICIuLi9ub2RlX21vZHVsZXMvQHdvcmtmbG93L2J1aWxkZXJzL3NyYy9zZXJkZS1jaGVja2VyLnRzIiwgIi4uL25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvdml0ZXN0L25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvYnVpbGRlcnMvc3JjL3NlcmRlLWNoZWNrZXIudHMiLCAiLi4vbm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9jb3JlL3NyYy9ydW50aW1lLnRzIiwgIi4uL25vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvY29yZS9zcmMvd29ya2Zsb3cudHMiLCAiLi4vbm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9jb3JlL3NyYy9ydW50aW1lL3Jlc3VtZS1ob29rLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmNvbnN0IFVVSURfUkUgPSAvXlswLTlhLWZdezh9LVswLTlhLWZdezR9LVswLTlhLWZdezR9LVswLTlhLWZdezR9LVswLTlhLWZdezEyfSQvaTtcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkRXBpc29kZUlkKGlkKSB7XG4gICAgcmV0dXJuIFVVSURfUkUudGVzdChpZCk7XG59XG5mdW5jdGlvbiBhc3NlcnRJZChpZCkge1xuICAgIGlmICghaXNWYWxpZEVwaXNvZGVJZChpZCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVwaXNvZGUgaWQ6ICR7aWQuc2xpY2UoMCwgNDApfWApO1xuICAgIH1cbn1cbmNvbnN0IEFVRElPX0VYVCA9IHtcbiAgICBcImF1ZGlvL3dhdlwiOiBcIndhdlwiLFxuICAgIFwiYXVkaW8vbXBlZ1wiOiBcIm1wM1wiXG59O1xuY2xhc3MgRnNNZXRhIHtcbiAgICBkaXI7XG4gICAgY29uc3RydWN0b3IoZGlyKXtcbiAgICAgICAgdGhpcy5kaXIgPSBkaXI7XG4gICAgfVxuICAgIGZpbGUoaWQpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbih0aGlzLmRpciwgYCR7aWR9Lmpzb25gKTtcbiAgICB9XG4gICAgYXN5bmMgd3JpdGUoZXBpc29kZSkge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih0aGlzLmRpciwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmZpbGUoZXBpc29kZS5pZCk7XG4gICAgICAgIGNvbnN0IHRtcCA9IGAke3RhcmdldH0udG1wYDtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHRtcCwgSlNPTi5zdHJpbmdpZnkoZXBpc29kZSwgbnVsbCwgMikpO1xuICAgICAgICBhd2FpdCBmcy5yZW5hbWUodG1wLCB0YXJnZXQpO1xuICAgIH1cbiAgICBhc3luYyBsaXN0KGZpbHRlcikge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih0aGlzLmRpciwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnJlYWRkaXIodGhpcy5kaXIpO1xuICAgICAgICBjb25zdCBlcGlzb2RlcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGYgb2YgZmlsZXMpe1xuICAgICAgICAgICAgaWYgKCFmLmVuZHNXaXRoKFwiLmpzb25cIikpIGNvbnRpbnVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlcGlzb2Rlcy5wdXNoKEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKHRoaXMuZGlyLCBmKSwgXCJ1dGY4XCIpKSk7XG4gICAgICAgICAgICB9IGNhdGNoICB7XG4gICAgICAgICAgICAvLyBza2lwIHRvcm4vY29ycnVwdCBlbnRyaWVzIHJhdGhlciB0aGFuIGZhaWxpbmcgdGhlIHdob2xlIGxpc3RpbmdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2aXNpYmxlID0gZmlsdGVyID8gZXBpc29kZXMuZmlsdGVyKChlKT0+ZS51c2VySWQgPT09IGZpbHRlci51c2VySWQgfHwgZmlsdGVyLmluY2x1ZGVVbm93bmVkICYmIGUudXNlcklkID09PSB1bmRlZmluZWQpIDogZXBpc29kZXM7XG4gICAgICAgIHJldHVybiB2aXNpYmxlLnNvcnQoKGEsIGIpPT5iLmNyZWF0ZWRBdC5sb2NhbGVDb21wYXJlKGEuY3JlYXRlZEF0KSk7XG4gICAgfVxuICAgIGFzeW5jIGdldChpZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUodGhpcy5maWxlKGlkKSwgXCJ1dGY4XCIpKTtcbiAgICAgICAgfSBjYXRjaCAge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgY3JlYXRlKGVwaXNvZGUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZShlcGlzb2RlKTtcbiAgICB9XG4gICAgYXN5bmMgcGF0Y2goaWQsIGZpZWxkcykge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKCFleGlzdGluZykgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWQgPSB7XG4gICAgICAgICAgICAuLi5leGlzdGluZyxcbiAgICAgICAgICAgIC4uLmZpZWxkcyxcbiAgICAgICAgICAgIGlkXG4gICAgICAgIH07XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGUodXBkYXRlZCk7XG4gICAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgIH1cbiAgICBhc3luYyBwYXRjaElmKGlkLCBleHBlY3RlZFN0YXR1cywgZmllbGRzKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5nZXQoaWQpO1xuICAgICAgICBpZiAoIWV4aXN0aW5nIHx8IGV4aXN0aW5nLnN0YXR1cyAhPT0gZXhwZWN0ZWRTdGF0dXMpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCB1cGRhdGVkID0ge1xuICAgICAgICAgICAgLi4uZXhpc3RpbmcsXG4gICAgICAgICAgICAuLi5maWVsZHMsXG4gICAgICAgICAgICBpZFxuICAgICAgICB9O1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlKHVwZGF0ZWQpO1xuICAgICAgICByZXR1cm4gdXBkYXRlZDtcbiAgICB9XG4gICAgYXN5bmMgZGVsZXRlKGlkKSB7XG4gICAgICAgIGF3YWl0IGZzLnJtKHRoaXMuZmlsZShpZCksIHtcbiAgICAgICAgICAgIGZvcmNlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJvd1RvRXBpc29kZShyb3cpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBpZDogcm93LmlkLFxuICAgICAgICB1c2VySWQ6IHJvdy51c2VyX2lkID8/IHVuZGVmaW5lZCxcbiAgICAgICAgdGl0bGU6IHJvdy50aXRsZSxcbiAgICAgICAgc291cmNlRmlsZW5hbWU6IHJvdy5zb3VyY2VfZmlsZW5hbWUsXG4gICAgICAgIG1vZGU6IHJvdy5tb2RlID8/IFwiY29udmVyc2F0aW9uXCIsXG4gICAgICAgIG9wdGlvbnM6IHJvdy5vcHRpb25zID8/IHVuZGVmaW5lZCxcbiAgICAgICAgc3RhdHVzOiByb3cuc3RhdHVzLFxuICAgICAgICBlcnJvcjogcm93LmVycm9yID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY3JlYXRlZEF0OiByb3cuY3JlYXRlZF9hdCxcbiAgICAgICAgdG90YWxQYWdlczogcm93LnRvdGFsX3BhZ2VzID8/IHVuZGVmaW5lZCxcbiAgICAgICAgZXh0cmFjdGVkQ2hhcnM6IHJvdy5leHRyYWN0ZWRfY2hhcnMgPz8gdW5kZWZpbmVkLFxuICAgICAgICBzY3JpcHQ6IHJvdy5zY3JpcHQgPz8gdW5kZWZpbmVkLFxuICAgICAgICBhdWRpb01pbWVUeXBlOiByb3cuYXVkaW9fbWltZV90eXBlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgZHVyYXRpb25TZWNvbmRzOiByb3cuZHVyYXRpb25fc2Vjb25kcyA/PyB1bmRlZmluZWQsXG4gICAgICAgIHByb3ZpZGVyczogcm93LnByb3ZpZGVycyA/PyB1bmRlZmluZWRcbiAgICB9O1xufVxuZnVuY3Rpb24gZXBpc29kZVRvUm93KGZpZWxkcykge1xuICAgIGNvbnN0IHJvdyA9IHt9O1xuICAgIGlmIChmaWVsZHMuaWQgIT09IHVuZGVmaW5lZCkgcm93LmlkID0gZmllbGRzLmlkO1xuICAgIGlmIChmaWVsZHMudXNlcklkICE9PSB1bmRlZmluZWQpIHJvdy51c2VyX2lkID0gZmllbGRzLnVzZXJJZDtcbiAgICBpZiAoZmllbGRzLnRpdGxlICE9PSB1bmRlZmluZWQpIHJvdy50aXRsZSA9IGZpZWxkcy50aXRsZTtcbiAgICBpZiAoZmllbGRzLnNvdXJjZUZpbGVuYW1lICE9PSB1bmRlZmluZWQpIHJvdy5zb3VyY2VfZmlsZW5hbWUgPSBmaWVsZHMuc291cmNlRmlsZW5hbWU7XG4gICAgaWYgKGZpZWxkcy5tb2RlICE9PSB1bmRlZmluZWQpIHJvdy5tb2RlID0gZmllbGRzLm1vZGU7XG4gICAgaWYgKGZpZWxkcy5vcHRpb25zICE9PSB1bmRlZmluZWQpIHJvdy5vcHRpb25zID0gZmllbGRzLm9wdGlvbnM7XG4gICAgaWYgKGZpZWxkcy5zdGF0dXMgIT09IHVuZGVmaW5lZCkgcm93LnN0YXR1cyA9IGZpZWxkcy5zdGF0dXM7XG4gICAgaWYgKGZpZWxkcy5lcnJvciAhPT0gdW5kZWZpbmVkKSByb3cuZXJyb3IgPSBmaWVsZHMuZXJyb3I7XG4gICAgaWYgKGZpZWxkcy5jcmVhdGVkQXQgIT09IHVuZGVmaW5lZCkgcm93LmNyZWF0ZWRfYXQgPSBmaWVsZHMuY3JlYXRlZEF0O1xuICAgIGlmIChmaWVsZHMudG90YWxQYWdlcyAhPT0gdW5kZWZpbmVkKSByb3cudG90YWxfcGFnZXMgPSBmaWVsZHMudG90YWxQYWdlcztcbiAgICBpZiAoZmllbGRzLmV4dHJhY3RlZENoYXJzICE9PSB1bmRlZmluZWQpIHJvdy5leHRyYWN0ZWRfY2hhcnMgPSBmaWVsZHMuZXh0cmFjdGVkQ2hhcnM7XG4gICAgaWYgKGZpZWxkcy5zY3JpcHQgIT09IHVuZGVmaW5lZCkgcm93LnNjcmlwdCA9IGZpZWxkcy5zY3JpcHQ7XG4gICAgaWYgKGZpZWxkcy5hdWRpb01pbWVUeXBlICE9PSB1bmRlZmluZWQpIHJvdy5hdWRpb19taW1lX3R5cGUgPSBmaWVsZHMuYXVkaW9NaW1lVHlwZTtcbiAgICBpZiAoZmllbGRzLmR1cmF0aW9uU2Vjb25kcyAhPT0gdW5kZWZpbmVkKSByb3cuZHVyYXRpb25fc2Vjb25kcyA9IGZpZWxkcy5kdXJhdGlvblNlY29uZHM7XG4gICAgaWYgKGZpZWxkcy5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCkgcm93LnByb3ZpZGVycyA9IGZpZWxkcy5wcm92aWRlcnM7XG4gICAgcmV0dXJuIHJvdztcbn1cbmNsYXNzIFN1cGFiYXNlTWV0YSB7XG4gICAgY2xpZW50UHJvbWlzZSA9IG51bGw7XG4gICAgY2xpZW50KCkge1xuICAgICAgICBpZiAoIXRoaXMuY2xpZW50UHJvbWlzZSkge1xuICAgICAgICAgICAgdGhpcy5jbGllbnRQcm9taXNlID0gaW1wb3J0KFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCIpLnRoZW4oKHsgY3JlYXRlQ2xpZW50IH0pPT5jcmVhdGVDbGllbnQocHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMLCBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRUNSRVRfS0VZLCB7XG4gICAgICAgICAgICAgICAgICAgIGF1dGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlcnNpc3RTZXNzaW9uOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudFByb21pc2U7XG4gICAgfVxuICAgIGFzeW5jIGxpc3QoZmlsdGVyKSB7XG4gICAgICAgIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gc3VwYWJhc2UuZnJvbShcImVwaXNvZGVzXCIpLnNlbGVjdChcIipcIikub3JkZXIoXCJjcmVhdGVkX2F0XCIsIHtcbiAgICAgICAgICAgIGFzY2VuZGluZzogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmaWx0ZXIpIHtcbiAgICAgICAgICAgIHF1ZXJ5ID0gZmlsdGVyLmluY2x1ZGVVbm93bmVkID8gcXVlcnkub3IoYHVzZXJfaWQuZXEuJHtmaWx0ZXIudXNlcklkfSx1c2VyX2lkLmlzLm51bGxgKSA6IHF1ZXJ5LmVxKFwidXNlcl9pZFwiLCBmaWx0ZXIudXNlcklkKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBxdWVyeTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBuZXcgRXJyb3IoYGVwaXNvZGVzIGxpc3QgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIHJldHVybiBkYXRhLm1hcChyb3dUb0VwaXNvZGUpO1xuICAgIH1cbiAgICBhc3luYyBnZXQoaWQpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikuc2VsZWN0KFwiKlwiKS5lcShcImlkXCIsIGlkKS5tYXliZVNpbmdsZSgpO1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgZXBpc29kZSBnZXQgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIHJldHVybiBkYXRhID8gcm93VG9FcGlzb2RlKGRhdGEpIDogbnVsbDtcbiAgICB9XG4gICAgYXN5bmMgY3JlYXRlKGVwaXNvZGUpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikuaW5zZXJ0KGVwaXNvZGVUb1JvdyhlcGlzb2RlKSk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBlcGlzb2RlIGNyZWF0ZSBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9XG4gICAgYXN5bmMgcGF0Y2goaWQsIGZpZWxkcykge1xuICAgICAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oXCJlcGlzb2Rlc1wiKS51cGRhdGUoZXBpc29kZVRvUm93KGZpZWxkcykpLmVxKFwiaWRcIiwgaWQpLnNlbGVjdCgpLm1heWJlU2luZ2xlKCk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBlcGlzb2RlIHBhdGNoIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICByZXR1cm4gZGF0YSA/IHJvd1RvRXBpc29kZShkYXRhKSA6IG51bGw7XG4gICAgfVxuICAgIGFzeW5jIHBhdGNoSWYoaWQsIGV4cGVjdGVkU3RhdHVzLCBmaWVsZHMpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICAvLyBBdG9taWMgY29tcGFyZS1hbmQtc2V0OiB0aGUgc3RhdHVzIHByZWRpY2F0ZSBtYWtlcyBjb25jdXJyZW50IFBBVENIZXNcbiAgICAgICAgLy8gcmFjZSBmb3IgdGhlIHNpbmdsZSByb3cgdGhhdCBzdGlsbCBtYXRjaGVzIGV4cGVjdGVkU3RhdHVzLlxuICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikudXBkYXRlKGVwaXNvZGVUb1JvdyhmaWVsZHMpKS5lcShcImlkXCIsIGlkKS5lcShcInN0YXR1c1wiLCBleHBlY3RlZFN0YXR1cykuc2VsZWN0KCkubWF5YmVTaW5nbGUoKTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBuZXcgRXJyb3IoYGVwaXNvZGUgcGF0Y2hJZiBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgcmV0dXJuIGRhdGEgPyByb3dUb0VwaXNvZGUoZGF0YSkgOiBudWxsO1xuICAgIH1cbiAgICBhc3luYyBkZWxldGUoaWQpIHtcbiAgICAgICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiZXBpc29kZXNcIikuZGVsZXRlKCkuZXEoXCJpZFwiLCBpZCk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBlcGlzb2RlIGRlbGV0ZSBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzbGljZVJhbmdlKGRhdGEsIG1pbWVUeXBlLCByYW5nZSkge1xuICAgIGNvbnN0IHRvdGFsID0gZGF0YS5ieXRlTGVuZ3RoO1xuICAgIGNvbnN0IGJhc2UgPSB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IG1pbWVUeXBlLFxuICAgICAgICBcIkFjY2VwdC1SYW5nZXNcIjogXCJieXRlc1wiLFxuICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJwcml2YXRlLCBtYXgtYWdlPTMxNTM2MDAwLCBpbW11dGFibGVcIlxuICAgIH07XG4gICAgY29uc3QgbWF0Y2ggPSByYW5nZSA/IC9ieXRlcz0oXFxkKiktKFxcZCopLy5leGVjKHJhbmdlKSA6IG51bGw7XG4gICAgaWYgKG1hdGNoICYmIChtYXRjaFsxXSB8fCBtYXRjaFsyXSkpIHtcbiAgICAgICAgbGV0IHN0YXJ0O1xuICAgICAgICBsZXQgZW5kO1xuICAgICAgICBpZiAoIW1hdGNoWzFdKSB7XG4gICAgICAgICAgICBjb25zdCBzdWZmaXggPSBNYXRoLm1pbihwYXJzZUludChtYXRjaFsyXSwgMTApLCB0b3RhbCk7XG4gICAgICAgICAgICBzdGFydCA9IHRvdGFsIC0gc3VmZml4O1xuICAgICAgICAgICAgZW5kID0gdG90YWwgLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhcnQgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICAgICAgZW5kID0gbWF0Y2hbMl0gPyBNYXRoLm1pbihwYXJzZUludChtYXRjaFsyXSwgMTApLCB0b3RhbCAtIDEpIDogdG90YWwgLSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydCA8PSBlbmQgJiYgc3RhcnQgPCB0b3RhbCkge1xuICAgICAgICAgICAgY29uc3QgY2h1bmsgPSBkYXRhLnNsaWNlKHN0YXJ0LCBlbmQgKyAxKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAyMDYsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAuLi5iYXNlLFxuICAgICAgICAgICAgICAgICAgICBcIkNvbnRlbnQtUmFuZ2VcIjogYGJ5dGVzICR7c3RhcnR9LSR7ZW5kfS8ke3RvdGFsfWAsXG4gICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1MZW5ndGhcIjogU3RyaW5nKGNodW5rLmJ5dGVMZW5ndGgpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBjaHVua1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzOiA0MTYsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJBY2NlcHQtUmFuZ2VzXCI6IFwiYnl0ZXNcIixcbiAgICAgICAgICAgICAgICBcIkNvbnRlbnQtUmFuZ2VcIjogYGJ5dGVzICovJHt0b3RhbH1gXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogbmV3IFVpbnQ4QXJyYXkoMClcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIC4uLmJhc2UsXG4gICAgICAgICAgICBcIkNvbnRlbnQtTGVuZ3RoXCI6IFN0cmluZyh0b3RhbClcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogZGF0YVxuICAgIH07XG59XG5jbGFzcyBGc0JpbmFyeSB7XG4gICAgcm9vdDtcbiAgICBjb25zdHJ1Y3Rvcihyb290KXtcbiAgICAgICAgdGhpcy5yb290ID0gcm9vdDtcbiAgICB9XG4gICAgYXN5bmMgZGlyKHN1Yikge1xuICAgICAgICBjb25zdCBwID0gcGF0aC5qb2luKHRoaXMucm9vdCwgc3ViKTtcbiAgICAgICAgYXdhaXQgZnMubWtkaXIocCwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVNvdXJjZShpZCwgZGF0YSkge1xuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGUocGF0aC5qb2luKGF3YWl0IHRoaXMuZGlyKFwic291cmNlc1wiKSwgYCR7aWR9LnBkZmApLCBkYXRhKTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0U291cmNlKGlkKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKHRoaXMucm9vdCwgXCJzb3VyY2VzXCIsIGAke2lkfS5wZGZgKSkpO1xuICAgICAgICB9IGNhdGNoICB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlQXVkaW8oaWQsIGRhdGEsIG1pbWVUeXBlKSB7XG4gICAgICAgIGNvbnN0IGV4dCA9IEFVRElPX0VYVFttaW1lVHlwZV0gPz8gXCJiaW5cIjtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHBhdGguam9pbihhd2FpdCB0aGlzLmRpcihcImF1ZGlvXCIpLCBgJHtpZH0uJHtleHR9YCksIGRhdGEpO1xuICAgIH1cbiAgICBhc3luYyBvcGVuQXVkaW8oaWQsIG1pbWVUeXBlLCByYW5nZSkge1xuICAgICAgICBjb25zdCBleHQgPSBBVURJT19FWFRbbWltZVR5cGVdID8/IFwiYmluXCI7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKHRoaXMucm9vdCwgXCJhdWRpb1wiLCBgJHtpZH0uJHtleHR9YCkpKTtcbiAgICAgICAgICAgIHJldHVybiBzbGljZVJhbmdlKGRhdGEsIG1pbWVUeXBlLCByYW5nZSk7XG4gICAgICAgIH0gY2F0Y2ggIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGRlbGV0ZShpZCwgbWltZVR5cGUpIHtcbiAgICAgICAgYXdhaXQgZnMucm0ocGF0aC5qb2luKHRoaXMucm9vdCwgXCJzb3VyY2VzXCIsIGAke2lkfS5wZGZgKSwge1xuICAgICAgICAgICAgZm9yY2U6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGV4dHMgPSBtaW1lVHlwZSA/IFtcbiAgICAgICAgICAgIEFVRElPX0VYVFttaW1lVHlwZV0gPz8gXCJiaW5cIlxuICAgICAgICBdIDogT2JqZWN0LnZhbHVlcyhBVURJT19FWFQpO1xuICAgICAgICBmb3IgKGNvbnN0IGV4dCBvZiBleHRzKXtcbiAgICAgICAgICAgIGF3YWl0IGZzLnJtKHBhdGguam9pbih0aGlzLnJvb3QsIFwiYXVkaW9cIiwgYCR7aWR9LiR7ZXh0fWApLCB7XG4gICAgICAgICAgICAgICAgZm9yY2U6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuY2xhc3MgQmxvYkJpbmFyeSB7XG4gICAgYmxvYigpIHtcbiAgICAgICAgcmV0dXJuIGltcG9ydChcIkB2ZXJjZWwvYmxvYlwiKTtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVNvdXJjZShpZCwgZGF0YSkge1xuICAgICAgICBjb25zdCB7IHB1dCB9ID0gYXdhaXQgdGhpcy5ibG9iKCk7XG4gICAgICAgIGF3YWl0IHB1dChgc291cmNlcy8ke2lkfS5wZGZgLCBCdWZmZXIuZnJvbShkYXRhKSwge1xuICAgICAgICAgICAgYWNjZXNzOiBcInByaXZhdGVcIixcbiAgICAgICAgICAgIGFkZFJhbmRvbVN1ZmZpeDogZmFsc2UsXG4gICAgICAgICAgICBhbGxvd092ZXJ3cml0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL3BkZlwiXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRTb3VyY2UoaWQpIHtcbiAgICAgICAgY29uc3QgeyBnZXQgfSA9IGF3YWl0IHRoaXMuYmxvYigpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXQoYHNvdXJjZXMvJHtpZH0ucGRmYCwge1xuICAgICAgICAgICAgYWNjZXNzOiBcInByaXZhdGVcIlxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFyZXN1bHQ/LnN0cmVhbSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShhd2FpdCBuZXcgUmVzcG9uc2UocmVzdWx0LnN0cmVhbSkuYXJyYXlCdWZmZXIoKSk7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVBdWRpbyhpZCwgZGF0YSwgbWltZVR5cGUpIHtcbiAgICAgICAgY29uc3QgeyBwdXQgfSA9IGF3YWl0IHRoaXMuYmxvYigpO1xuICAgICAgICBjb25zdCBleHQgPSBBVURJT19FWFRbbWltZVR5cGVdID8/IFwiYmluXCI7XG4gICAgICAgIGF3YWl0IHB1dChgYXVkaW8vJHtpZH0uJHtleHR9YCwgQnVmZmVyLmZyb20oZGF0YSksIHtcbiAgICAgICAgICAgIGFjY2VzczogXCJwcml2YXRlXCIsXG4gICAgICAgICAgICBhZGRSYW5kb21TdWZmaXg6IGZhbHNlLFxuICAgICAgICAgICAgYWxsb3dPdmVyd3JpdGU6IHRydWUsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogbWltZVR5cGVcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIG9wZW5BdWRpbyhpZCwgbWltZVR5cGUsIHJhbmdlKSB7XG4gICAgICAgIGNvbnN0IHsgZ2V0IH0gPSBhd2FpdCB0aGlzLmJsb2IoKTtcbiAgICAgICAgY29uc3QgZXh0ID0gQVVESU9fRVhUW21pbWVUeXBlXSA/PyBcImJpblwiO1xuICAgICAgICAvLyBQYXNzIHRoZSBjbGllbnQncyBSYW5nZSB0aHJvdWdoIHRvIG9yaWdpbiBzbyB3ZSBzdHJlYW0gcGFydGlhbCBjb250ZW50XG4gICAgICAgIC8vIHdpdGhvdXQgYnVmZmVyaW5nIHRoZSB3aG9sZSBmaWxlIGluIHRoZSBmdW5jdGlvbi5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZ2V0KGBhdWRpby8ke2lkfS4ke2V4dH1gLCB7XG4gICAgICAgICAgICBhY2Nlc3M6IFwicHJpdmF0ZVwiLFxuICAgICAgICAgICAgLi4ucmFuZ2UgPyB7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICBSYW5nZTogcmFuZ2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IDoge31cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghcmVzdWx0Py5zdHJlYW0pIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBzcmMgPSByZXN1bHQuaGVhZGVycztcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IHNyYy5nZXQoXCJjb250ZW50LXR5cGVcIikgPz8gbWltZVR5cGUsXG4gICAgICAgICAgICBcIkFjY2VwdC1SYW5nZXNcIjogXCJieXRlc1wiLFxuICAgICAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwicHJpdmF0ZSwgbWF4LWFnZT0zMTUzNjAwMCwgaW1tdXRhYmxlXCJcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgY29udGVudFJhbmdlID0gc3JjLmdldChcImNvbnRlbnQtcmFuZ2VcIik7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBzcmMuZ2V0KFwiY29udGVudC1sZW5ndGhcIik7XG4gICAgICAgIGlmIChjb250ZW50UmFuZ2UpIGhlYWRlcnNbXCJDb250ZW50LVJhbmdlXCJdID0gY29udGVudFJhbmdlO1xuICAgICAgICBpZiAoY29udGVudExlbmd0aCkgaGVhZGVyc1tcIkNvbnRlbnQtTGVuZ3RoXCJdID0gY29udGVudExlbmd0aDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXR1czogcmFuZ2UgJiYgY29udGVudFJhbmdlID8gMjA2IDogMjAwLFxuICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgIGJvZHk6IHJlc3VsdC5zdHJlYW1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXN5bmMgZGVsZXRlKGlkLCBtaW1lVHlwZSkge1xuICAgICAgICBjb25zdCB7IGxpc3QsIGRlbCB9ID0gYXdhaXQgdGhpcy5ibG9iKCk7XG4gICAgICAgIGNvbnN0IGV4dHMgPSBtaW1lVHlwZSA/IFtcbiAgICAgICAgICAgIEFVRElPX0VYVFttaW1lVHlwZV0gPz8gXCJiaW5cIlxuICAgICAgICBdIDogT2JqZWN0LnZhbHVlcyhBVURJT19FWFQpO1xuICAgICAgICBjb25zdCBwcmVmaXhlcyA9IFtcbiAgICAgICAgICAgIGBzb3VyY2VzLyR7aWR9LnBkZmAsXG4gICAgICAgICAgICAuLi5leHRzLm1hcCgoZXh0KT0+YGF1ZGlvLyR7aWR9LiR7ZXh0fWApXG4gICAgICAgIF07XG4gICAgICAgIGZvciAoY29uc3QgcHJlZml4IG9mIHByZWZpeGVzKXtcbiAgICAgICAgICAgIGNvbnN0IHsgYmxvYnMgfSA9IGF3YWl0IGxpc3Qoe1xuICAgICAgICAgICAgICAgIHByZWZpeFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoYmxvYnMubGVuZ3RoID4gMCkgYXdhaXQgZGVsKGJsb2JzLm1hcCgoYik9PmIudXJsKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIENvbXBvc2l0ZVN0b3JlIHtcbiAgICBtZXRhO1xuICAgIGJpbmFyeTtcbiAgICBjb25zdHJ1Y3RvcihtZXRhLCBiaW5hcnkpe1xuICAgICAgICB0aGlzLm1ldGEgPSBtZXRhO1xuICAgICAgICB0aGlzLmJpbmFyeSA9IGJpbmFyeTtcbiAgICB9XG4gICAgbGlzdChmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWV0YS5saXN0KGZpbHRlcik7XG4gICAgfVxuICAgIGdldChpZCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEuZ2V0KGlkKTtcbiAgICB9XG4gICAgY3JlYXRlKGVwaXNvZGUpIHtcbiAgICAgICAgYXNzZXJ0SWQoZXBpc29kZS5pZCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEuY3JlYXRlKGVwaXNvZGUpO1xuICAgIH1cbiAgICBwYXRjaChpZCwgZmllbGRzKSB7XG4gICAgICAgIGFzc2VydElkKGlkKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWV0YS5wYXRjaChpZCwgZmllbGRzKTtcbiAgICB9XG4gICAgcGF0Y2hJZihpZCwgZXhwZWN0ZWRTdGF0dXMsIGZpZWxkcykge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGEucGF0Y2hJZihpZCwgZXhwZWN0ZWRTdGF0dXMsIGZpZWxkcyk7XG4gICAgfVxuICAgIGFzeW5jIGRlbGV0ZShpZCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIGNvbnN0IGVwaXNvZGUgPSBhd2FpdCB0aGlzLm1ldGEuZ2V0KGlkKTtcbiAgICAgICAgYXdhaXQgdGhpcy5tZXRhLmRlbGV0ZShpZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYmluYXJ5LmRlbGV0ZShpZCwgZXBpc29kZT8uYXVkaW9NaW1lVHlwZSk7XG4gICAgfVxuICAgIHNhdmVTb3VyY2UoaWQsIGRhdGEpIHtcbiAgICAgICAgYXNzZXJ0SWQoaWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5iaW5hcnkuc2F2ZVNvdXJjZShpZCwgZGF0YSk7XG4gICAgfVxuICAgIGdldFNvdXJjZShpZCkge1xuICAgICAgICBhc3NlcnRJZChpZCk7XG4gICAgICAgIHJldHVybiB0aGlzLmJpbmFyeS5nZXRTb3VyY2UoaWQpO1xuICAgIH1cbiAgICBzYXZlQXVkaW8oaWQsIGRhdGEsIG1pbWVUeXBlKSB7XG4gICAgICAgIGFzc2VydElkKGlkKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmluYXJ5LnNhdmVBdWRpbyhpZCwgZGF0YSwgbWltZVR5cGUpO1xuICAgIH1cbiAgICBhc3luYyBvcGVuQXVkaW8oaWQsIHJhbmdlKSB7XG4gICAgICAgIGFzc2VydElkKGlkKTtcbiAgICAgICAgY29uc3QgZXBpc29kZSA9IGF3YWl0IHRoaXMubWV0YS5nZXQoaWQpO1xuICAgICAgICBpZiAoIWVwaXNvZGUpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gdGhpcy5iaW5hcnkub3BlbkF1ZGlvKGlkLCBlcGlzb2RlLmF1ZGlvTWltZVR5cGUgPz8gXCJhdWRpby93YXZcIiwgcmFuZ2UpO1xuICAgIH1cbn1cbmxldCBzdG9yZSA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RvcmUoKSB7XG4gICAgaWYgKCFzdG9yZSkge1xuICAgICAgICBjb25zdCBoYXNTdXBhYmFzZSA9IEJvb2xlYW4ocHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMICYmIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFQ1JFVF9LRVkpO1xuICAgICAgICBjb25zdCBoYXNCbG9iID0gQm9vbGVhbihwcm9jZXNzLmVudi5CTE9CX1JFQURfV1JJVEVfVE9LRU4pO1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuVkVSQ0VMICYmICghaGFzU3VwYWJhc2UgfHwgIWhhc0Jsb2IpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm9kdWN0aW9uIHJlcXVpcmVzIFNVUEFCQVNFX1VSTCArIFNVUEFCQVNFX1NFQ1JFVF9LRVkgYW5kIEJMT0JfUkVBRF9XUklURV9UT0tFTjsgdGhlIGZpbGVzeXN0ZW0gZmFsbGJhY2sgZG9lcyBub3Qgd29yayBvbiBWZXJjZWwuXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGFSb290ID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIFwiLmRhdGFcIik7XG4gICAgICAgIHN0b3JlID0gbmV3IENvbXBvc2l0ZVN0b3JlKGhhc1N1cGFiYXNlID8gbmV3IFN1cGFiYXNlTWV0YSgpIDogbmV3IEZzTWV0YShwYXRoLmpvaW4oZGF0YVJvb3QsIFwiZXBpc29kZXNcIikpLCBoYXNCbG9iID8gbmV3IEJsb2JCaW5hcnkoKSA6IG5ldyBGc0JpbmFyeShkYXRhUm9vdCkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RvcmU7XG59XG4iLCAiaW1wb3J0IHsgZXh0cmFjdFRleHQsIGdldERvY3VtZW50UHJveHkgfSBmcm9tIFwidW5wZGZcIjtcbmV4cG9ydCBjb25zdCBNQVhfUERGX0JZVEVTID0gNCAqIDEwMjQgKiAxMDI0O1xuLyoqIFNpemUvdHlwZSBnYXRlIGZvciBhbiB1cGxvYWRlZCBmaWxlLCBiZWZvcmUgaXQgaXMgcmVhZCBpbnRvIG1lbW9yeS4gKi8gZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUGRmRmlsZShmaWxlKSB7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIEZpbGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgICAgIGVycm9yOiBcIlVwbG9hZCBhIFBERiBpbiB0aGUgJ2ZpbGUnIGZpZWxkXCJcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGZpbGUuc2l6ZSA+IE1BWF9QREZfQllURVMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXR1czogNDEzLFxuICAgICAgICAgICAgZXJyb3I6IFwiUERGIGlzIHRvbyBsYXJnZSAoNCBNQiBtYXgpXCJcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IHRydWUsXG4gICAgICAgIGZpbGVcbiAgICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGxvb2tzTGlrZVBkZihkYXRhLCBmaWxlbmFtZSkge1xuICAgIGNvbnN0IG1hZ2ljID0gZGF0YS5sZW5ndGggPiA0ICYmIGRhdGFbMF0gPT09IDB4MjUgJiYgZGF0YVsxXSA9PT0gMHg1MCAmJiBkYXRhWzJdID09PSAweDQ0ICYmIGRhdGFbM10gPT09IDB4NDY7XG4gICAgcmV0dXJuIG1hZ2ljIHx8IGZpbGVuYW1lLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoXCIucGRmXCIpO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQZGZUZXh0KGRhdGEpIHtcbiAgICBjb25zdCBwZGYgPSBhd2FpdCBnZXREb2N1bWVudFByb3h5KGRhdGEpO1xuICAgIGNvbnN0IHsgdG90YWxQYWdlcywgdGV4dCB9ID0gYXdhaXQgZXh0cmFjdFRleHQocGRmLCB7XG4gICAgICAgIG1lcmdlUGFnZXM6IHRydWVcbiAgICB9KTtcbiAgICBjb25zdCBjbGVhbmVkID0gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHRleHQgY291bGQgYmUgZXh0cmFjdGVkIGZyb20gdGhpcyBQREYuIEl0IG1heSBiZSBhIHNjYW5uZWQgZG9jdW1lbnQgd2l0aG91dCBhIHRleHQgbGF5ZXIuXCIpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICB0b3RhbFBhZ2VzXG4gICAgfTtcbn1cbiIsICIvLyBDdXJhdGVkLCBBUEktdmFsaWRhdGVkIEdlbWluaSBwcmVidWlsdCB2b2ljZXMuXG5leHBvcnQgY29uc3QgVk9JQ0VTID0gW1xuICAgIHtcbiAgICAgICAgaWQ6IFwiS29yZVwiLFxuICAgICAgICBsYWJlbDogXCJLb3JlXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkZpcm0sIGNsZWFyXCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiUHVja1wiLFxuICAgICAgICBsYWJlbDogXCJQdWNrXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlVwYmVhdCwgbGl2ZWx5XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiRW5jZWxhZHVzXCIsXG4gICAgICAgIGxhYmVsOiBcIkVuY2VsYWR1c1wiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTb2Z0LCBicmVhdGh5XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiQ2hhcm9uXCIsXG4gICAgICAgIGxhYmVsOiBcIkNoYXJvblwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJEZWVwLCBpbmZvcm1hdGl2ZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiBcIkFvZWRlXCIsXG4gICAgICAgIGxhYmVsOiBcIkFvZWRlXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkJyZWV6eSwgd2FybVwiXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiBcIkxlZGFcIixcbiAgICAgICAgbGFiZWw6IFwiTGVkYVwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJZb3V0aGZ1bCwgYnJpZ2h0XCJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6IFwiWmVwaHlyXCIsXG4gICAgICAgIGxhYmVsOiBcIlplcGh5clwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJCcmlnaHQsIGNyaXNwXCJcbiAgICB9XG5dO1xuY29uc3QgVk9JQ0VfSURTID0gbmV3IFNldChWT0lDRVMubWFwKCh2KT0+di5pZCkpO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfSE9TVF9WT0lDRSA9IFwiS29yZVwiO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfR1VFU1RfVk9JQ0UgPSBcIlB1Y2tcIjtcbmV4cG9ydCBjb25zdCBERUZBVUxUX1JFQURFUl9WT0lDRSA9IFwiRW5jZWxhZHVzXCI7XG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZFZvaWNlKGlkKSB7XG4gICAgcmV0dXJuIFZPSUNFX0lEUy5oYXMoaWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVZvaWNlKGlkLCBmYWxsYmFjaykge1xuICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwic3RyaW5nXCIgJiYgVk9JQ0VfSURTLmhhcyhpZCkgPyBpZCA6IGZhbGxiYWNrO1xufVxuIiwgImltcG9ydCB7IERFRkFVTFRfR1VFU1RfVk9JQ0UsIERFRkFVTFRfSE9TVF9WT0lDRSwgREVGQVVMVF9SRUFERVJfVk9JQ0UsIG5vcm1hbGl6ZVZvaWNlIH0gZnJvbSBcIi4vdm9pY2VzXCI7XG5jb25zdCBMRU5HVEhTID0gW1xuICAgIFwic2hvcnRcIixcbiAgICBcInN0YW5kYXJkXCIsXG4gICAgXCJkZWVwXCJcbl07XG5jb25zdCBGT1JNQVRTID0gW1xuICAgIFwiZGlzY3Vzc2lvblwiLFxuICAgIFwiYnJpZWZcIixcbiAgICBcImRlYmF0ZVwiLFxuICAgIFwibGVjdHVyZVwiXG5dO1xuY29uc3QgQVVESUVOQ0VTID0gW1xuICAgIFwiYmVnaW5uZXJcIixcbiAgICBcImV4cGVydFwiXG5dO1xuLy8gU2luZ2xlLXZvaWNlIGNvbnZlcnNhdGlvbiBmb3JtYXRzIHNwZWFrIG9ubHkgaW4gdGhlIGhvc3Qgdm9pY2UuXG5leHBvcnQgY29uc3QgU0lOR0xFX1ZPSUNFX0ZPUk1BVFMgPSBbXG4gICAgXCJicmllZlwiLFxuICAgIFwibGVjdHVyZVwiXG5dO1xuZXhwb3J0IGNvbnN0IExFTkdUSF9CVURHRVRTID0ge1xuICAgIHNob3J0OiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiAyXzAwMCxcbiAgICAgICAgcmVhZENoYXJzOiAzMF8wMDAsXG4gICAgICAgIGFwcHJveE1pbnV0ZXM6IDNcbiAgICB9LFxuICAgIHN0YW5kYXJkOiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiA0XzUwMCxcbiAgICAgICAgcmVhZENoYXJzOiAxMDBfMDAwLFxuICAgICAgICBhcHByb3hNaW51dGVzOiA3XG4gICAgfSxcbiAgICBkZWVwOiB7XG4gICAgICAgIHNjcmlwdENoYXJzOiA5XzAwMCxcbiAgICAgICAgcmVhZENoYXJzOiAyMDBfMDAwLFxuICAgICAgICBhcHByb3hNaW51dGVzOiAxNVxuICAgIH1cbn07XG5mdW5jdGlvbiBwaWNrKHZhbHVlLCBhbGxvd2VkLCBmYWxsYmFjaykge1xuICAgIHJldHVybiBhbGxvd2VkLmluY2x1ZGVzKHZhbHVlKSA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG4vKiogVmFsaWRhdGVzL25vcm1hbGl6ZXMgdW50cnVzdGVkIG9wdGlvbiBpbnB1dCBpbnRvIGEgY29tcGxldGUgRXBpc29kZU9wdGlvbnMuICovIGV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVPcHRpb25zKGlucHV0KSB7XG4gICAgY29uc3QgbyA9IGlucHV0ID8/IHt9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGxlbmd0aDogcGljayhvLmxlbmd0aCwgTEVOR1RIUywgXCJzdGFuZGFyZFwiKSxcbiAgICAgICAgZm9ybWF0OiBwaWNrKG8uZm9ybWF0LCBGT1JNQVRTLCBcImRpc2N1c3Npb25cIiksXG4gICAgICAgIGF1ZGllbmNlOiBwaWNrKG8uYXVkaWVuY2UsIEFVRElFTkNFUywgXCJiZWdpbm5lclwiKSxcbiAgICAgICAgaG9zdFZvaWNlOiBub3JtYWxpemVWb2ljZShvLmhvc3RWb2ljZSwgREVGQVVMVF9IT1NUX1ZPSUNFKSxcbiAgICAgICAgZ3Vlc3RWb2ljZTogbm9ybWFsaXplVm9pY2Uoby5ndWVzdFZvaWNlLCBERUZBVUxUX0dVRVNUX1ZPSUNFKSxcbiAgICAgICAgcmVhZGVyVm9pY2U6IG5vcm1hbGl6ZVZvaWNlKG8ucmVhZGVyVm9pY2UsIERFRkFVTFRfUkVBREVSX1ZPSUNFKSxcbiAgICAgICAgcmV2aWV3U2NyaXB0OiBvLnJldmlld1NjcmlwdCA9PT0gdHJ1ZVxuICAgIH07XG59XG5jb25zdCBNQVhfU0NSSVBUX0xJTkVTID0gNjAwO1xuY29uc3QgTUFYX0xJTkVfQ0hBUlMgPSA1XzAwMDtcbmV4cG9ydCBmdW5jdGlvbiBzY3JpcHRDaGFycyhzY3JpcHQpIHtcbiAgICByZXR1cm4gc2NyaXB0LmxpbmVzLnJlZHVjZSgobiwgbCk9Pm4gKyBsLnRleHQudHJpbSgpLmxlbmd0aCwgMCk7XG59XG4vKiogSG93IG11Y2ggYSB1c2VyIG1heSBncm93IGFuIGVkaXRlZCBzY3JpcHQgb3ZlciB0aGUgb3JpZ2luYWwgdGhleSBwYWlkIGZvcjpcbiAqICAxMCUgcHJvcG9ydGlvbmFsIGhlYWRyb29tIHBsdXMgYSBzbWFsbCBhYnNvbHV0ZSBhbGxvd2FuY2UgZm9yIGEgc2hvcnQgYWRkLiAqLyBleHBvcnQgZnVuY3Rpb24gZWRpdENoYXJCdWRnZXQob3JpZ2luYWxDaGFycykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG9yaWdpbmFsQ2hhcnMgKiAxLjEpICsgMjAwO1xufVxuLy8gVmFsaWRhdGVzIGEgdXNlci1lZGl0ZWQgc2NyaXB0IGFuZCBjYXBzIHRvdGFsIGxlbmd0aCBzbyBlZGl0aW5nIGNhbid0XG4vLyBpbmZsYXRlIFRUUyBjb3N0IGJleW9uZCB0aGUgc2NyaXB0IHRoZSB1c2VyIGFscmVhZHkgcGFpZCB0byBnZW5lcmF0ZS5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUVkaXRlZFNjcmlwdChpbnB1dCwgbWF4Q2hhcnMpIHtcbiAgICBjb25zdCByYXcgPSBpbnB1dDtcbiAgICBpZiAoIXJhdyB8fCAhQXJyYXkuaXNBcnJheShyYXcubGluZXMpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogXCJTY3JpcHQgbXVzdCBoYXZlIGEgbGluZXMgYXJyYXlcIlxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAocmF3LmxpbmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IFwiU2NyaXB0IGNhbm5vdCBiZSBlbXB0eVwiXG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChyYXcubGluZXMubGVuZ3RoID4gTUFYX1NDUklQVF9MSU5FUykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGBUb28gbWFueSBsaW5lcyAobWF4ICR7TUFYX1NDUklQVF9MSU5FU30pYFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBsaW5lcyA9IFtdO1xuICAgIGxldCB0b3RhbCA9IDA7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiByYXcubGluZXMpe1xuICAgICAgICBjb25zdCBsaW5lID0gZW50cnk7XG4gICAgICAgIGlmIChsaW5lLnNwZWFrZXIgIT09IFwiSE9TVFwiICYmIGxpbmUuc3BlYWtlciAhPT0gXCJHVUVTVFwiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogXCJFYWNoIGxpbmUgbmVlZHMgc3BlYWtlciBIT1NUIG9yIEdVRVNUXCJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBsaW5lLnRleHQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBcIkVhY2ggbGluZSBuZWVkcyB0ZXh0XCJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGxpbmUudGV4dC50cmltKCk7XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkgY29udGludWU7XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IE1BWF9MSU5FX0NIQVJTKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogXCJBIGxpbmUgaXMgdG9vIGxvbmdcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB0b3RhbCArPSB0ZXh0Lmxlbmd0aDtcbiAgICAgICAgbGluZXMucHVzaCh7XG4gICAgICAgICAgICBzcGVha2VyOiBsaW5lLnNwZWFrZXIsXG4gICAgICAgICAgICB0ZXh0XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAobGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogXCJTY3JpcHQgY2Fubm90IGJlIGVtcHR5XCJcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHRvdGFsID4gbWF4Q2hhcnMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBcIkVkaXRlZCBzY3JpcHQgaXMgbG9uZ2VyIHRoYW4gdGhlIHZlcnNpb24geW91IGdlbmVyYXRlZFwiXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHRpdGxlID0gdHlwZW9mIHJhdy50aXRsZSA9PT0gXCJzdHJpbmdcIiAmJiByYXcudGl0bGUudHJpbSgpID8gcmF3LnRpdGxlLnRyaW0oKS5zbGljZSgwLCAyMDApIDogXCJVbnRpdGxlZCBlcGlzb2RlXCI7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IHRydWUsXG4gICAgICAgIHNjcmlwdDoge1xuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBsaW5lc1xuICAgICAgICB9XG4gICAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1NpbmdsZVZvaWNlRm9ybWF0KGZvcm1hdCkge1xuICAgIHJldHVybiBTSU5HTEVfVk9JQ0VfRk9STUFUUy5pbmNsdWRlcyhmb3JtYXQpO1xufVxuLyoqIFRoZSBjaGFyYWN0ZXIgYnVkZ2V0IHRoYXQgZHJpdmVzIGNyZWRpdCBjb3N0IGZvciBhIGdpdmVuIG1vZGUgKyBsZW5ndGguICovIGV4cG9ydCBmdW5jdGlvbiByZWFkQ2hhckJ1ZGdldChtb2RlLCBsZW5ndGgpIHtcbiAgICByZXR1cm4gbW9kZSA9PT0gXCJyZWFkaW5nXCIgPyBMRU5HVEhfQlVER0VUU1tsZW5ndGhdLnJlYWRDaGFycyA6IExFTkdUSF9CVURHRVRTW2xlbmd0aF0uc2NyaXB0Q2hhcnM7XG59XG4iLCAiaW1wb3J0IHsgeiB9IGZyb20gXCJ6b2RcIjtcbmltcG9ydCB7IGlzU2luZ2xlVm9pY2VGb3JtYXQsIExFTkdUSF9CVURHRVRTIH0gZnJvbSBcIi4uL29wdGlvbnNcIjtcbmNvbnN0IE1BWF9TT1VSQ0VfQ0hBUlMgPSAyMDBfMDAwO1xuY29uc3Qgc2NyaXB0U2NoZW1hID0gei5vYmplY3Qoe1xuICAgIHRpdGxlOiB6LnN0cmluZygpLmRlc2NyaWJlKFwiQSBzaG9ydCwgY2F0Y2h5IGVwaXNvZGUgdGl0bGUgYmFzZWQgb24gdGhlIGRvY3VtZW50XCIpLFxuICAgIGxpbmVzOiB6LmFycmF5KHoub2JqZWN0KHtcbiAgICAgICAgc3BlYWtlcjogei5lbnVtKFtcbiAgICAgICAgICAgIFwiSE9TVFwiLFxuICAgICAgICAgICAgXCJHVUVTVFwiXG4gICAgICAgIF0pLFxuICAgICAgICB0ZXh0OiB6LnN0cmluZygpXG4gICAgfSkpLmRlc2NyaWJlKFwiVGhlIGRpYWxvZ3VlLCBhbHRlcm5hdGluZyBuYXR1cmFsbHkgYmV0d2VlbiBzcGVha2Vyc1wiKVxufSk7XG5jb25zdCBGT1JNQVRfQlJJRUYgPSB7XG4gICAgZGlzY3Vzc2lvbjogXCJhIG5hdHVyYWwgdHdvLXBlcnNvbiBjb252ZXJzYXRpb24gYmV0d2VlbiBIT1NUIChjdXJpb3VzLCBhc2tzIHNoYXJwIHF1ZXN0aW9ucykgYW5kIEdVRVNUIChhbiBleHBlcnQgd2hvIGV4cGxhaW5zIHZpdmlkbHkgd2l0aCBhbmFsb2dpZXMpLiBTaG9ydCB0dXJucywgcmVhbCByZWFjdGlvbnMsIG5vIGxpc3RzLlwiLFxuICAgIGJyaWVmOiBcImEgdGlnaHQgc29sbyBicmllZmluZyBkZWxpdmVyZWQgZW50aXJlbHkgYnkgSE9TVCBcdTIwMTQgYSBzaW5nbGUgY29uZmlkZW50IG5hcnJhdG9yIHN1bW1hcml6aW5nIHRoZSBlc3NlbnRpYWxzLiBFdmVyeSBsaW5lIHVzZXMgc3BlYWtlciBIT1NULiBObyBzZWNvbmQgc3BlYWtlci5cIixcbiAgICBkZWJhdGU6IFwiYSBsaXZlbHkgZGViYXRlIGJldHdlZW4gSE9TVCBhbmQgR1VFU1Qgd2hvIHRha2Ugb3Bwb3NpbmcgcG9zaXRpb25zIG9uIHRoZSBkb2N1bWVudCdzIGtleSBjbGFpbXMsIGVhY2ggbWFraW5nIHRoZWlyIHN0cm9uZ2VzdCBjYXNlIGFuZCByZWJ1dHRpbmcgdGhlIG90aGVyLiBLZWVwIGl0IHNoYXJwIGJ1dCBmYWlyLlwiLFxuICAgIGxlY3R1cmU6IFwiYW4gaW4tZGVwdGggZXhwZXJ0IGxlY3R1cmUgZGVsaXZlcmVkIGVudGlyZWx5IGJ5IEhPU1QgXHUyMDE0IGEga25vd2xlZGdlYWJsZSB0ZWFjaGVyIHdhbGtpbmcgdGhyb3VnaCB0aGUgbWF0ZXJpYWwgd2l0aCByaWdvciBhbmQgc3RydWN0dXJlLCB0aGUgZGVwdGggb2YgYW4gODAsMDAwIEhvdXJzIGJyaWVmaW5nLiBFdmVyeSBsaW5lIHVzZXMgc3BlYWtlciBIT1NULiBObyBzZWNvbmQgc3BlYWtlci5cIlxufTtcbmZ1bmN0aW9uIHN5c3RlbVByb21wdChvcHRpb25zKSB7XG4gICAgY29uc3QgYnVkZ2V0ID0gTEVOR1RIX0JVREdFVFNbb3B0aW9ucy5sZW5ndGhdO1xuICAgIGNvbnN0IGF1ZGllbmNlID0gb3B0aW9ucy5hdWRpZW5jZSA9PT0gXCJleHBlcnRcIiA/IFwiQXNzdW1lIGFuIGV4cGVydCBsaXN0ZW5lcjsgdXNlIHByZWNpc2UgdGVybWlub2xvZ3kgYW5kIGdvIGRlZXAuXCIgOiBcIkFzc3VtZSBhIGN1cmlvdXMgbmV3Y29tZXI7IGV4cGxhaW4gamFyZ29uIGluIHBsYWluIGxhbmd1YWdlLlwiO1xuICAgIHJldHVybiBgWW91IGFyZSBhIHdvcmxkLWNsYXNzIHBvZGNhc3QgcHJvZHVjZXIuIFR1cm4gZG9jdW1lbnRzIGludG8gJHtGT1JNQVRfQlJJRUZbb3B0aW9ucy5mb3JtYXRdfVxuXG5SdWxlczpcbi0gT3BlbiBieSB3ZWxjb21pbmcgbGlzdGVuZXJzIGFuZCBuYW1pbmcgdGhlIHRvcGljIGluIG9uZSBvciB0d28gc2VudGVuY2VzLlxuLSBDb3ZlciB0aGUgZG9jdW1lbnQncyBtb3N0IGltcG9ydGFudCBpZGVhcyBhY2N1cmF0ZWx5OyBkbyBub3QgaW52ZW50IGZhY3RzLlxuLSAke2F1ZGllbmNlfVxuLSBDbG9zZSB3aXRoIHRoZSBzaW5nbGUgYmlnZ2VzdCB0YWtlYXdheSBhbmQgYSBzaWduLW9mZi5cbi0gVG90YWwgc3Bva2VuIHRleHQgbXVzdCBzdGF5IHVuZGVyICR7YnVkZ2V0LnNjcmlwdENoYXJzfSBjaGFyYWN0ZXJzIChhYm91dCAke2J1ZGdldC5hcHByb3hNaW51dGVzfSBtaW51dGVzKS5gO1xufVxubGV0IHNjcmlwdEZlbGxCYWNrID0gZmFsc2U7XG5leHBvcnQgZnVuY3Rpb24gc2NyaXB0UHJvdmlkZXJOYW1lKCkge1xuICAgIGlmIChzY3JpcHRGZWxsQmFjaykgcmV0dXJuIFwibW9jayAoZ2F0ZXdheSB1bmF2YWlsYWJsZSlcIjtcbiAgICByZXR1cm4gaGFzU2NyaXB0Q3JlZGVudGlhbHMoKSA/IHByb2Nlc3MuZW52LlBPRENBU1RfU0NSSVBUX01PREVMID8/IFwiYW50aHJvcGljL2NsYXVkZS1zb25uZXQtNVwiIDogXCJtb2NrXCI7XG59XG5mdW5jdGlvbiBoYXNTY3JpcHRDcmVkZW50aWFscygpIHtcbiAgICByZXR1cm4gQm9vbGVhbihwcm9jZXNzLmVudi5BSV9HQVRFV0FZX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuVkVSQ0VMX09JRENfVE9LRU4gfHwgcHJvY2Vzcy5lbnYuVkVSQ0VMKTtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVBvZGNhc3RTY3JpcHQoc291cmNlVGV4dCwgc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB0ZXh0ID0gc291cmNlVGV4dC5zbGljZSgwLCBNQVhfU09VUkNFX0NIQVJTKTtcbiAgICBpZiAoIWhhc1NjcmlwdENyZWRlbnRpYWxzKCkpIHtcbiAgICAgICAgcmV0dXJuIG1vY2tTY3JpcHQodGV4dCwgc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGdlbmVyYXRlVGV4dCwgT3V0cHV0IH0gPSBhd2FpdCBpbXBvcnQoXCJhaVwiKTtcbiAgICAgICAgY29uc3QgeyBvdXRwdXQgfSA9IGF3YWl0IGdlbmVyYXRlVGV4dCh7XG4gICAgICAgICAgICBtb2RlbDogc2NyaXB0UHJvdmlkZXJOYW1lKCksXG4gICAgICAgICAgICBzeXN0ZW06IHN5c3RlbVByb21wdChvcHRpb25zKSxcbiAgICAgICAgICAgIG91dHB1dDogT3V0cHV0Lm9iamVjdCh7XG4gICAgICAgICAgICAgICAgc2NoZW1hOiBzY3JpcHRTY2hlbWFcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcHJvbXB0OiBgVHVybiB0aGUgZm9sbG93aW5nIGRvY3VtZW50IChcIiR7c291cmNlRmlsZW5hbWV9XCIpIGludG8gYSBwb2RjYXN0IHNjcmlwdC5cXG5cXG48ZG9jdW1lbnQ+XFxuJHt0ZXh0fVxcbjwvZG9jdW1lbnQ+YFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc2NyaXB0ID0gb3V0cHV0O1xuICAgICAgICAvLyBTaW5nbGUtdm9pY2UgZm9ybWF0cyBtdXN0IG5vdCBjb250YWluIGEgR1VFU1Qgc3BlYWtlci5cbiAgICAgICAgaWYgKGlzU2luZ2xlVm9pY2VGb3JtYXQob3B0aW9ucy5mb3JtYXQpKSB7XG4gICAgICAgICAgICBzY3JpcHQubGluZXMgPSBzY3JpcHQubGluZXMubWFwKChsKT0+KHtcbiAgICAgICAgICAgICAgICAgICAgLi4ubCxcbiAgICAgICAgICAgICAgICAgICAgc3BlYWtlcjogXCJIT1NUXCJcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjcmlwdDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlNjcmlwdCBnZW5lcmF0aW9uIHZpYSBBSSBHYXRld2F5IGZhaWxlZCwgZmFsbGluZyBiYWNrIHRvIG1vY2s6XCIsIGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBlcnIpO1xuICAgICAgICBzY3JpcHRGZWxsQmFjayA9IHRydWU7XG4gICAgICAgIHJldHVybiBtb2NrU2NyaXB0KHRleHQsIHNvdXJjZUZpbGVuYW1lLCBvcHRpb25zKTtcbiAgICB9XG59XG4vLyBcIlJlYWQgYWxvdWRcIiBtb2RlOiBubyBMTE0sIG5vIHN1bW1hcml6aW5nIFx1MjAxNCB0aGUgZXh0cmFjdGVkIHRleHQgYmVjb21lcyB0aGVcbi8vIHNjcmlwdCB2ZXJiYXRpbSwgY2h1bmtlZCBpbnRvIG5hcnJhdG9yIGxpbmVzIHNvIFRUUyByZXF1ZXN0cyBzdGF5IHNtYWxsIGFuZFxuLy8gdGhlIHRyYW5zY3JpcHQgc3RheXMgc2Nyb2xsYWJsZS5cbmNvbnN0IFJFQURfQ0hVTktfQ0hBUlMgPSA5MDA7XG5leHBvcnQgZnVuY3Rpb24gdmVyYmF0aW1TY3JpcHQoc291cmNlVGV4dCwgc291cmNlRmlsZW5hbWUsIG1heENoYXJzKSB7XG4gICAgY29uc3QgdGl0bGUgPSBzb3VyY2VGaWxlbmFtZS5yZXBsYWNlKC9cXC5wZGYkL2ksIFwiXCIpLnJlcGxhY2UoL1stX10rL2csIFwiIFwiKTtcbiAgICBjb25zdCB0ZXh0ID0gc291cmNlVGV4dC5zbGljZSgwLCBtYXhDaGFycyk7XG4gICAgY29uc3Qgc2VudGVuY2VzID0gdGV4dC5zcGxpdCgvKD88PVsuIT9dKVxccysvKTtcbiAgICBjb25zdCBsaW5lcyA9IFtdO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHNlbnRlbmNlIG9mIHNlbnRlbmNlcyl7XG4gICAgICAgIGlmIChjdXJyZW50ICYmIGN1cnJlbnQubGVuZ3RoICsgc2VudGVuY2UubGVuZ3RoICsgMSA+IFJFQURfQ0hVTktfQ0hBUlMpIHtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goe1xuICAgICAgICAgICAgICAgIHNwZWFrZXI6IFwiSE9TVFwiLFxuICAgICAgICAgICAgICAgIHRleHQ6IGN1cnJlbnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3VycmVudCA9IHNlbnRlbmNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQgPyBgJHtjdXJyZW50fSAke3NlbnRlbmNlfWAgOiBzZW50ZW5jZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoY3VycmVudCkgbGluZXMucHVzaCh7XG4gICAgICAgIHNwZWFrZXI6IFwiSE9TVFwiLFxuICAgICAgICB0ZXh0OiBjdXJyZW50XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGxpbmVzXG4gICAgfTtcbn1cbmZ1bmN0aW9uIG1vY2tTY3JpcHQodGV4dCwgc291cmNlRmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBzaW5nbGUgPSBpc1NpbmdsZVZvaWNlRm9ybWF0KG9wdGlvbnMuZm9ybWF0KTtcbiAgICBjb25zdCBhbGwgPSB0ZXh0LnNwbGl0KC8oPzw9Wy4hP10pXFxzKy8pLmZpbHRlcigocyk9PnMubGVuZ3RoID4gMjApO1xuICAgIGNvbnN0IHRhcmdldCA9IE1hdGgubWF4KDgsIE1hdGgucm91bmQoTEVOR1RIX0JVREdFVFNbb3B0aW9ucy5sZW5ndGhdLnNjcmlwdENoYXJzIC8gMTEwKSk7XG4gICAgY29uc3Qgc3RlcCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3IoYWxsLmxlbmd0aCAvIHRhcmdldCkpO1xuICAgIGNvbnN0IHNlbnRlbmNlcyA9IGFsbC5maWx0ZXIoKF8sIGkpPT5pICUgc3RlcCA9PT0gMCkuc2xpY2UoMCwgdGFyZ2V0KTtcbiAgICBjb25zdCB0aXRsZSA9IHNvdXJjZUZpbGVuYW1lLnJlcGxhY2UoL1xcLnBkZiQvaSwgXCJcIikucmVwbGFjZSgvWy1fXSsvZywgXCIgXCIpO1xuICAgIGNvbnN0IGxpbmVzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgICBzcGVha2VyOiBcIkhPU1RcIixcbiAgICAgICAgICAgIHRleHQ6IGBXZWxjb21lIGJhY2sgdG8gdGhlIHNob3cuIFRvZGF5IHdlJ3JlIGRpZ2dpbmcgaW50byAke3RpdGxlfS5gXG4gICAgICAgIH1cbiAgICBdO1xuICAgIGlmICghc2luZ2xlKSB7XG4gICAgICAgIGxpbmVzLnB1c2goe1xuICAgICAgICAgICAgc3BlYWtlcjogXCJHVUVTVFwiLFxuICAgICAgICAgICAgdGV4dDogXCJUaGFua3MgZm9yIGhhdmluZyBtZS4gVGhlcmUncyBhIGxvdCBpbiBoZXJlLlwiXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzZW50ZW5jZXMuZm9yRWFjaCgoc2VudGVuY2UsIGkpPT57XG4gICAgICAgIGxpbmVzLnB1c2goe1xuICAgICAgICAgICAgc3BlYWtlcjogc2luZ2xlIHx8IGkgJSAyID09PSAxID8gXCJIT1NUXCIgOiBcIkdVRVNUXCIsXG4gICAgICAgICAgICB0ZXh0OiBzZW50ZW5jZS50cmltKClcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgbGluZXMucHVzaCh7XG4gICAgICAgIHNwZWFrZXI6IFwiSE9TVFwiLFxuICAgICAgICB0ZXh0OiBcIlRoYXQncyB0aGUgYmlnIHBpY3R1cmUuIFRoYW5rcyBmb3IgbGlzdGVuaW5nLCBhbmQgc2VlIHlvdSBuZXh0IHRpbWUuXCJcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbGluZXNcbiAgICB9O1xufVxuIiwgImNvbnN0IEJZVEVTX1BFUl9TQU1QTEUgPSAyO1xuZXhwb3J0IGZ1bmN0aW9uIHBjbTE2VG9XYXYocGNtLCBzYW1wbGVSYXRlLCBjaGFubmVscyA9IDEpIHtcbiAgICBjb25zdCBoZWFkZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoaGVhZGVyKTtcbiAgICBjb25zdCBieXRlUmF0ZSA9IHNhbXBsZVJhdGUgKiBjaGFubmVscyAqIEJZVEVTX1BFUl9TQU1QTEU7XG4gICAgd3JpdGVBc2NpaSh2aWV3LCAwLCBcIlJJRkZcIik7XG4gICAgdmlldy5zZXRVaW50MzIoNCwgMzYgKyBwY20uYnl0ZUxlbmd0aCwgdHJ1ZSk7XG4gICAgd3JpdGVBc2NpaSh2aWV3LCA4LCBcIldBVkVcIik7XG4gICAgd3JpdGVBc2NpaSh2aWV3LCAxMiwgXCJmbXQgXCIpO1xuICAgIHZpZXcuc2V0VWludDMyKDE2LCAxNiwgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MTYoMjAsIDEsIHRydWUpO1xuICAgIHZpZXcuc2V0VWludDE2KDIyLCBjaGFubmVscywgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MzIoMjQsIHNhbXBsZVJhdGUsIHRydWUpO1xuICAgIHZpZXcuc2V0VWludDMyKDI4LCBieXRlUmF0ZSwgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MTYoMzIsIGNoYW5uZWxzICogQllURVNfUEVSX1NBTVBMRSwgdHJ1ZSk7XG4gICAgdmlldy5zZXRVaW50MTYoMzQsIDE2LCB0cnVlKTtcbiAgICB3cml0ZUFzY2lpKHZpZXcsIDM2LCBcImRhdGFcIik7XG4gICAgdmlldy5zZXRVaW50MzIoNDAsIHBjbS5ieXRlTGVuZ3RoLCB0cnVlKTtcbiAgICBjb25zdCB3YXYgPSBuZXcgVWludDhBcnJheSg0NCArIHBjbS5ieXRlTGVuZ3RoKTtcbiAgICB3YXYuc2V0KG5ldyBVaW50OEFycmF5KGhlYWRlciksIDApO1xuICAgIHdhdi5zZXQocGNtLCA0NCk7XG4gICAgcmV0dXJuIHdhdjtcbn1cbmV4cG9ydCBmdW5jdGlvbiB3YXZEdXJhdGlvblNlY29uZHMocGNtQnl0ZUxlbmd0aCwgc2FtcGxlUmF0ZSwgY2hhbm5lbHMgPSAxKSB7XG4gICAgcmV0dXJuIHBjbUJ5dGVMZW5ndGggLyAoc2FtcGxlUmF0ZSAqIGNoYW5uZWxzICogQllURVNfUEVSX1NBTVBMRSk7XG59XG5mdW5jdGlvbiB3cml0ZUFzY2lpKHZpZXcsIG9mZnNldCwgdGV4dCkge1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQgKyBpLCB0ZXh0LmNoYXJDb2RlQXQoaSkpO1xuICAgIH1cbn1cbiIsICJpbXBvcnQgeyBwY20xNlRvV2F2LCB3YXZEdXJhdGlvblNlY29uZHMgfSBmcm9tIFwiLi93YXZcIjtcbi8vIDY0IGticHMgbW9ubyBpcyB0cmFuc3BhcmVudCBmb3Igc3BlZWNoIGFuZCB+Nnggc21hbGxlciB0aGFuIDE2LWJpdCBXQVYuXG5jb25zdCBNUDNfQklUUkFURV9LQlBTID0gNjQ7XG5jb25zdCBTQU1QTEVTX1BFUl9GUkFNRSA9IDExNTI7XG5hc3luYyBmdW5jdGlvbiBlbmNvZGVNcDMocGNtLCBzYW1wbGVSYXRlKSB7XG4gICAgY29uc3QgeyBNcDNFbmNvZGVyIH0gPSBhd2FpdCBpbXBvcnQoXCJAYnJlZXp5c3RhY2svbGFtZWpzXCIpO1xuICAgIGNvbnN0IGVuY29kZXIgPSBuZXcgTXAzRW5jb2RlcigxLCBzYW1wbGVSYXRlLCBNUDNfQklUUkFURV9LQlBTKTtcbiAgICBjb25zdCBzYW1wbGVzID0gbmV3IEludDE2QXJyYXkocGNtLmJ1ZmZlciwgcGNtLmJ5dGVPZmZzZXQsIE1hdGguZmxvb3IocGNtLmJ5dGVMZW5ndGggLyAyKSk7XG4gICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHNhbXBsZXMubGVuZ3RoOyBpICs9IFNBTVBMRVNfUEVSX0ZSQU1FKXtcbiAgICAgICAgY29uc3QgYmxvY2sgPSBzYW1wbGVzLnN1YmFycmF5KGksIGkgKyBTQU1QTEVTX1BFUl9GUkFNRSk7XG4gICAgICAgIGNvbnN0IGZyYW1lID0gZW5jb2Rlci5lbmNvZGVCdWZmZXIoYmxvY2spO1xuICAgICAgICBpZiAoZnJhbWUubGVuZ3RoID4gMCkgY2h1bmtzLnB1c2gobmV3IFVpbnQ4QXJyYXkoZnJhbWUpKTtcbiAgICB9XG4gICAgY29uc3QgdGFpbCA9IGVuY29kZXIuZmx1c2goKTtcbiAgICBpZiAodGFpbC5sZW5ndGggPiAwKSBjaHVua3MucHVzaChuZXcgVWludDhBcnJheSh0YWlsKSk7XG4gICAgY29uc3QgdG90YWwgPSBjaHVua3MucmVkdWNlKChuLCBjKT0+biArIGMuYnl0ZUxlbmd0aCwgMCk7XG4gICAgY29uc3Qgb3V0ID0gbmV3IFVpbnQ4QXJyYXkodG90YWwpO1xuICAgIGxldCBvZmZzZXQgPSAwO1xuICAgIGZvciAoY29uc3QgYyBvZiBjaHVua3Mpe1xuICAgICAgICBvdXQuc2V0KGMsIG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSBjLmJ5dGVMZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG4vKiogRW5jb2RlcyAxNi1iaXQgbW9ubyBQQ00gdG8gTVAzLCBmYWxsaW5nIGJhY2sgdG8gV0FWIGlmIGVuY29kaW5nIGZhaWxzLiAqLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gZmluYWxpemVBdWRpbyhwY20sIHNhbXBsZVJhdGUpIHtcbiAgICBjb25zdCBkdXJhdGlvblNlY29uZHMgPSB3YXZEdXJhdGlvblNlY29uZHMocGNtLmJ5dGVMZW5ndGgsIHNhbXBsZVJhdGUpO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGF1ZGlvID0gYXdhaXQgZW5jb2RlTXAzKHBjbSwgc2FtcGxlUmF0ZSk7XG4gICAgICAgIGlmIChhdWRpby5ieXRlTGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhdWRpbyxcbiAgICAgICAgICAgICAgICBtaW1lVHlwZTogXCJhdWRpby9tcGVnXCIsXG4gICAgICAgICAgICAgICAgZHVyYXRpb25TZWNvbmRzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNUDMgZW5jb2RlIGZhaWxlZCwgZmFsbGluZyBiYWNrIHRvIFdBVjpcIiwgZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXVkaW86IHBjbTE2VG9XYXYocGNtLCBzYW1wbGVSYXRlKSxcbiAgICAgICAgbWltZVR5cGU6IFwiYXVkaW8vd2F2XCIsXG4gICAgICAgIGR1cmF0aW9uU2Vjb25kc1xuICAgIH07XG59XG4iLCAiaW1wb3J0IHsgZmluYWxpemVBdWRpbyB9IGZyb20gXCIuLi9hdWRpby9tcDNcIjtcbmltcG9ydCB7IGlzU2luZ2xlVm9pY2VGb3JtYXQgfSBmcm9tIFwiLi4vb3B0aW9uc1wiO1xuaW1wb3J0IHsgREVGQVVMVF9HVUVTVF9WT0lDRSwgREVGQVVMVF9IT1NUX1ZPSUNFLCBERUZBVUxUX1JFQURFUl9WT0lDRSB9IGZyb20gXCIuLi92b2ljZXNcIjtcbmNvbnN0IEdFTUlOSV9TQU1QTEVfUkFURSA9IDI0XzAwMDtcbmNvbnN0IEdFTUlOSV9UVFNfTU9ERUwgPSBwcm9jZXNzLmVudi5QT0RDQVNUX1RUU19NT0RFTCA/PyBcImdlbWluaS0yLjUtZmxhc2gtcHJldmlldy10dHNcIjtcbmNvbnN0IFNJTkdMRV9UVFNfQ0hVTktfQ0hBUlMgPSAzXzUwMDtcbmZ1bmN0aW9uIGdlbWluaUFwaUtleSgpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuR09PR0xFX0dFTkVSQVRJVkVfQUlfQVBJX0tFWTtcbn1cbmV4cG9ydCBmdW5jdGlvbiB0dHNQcm92aWRlck5hbWUoKSB7XG4gICAgcmV0dXJuIGdlbWluaUFwaUtleSgpID8gR0VNSU5JX1RUU19NT0RFTCA6IFwibW9ja1wiO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN5bnRoZXNpemVEaWFsb2d1ZShzY3JpcHQsIG1vZGUgPSBcImNvbnZlcnNhdGlvblwiLCBvcHRpb25zKSB7XG4gICAgaWYgKCFnZW1pbmlBcGlLZXkoKSkgcmV0dXJuIGZpbmFsaXplQXVkaW8oLi4ubW9ja1BjbShzY3JpcHQpKTtcbiAgICBjb25zdCByZWFkZXJWb2ljZSA9IG9wdGlvbnM/LnJlYWRlclZvaWNlID8/IERFRkFVTFRfUkVBREVSX1ZPSUNFO1xuICAgIGNvbnN0IGhvc3RWb2ljZSA9IG9wdGlvbnM/Lmhvc3RWb2ljZSA/PyBERUZBVUxUX0hPU1RfVk9JQ0U7XG4gICAgY29uc3QgZ3Vlc3RWb2ljZSA9IG9wdGlvbnM/Lmd1ZXN0Vm9pY2UgPz8gREVGQVVMVF9HVUVTVF9WT0lDRTtcbiAgICBpZiAobW9kZSA9PT0gXCJyZWFkaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIGdlbWluaVNpbmdsZVZvaWNlKHNjcmlwdCwgcmVhZGVyVm9pY2UsIFwiUmVhZCB0aGUgZm9sbG93aW5nIHRleHQgYWxvdWQgaW4gYSBjYWxtLCB3YXJtLCBzb290aGluZyB2b2ljZSBhdCBhIHJlbGF4ZWQgcGFjZTpcIik7XG4gICAgfVxuICAgIGlmIChvcHRpb25zICYmIGlzU2luZ2xlVm9pY2VGb3JtYXQob3B0aW9ucy5mb3JtYXQpKSB7XG4gICAgICAgIHJldHVybiBnZW1pbmlTaW5nbGVWb2ljZShzY3JpcHQsIGhvc3RWb2ljZSwgXCJOYXJyYXRlIHRoZSBmb2xsb3dpbmcgaW4gYSBjbGVhciwgZW5nYWdpbmcgdm9pY2U6XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZ2VtaW5pVHRzKHNjcmlwdCwgaG9zdFZvaWNlLCBndWVzdFZvaWNlKTtcbn1cbi8vIE9uZSB2b2ljZSwgY2h1bmtlZCB0byBrZWVwIGVhY2ggcmVxdWVzdCBzbWFsbDsgUENNIGNodW5rcyBzaGFyZSBhIHNhbXBsZVxuLy8gcmF0ZSBhbmQgY29uY2F0ZW5hdGUgY2xlYW5seS4gVXNlZCBieSByZWFkLWFsb3VkIGFuZCBzaW5nbGUtdm9pY2UgZm9ybWF0cy5cbmFzeW5jIGZ1bmN0aW9uIGdlbWluaVNpbmdsZVZvaWNlKHNjcmlwdCwgdm9pY2VOYW1lLCBpbnN0cnVjdGlvbikge1xuICAgIGNvbnN0IGNodW5rcyA9IFtdO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2Ygc2NyaXB0LmxpbmVzKXtcbiAgICAgICAgaWYgKGN1cnJlbnQgJiYgY3VycmVudC5sZW5ndGggKyBsaW5lLnRleHQubGVuZ3RoICsgMSA+IFNJTkdMRV9UVFNfQ0hVTktfQ0hBUlMpIHtcbiAgICAgICAgICAgIGNodW5rcy5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgICAgY3VycmVudCA9IGxpbmUudGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH1cXG4ke2xpbmUudGV4dH1gIDogbGluZS50ZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjdXJyZW50KSBjaHVua3MucHVzaChjdXJyZW50KTtcbiAgICBjb25zdCBwY21QYXJ0cyA9IFtdO1xuICAgIGxldCBzYW1wbGVSYXRlID0gR0VNSU5JX1NBTVBMRV9SQVRFO1xuICAgIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKXtcbiAgICAgICAgY29uc3QgcGFydCA9IGF3YWl0IGdlbWluaUdlbmVyYXRlKGAke2luc3RydWN0aW9ufVxcbiR7Y2h1bmt9YCwge1xuICAgICAgICAgICAgdm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICBwcmVidWlsdFZvaWNlQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgIHZvaWNlTmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHBjbVBhcnRzLnB1c2gocGFydC5wY20pO1xuICAgICAgICBzYW1wbGVSYXRlID0gcGFydC5zYW1wbGVSYXRlO1xuICAgIH1cbiAgICBjb25zdCBwY20gPSBuZXcgVWludDhBcnJheShCdWZmZXIuY29uY2F0KHBjbVBhcnRzLm1hcCgocCk9PkJ1ZmZlci5mcm9tKHApKSkpO1xuICAgIHJldHVybiBmaW5hbGl6ZUF1ZGlvKHBjbSwgc2FtcGxlUmF0ZSk7XG59XG5hc3luYyBmdW5jdGlvbiBnZW1pbmlUdHMoc2NyaXB0LCBob3N0Vm9pY2UsIGd1ZXN0Vm9pY2UpIHtcbiAgICBjb25zdCB0cmFuc2NyaXB0ID0gc2NyaXB0LmxpbmVzLm1hcCgobGluZSk9PmAke2xpbmUuc3BlYWtlciA9PT0gXCJIT1NUXCIgPyBcIkhvc3RcIiA6IFwiR3Vlc3RcIn06ICR7bGluZS50ZXh0fWApLmpvaW4oXCJcXG5cIik7XG4gICAgY29uc3QgeyBwY20sIHNhbXBsZVJhdGUgfSA9IGF3YWl0IGdlbWluaUdlbmVyYXRlKGBUVFMgdGhlIGZvbGxvd2luZyBwb2RjYXN0IGNvbnZlcnNhdGlvbiBiZXR3ZWVuIEhvc3QgYW5kIEd1ZXN0OlxcbiR7dHJhbnNjcmlwdH1gLCB7XG4gICAgICAgIG11bHRpU3BlYWtlclZvaWNlQ29uZmlnOiB7XG4gICAgICAgICAgICBzcGVha2VyVm9pY2VDb25maWdzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzcGVha2VyOiBcIkhvc3RcIixcbiAgICAgICAgICAgICAgICAgICAgdm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWJ1aWx0Vm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2ljZU5hbWU6IGhvc3RWb2ljZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNwZWFrZXI6IFwiR3Vlc3RcIixcbiAgICAgICAgICAgICAgICAgICAgdm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWJ1aWx0Vm9pY2VDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2ljZU5hbWU6IGd1ZXN0Vm9pY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBmaW5hbGl6ZUF1ZGlvKHBjbSwgc2FtcGxlUmF0ZSk7XG59XG5hc3luYyBmdW5jdGlvbiBnZW1pbmlHZW5lcmF0ZSh0ZXh0LCBzcGVlY2hDb25maWcpIHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy8ke0dFTUlOSV9UVFNfTU9ERUx9OmdlbmVyYXRlQ29udGVudGAsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICBcIngtZ29vZy1hcGkta2V5XCI6IGdlbWluaUFwaUtleSgpXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0czogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBnZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VNb2RhbGl0aWVzOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiQVVESU9cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgc3BlZWNoQ29uZmlnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSk7XG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgY29uc3QgYm9keSA9IChhd2FpdCByZXMudGV4dCgpKS5zbGljZSgwLCAyMDApO1xuICAgICAgICBjb25zb2xlLmVycm9yKGBHZW1pbmkgVFRTIGVycm9yICR7cmVzLnN0YXR1c306ICR7Ym9keX1gKTtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBTcGVlY2ggc3ludGhlc2lzIGZhaWxlZCAoR2VtaW5pIHJldHVybmVkICR7cmVzLnN0YXR1c30pYDtcbiAgICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQyOSB8fCByZXMuc3RhdHVzID49IDUwMCkge1xuICAgICAgICAgICAgY29uc3QgeyBSZXRyeWFibGVFcnJvciB9ID0gYXdhaXQgaW1wb3J0KFwid29ya2Zsb3dcIik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmV0cnlhYmxlRXJyb3IobWVzc2FnZSwge1xuICAgICAgICAgICAgICAgIHJldHJ5QWZ0ZXI6IFwiMzBzXCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgRmF0YWxFcnJvciB9ID0gYXdhaXQgaW1wb3J0KFwid29ya2Zsb3dcIik7XG4gICAgICAgIHRocm93IG5ldyBGYXRhbEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICBjb25zdCBwYXJ0cyA9IGpzb24uY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uZmlsdGVyKChwKT0+cC5pbmxpbmVEYXRhPy5kYXRhKSA/PyBbXTtcbiAgICBpZiAocGFydHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnN0IHsgRmF0YWxFcnJvciB9ID0gYXdhaXQgaW1wb3J0KFwid29ya2Zsb3dcIik7XG4gICAgICAgIHRocm93IG5ldyBGYXRhbEVycm9yKFwiU3BlZWNoIHN5bnRoZXNpcyByZXR1cm5lZCBubyBhdWRpbyBkYXRhXCIpO1xuICAgIH1cbiAgICAvLyBMb25nIHRyYW5zY3JpcHRzIGNvbWUgYmFjayBhcyBtdWx0aXBsZSBpbmxpbmVEYXRhIFBDTSBjaHVua3MuXG4gICAgY29uc3QgcGNtID0gbmV3IFVpbnQ4QXJyYXkoQnVmZmVyLmNvbmNhdChwYXJ0cy5tYXAoKHApPT5CdWZmZXIuZnJvbShwLmlubGluZURhdGEuZGF0YSwgXCJiYXNlNjRcIikpKSk7XG4gICAgY29uc3QgcmF0ZU1hdGNoID0gL3JhdGU9KFxcZCspLy5leGVjKHBhcnRzWzBdLmlubGluZURhdGE/Lm1pbWVUeXBlID8/IFwiXCIpO1xuICAgIGNvbnN0IHNhbXBsZVJhdGUgPSByYXRlTWF0Y2ggPyBwYXJzZUludChyYXRlTWF0Y2hbMV0sIDEwKSA6IEdFTUlOSV9TQU1QTEVfUkFURTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwY20sXG4gICAgICAgIHNhbXBsZVJhdGVcbiAgICB9O1xufVxuLy8gU3BlZWNoLXBhY2VkIHRvbmVzIChkaXN0aW5jdCBwaXRjaCBwZXIgc3BlYWtlcikgc28gdGhlIGZ1bGwgcGlwZWxpbmUgYW5kXG4vLyBwbGF5ZXIgYXJlIHRlc3RhYmxlIHdpdGhvdXQgYW55IFRUUyBjcmVkZW50aWFscy5cbmZ1bmN0aW9uIG1vY2tQY20oc2NyaXB0KSB7XG4gICAgY29uc3Qgc2FtcGxlUmF0ZSA9IDI0XzAwMDtcbiAgICBjb25zdCB3b3JkU2Vjb25kcyA9IDAuMjI7XG4gICAgY29uc3QgbGluZUdhcFNlY29uZHMgPSAwLjQ7XG4gICAgY29uc3QgbWF4U2Vjb25kcyA9IDEyMDtcbiAgICBsZXQgdG90YWxTZWNvbmRzID0gMDtcbiAgICBjb25zdCBzZWdtZW50cyA9IFtdO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBzY3JpcHQubGluZXMpe1xuICAgICAgICBjb25zdCB3b3JkcyA9IE1hdGgubWF4KDEsIGxpbmUudGV4dC5zcGxpdCgvXFxzKy8pLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHNlY29uZHMgPSB3b3JkcyAqIHdvcmRTZWNvbmRzICsgbGluZUdhcFNlY29uZHM7XG4gICAgICAgIGlmICh0b3RhbFNlY29uZHMgKyBzZWNvbmRzID4gbWF4U2Vjb25kcykgYnJlYWs7XG4gICAgICAgIHRvdGFsU2Vjb25kcyArPSBzZWNvbmRzO1xuICAgICAgICBzZWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIGZyZXE6IGxpbmUuc3BlYWtlciA9PT0gXCJIT1NUXCIgPyAxOTYgOiAxNDcsXG4gICAgICAgICAgICB3b3Jkc1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgdG90YWxTYW1wbGVzID0gTWF0aC5jZWlsKHRvdGFsU2Vjb25kcyAqIHNhbXBsZVJhdGUpO1xuICAgIGNvbnN0IHBjbSA9IG5ldyBJbnQxNkFycmF5KHRvdGFsU2FtcGxlcyk7XG4gICAgbGV0IG9mZnNldCA9IDA7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKXtcbiAgICAgICAgZm9yKGxldCB3ID0gMDsgdyA8IHNlZ21lbnQud29yZHM7IHcrKyl7XG4gICAgICAgICAgICBjb25zdCB3b3JkU2FtcGxlcyA9IE1hdGguZmxvb3Iod29yZFNlY29uZHMgKiBzYW1wbGVSYXRlICogMC44NSk7XG4gICAgICAgICAgICBjb25zdCBmcmVxID0gc2VnbWVudC5mcmVxICogKDEgKyAwLjEyICogTWF0aC5zaW4odykpO1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHdvcmRTYW1wbGVzICYmIG9mZnNldCArIGkgPCB0b3RhbFNhbXBsZXM7IGkrKyl7XG4gICAgICAgICAgICAgICAgY29uc3QgdCA9IGkgLyBzYW1wbGVSYXRlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudmVsb3BlID0gTWF0aC5zaW4oTWF0aC5QSSAqIGkgLyB3b3JkU2FtcGxlcyk7XG4gICAgICAgICAgICAgICAgcGNtW29mZnNldCArIGldID0gTWF0aC5yb3VuZCg2MDAwICogZW52ZWxvcGUgKiBNYXRoLnNpbigyICogTWF0aC5QSSAqIGZyZXEgKiB0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvZmZzZXQgKz0gTWF0aC5mbG9vcih3b3JkU2Vjb25kcyAqIHNhbXBsZVJhdGUpO1xuICAgICAgICB9XG4gICAgICAgIG9mZnNldCArPSBNYXRoLmZsb29yKGxpbmVHYXBTZWNvbmRzICogc2FtcGxlUmF0ZSk7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkocGNtLmJ1ZmZlciwgMCwgdG90YWxTYW1wbGVzICogMik7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgYnl0ZXMsXG4gICAgICAgIHNhbXBsZVJhdGVcbiAgICBdO1xufVxuIiwgImxldCBjbGllbnRQcm9taXNlID0gbnVsbDtcbi8qKiBTZWNyZXQta2V5IGNsaWVudCBmb3Igc2VydmVyLXNpZGUgd3JpdGVzOyBieXBhc3NlcyBSTFMuIE5ldmVyIGltcG9ydCBmcm9tIGNsaWVudCBjb2RlLiAqLyBleHBvcnQgZnVuY3Rpb24gZ2V0QWRtaW5DbGllbnQoKSB7XG4gICAgaWYgKCFjbGllbnRQcm9taXNlKSB7XG4gICAgICAgIGNsaWVudFByb21pc2UgPSBpbXBvcnQoXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIikudGhlbigoeyBjcmVhdGVDbGllbnQgfSk9PmNyZWF0ZUNsaWVudChwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFQ1JFVF9LRVksIHtcbiAgICAgICAgICAgICAgICBhdXRoOiB7XG4gICAgICAgICAgICAgICAgICAgIHBlcnNpc3RTZXNzaW9uOiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGNsaWVudFByb21pc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gc3VwYWJhc2VDb25maWd1cmVkKCkge1xuICAgIHJldHVybiBCb29sZWFuKHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCAmJiBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRUNSRVRfS0VZKTtcbn1cbiIsICJpbXBvcnQgeyBnZXRBZG1pbkNsaWVudCwgc3VwYWJhc2VDb25maWd1cmVkIH0gZnJvbSBcIi4vc3VwYWJhc2UvYWRtaW5cIjtcbmltcG9ydCB7IExFTkdUSF9CVURHRVRTIH0gZnJvbSBcIi4vb3B0aW9uc1wiO1xuLy8gMSBjcmVkaXQgXHUyMjQ4IDI1IG1pbnV0ZXMgb2YgcmVhZC1hbG91ZCBhdWRpbzsgY29udmVyc2F0aW9ucyBhcmUgYSBmaXhlZC1sZW5ndGhcbi8vIHN1bW1hcnkgcmVnYXJkbGVzcyBvZiBpbnB1dCBzaXplLlxuY29uc3QgUkVBRF9DSEFSU19QRVJfQ1JFRElUID0gMjVfMDAwO1xuLy8gUmVhZC1hbG91ZCBpcyBjYXBwZWQgYnkgdGhlIHNlbGVjdGVkIGxlbmd0aCwgc28gY29zdCB0b3BzIG91dCBoZXJlOyB0aGUgY2FwXG4vLyBhbHNvIGd1YXJkcyBhZ2FpbnN0IGFueSBleHRyYWN0aW9uIGFub21hbHkgaW5mbGF0aW5nIHRoZSBjaGFyZ2UuXG5jb25zdCBNQVhfQ1JFRElUU19QRVJfRVBJU09ERSA9IDg7XG4vKiogQ2hhcnMgYWN0dWFsbHkgc3Bva2VuID0gbWluKGV4dHJhY3RlZCwgdGhlIGxlbmd0aCBidWRnZXQncyByZWFkIGNhcCkuICovIGZ1bmN0aW9uIHJlYWRhYmxlQ2hhcnMoZXh0cmFjdGVkQ2hhcnMsIGxlbmd0aCkge1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCgwLCBleHRyYWN0ZWRDaGFycyksIExFTkdUSF9CVURHRVRTW2xlbmd0aF0ucmVhZENoYXJzKTtcbn1cbi8vIEEgY29udmVyc2F0aW9uJ3Mgc3Bva2VuIGxlbmd0aCBpcyBzZXQgYnkgaXRzIHRpZXIgYnVkZ2V0OyB+MSBjcmVkaXQgcGVyXG4vLyBzdGFuZGFyZC1lcGlzb2RlJ3Mgd29ydGggb2YgZGlhbG9ndWUsIHNvIGRlZXAgKDJ4KSBjb3N0cyAyLlxuY29uc3QgQ09OVkVSU0FUSU9OX0NIQVJTX1BFUl9DUkVESVQgPSBMRU5HVEhfQlVER0VUUy5zdGFuZGFyZC5zY3JpcHRDaGFycztcbmV4cG9ydCBmdW5jdGlvbiBjcmVkaXRDb3N0KG1vZGUsIGV4dHJhY3RlZENoYXJzLCBsZW5ndGggPSBcInN0YW5kYXJkXCIpIHtcbiAgICBpZiAobW9kZSA9PT0gXCJyZWFkaW5nXCIpIHtcbiAgICAgICAgY29uc3QgY2hhcnMgPSByZWFkYWJsZUNoYXJzKGV4dHJhY3RlZENoYXJzLCBsZW5ndGgpO1xuICAgICAgICByZXR1cm4gTWF0aC5taW4oTUFYX0NSRURJVFNfUEVSX0VQSVNPREUsIE1hdGgubWF4KDEsIE1hdGguY2VpbChjaGFycyAvIFJFQURfQ0hBUlNfUEVSX0NSRURJVCkpKTtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGgubWluKE1BWF9DUkVESVRTX1BFUl9FUElTT0RFLCBNYXRoLm1heCgxLCBNYXRoLmNlaWwoTEVOR1RIX0JVREdFVFNbbGVuZ3RoXS5zY3JpcHRDaGFycyAvIENPTlZFUlNBVElPTl9DSEFSU19QRVJfQ1JFRElUKSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGVzdGltYXRlTWludXRlcyhtb2RlLCBleHRyYWN0ZWRDaGFycywgbGVuZ3RoID0gXCJzdGFuZGFyZFwiKSB7XG4gICAgaWYgKG1vZGUgPT09IFwicmVhZGluZ1wiKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKHJlYWRhYmxlQ2hhcnMoZXh0cmFjdGVkQ2hhcnMsIGxlbmd0aCkgLyAxXzAwMCkpO1xuICAgIH1cbiAgICByZXR1cm4gTEVOR1RIX0JVREdFVFNbbGVuZ3RoXS5hcHByb3hNaW51dGVzO1xufVxuLyoqIENyZWRpdHMgYXJlIGVuZm9yY2VkIG9ubHkgd2hlbiBTdXBhYmFzZSBpcyBjb25maWd1cmVkIChhbHdheXMsIGluIHByb2R1Y3Rpb24pLiAqLyBleHBvcnQgZnVuY3Rpb24gY3JlZGl0c0VuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHN1cGFiYXNlQ29uZmlndXJlZCgpO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEJhbGFuY2UodXNlcklkKSB7XG4gICAgaWYgKCFjcmVkaXRzRW5hYmxlZCgpKSByZXR1cm4gSW5maW5pdHk7XG4gICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCBnZXRBZG1pbkNsaWVudCgpO1xuICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLnJwYyhcImNyZWRpdF9iYWxhbmNlXCIsIHtcbiAgICAgICAgcF91c2VyOiB1c2VySWRcbiAgICB9KTtcbiAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihgY3JlZGl0IGJhbGFuY2UgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgcmV0dXJuIE51bWJlcihkYXRhID8/IDApO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNwZW5kQ3JlZGl0cyh1c2VySWQsIGFtb3VudCwgZXBpc29kZUlkKSB7XG4gICAgaWYgKCFjcmVkaXRzRW5hYmxlZCgpKSByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IGdldEFkbWluQ2xpZW50KCk7XG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UucnBjKFwic3BlbmRfY3JlZGl0c1wiLCB7XG4gICAgICAgIHBfdXNlcjogdXNlcklkLFxuICAgICAgICBwX2Ftb3VudDogYW1vdW50LFxuICAgICAgICBwX3JlZjogYGVwaXNvZGU6JHtlcGlzb2RlSWR9YFxuICAgIH0pO1xuICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBjcmVkaXQgc3BlbmQgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgcmV0dXJuIGRhdGEgPT09IHRydWU7XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmdW5kRXBpc29kZSh1c2VySWQsIGVwaXNvZGVJZCkge1xuICAgIGlmICghY3JlZGl0c0VuYWJsZWQoKSkgcmV0dXJuO1xuICAgIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgZ2V0QWRtaW5DbGllbnQoKTtcbiAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5ycGMoXCJyZWZ1bmRfZXBpc29kZVwiLCB7XG4gICAgICAgIHBfdXNlcjogdXNlcklkLFxuICAgICAgICBwX2VwaXNvZGU6IGVwaXNvZGVJZFxuICAgIH0pO1xuICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGBjcmVkaXQgcmVmdW5kIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWApO1xufVxuIiwgIi8qKlxuICogVGhlc2UgYXJlIHRoZSBidWlsdC1pbiBzdGVwcyB0aGF0IGFyZSBcImF1dG9tYXRpY2FsbHkgYXZhaWxhYmxlXCIgaW4gdGhlIHdvcmtmbG93IHNjb3BlLiBUaGV5IGFyZVxuICogc2ltaWxhciB0byBcInN0ZGxpYlwiIGV4Y2VwdCB0aGF0IGFyZSBub3QgbWVhbnQgdG8gYmUgaW1wb3J0ZWQgYnkgdXNlcnMsIGJ1dCBhcmUgaW5zdGVhZCBcImp1c3QgYXZhaWxhYmxlXCJcbiAqIGFsb25nc2lkZSB1c2VyIGRlZmluZWQgc3RlcHMuIFRoZXkgYXJlIHVzZWQgaW50ZXJuYWxseSBieSB0aGUgcnVudGltZVxuICovXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBfX2J1aWx0aW5fcmVzcG9uc2VfYXJyYXlfYnVmZmVyKFxuICB0aGlzOiBSZXF1ZXN0IHwgUmVzcG9uc2Vcbikge1xuICAndXNlIHN0ZXAnO1xuICByZXR1cm4gdGhpcy5hcnJheUJ1ZmZlcigpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gX19idWlsdGluX3Jlc3BvbnNlX2pzb24odGhpczogUmVxdWVzdCB8IFJlc3BvbnNlKSB7XG4gICd1c2Ugc3RlcCc7XG4gIHJldHVybiB0aGlzLmpzb24oKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIF9fYnVpbHRpbl9yZXNwb25zZV90ZXh0KHRoaXM6IFJlcXVlc3QgfCBSZXNwb25zZSkge1xuICAndXNlIHN0ZXAnO1xuICByZXR1cm4gdGhpcy50ZXh0KCk7XG59XG4iLCAiLyoqXG4gKiBUaGlzIGlzIHRoZSBcInN0YW5kYXJkIGxpYnJhcnlcIiBvZiBzdGVwcyB0aGF0IHdlIG1ha2UgYXZhaWxhYmxlIHRvIGFsbCB3b3JrZmxvdyB1c2Vycy5cbiAqIFRoZSBjYW4gYmUgaW1wb3J0ZWQgbGlrZSBzbzogYGltcG9ydCB7IGZldGNoIH0gZnJvbSAnd29ya2Zsb3cnYC4gYW5kIHVzZWQgaW4gd29ya2Zsb3cuXG4gKiBUaGUgbmVlZCB0byBiZSBleHBvcnRlZCBkaXJlY3RseSBpbiB0aGlzIHBhY2thZ2UgYW5kIGNhbm5vdCBsaXZlIGluIGBjb3JlYCB0byBwcmV2ZW50XG4gKiBjaXJjdWxhciBkZXBlbmRlbmNpZXMgcG9zdC1jb21waWxhdGlvbi5cbiAqL1xuXG4vKipcbiAqIEEgaG9pc3RlZCBgZmV0Y2goKWAgZnVuY3Rpb24gdGhhdCBpcyBleGVjdXRlZCBhcyBhIFwic3RlcFwiIGZ1bmN0aW9uLFxuICogZm9yIHVzZSB3aXRoaW4gd29ya2Zsb3cgZnVuY3Rpb25zLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0ZldGNoX0FQSVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2goLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgZ2xvYmFsVGhpcy5mZXRjaD4pIHtcbiAgJ3VzZSBzdGVwJztcbiAgcmV0dXJuIGdsb2JhbFRoaXMuZmV0Y2goLi4uYXJncyk7XG59XG4iLCAiaW1wb3J0IHsgcmVnaXN0ZXJTdGVwRnVuY3Rpb24gfSBmcm9tIFwid29ya2Zsb3cvaW50ZXJuYWwvcHJpdmF0ZVwiO1xuaW1wb3J0IHsgY3JlYXRlSG9vaywgRmF0YWxFcnJvciB9IGZyb20gXCJ3b3JrZmxvd1wiO1xuLyoqX19pbnRlcm5hbF93b3JrZmxvd3N7XCJ3b3JrZmxvd3NcIjp7XCJ3b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS50c1wiOntcImdlbmVyYXRlRXBpc29kZVwiOntcIndvcmtmbG93SWRcIjpcIndvcmtmbG93Ly8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9nZW5lcmF0ZUVwaXNvZGVcIn19fSxcInN0ZXBzXCI6e1wid29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUudHNcIjp7XCJleHRyYWN0U3RlcFwiOntcInN0ZXBJZFwiOlwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vZXh0cmFjdFN0ZXBcIn0sXCJmYWlsU3RlcFwiOntcInN0ZXBJZFwiOlwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vZmFpbFN0ZXBcIn0sXCJtYXJrU2NyaXB0UmVhZHlcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL21hcmtTY3JpcHRSZWFkeVwifSxcInNjcmlwdFN0ZXBcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL3NjcmlwdFN0ZXBcIn0sXCJzeW50aGVzaXplU3RlcFwiOntcInN0ZXBJZFwiOlwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vc3ludGhlc2l6ZVN0ZXBcIn19fX0qLztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUVwaXNvZGUoZXBpc29kZUlkLCByZXZpZXdTY3JpcHQgPSBmYWxzZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBhdHRlbXB0ZWQgdG8gZXhlY3V0ZSB3b3JrZmxvdyBnZW5lcmF0ZUVwaXNvZGUgZnVuY3Rpb24gZGlyZWN0bHkuIFRvIHN0YXJ0IGEgd29ya2Zsb3csIHVzZSBzdGFydChnZW5lcmF0ZUVwaXNvZGUpIGZyb20gd29ya2Zsb3cvYXBpXCIpO1xufVxuZ2VuZXJhdGVFcGlzb2RlLndvcmtmbG93SWQgPSBcIndvcmtmbG93Ly8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9nZW5lcmF0ZUVwaXNvZGVcIjtcbmFzeW5jIGZ1bmN0aW9uIG1hcmtTY3JpcHRSZWFkeShlcGlzb2RlSWQpIHtcbiAgICBjb25zb2xlLmxvZyhgW2dlbmVyYXRlLWVwaXNvZGU6JHtlcGlzb2RlSWR9XSBhd2FpdGluZyBzY3JpcHQgcmV2aWV3YCk7XG4gICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgaWYgKCFhd2FpdCBnZXRTdG9yZSgpLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICBzdGF0dXM6IFwic2NyaXB0X3JlYWR5XCJcbiAgICB9KSkge1xuICAgICAgICB0aHJvdyBuZXcgRmF0YWxFcnJvcihcIkVwaXNvZGUgd2FzIGRlbGV0ZWRcIik7XG4gICAgfVxufVxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFN0ZXAoZXBpc29kZUlkKSB7XG4gICAgY29uc29sZS5sb2coYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gZXh0cmFjdGluZyB0ZXh0YCk7XG4gICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgY29uc3QgeyBleHRyYWN0UGRmVGV4dCB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvcGlwZWxpbmUvZXh0cmFjdFwiKTtcbiAgICBjb25zdCBzdG9yZSA9IGdldFN0b3JlKCk7XG4gICAgaWYgKCFhd2FpdCBzdG9yZS5wYXRjaChlcGlzb2RlSWQsIHtcbiAgICAgICAgc3RhdHVzOiBcImV4dHJhY3RpbmdcIlxuICAgIH0pKSB7XG4gICAgICAgIHRocm93IG5ldyBGYXRhbEVycm9yKFwiRXBpc29kZSB3YXMgZGVsZXRlZFwiKTtcbiAgICB9XG4gICAgY29uc3Qgc291cmNlID0gYXdhaXQgc3RvcmUuZ2V0U291cmNlKGVwaXNvZGVJZCk7XG4gICAgaWYgKCFzb3VyY2UpIHRocm93IG5ldyBGYXRhbEVycm9yKFwiU291cmNlIFBERiBpcyBtaXNzaW5nXCIpO1xuICAgIGxldCB0ZXh0O1xuICAgIGxldCB0b3RhbFBhZ2VzO1xuICAgIHRyeSB7XG4gICAgICAgICh7IHRleHQsIHRvdGFsUGFnZXMgfSA9IGF3YWl0IGV4dHJhY3RQZGZUZXh0KHNvdXJjZSkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBVbi1wYXJzZWFibGUvZW1wdHkgUERGcyB3aWxsIG5ldmVyIHN1Y2NlZWQgb24gcmV0cnkuXG4gICAgICAgIHRocm93IG5ldyBGYXRhbEVycm9yKGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKSk7XG4gICAgfVxuICAgIGF3YWl0IHN0b3JlLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICB0b3RhbFBhZ2VzLFxuICAgICAgICBleHRyYWN0ZWRDaGFyczogdGV4dC5sZW5ndGhcbiAgICB9KTtcbiAgICByZXR1cm4gdGV4dDtcbn1cbmFzeW5jIGZ1bmN0aW9uIHNjcmlwdFN0ZXAoZXBpc29kZUlkLCB0ZXh0KSB7XG4gICAgY29uc29sZS5sb2coYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gZ2VuZXJhdGluZyBzY3JpcHRgKTtcbiAgICBjb25zdCB7IGdldFN0b3JlIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9zdG9yZVwiKTtcbiAgICBjb25zdCB7IGdlbmVyYXRlUG9kY2FzdFNjcmlwdCwgdmVyYmF0aW1TY3JpcHQsIHNjcmlwdFByb3ZpZGVyTmFtZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvcGlwZWxpbmUvc2NyaXB0XCIpO1xuICAgIGNvbnN0IHsgbm9ybWFsaXplT3B0aW9ucywgTEVOR1RIX0JVREdFVFMgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL29wdGlvbnNcIik7XG4gICAgY29uc3Qgc3RvcmUgPSBnZXRTdG9yZSgpO1xuICAgIGNvbnN0IGVwaXNvZGUgPSBhd2FpdCBzdG9yZS5wYXRjaChlcGlzb2RlSWQsIHtcbiAgICAgICAgc3RhdHVzOiBcInNjcmlwdGluZ1wiXG4gICAgfSk7XG4gICAgaWYgKCFlcGlzb2RlKSB0aHJvdyBuZXcgRmF0YWxFcnJvcihcIkVwaXNvZGUgd2FzIGRlbGV0ZWRcIik7XG4gICAgY29uc3Qgb3B0aW9ucyA9IG5vcm1hbGl6ZU9wdGlvbnMoZXBpc29kZS5vcHRpb25zKTtcbiAgICBjb25zdCBzY3JpcHQgPSBlcGlzb2RlLm1vZGUgPT09IFwicmVhZGluZ1wiID8gdmVyYmF0aW1TY3JpcHQodGV4dCwgZXBpc29kZS5zb3VyY2VGaWxlbmFtZSwgTEVOR1RIX0JVREdFVFNbb3B0aW9ucy5sZW5ndGhdLnJlYWRDaGFycykgOiBhd2FpdCBnZW5lcmF0ZVBvZGNhc3RTY3JpcHQodGV4dCwgZXBpc29kZS5zb3VyY2VGaWxlbmFtZSwgb3B0aW9ucyk7XG4gICAgYXdhaXQgc3RvcmUucGF0Y2goZXBpc29kZUlkLCB7XG4gICAgICAgIHRpdGxlOiBzY3JpcHQudGl0bGUsXG4gICAgICAgIHNjcmlwdCxcbiAgICAgICAgcHJvdmlkZXJzOiB7XG4gICAgICAgICAgICBzY3JpcHQ6IGVwaXNvZGUubW9kZSA9PT0gXCJyZWFkaW5nXCIgPyBcInZlcmJhdGltXCIgOiBzY3JpcHRQcm92aWRlck5hbWUoKSxcbiAgICAgICAgICAgIHR0czogXCJcIlxuICAgICAgICB9XG4gICAgfSk7XG59XG5hc3luYyBmdW5jdGlvbiBzeW50aGVzaXplU3RlcChlcGlzb2RlSWQpIHtcbiAgICBjb25zb2xlLmxvZyhgW2dlbmVyYXRlLWVwaXNvZGU6JHtlcGlzb2RlSWR9XSBzeW50aGVzaXppbmcgYXVkaW9gKTtcbiAgICBjb25zdCB7IGdldFN0b3JlIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9zdG9yZVwiKTtcbiAgICBjb25zdCB7IHN5bnRoZXNpemVEaWFsb2d1ZSwgdHRzUHJvdmlkZXJOYW1lIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9waXBlbGluZS90dHNcIik7XG4gICAgY29uc3QgeyBub3JtYWxpemVPcHRpb25zIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9vcHRpb25zXCIpO1xuICAgIGNvbnN0IHN0b3JlID0gZ2V0U3RvcmUoKTtcbiAgICBjb25zdCBlcGlzb2RlID0gYXdhaXQgc3RvcmUucGF0Y2goZXBpc29kZUlkLCB7XG4gICAgICAgIHN0YXR1czogXCJzeW50aGVzaXppbmdcIlxuICAgIH0pO1xuICAgIGlmICghZXBpc29kZSkgdGhyb3cgbmV3IEZhdGFsRXJyb3IoXCJFcGlzb2RlIHdhcyBkZWxldGVkXCIpO1xuICAgIC8vIFRoZSBzY3JpcHQgaW4gdGhlIERCIG1heSBoYXZlIGJlZW4gZWRpdGVkIGR1cmluZyByZXZpZXcgXHUyMDE0IGl0J3MgdGhlIHNvdXJjZVxuICAgIC8vIG9mIHRydXRoLCBub3Qgd2hhdGV2ZXIgc2NyaXB0U3RlcCBvcmlnaW5hbGx5IHByb2R1Y2VkLlxuICAgIGNvbnN0IHNjcmlwdCA9IGVwaXNvZGUuc2NyaXB0O1xuICAgIGlmICghc2NyaXB0KSB0aHJvdyBuZXcgRmF0YWxFcnJvcihcIlNjcmlwdCBpcyBtaXNzaW5nXCIpO1xuICAgIGNvbnN0IHsgYXVkaW8sIG1pbWVUeXBlLCBkdXJhdGlvblNlY29uZHMgfSA9IGF3YWl0IHN5bnRoZXNpemVEaWFsb2d1ZShzY3JpcHQsIGVwaXNvZGUubW9kZSA/PyBcImNvbnZlcnNhdGlvblwiLCBub3JtYWxpemVPcHRpb25zKGVwaXNvZGUub3B0aW9ucykpO1xuICAgIGF3YWl0IHN0b3JlLnNhdmVBdWRpbyhlcGlzb2RlSWQsIGF1ZGlvLCBtaW1lVHlwZSk7XG4gICAgYXdhaXQgc3RvcmUucGF0Y2goZXBpc29kZUlkLCB7XG4gICAgICAgIHN0YXR1czogXCJyZWFkeVwiLFxuICAgICAgICBhdWRpb01pbWVUeXBlOiBtaW1lVHlwZSxcbiAgICAgICAgZHVyYXRpb25TZWNvbmRzOiBNYXRoLnJvdW5kKGR1cmF0aW9uU2Vjb25kcyksXG4gICAgICAgIHByb3ZpZGVyczoge1xuICAgICAgICAgICAgc2NyaXB0OiBlcGlzb2RlLnByb3ZpZGVycz8uc2NyaXB0ID8/IFwiXCIsXG4gICAgICAgICAgICB0dHM6IHR0c1Byb3ZpZGVyTmFtZSgpXG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGZhaWxTdGVwKGVwaXNvZGVJZCwgbWVzc2FnZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtnZW5lcmF0ZS1lcGlzb2RlOiR7ZXBpc29kZUlkfV0gZmFpbGVkOiAke21lc3NhZ2V9YCk7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBnZXRTdG9yZSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvc3RvcmVcIik7XG4gICAgICAgIGNvbnN0IGVwaXNvZGUgPSBhd2FpdCBnZXRTdG9yZSgpLnBhdGNoKGVwaXNvZGVJZCwge1xuICAgICAgICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICAgICAgICBlcnJvcjogbWVzc2FnZVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGVwaXNvZGU/LnVzZXJJZCkge1xuICAgICAgICAgICAgY29uc3QgeyByZWZ1bmRFcGlzb2RlIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9jcmVkaXRzXCIpO1xuICAgICAgICAgICAgLy8gTm8tb3AgdW5sZXNzIGEgc3BlbmQgcm93IGV4aXN0cyBmb3IgdGhpcyBlcGlzb2RlLCBzbyBhZG1pbiBydW5zIGFuZFxuICAgICAgICAgICAgLy8gcmV0cmllcyBhcmUgc2FmZS5cbiAgICAgICAgICAgIGF3YWl0IHJlZnVuZEVwaXNvZGUoZXBpc29kZS51c2VySWQsIGVwaXNvZGVJZCk7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChwYXRjaEVycikge1xuICAgICAgICAvLyBOZXZlciBtYXNrIHRoZSBvcmlnaW5hbCB3b3JrZmxvdyBlcnJvciB3aXRoIGEgYm9va2tlZXBpbmcgZmFpbHVyZS5cbiAgICAgICAgY29uc29sZS5lcnJvcihgW2dlbmVyYXRlLWVwaXNvZGU6JHtlcGlzb2RlSWR9XSBjb3VsZCBub3QgcmVjb3JkIGZhaWx1cmU6YCwgcGF0Y2hFcnIpO1xuICAgIH1cbn1cbnJlZ2lzdGVyU3RlcEZ1bmN0aW9uKFwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vbWFya1NjcmlwdFJlYWR5XCIsIG1hcmtTY3JpcHRSZWFkeSk7XG5yZWdpc3RlclN0ZXBGdW5jdGlvbihcInN0ZXAvLy4vd29ya2Zsb3dzL2dlbmVyYXRlLWVwaXNvZGUvL2V4dHJhY3RTdGVwXCIsIGV4dHJhY3RTdGVwKTtcbnJlZ2lzdGVyU3RlcEZ1bmN0aW9uKFwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vc2NyaXB0U3RlcFwiLCBzY3JpcHRTdGVwKTtcbnJlZ2lzdGVyU3RlcEZ1bmN0aW9uKFwic3RlcC8vLi93b3JrZmxvd3MvZ2VuZXJhdGUtZXBpc29kZS8vc3ludGhlc2l6ZVN0ZXBcIiwgc3ludGhlc2l6ZVN0ZXApO1xucmVnaXN0ZXJTdGVwRnVuY3Rpb24oXCJzdGVwLy8uL3dvcmtmbG93cy9nZW5lcmF0ZS1lcGlzb2RlLy9mYWlsU3RlcFwiLCBmYWlsU3RlcCk7XG4iLCAiLyoqXG4gKiBTZXJkZSBjb21wbGlhbmNlIGNoZWNrZXIgZm9yIHdvcmtmbG93IGN1c3RvbSBjbGFzcyBzZXJpYWxpemF0aW9uLlxuICpcbiAqIEFuYWx5emVzIHNvdXJjZSBjb2RlIHRvIGRldGVybWluZSBpZiBjbGFzc2VzIHdpdGggV09SS0ZMT1dfU0VSSUFMSVpFIC9cbiAqIFdPUktGTE9XX0RFU0VSSUFMSVpFIGFyZSBjb3JyZWN0bHkgc2V0IHVwIGZvciB0aGUgd29ya2Zsb3cgc2FuZGJveC5cbiAqXG4gKiBVc2VkIGJ5OlxuICogLSBDTEkgYHZhbGlkYXRlYCBjb21tYW5kXG4gKiAtIENMSSBgdHJhbnNmb3JtYCBjb21tYW5kICgtLWNoZWNrLXNlcmRlKVxuICogLSBTV0MgcGxheWdyb3VuZCBzZXJkZSBhbmFseXNpcyBwYW5lbFxuICogLSBCdWlsZC10aW1lIHdhcm5pbmdzIGluIEJhc2VCdWlsZGVyXG4gKi9cblxuaW1wb3J0IGJ1aWx0aW5Nb2R1bGVzIGZyb20gJ2J1aWx0aW4tbW9kdWxlcyc7XG5pbXBvcnQgdHlwZSB7IFdvcmtmbG93TWFuaWZlc3QgfSBmcm9tICcuL2FwcGx5LXN3Yy10cmFuc2Zvcm0uanMnO1xuXG4vLyBCdWlsZCBhIHJlZ2V4IHRoYXQgbWF0Y2hlcyBOb2RlLmpzIGJ1aWx0LWluIG1vZHVsZSBpbXBvcnRzIGluIHRyYW5zZm9ybWVkIGNvZGUuXG4vLyBIYW5kbGVzIGJvdGggRVNNIChgZnJvbSAnZnMnYCwgYGZyb20gJ25vZGU6ZnMnYCkgYW5kIENKUyAoYHJlcXVpcmUoJ2ZzJylgKVxuY29uc3Qgbm9kZUJ1aWx0aW5zID0gYnVpbHRpbk1vZHVsZXMuam9pbignfCcpO1xuXG4vLyBSZWdleCB0byBleHRyYWN0IHNwZWNpZmljIG1vZHVsZSBuYW1lcyBmcm9tIGltcG9ydC9yZXF1aXJlIHN0YXRlbWVudHNcbmNvbnN0IG5vZGVJbXBvcnRFeHRyYWN0UmVnZXggPSBuZXcgUmVnRXhwKFxuICBgKD86ZnJvbVxcXFxzK1snXCJdKD86bm9kZTopPygoPzoke25vZGVCdWlsdGluc30pKD86L1teJ1wiXSopPylbJ1wiXWAgK1xuICAgIGB8cmVxdWlyZVxcXFxzKlxcXFwoXFxcXHMqWydcIl0oPzpub2RlOik/KCg/OiR7bm9kZUJ1aWx0aW5zfSkoPzovW14nXCJdKik/KVsnXCJdXFxcXHMqXFxcXCkpYCxcbiAgJ2cnXG4pO1xuXG4vLyBSZWdleCB0byBkZXRlY3QgY2xhc3MgcmVnaXN0cmF0aW9uIElJRkVzIGdlbmVyYXRlZCBieSB0aGUgU1dDIHBsdWdpblxuY29uc3QgcmVnaXN0cmF0aW9uSWlmZVJlZ2V4ID1cbiAgL1N5bWJvbFxcLmZvclxccypcXChcXHMqW1wiJ113b3JrZmxvdy1jbGFzcy1yZWdpc3RyeVtcIiddXFxzKlxcKS87XG5cbi8qKlxuICogUmVzdWx0IG9mIGNoZWNraW5nIGEgc2luZ2xlIGNsYXNzIGZvciBzZXJkZSBjb21wbGlhbmNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlcmRlQ2xhc3NDaGVja1Jlc3VsdCB7XG4gIC8qKiBUaGUgY2xhc3MgbmFtZSBhcyBkZXRlY3RlZCBpbiB0aGUgc291cmNlICovXG4gIGNsYXNzTmFtZTogc3RyaW5nO1xuICAvKiogVGhlIGNsYXNzSWQgYXNzaWduZWQgYnkgdGhlIFNXQyBwbHVnaW4gKGZyb20gdGhlIG1hbmlmZXN0KSAqL1xuICBjbGFzc0lkOiBzdHJpbmc7XG4gIC8qKiBXaGV0aGVyIHRoZSBTV0MgcGx1Z2luIGRldGVjdGVkIHNlcmRlIHN5bWJvbHMgb24gdGhpcyBjbGFzcyAqL1xuICBkZXRlY3RlZDogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgYSByZWdpc3RyYXRpb24gSUlGRSB3YXMgZ2VuZXJhdGVkIGluIHRoZSBvdXRwdXQgKi9cbiAgcmVnaXN0ZXJlZDogYm9vbGVhbjtcbiAgLyoqXG4gICAqIE5vZGUuanMgYnVpbHQtaW4gbW9kdWxlIGltcG9ydHMgcmVtYWluaW5nIGluIHRoZSB3b3JrZmxvdy1tb2RlIG91dHB1dC5cbiAgICogSWYgbm9uLWVtcHR5LCB0aGUgY2xhc3MgaXMgTk9UIHdvcmtmbG93LXNhbmRib3ggY29tcGxpYW50LlxuICAgKi9cbiAgbm9kZUltcG9ydHM6IHN0cmluZ1tdO1xuICAvKiogV2hldGhlciB0aGUgY2xhc3MgcGFzc2VzIGFsbCBjb21wbGlhbmNlIGNoZWNrcyAqL1xuICBjb21wbGlhbnQ6IGJvb2xlYW47XG4gIC8qKiBIdW1hbi1yZWFkYWJsZSBkZXNjcmlwdGlvbnMgb2YgYW55IGlzc3VlcyBmb3VuZCAqL1xuICBpc3N1ZXM6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIEZ1bGwgcmVzdWx0IG9mIHNlcmRlIGNvbXBsaWFuY2UgYW5hbHlzaXMgZm9yIGEgc291cmNlIGZpbGUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VyZGVDaGVja1Jlc3VsdCB7XG4gIC8qKiBQZXItY2xhc3MgYW5hbHlzaXMgcmVzdWx0cyAqL1xuICBjbGFzc2VzOiBTZXJkZUNsYXNzQ2hlY2tSZXN1bHRbXTtcbiAgLyoqIEFsbCBOb2RlLmpzIGJ1aWx0LWluIGltcG9ydHMgZm91bmQgaW4gdGhlIHdvcmtmbG93LW1vZGUgb3V0cHV0ICovXG4gIGdsb2JhbE5vZGVJbXBvcnRzOiBzdHJpbmdbXTtcbiAgLyoqIFdoZXRoZXIgdGhlIHdvcmtmbG93LW1vZGUgb3V0cHV0IGNvbnRhaW5zIGFueSBzZXJkZS1yZWxhdGVkIGNsYXNzZXMgKi9cbiAgaGFzU2VyZGVDbGFzc2VzOiBib29sZWFuO1xuICAvKiogVGhlIHJhdyB3b3JrZmxvdyBtYW5pZmVzdCBleHRyYWN0ZWQgZnJvbSB0aGUgU1dDIHRyYW5zZm9ybSAqL1xuICBtYW5pZmVzdDogV29ya2Zsb3dNYW5pZmVzdDtcbn1cblxuLyoqXG4gKiBMaWdodHdlaWdodCBzZXJkZSBjb21wbGlhbmNlIGNoZWNrZXIgdGhhdCB3b3JrcyB3aXRoIHByZS1jb21wdXRlZFxuICogU1dDIHRyYW5zZm9ybSByZXN1bHRzLiBUaGlzIGF2b2lkcyByZS1ydW5uaW5nIHRoZSBTV0MgdHJhbnNmb3JtXG4gKiB3aGVuIHRoZSBjYWxsZXIgYWxyZWFkeSBoYXMgdGhlIG91dHB1dHMgKGUuZy4sIHRoZSBwbGF5Z3JvdW5kIG9yIGJ1aWxkZXIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5hbHl6ZVNlcmRlQ29tcGxpYW5jZShvcHRpb25zOiB7XG4gIC8qKiBTb3VyY2UgY29kZSAodXNlZCBmb3IgcGF0dGVybiBkZXRlY3Rpb24pICovXG4gIHNvdXJjZUNvZGU6IHN0cmluZztcbiAgLyoqIFdvcmtmbG93LW1vZGUgdHJhbnNmb3JtZWQgb3V0cHV0ICovXG4gIHdvcmtmbG93Q29kZTogc3RyaW5nO1xuICAvKiogTWFuaWZlc3QgZXh0cmFjdGVkIGZyb20gdGhlIFNXQyB0cmFuc2Zvcm0gKi9cbiAgbWFuaWZlc3Q6IFdvcmtmbG93TWFuaWZlc3Q7XG59KTogU2VyZGVDaGVja1Jlc3VsdCB7XG4gIGNvbnN0IHsgc291cmNlQ29kZSwgd29ya2Zsb3dDb2RlLCBtYW5pZmVzdCB9ID0gb3B0aW9ucztcblxuICAvLyAxLiBFeHRyYWN0IGFsbCBOb2RlLmpzIGJ1aWx0LWluIGltcG9ydHMgZnJvbSB0aGUgd29ya2Zsb3cgb3V0cHV0XG4gIGNvbnN0IGdsb2JhbE5vZGVJbXBvcnRzID0gZXh0cmFjdE5vZGVJbXBvcnRzKHdvcmtmbG93Q29kZSk7XG5cbiAgLy8gMi4gQ2hlY2sgaWYgdGhlIG1hbmlmZXN0IGNvbnRhaW5zIGFueSBzZXJkZS1yZWdpc3RlcmVkIGNsYXNzZXNcbiAgY29uc3QgY2xhc3NFbnRyaWVzID0gZXh0cmFjdENsYXNzRW50cmllcyhtYW5pZmVzdCk7XG4gIGNvbnN0IGhhc1NlcmRlQ2xhc3NlcyA9IGNsYXNzRW50cmllcy5sZW5ndGggPiAwO1xuXG4gIC8vIDMuIENoZWNrIGlmIHRoZSB3b3JrZmxvdyBvdXRwdXQgY29udGFpbnMgcmVnaXN0cmF0aW9uIElJRkVzXG4gIGNvbnN0IGhhc1JlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbklpZmVSZWdleC50ZXN0KHdvcmtmbG93Q29kZSk7XG5cbiAgLy8gNC4gQW5hbHl6ZSBlYWNoIGNsYXNzXG4gIGNvbnN0IGNsYXNzZXM6IFNlcmRlQ2xhc3NDaGVja1Jlc3VsdFtdID0gY2xhc3NFbnRyaWVzLm1hcCgoZW50cnkpID0+IHtcbiAgICBjb25zdCBpc3N1ZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyBDaGVjayBmb3IgTm9kZS5qcyBpbXBvcnRzICh0aGVzZSB3aWxsIGZhaWwgaW4gdGhlIHdvcmtmbG93IHNhbmRib3gpXG4gICAgaWYgKGdsb2JhbE5vZGVJbXBvcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKFxuICAgICAgICBgV29ya2Zsb3cgYnVuZGxlIGNvbnRhaW5zIE5vZGUuanMgYnVpbHQtaW4gaW1wb3J0czogJHtnbG9iYWxOb2RlSW1wb3J0cy5qb2luKCcsICcpfS4gYCArXG4gICAgICAgICAgYFRoZXNlIHdpbGwgZmFpbCBhdCBydW50aW1lIGluIHRoZSB3b3JrZmxvdyBzYW5kYm94LiBgICtcbiAgICAgICAgICBgQWRkIFwidXNlIHN0ZXBcIiB0byBtZXRob2RzIHRoYXQgZGVwZW5kIG9uIE5vZGUuanMgQVBJcyBzbyB0aGV5IGFyZSBzdHJpcHBlZCBmcm9tIHRoZSB3b3JrZmxvdyBidW5kbGUuYFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgcmVnaXN0cmF0aW9uXG4gICAgaWYgKCFoYXNSZWdpc3RyYXRpb24pIHtcbiAgICAgIGlzc3Vlcy5wdXNoKFxuICAgICAgICBgTm8gY2xhc3MgcmVnaXN0cmF0aW9uIElJRkUgd2FzIGdlbmVyYXRlZC4gYCArXG4gICAgICAgICAgYEVuc3VyZSBXT1JLRkxPV19TRVJJQUxJWkUgYW5kIFdPUktGTE9XX0RFU0VSSUFMSVpFIGFyZSBkZWZpbmVkIGFzIHN0YXRpYyBtZXRob2RzIGAgK1xuICAgICAgICAgIGBpbnNpZGUgdGhlIGNsYXNzIGJvZHkgdXNpbmcgY29tcHV0ZWQgcHJvcGVydHkgc3ludGF4OiBzdGF0aWMgW1dPUktGTE9XX1NFUklBTElaRV0oLi4uKSB7IC4uLiB9YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY2xhc3NOYW1lOiBlbnRyeS5jbGFzc05hbWUsXG4gICAgICBjbGFzc0lkOiBlbnRyeS5jbGFzc0lkLFxuICAgICAgZGV0ZWN0ZWQ6IHRydWUsXG4gICAgICByZWdpc3RlcmVkOiBoYXNSZWdpc3RyYXRpb24sXG4gICAgICBub2RlSW1wb3J0czogZ2xvYmFsTm9kZUltcG9ydHMsXG4gICAgICBjb21wbGlhbnQ6IGdsb2JhbE5vZGVJbXBvcnRzLmxlbmd0aCA9PT0gMCAmJiBoYXNSZWdpc3RyYXRpb24sXG4gICAgICBpc3N1ZXMsXG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gNS4gQ2hlY2sgZm9yIGNsYXNzZXMgdGhhdCBoYXZlIHNlcmRlIHBhdHRlcm5zIGluIHNvdXJjZSBidXQgd2VyZW4ndCBkZXRlY3RlZCBieSBTV0NcbiAgY29uc3Qgc291cmNlSGFzU2VyZGVQYXR0ZXJucyA9XG4gICAgL1xcW1xccypXT1JLRkxPV18oPzpTRVJJQUxJWkV8REVTRVJJQUxJWkUpXFxzKlxcXS8udGVzdChzb3VyY2VDb2RlKSB8fFxuICAgIC9TeW1ib2xcXC5mb3JcXHMqXFwoXFxzKlsnXCJdd29ya2Zsb3ctKD86c2VyaWFsaXplfGRlc2VyaWFsaXplKVsnXCJdXFxzKlxcKS8udGVzdChcbiAgICAgIHNvdXJjZUNvZGVcbiAgICApO1xuXG4gIGlmIChzb3VyY2VIYXNTZXJkZVBhdHRlcm5zICYmIGNsYXNzRW50cmllcy5sZW5ndGggPT09IDApIHtcbiAgICBjbGFzc2VzLnB1c2goe1xuICAgICAgY2xhc3NOYW1lOiAnPHVua25vd24+JyxcbiAgICAgIGNsYXNzSWQ6ICcnLFxuICAgICAgZGV0ZWN0ZWQ6IGZhbHNlLFxuICAgICAgcmVnaXN0ZXJlZDogZmFsc2UsXG4gICAgICBub2RlSW1wb3J0czogZ2xvYmFsTm9kZUltcG9ydHMsXG4gICAgICBjb21wbGlhbnQ6IGZhbHNlLFxuICAgICAgaXNzdWVzOiBbXG4gICAgICAgIGBTb3VyY2UgY29kZSBjb250YWlucyBXT1JLRkxPV19TRVJJQUxJWkUvV09SS0ZMT1dfREVTRVJJQUxJWkUgcGF0dGVybnMgYnV0IGAgK1xuICAgICAgICAgIGB0aGUgU1dDIHBsdWdpbiBkaWQgbm90IGRldGVjdCBhbnkgc2VyZGUtZW5hYmxlZCBjbGFzc2VzLiBgICtcbiAgICAgICAgICBgRW5zdXJlIHRoZSBzeW1ib2xzIGFyZSBkZWZpbmVkIGFzIHN0YXRpYyBtZXRob2RzIElOU0lERSB0aGUgY2xhc3MgYm9keSwgYCArXG4gICAgICAgICAgYG5vdCBhc3NpZ25lZCBleHRlcm5hbGx5IChlLmcuLCAoTXlDbGFzcyBhcyBhbnkpW1dPUktGTE9XX1NFUklBTElaRV0gPSAuLi4pLmAsXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjbGFzc2VzLFxuICAgIGdsb2JhbE5vZGVJbXBvcnRzLFxuICAgIGhhc1NlcmRlQ2xhc3NlcyxcbiAgICBtYW5pZmVzdCxcbiAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IE5vZGUuanMgYnVpbHQtaW4gbW9kdWxlIG5hbWVzIGZyb20gdHJhbnNmb3JtZWQgY29kZS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdE5vZGVJbXBvcnRzKGNvZGU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgaW1wb3J0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAvLyBSZXNldCByZWdleCBzdGF0ZVxuICBub2RlSW1wb3J0RXh0cmFjdFJlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gIGZvciAoXG4gICAgbGV0IG1hdGNoID0gbm9kZUltcG9ydEV4dHJhY3RSZWdleC5leGVjKGNvZGUpO1xuICAgIG1hdGNoICE9PSBudWxsO1xuICAgIG1hdGNoID0gbm9kZUltcG9ydEV4dHJhY3RSZWdleC5leGVjKGNvZGUpXG4gICkge1xuICAgIC8vIG1hdGNoWzFdIGlzIGZyb20gdGhlIEVTTSBwYXR0ZXJuLCBtYXRjaFsyXSBpcyBmcm9tIHRoZSBDSlMgcGF0dGVyblxuICAgIGNvbnN0IG1vZHVsZU5hbWUgPSBtYXRjaFsxXSB8fCBtYXRjaFsyXTtcbiAgICBpZiAobW9kdWxlTmFtZSkge1xuICAgICAgLy8gTm9ybWFsaXplIHRvIGJhc2UgbW9kdWxlIG5hbWUgKGUuZy4sICdmcy9wcm9taXNlcycgLT4gJ2ZzJylcbiAgICAgIGltcG9ydHMuYWRkKG1vZHVsZU5hbWUuc3BsaXQoJy8nKVswXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBbLi4uaW1wb3J0c10uc29ydCgpO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgY2xhc3MgZW50cmllcyBmcm9tIGEgV29ya2Zsb3dNYW5pZmVzdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RDbGFzc0VudHJpZXMoXG4gIG1hbmlmZXN0OiBXb3JrZmxvd01hbmlmZXN0XG4pOiBBcnJheTx7IGNsYXNzTmFtZTogc3RyaW5nOyBjbGFzc0lkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfT4ge1xuICBjb25zdCBlbnRyaWVzOiBBcnJheTx7XG4gICAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gICAgY2xhc3NJZDogc3RyaW5nO1xuICAgIGZpbGVOYW1lOiBzdHJpbmc7XG4gIH0+ID0gW107XG4gIGlmICghbWFuaWZlc3QuY2xhc3NlcykgcmV0dXJuIGVudHJpZXM7XG5cbiAgZm9yIChjb25zdCBbZmlsZU5hbWUsIGNsYXNzZXNdIG9mIE9iamVjdC5lbnRyaWVzKG1hbmlmZXN0LmNsYXNzZXMpKSB7XG4gICAgZm9yIChjb25zdCBbY2xhc3NOYW1lLCB7IGNsYXNzSWQgfV0gb2YgT2JqZWN0LmVudHJpZXMoY2xhc3NlcykpIHtcbiAgICAgIGVudHJpZXMucHVzaCh7IGNsYXNzTmFtZSwgY2xhc3NJZCwgZmlsZU5hbWUgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBlbnRyaWVzO1xufVxuIiwgIi8qKlxuICogU2VyZGUgY29tcGxpYW5jZSBjaGVja2VyIGZvciB3b3JrZmxvdyBjdXN0b20gY2xhc3Mgc2VyaWFsaXphdGlvbi5cbiAqXG4gKiBBbmFseXplcyBzb3VyY2UgY29kZSB0byBkZXRlcm1pbmUgaWYgY2xhc3NlcyB3aXRoIFdPUktGTE9XX1NFUklBTElaRSAvXG4gKiBXT1JLRkxPV19ERVNFUklBTElaRSBhcmUgY29ycmVjdGx5IHNldCB1cCBmb3IgdGhlIHdvcmtmbG93IHNhbmRib3guXG4gKlxuICogVXNlZCBieTpcbiAqIC0gQ0xJIGB2YWxpZGF0ZWAgY29tbWFuZFxuICogLSBDTEkgYHRyYW5zZm9ybWAgY29tbWFuZCAoLS1jaGVjay1zZXJkZSlcbiAqIC0gU1dDIHBsYXlncm91bmQgc2VyZGUgYW5hbHlzaXMgcGFuZWxcbiAqIC0gQnVpbGQtdGltZSB3YXJuaW5ncyBpbiBCYXNlQnVpbGRlclxuICovXG5cbmltcG9ydCBidWlsdGluTW9kdWxlcyBmcm9tICdidWlsdGluLW1vZHVsZXMnO1xuaW1wb3J0IHR5cGUgeyBXb3JrZmxvd01hbmlmZXN0IH0gZnJvbSAnLi9hcHBseS1zd2MtdHJhbnNmb3JtLmpzJztcblxuLy8gQnVpbGQgYSByZWdleCB0aGF0IG1hdGNoZXMgTm9kZS5qcyBidWlsdC1pbiBtb2R1bGUgaW1wb3J0cyBpbiB0cmFuc2Zvcm1lZCBjb2RlLlxuLy8gSGFuZGxlcyBib3RoIEVTTSAoYGZyb20gJ2ZzJ2AsIGBmcm9tICdub2RlOmZzJ2ApIGFuZCBDSlMgKGByZXF1aXJlKCdmcycpYClcbmNvbnN0IG5vZGVCdWlsdGlucyA9IGJ1aWx0aW5Nb2R1bGVzLmpvaW4oJ3wnKTtcblxuLy8gUmVnZXggdG8gZXh0cmFjdCBzcGVjaWZpYyBtb2R1bGUgbmFtZXMgZnJvbSBpbXBvcnQvcmVxdWlyZSBzdGF0ZW1lbnRzXG5jb25zdCBub2RlSW1wb3J0RXh0cmFjdFJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgYCg/OmZyb21cXFxccytbJ1wiXSg/Om5vZGU6KT8oKD86JHtub2RlQnVpbHRpbnN9KSg/Oi9bXidcIl0qKT8pWydcIl1gICtcbiAgICBgfHJlcXVpcmVcXFxccypcXFxcKFxcXFxzKlsnXCJdKD86bm9kZTopPygoPzoke25vZGVCdWlsdGluc30pKD86L1teJ1wiXSopPylbJ1wiXVxcXFxzKlxcXFwpKWAsXG4gICdnJ1xuKTtcblxuLy8gUmVnZXggdG8gZGV0ZWN0IGNsYXNzIHJlZ2lzdHJhdGlvbiBJSUZFcyBnZW5lcmF0ZWQgYnkgdGhlIFNXQyBwbHVnaW5cbmNvbnN0IHJlZ2lzdHJhdGlvbklpZmVSZWdleCA9XG4gIC9TeW1ib2xcXC5mb3JcXHMqXFwoXFxzKltcIiddd29ya2Zsb3ctY2xhc3MtcmVnaXN0cnlbXCInXVxccypcXCkvO1xuXG4vKipcbiAqIFJlc3VsdCBvZiBjaGVja2luZyBhIHNpbmdsZSBjbGFzcyBmb3Igc2VyZGUgY29tcGxpYW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJkZUNsYXNzQ2hlY2tSZXN1bHQge1xuICAvKiogVGhlIGNsYXNzIG5hbWUgYXMgZGV0ZWN0ZWQgaW4gdGhlIHNvdXJjZSAqL1xuICBjbGFzc05hbWU6IHN0cmluZztcbiAgLyoqIFRoZSBjbGFzc0lkIGFzc2lnbmVkIGJ5IHRoZSBTV0MgcGx1Z2luIChmcm9tIHRoZSBtYW5pZmVzdCkgKi9cbiAgY2xhc3NJZDogc3RyaW5nO1xuICAvKiogV2hldGhlciB0aGUgU1dDIHBsdWdpbiBkZXRlY3RlZCBzZXJkZSBzeW1ib2xzIG9uIHRoaXMgY2xhc3MgKi9cbiAgZGV0ZWN0ZWQ6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIGEgcmVnaXN0cmF0aW9uIElJRkUgd2FzIGdlbmVyYXRlZCBpbiB0aGUgb3V0cHV0ICovXG4gIHJlZ2lzdGVyZWQ6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBOb2RlLmpzIGJ1aWx0LWluIG1vZHVsZSBpbXBvcnRzIHJlbWFpbmluZyBpbiB0aGUgd29ya2Zsb3ctbW9kZSBvdXRwdXQuXG4gICAqIElmIG5vbi1lbXB0eSwgdGhlIGNsYXNzIGlzIE5PVCB3b3JrZmxvdy1zYW5kYm94IGNvbXBsaWFudC5cbiAgICovXG4gIG5vZGVJbXBvcnRzOiBzdHJpbmdbXTtcbiAgLyoqIFdoZXRoZXIgdGhlIGNsYXNzIHBhc3NlcyBhbGwgY29tcGxpYW5jZSBjaGVja3MgKi9cbiAgY29tcGxpYW50OiBib29sZWFuO1xuICAvKiogSHVtYW4tcmVhZGFibGUgZGVzY3JpcHRpb25zIG9mIGFueSBpc3N1ZXMgZm91bmQgKi9cbiAgaXNzdWVzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBGdWxsIHJlc3VsdCBvZiBzZXJkZSBjb21wbGlhbmNlIGFuYWx5c2lzIGZvciBhIHNvdXJjZSBmaWxlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlcmRlQ2hlY2tSZXN1bHQge1xuICAvKiogUGVyLWNsYXNzIGFuYWx5c2lzIHJlc3VsdHMgKi9cbiAgY2xhc3NlczogU2VyZGVDbGFzc0NoZWNrUmVzdWx0W107XG4gIC8qKiBBbGwgTm9kZS5qcyBidWlsdC1pbiBpbXBvcnRzIGZvdW5kIGluIHRoZSB3b3JrZmxvdy1tb2RlIG91dHB1dCAqL1xuICBnbG9iYWxOb2RlSW1wb3J0czogc3RyaW5nW107XG4gIC8qKiBXaGV0aGVyIHRoZSB3b3JrZmxvdy1tb2RlIG91dHB1dCBjb250YWlucyBhbnkgc2VyZGUtcmVsYXRlZCBjbGFzc2VzICovXG4gIGhhc1NlcmRlQ2xhc3NlczogYm9vbGVhbjtcbiAgLyoqIFRoZSByYXcgd29ya2Zsb3cgbWFuaWZlc3QgZXh0cmFjdGVkIGZyb20gdGhlIFNXQyB0cmFuc2Zvcm0gKi9cbiAgbWFuaWZlc3Q6IFdvcmtmbG93TWFuaWZlc3Q7XG59XG5cbi8qKlxuICogTGlnaHR3ZWlnaHQgc2VyZGUgY29tcGxpYW5jZSBjaGVja2VyIHRoYXQgd29ya3Mgd2l0aCBwcmUtY29tcHV0ZWRcbiAqIFNXQyB0cmFuc2Zvcm0gcmVzdWx0cy4gVGhpcyBhdm9pZHMgcmUtcnVubmluZyB0aGUgU1dDIHRyYW5zZm9ybVxuICogd2hlbiB0aGUgY2FsbGVyIGFscmVhZHkgaGFzIHRoZSBvdXRwdXRzIChlLmcuLCB0aGUgcGxheWdyb3VuZCBvciBidWlsZGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVTZXJkZUNvbXBsaWFuY2Uob3B0aW9uczoge1xuICAvKiogU291cmNlIGNvZGUgKHVzZWQgZm9yIHBhdHRlcm4gZGV0ZWN0aW9uKSAqL1xuICBzb3VyY2VDb2RlOiBzdHJpbmc7XG4gIC8qKiBXb3JrZmxvdy1tb2RlIHRyYW5zZm9ybWVkIG91dHB1dCAqL1xuICB3b3JrZmxvd0NvZGU6IHN0cmluZztcbiAgLyoqIE1hbmlmZXN0IGV4dHJhY3RlZCBmcm9tIHRoZSBTV0MgdHJhbnNmb3JtICovXG4gIG1hbmlmZXN0OiBXb3JrZmxvd01hbmlmZXN0O1xufSk6IFNlcmRlQ2hlY2tSZXN1bHQge1xuICBjb25zdCB7IHNvdXJjZUNvZGUsIHdvcmtmbG93Q29kZSwgbWFuaWZlc3QgfSA9IG9wdGlvbnM7XG5cbiAgLy8gMS4gRXh0cmFjdCBhbGwgTm9kZS5qcyBidWlsdC1pbiBpbXBvcnRzIGZyb20gdGhlIHdvcmtmbG93IG91dHB1dFxuICBjb25zdCBnbG9iYWxOb2RlSW1wb3J0cyA9IGV4dHJhY3ROb2RlSW1wb3J0cyh3b3JrZmxvd0NvZGUpO1xuXG4gIC8vIDIuIENoZWNrIGlmIHRoZSBtYW5pZmVzdCBjb250YWlucyBhbnkgc2VyZGUtcmVnaXN0ZXJlZCBjbGFzc2VzXG4gIGNvbnN0IGNsYXNzRW50cmllcyA9IGV4dHJhY3RDbGFzc0VudHJpZXMobWFuaWZlc3QpO1xuICBjb25zdCBoYXNTZXJkZUNsYXNzZXMgPSBjbGFzc0VudHJpZXMubGVuZ3RoID4gMDtcblxuICAvLyAzLiBDaGVjayBpZiB0aGUgd29ya2Zsb3cgb3V0cHV0IGNvbnRhaW5zIHJlZ2lzdHJhdGlvbiBJSUZFc1xuICBjb25zdCBoYXNSZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25JaWZlUmVnZXgudGVzdCh3b3JrZmxvd0NvZGUpO1xuXG4gIC8vIDQuIEFuYWx5emUgZWFjaCBjbGFzc1xuICBjb25zdCBjbGFzc2VzOiBTZXJkZUNsYXNzQ2hlY2tSZXN1bHRbXSA9IGNsYXNzRW50cmllcy5tYXAoKGVudHJ5KSA9PiB7XG4gICAgY29uc3QgaXNzdWVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8gQ2hlY2sgZm9yIE5vZGUuanMgaW1wb3J0cyAodGhlc2Ugd2lsbCBmYWlsIGluIHRoZSB3b3JrZmxvdyBzYW5kYm94KVxuICAgIGlmIChnbG9iYWxOb2RlSW1wb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYFdvcmtmbG93IGJ1bmRsZSBjb250YWlucyBOb2RlLmpzIGJ1aWx0LWluIGltcG9ydHM6ICR7Z2xvYmFsTm9kZUltcG9ydHMuam9pbignLCAnKX0uIGAgK1xuICAgICAgICAgIGBUaGVzZSB3aWxsIGZhaWwgYXQgcnVudGltZSBpbiB0aGUgd29ya2Zsb3cgc2FuZGJveC4gYCArXG4gICAgICAgICAgYEFkZCBcInVzZSBzdGVwXCIgdG8gbWV0aG9kcyB0aGF0IGRlcGVuZCBvbiBOb2RlLmpzIEFQSXMgc28gdGhleSBhcmUgc3RyaXBwZWQgZnJvbSB0aGUgd29ya2Zsb3cgYnVuZGxlLmBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHJlZ2lzdHJhdGlvblxuICAgIGlmICghaGFzUmVnaXN0cmF0aW9uKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYE5vIGNsYXNzIHJlZ2lzdHJhdGlvbiBJSUZFIHdhcyBnZW5lcmF0ZWQuIGAgK1xuICAgICAgICAgIGBFbnN1cmUgV09SS0ZMT1dfU0VSSUFMSVpFIGFuZCBXT1JLRkxPV19ERVNFUklBTElaRSBhcmUgZGVmaW5lZCBhcyBzdGF0aWMgbWV0aG9kcyBgICtcbiAgICAgICAgICBgaW5zaWRlIHRoZSBjbGFzcyBib2R5IHVzaW5nIGNvbXB1dGVkIHByb3BlcnR5IHN5bnRheDogc3RhdGljIFtXT1JLRkxPV19TRVJJQUxJWkVdKC4uLikgeyAuLi4gfWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzTmFtZTogZW50cnkuY2xhc3NOYW1lLFxuICAgICAgY2xhc3NJZDogZW50cnkuY2xhc3NJZCxcbiAgICAgIGRldGVjdGVkOiB0cnVlLFxuICAgICAgcmVnaXN0ZXJlZDogaGFzUmVnaXN0cmF0aW9uLFxuICAgICAgbm9kZUltcG9ydHM6IGdsb2JhbE5vZGVJbXBvcnRzLFxuICAgICAgY29tcGxpYW50OiBnbG9iYWxOb2RlSW1wb3J0cy5sZW5ndGggPT09IDAgJiYgaGFzUmVnaXN0cmF0aW9uLFxuICAgICAgaXNzdWVzLFxuICAgIH07XG4gIH0pO1xuXG4gIC8vIDUuIENoZWNrIGZvciBjbGFzc2VzIHRoYXQgaGF2ZSBzZXJkZSBwYXR0ZXJucyBpbiBzb3VyY2UgYnV0IHdlcmVuJ3QgZGV0ZWN0ZWQgYnkgU1dDXG4gIGNvbnN0IHNvdXJjZUhhc1NlcmRlUGF0dGVybnMgPVxuICAgIC9cXFtcXHMqV09SS0ZMT1dfKD86U0VSSUFMSVpFfERFU0VSSUFMSVpFKVxccypcXF0vLnRlc3Qoc291cmNlQ29kZSkgfHxcbiAgICAvU3ltYm9sXFwuZm9yXFxzKlxcKFxccypbJ1wiXXdvcmtmbG93LSg/OnNlcmlhbGl6ZXxkZXNlcmlhbGl6ZSlbJ1wiXVxccypcXCkvLnRlc3QoXG4gICAgICBzb3VyY2VDb2RlXG4gICAgKTtcblxuICBpZiAoc291cmNlSGFzU2VyZGVQYXR0ZXJucyAmJiBjbGFzc0VudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY2xhc3Nlcy5wdXNoKHtcbiAgICAgIGNsYXNzTmFtZTogJzx1bmtub3duPicsXG4gICAgICBjbGFzc0lkOiAnJyxcbiAgICAgIGRldGVjdGVkOiBmYWxzZSxcbiAgICAgIHJlZ2lzdGVyZWQ6IGZhbHNlLFxuICAgICAgbm9kZUltcG9ydHM6IGdsb2JhbE5vZGVJbXBvcnRzLFxuICAgICAgY29tcGxpYW50OiBmYWxzZSxcbiAgICAgIGlzc3VlczogW1xuICAgICAgICBgU291cmNlIGNvZGUgY29udGFpbnMgV09SS0ZMT1dfU0VSSUFMSVpFL1dPUktGTE9XX0RFU0VSSUFMSVpFIHBhdHRlcm5zIGJ1dCBgICtcbiAgICAgICAgICBgdGhlIFNXQyBwbHVnaW4gZGlkIG5vdCBkZXRlY3QgYW55IHNlcmRlLWVuYWJsZWQgY2xhc3Nlcy4gYCArXG4gICAgICAgICAgYEVuc3VyZSB0aGUgc3ltYm9scyBhcmUgZGVmaW5lZCBhcyBzdGF0aWMgbWV0aG9kcyBJTlNJREUgdGhlIGNsYXNzIGJvZHksIGAgK1xuICAgICAgICAgIGBub3QgYXNzaWduZWQgZXh0ZXJuYWxseSAoZS5nLiwgKE15Q2xhc3MgYXMgYW55KVtXT1JLRkxPV19TRVJJQUxJWkVdID0gLi4uKS5gLFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY2xhc3NlcyxcbiAgICBnbG9iYWxOb2RlSW1wb3J0cyxcbiAgICBoYXNTZXJkZUNsYXNzZXMsXG4gICAgbWFuaWZlc3QsXG4gIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBOb2RlLmpzIGJ1aWx0LWluIG1vZHVsZSBuYW1lcyBmcm9tIHRyYW5zZm9ybWVkIGNvZGUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3ROb2RlSW1wb3J0cyhjb2RlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGltcG9ydHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgLy8gUmVzZXQgcmVnZXggc3RhdGVcbiAgbm9kZUltcG9ydEV4dHJhY3RSZWdleC5sYXN0SW5kZXggPSAwO1xuICBmb3IgKFxuICAgIGxldCBtYXRjaCA9IG5vZGVJbXBvcnRFeHRyYWN0UmVnZXguZXhlYyhjb2RlKTtcbiAgICBtYXRjaCAhPT0gbnVsbDtcbiAgICBtYXRjaCA9IG5vZGVJbXBvcnRFeHRyYWN0UmVnZXguZXhlYyhjb2RlKVxuICApIHtcbiAgICAvLyBtYXRjaFsxXSBpcyBmcm9tIHRoZSBFU00gcGF0dGVybiwgbWF0Y2hbMl0gaXMgZnJvbSB0aGUgQ0pTIHBhdHRlcm5cbiAgICBjb25zdCBtb2R1bGVOYW1lID0gbWF0Y2hbMV0gfHwgbWF0Y2hbMl07XG4gICAgaWYgKG1vZHVsZU5hbWUpIHtcbiAgICAgIC8vIE5vcm1hbGl6ZSB0byBiYXNlIG1vZHVsZSBuYW1lIChlLmcuLCAnZnMvcHJvbWlzZXMnIC0+ICdmcycpXG4gICAgICBpbXBvcnRzLmFkZChtb2R1bGVOYW1lLnNwbGl0KCcvJylbMF0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gWy4uLmltcG9ydHNdLnNvcnQoKTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGNsYXNzIGVudHJpZXMgZnJvbSBhIFdvcmtmbG93TWFuaWZlc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Q2xhc3NFbnRyaWVzKFxuICBtYW5pZmVzdDogV29ya2Zsb3dNYW5pZmVzdFxuKTogQXJyYXk8eyBjbGFzc05hbWU6IHN0cmluZzsgY2xhc3NJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH0+IHtcbiAgY29uc3QgZW50cmllczogQXJyYXk8e1xuICAgIGNsYXNzTmFtZTogc3RyaW5nO1xuICAgIGNsYXNzSWQ6IHN0cmluZztcbiAgICBmaWxlTmFtZTogc3RyaW5nO1xuICB9PiA9IFtdO1xuICBpZiAoIW1hbmlmZXN0LmNsYXNzZXMpIHJldHVybiBlbnRyaWVzO1xuXG4gIGZvciAoY29uc3QgW2ZpbGVOYW1lLCBjbGFzc2VzXSBvZiBPYmplY3QuZW50cmllcyhtYW5pZmVzdC5jbGFzc2VzKSkge1xuICAgIGZvciAoY29uc3QgW2NsYXNzTmFtZSwgeyBjbGFzc0lkIH1dIG9mIE9iamVjdC5lbnRyaWVzKGNsYXNzZXMpKSB7XG4gICAgICBlbnRyaWVzLnB1c2goeyBjbGFzc05hbWUsIGNsYXNzSWQsIGZpbGVOYW1lIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZW50cmllcztcbn1cbiIsICJpbXBvcnQge1xuICBDb3JydXB0ZWRFdmVudExvZ0Vycm9yLFxuICBFbnRpdHlDb25mbGljdEVycm9yLFxuICBQcmVjb25kaXRpb25GYWlsZWRFcnJvcixcbiAgUmVwbGF5RGl2ZXJnZW5jZUVycm9yLFxuICBSVU5fRVJST1JfQ09ERVMsXG4gIFJ1bkV4cGlyZWRFcnJvcixcbiAgV29ya2Zsb3dSdW50aW1lRXJyb3IsXG59IGZyb20gJ0B3b3JrZmxvdy9lcnJvcnMnO1xuaW1wb3J0IHsgc2V0V29ya2Zsb3dCYXNlUGF0aCB9IGZyb20gJ0B3b3JrZmxvdy91dGlscyc7XG5pbXBvcnQgeyBwYXJzZVdvcmtmbG93TmFtZSB9IGZyb20gJ0B3b3JrZmxvdy91dGlscy9wYXJzZS1uYW1lJztcbmltcG9ydCB7XG4gIHR5cGUgRXZlbnQsXG4gIGdldFF1ZXVlVG9waWNQcmVmaXgsXG4gIHJlc29sdmVRdWV1ZU5hbWVzcGFjZSxcbiAgU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gIFNQRUNfVkVSU0lPTl9MRUdBQ1ksXG4gIFdvcmtmbG93SW52b2tlUGF5bG9hZFNjaGVtYSxcbiAgdHlwZSBXb3JrZmxvd1J1bixcbn0gZnJvbSAnQHdvcmtmbG93L3dvcmxkJztcbmltcG9ydCB7XG4gIGNsYXNzaWZ5UnVuRXJyb3IsXG4gIGlzUmV0cnlhYmxlV29ybGRFcnJvcixcbiAgaXNXb3JsZENvbnRyYWN0RXJyb3IsXG59IGZyb20gJy4vY2xhc3NpZnktZXJyb3IuanMnO1xuaW1wb3J0IHsgaW1wb3J0S2V5IH0gZnJvbSAnLi9lbmNyeXB0aW9uLmpzJztcbmltcG9ydCB7IFdvcmtmbG93U3VzcGVuc2lvbiB9IGZyb20gJy4vZ2xvYmFsLmpzJztcbmltcG9ydCB7IHJ1bnRpbWVMb2dnZXIgfSBmcm9tICcuL2xvZ2dlci5qcyc7XG5pbXBvcnQge1xuICBNQVhfUVVFVUVfREVMSVZFUklFUyxcbiAgUkVQTEFZX0RJVkVSR0VOQ0VfTUFYX1JFVFJJRVMsXG4gIFJFUExBWV9USU1FT1VUX01BWF9SRVRSSUVTLFxuICBSRVBMQVlfVElNRU9VVF9NUyxcbn0gZnJvbSAnLi9ydW50aW1lL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQge1xuICBnZXRRdWV1ZU92ZXJoZWFkLFxuICBnZXRXb3JrZmxvd1F1ZXVlTmFtZSxcbiAgZ2V0V29ya2Zsb3dSdW5FdmVudHMsXG4gIGhhbmRsZUhlYWx0aENoZWNrTWVzc2FnZSxcbiAgdHlwZSBNdXRhYmxlRXZlbnRMb2csXG4gIHBhcnNlSGVhbHRoQ2hlY2tQYXlsb2FkLFxuICBxdWV1ZU1lc3NhZ2UsXG4gIHN0YXRlVXBkYXRlZEF0Rm9yQ3JlYXRlLFxuICB3aXRoSGVhbHRoQ2hlY2ssXG4gIHdpdGhQcmVjb25kaXRpb25SZXRyeSxcbn0gZnJvbSAnLi9ydW50aW1lL2hlbHBlcnMuanMnO1xuaW1wb3J0IHsgaGFuZGxlU3VzcGVuc2lvbiB9IGZyb20gJy4vcnVudGltZS9zdXNwZW5zaW9uLWhhbmRsZXIuanMnO1xuaW1wb3J0IHsgZ2V0V29ybGQsIGdldFdvcmxkSGFuZGxlcnMgfSBmcm9tICcuL3J1bnRpbWUvd29ybGQuanMnO1xuaW1wb3J0IHsgcmVtYXBFcnJvclN0YWNrIH0gZnJvbSAnLi9zb3VyY2UtbWFwLmpzJztcbmltcG9ydCAqIGFzIEF0dHJpYnV0ZSBmcm9tICcuL3RlbGVtZXRyeS9zZW1hbnRpYy1jb252ZW50aW9ucy5qcyc7XG5pbXBvcnQge1xuICBsaW5rVG9DdXJyZW50Q29udGV4dCxcbiAgdHJhY2UsXG4gIHdpdGhUcmFjZUNvbnRleHQsXG4gIHdpdGhXb3JrZmxvd0JhZ2dhZ2UsXG59IGZyb20gJy4vdGVsZW1ldHJ5LmpzJztcbmltcG9ydCB7IGdldEVycm9yTmFtZSwgZ2V0RXJyb3JTdGFjaywgbm9ybWFsaXplVW5rbm93bkVycm9yIH0gZnJvbSAnLi90eXBlcy5qcyc7XG5pbXBvcnQgeyBidWlsZFdvcmtmbG93U3VzcGVuc2lvbk1lc3NhZ2UgfSBmcm9tICcuL3V0aWwuanMnO1xuaW1wb3J0IHsgcnVuV29ya2Zsb3cgfSBmcm9tICcuL3dvcmtmbG93LmpzJztcblxuZXhwb3J0IHR5cGUgeyBFdmVudCwgV29ya2Zsb3dSdW4gfTtcbmV4cG9ydCB7IFdvcmtmbG93U3VzcGVuc2lvbiB9IGZyb20gJy4vZ2xvYmFsLmpzJztcbmV4cG9ydCB7XG4gIHR5cGUgSGVhbHRoQ2hlY2tFbmRwb2ludCxcbiAgdHlwZSBIZWFsdGhDaGVja09wdGlvbnMsXG4gIHR5cGUgSGVhbHRoQ2hlY2tSZXN1bHQsXG4gIGhlYWx0aENoZWNrLFxufSBmcm9tICcuL3J1bnRpbWUvaGVscGVycy5qcyc7XG5leHBvcnQge1xuICBnZXRIb29rQnlUb2tlbixcbiAgcmVzdW1lSG9vayxcbiAgcmVzdW1lV2ViaG9vayxcbn0gZnJvbSAnLi9ydW50aW1lL3Jlc3VtZS1ob29rLmpzJztcbmV4cG9ydCB7XG4gIGdldFJ1bixcbiAgUnVuLFxuICB0eXBlIFdvcmtmbG93UmVhZGFibGVTdHJlYW0sXG4gIHR5cGUgV29ya2Zsb3dSZWFkYWJsZVN0cmVhbU9wdGlvbnMsXG59IGZyb20gJy4vcnVudGltZS9ydW4uanMnO1xuZXhwb3J0IHtcbiAgY2FuY2VsUnVuLFxuICBsaXN0U3RyZWFtcyxcbiAgdHlwZSBSZWFkU3RyZWFtT3B0aW9ucyxcbiAgdHlwZSBSZWNyZWF0ZVJ1bk9wdGlvbnMsXG4gIHJlYWRTdHJlYW0sXG4gIHJlY3JlYXRlUnVuRnJvbUV4aXN0aW5nLFxuICByZWVucXVldWVSdW4sXG4gIHR5cGUgU3RvcFNsZWVwT3B0aW9ucyxcbiAgdHlwZSBTdG9wU2xlZXBSZXN1bHQsXG4gIHdha2VVcFJ1bixcbn0gZnJvbSAnLi9ydW50aW1lL3J1bnMuanMnO1xuZXhwb3J0IHtcbiAgdHlwZSBTdGFydE9wdGlvbnMsXG4gIHR5cGUgU3RhcnRPcHRpb25zQmFzZSxcbiAgdHlwZSBTdGFydE9wdGlvbnNXaXRoRGVwbG95bWVudElkLFxuICB0eXBlIFN0YXJ0T3B0aW9uc1dpdGhvdXREZXBsb3ltZW50SWQsXG4gIHN0YXJ0LFxufSBmcm9tICcuL3J1bnRpbWUvc3RhcnQuanMnO1xuZXhwb3J0IHsgc3RlcEVudHJ5cG9pbnQgfSBmcm9tICcuL3J1bnRpbWUvc3RlcC1oYW5kbGVyLmpzJztcbmV4cG9ydCB7XG4gIGNyZWF0ZVdvcmxkLFxuICBnZXRXb3JsZCxcbiAgZ2V0V29ybGRIYW5kbGVycyxcbiAgc2V0V29ybGQsXG59IGZyb20gJy4vcnVudGltZS93b3JsZC5qcyc7XG5cbmZ1bmN0aW9uIGhhc1JlY29yZGVkVGVybWluYWxSdW5FdmVudChldmVudHM6IEV2ZW50W10sIHJ1bklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgdGVybWluYWxFdmVudCA9IGV2ZW50cy5maW5kKFxuICAgIChldmVudCkgPT5cbiAgICAgIGV2ZW50LnJ1bklkID09PSBydW5JZCAmJlxuICAgICAgKGV2ZW50LmV2ZW50VHlwZSA9PT0gJ3J1bl9jb21wbGV0ZWQnIHx8XG4gICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9PT0gJ3J1bl9mYWlsZWQnIHx8XG4gICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9PT0gJ3J1bl9jYW5jZWxsZWQnKVxuICApO1xuXG4gIGlmICghdGVybWluYWxFdmVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJ1bnRpbWVMb2dnZXIuaW5mbyhcbiAgICAnV29ya2Zsb3cgZXZlbnQgbG9nIGFscmVhZHkgY29udGFpbnMgYSB0ZXJtaW5hbCBydW4gZXZlbnQsIHNraXBwaW5nIHJlcGxheScsXG4gICAge1xuICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICBldmVudFR5cGU6IHRlcm1pbmFsRXZlbnQuZXZlbnRUeXBlLFxuICAgICAgZXZlbnRJZDogdGVybWluYWxFdmVudC5ldmVudElkLFxuICAgIH1cbiAgKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdGhhdCBjcmVhdGVzIGEgc2luZ2xlIHJvdXRlIHdoaWNoIGhhbmRsZXMgYW55IHdvcmtmbG93IGV4ZWN1dGlvblxuICogcmVxdWVzdCBhbmQgcm91dGVzIHRvIHRoZSBhcHByb3ByaWF0ZSB3b3JrZmxvdyBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gd29ya2Zsb3dDb2RlIC0gVGhlIHdvcmtmbG93IGJ1bmRsZSBjb2RlIGNvbnRhaW5pbmcgYWxsIHRoZSB3b3JrZmxvd1xuICogZnVuY3Rpb25zIGF0IHRoZSB0b3AgbGV2ZWwuXG4gKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgYXMgYSBWZXJjZWwgQVBJIHJvdXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd29ya2Zsb3dFbnRyeXBvaW50KFxuICB3b3JrZmxvd0NvZGU6IHN0cmluZyxcbiAgb3B0aW9ucz86IHsgbmFtZXNwYWNlPzogc3RyaW5nOyBiYXNlUGF0aD86IHN0cmluZyB9XG4pOiAocmVxOiBSZXF1ZXN0KSA9PiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIHNldFdvcmtmbG93QmFzZVBhdGgob3B0aW9ucz8uYmFzZVBhdGgpO1xuXG4gIGNvbnN0IG5hbWVzcGFjZSA9IHJlc29sdmVRdWV1ZU5hbWVzcGFjZShvcHRpb25zPy5uYW1lc3BhY2UpO1xuICBjb25zdCB3b3JrZmxvd1ByZWZpeCA9IGdldFF1ZXVlVG9waWNQcmVmaXgoJ3dvcmtmbG93JywgbmFtZXNwYWNlKTtcblxuICBjb25zdCB7IGNyZWF0ZVF1ZXVlSGFuZGxlciwgc3BlY1ZlcnNpb246IHdvcmxkU3BlY1ZlcnNpb24gfSA9XG4gICAgZ2V0V29ybGRIYW5kbGVycygpO1xuICBjb25zdCBoYW5kbGVyID0gY3JlYXRlUXVldWVIYW5kbGVyKFxuICAgIHdvcmtmbG93UHJlZml4LFxuICAgIGFzeW5jIChtZXNzYWdlXywgbWV0YWRhdGEpID0+IHtcbiAgICAgIC8vIENoZWNrIGlmIHRoaXMgaXMgYSBoZWFsdGggY2hlY2sgbWVzc2FnZVxuICAgICAgLy8gTk9URTogSGVhbHRoIGNoZWNrIG1lc3NhZ2VzIGFyZSBpbnRlbnRpb25hbGx5IHVuYXV0aGVudGljYXRlZCBmb3IgbW9uaXRvcmluZyBwdXJwb3Nlcy5cbiAgICAgIC8vIFRoZXkgb25seSB3cml0ZSBhIHNpbXBsZSBzdGF0dXMgcmVzcG9uc2UgdG8gYSBzdHJlYW0gYW5kIGRvIG5vdCBleHBvc2Ugc2Vuc2l0aXZlIGRhdGEuXG4gICAgICAvLyBUaGUgc3RyZWFtIG5hbWUgaW5jbHVkZXMgYSB1bmlxdWUgY29ycmVsYXRpb25JZCB0aGF0IG11c3QgYmUga25vd24gYnkgdGhlIGNhbGxlci5cbiAgICAgIGNvbnN0IGhlYWx0aENoZWNrID0gcGFyc2VIZWFsdGhDaGVja1BheWxvYWQobWVzc2FnZV8pO1xuICAgICAgaWYgKGhlYWx0aENoZWNrKSB7XG4gICAgICAgIGF3YWl0IGhhbmRsZUhlYWx0aENoZWNrTWVzc2FnZShcbiAgICAgICAgICBoZWFsdGhDaGVjayxcbiAgICAgICAgICAnd29ya2Zsb3cnLFxuICAgICAgICAgIHdvcmxkU3BlY1ZlcnNpb25cbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7XG4gICAgICAgIHJ1bklkLFxuICAgICAgICB0cmFjZUNhcnJpZXI6IHRyYWNlQ29udGV4dCxcbiAgICAgICAgcmVxdWVzdGVkQXQsXG4gICAgICAgIHJlcGxheURpdmVyZ2VuY2UsXG4gICAgICAgIHJ1bklucHV0LFxuICAgICAgfSA9IFdvcmtmbG93SW52b2tlUGF5bG9hZFNjaGVtYS5wYXJzZShtZXNzYWdlXyk7XG4gICAgICBjb25zdCB7IHJlcXVlc3RJZCB9ID0gbWV0YWRhdGE7XG4gICAgICAvLyBFeHRyYWN0IHRoZSB3b3JrZmxvdyBuYW1lIGZyb20gdGhlIHRvcGljIG5hbWVcbiAgICAgIGNvbnN0IHdvcmtmbG93TmFtZSA9IG1ldGFkYXRhLnF1ZXVlTmFtZS5zbGljZSh3b3JrZmxvd1ByZWZpeC5sZW5ndGgpO1xuXG4gICAgICAvLyAtLS0gTWF4IGRlbGl2ZXJ5IGNoZWNrIC0tLVxuICAgICAgLy8gRW5mb3JjZSBtYXggZGVsaXZlcnkgbGltaXQgYmVmb3JlIGFueSBpbmZyYXN0cnVjdHVyZSBjYWxscy5cbiAgICAgIC8vIFRoaXMgcHJldmVudHMgcnVuYXdheSB3b3JrZmxvd3MgZnJvbSBjb25zdW1pbmcgaW5maW5pdGUgcXVldWUgZGVsaXZlcmllcy5cbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIHdhbnQgdG8gZG8gdGhlIG1pbmltYWwgYW1vdW50IG9mIHdvcmsgKG5vIGZldGNoaW5nXG4gICAgICAvLyBvZiB0aGUgd29ya2Zsb3cgZXZlbnRzLCBldGMuIFdlIHNpbXBseSBhdHRlbXB0IHRvIG1hcmsgdGhlIHJ1biBhcyBmYWlsZWRcbiAgICAgIC8vIGFuZCBpZiB0aGF0IGZhaWxzLCB0aGUgbWVzc2FnZSBpcyBzdGlsbCBjb25zdW1lZCBidXQgd2l0aCBhZGVxdWF0ZSBsb2dnaW5nXG4gICAgICAvLyB0aGF0IGFuIGVycm9yIG9jY3VycmVkIHByZXZlbnRpbmcgdXMgZnJvbSBmYWlsaW5nIHRoZSBydW4uXG4gICAgICBpZiAobWV0YWRhdGEuYXR0ZW1wdCA+IE1BWF9RVUVVRV9ERUxJVkVSSUVTKSB7XG4gICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgYFdvcmtmbG93IGhhbmRsZXIgZXhjZWVkZWQgbWF4IGRlbGl2ZXJpZXMgKCR7bWV0YWRhdGEuYXR0ZW1wdH0vJHtNQVhfUVVFVUVfREVMSVZFUklFU30pYCxcbiAgICAgICAgICB7IHdvcmtmbG93UnVuSWQ6IHJ1bklkLCB3b3JrZmxvd05hbWUsIGF0dGVtcHQ6IG1ldGFkYXRhLmF0dGVtcHQgfVxuICAgICAgICApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHdvcmxkID0gZ2V0V29ybGQoKTtcbiAgICAgICAgICBhd2FpdCB3b3JsZC5ldmVudHMuY3JlYXRlKFxuICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGV2ZW50VHlwZTogJ3J1bl9mYWlsZWQnLFxuICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgV29ya2Zsb3cgZXhjZWVkZWQgbWF4aW11bSBxdWV1ZSBkZWxpdmVyaWVzICgke21ldGFkYXRhLmF0dGVtcHR9LyR7TUFYX1FVRVVFX0RFTElWRVJJRVN9KWAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5NQVhfREVMSVZFUklFU19FWENFRURFRCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgaWYgKEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZXJyKSB8fCBSdW5FeHBpcmVkRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICAgICAgLy8gUnVuIGFscmVhZHkgZmluaXNoZWQsIGNvbnN1bWUgdGhlIG1lc3NhZ2Ugc2lsZW50bHlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcnVudGltZUxvZ2dlci5lcnJvcihcbiAgICAgICAgICAgIGBGYWlsZWQgdG8gbWFyayBydW4gYXMgZmFpbGVkIGFmdGVyICR7bWV0YWRhdGEuYXR0ZW1wdH0gZGVsaXZlcnkgYXR0ZW1wdHMuIGAgK1xuICAgICAgICAgICAgICBgQSBwZXJzaXN0ZW50IGVycm9yIGlzIHByZXZlbnRpbmcgdGhlIHJ1biBmcm9tIGJlaW5nIHRlcm1pbmF0ZWQuIGAgK1xuICAgICAgICAgICAgICBgVGhlIHJ1biB3aWxsIHJlbWFpbiBpbiBpdHMgY3VycmVudCBzdGF0ZSB1bnRpbCBtYW51YWxseSByZXNvbHZlZC4gYCArXG4gICAgICAgICAgICAgIGBUaGlzIGlzIG1vc3QgbGlrZWx5IGR1ZSB0byBhIHBlcnNpc3RlbnQgb3V0YWdlIG9mIHRoZSB3b3JrZmxvdyBiYWNrZW5kIGAgK1xuICAgICAgICAgICAgICBgb3IgYSBidWcgaW4gdGhlIHdvcmtmbG93IHJ1bnRpbWUgYW5kIHNob3VsZCBiZSByZXBvcnRlZCB0byB0aGUgV29ya2Zsb3cgdGVhbS5gLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgZXJyb3I6IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKSxcbiAgICAgICAgICAgICAgYXR0ZW1wdDogbWV0YWRhdGEuYXR0ZW1wdCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3BhbkxpbmtzID0gYXdhaXQgbGlua1RvQ3VycmVudENvbnRleHQoKTtcblxuICAgICAgLy8gLS0tIFJlcGxheSB0aW1lb3V0IGd1YXJkIC0tLVxuICAgICAgLy8gSWYgdGhlIHJlcGxheSB0YWtlcyBsb25nZXIgdGhhbiB0aGUgdGltZW91dCwgZmFpbCB0aGUgcnVuIGFuZCBleGl0LlxuICAgICAgLy8gVGhpcyBtdXN0IGJlIGxvd2VyIHRoYW4gdGhlIGZ1bmN0aW9uJ3MgbWF4RHVyYXRpb24gdG8gZW5zdXJlXG4gICAgICAvLyB0aGUgZmFpbHVyZSBpcyByZWNvcmRlZCBiZWZvcmUgdGhlIHBsYXRmb3JtIGtpbGxzIHRoZSBmdW5jdGlvbi5cbiAgICAgIGxldCByZXBsYXlUaW1lb3V0OiBOb2RlSlMuVGltZW91dCB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChwcm9jZXNzLmVudi5WRVJDRUxfVVJMICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmVwbGF5VGltZW91dCA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoJ1dvcmtmbG93IHJlcGxheSBleGNlZWRlZCB0aW1lb3V0Jywge1xuICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICB0aW1lb3V0TXM6IFJFUExBWV9USU1FT1VUX01TLFxuICAgICAgICAgICAgYXR0ZW1wdDogbWV0YWRhdGEuYXR0ZW1wdCxcbiAgICAgICAgICAgIG1heFJldHJpZXM6IFJFUExBWV9USU1FT1VUX01BWF9SRVRSSUVTLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gQWxsb3cgYSBmZXcgcmV0cmllcyBiZWZvcmUgcGVybWFuZW50bHkgZmFpbGluZyB0aGUgcnVuLlxuICAgICAgICAgIC8vIE9uIGVhcmx5IGF0dGVtcHRzLCBqdXN0IGV4aXQgc28gdGhlIHF1ZXVlIHJldHJpZXMgdGhlIG1lc3NhZ2UuXG4gICAgICAgICAgaWYgKG1ldGFkYXRhLmF0dGVtcHQgPD0gUkVQTEFZX1RJTUVPVVRfTUFYX1JFVFJJRVMpIHtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgd29ybGQgPSBhd2FpdCBnZXRXb3JsZCgpO1xuICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgZXZlbnREYXRhOiB7XG4gICAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgV29ya2Zsb3cgcmVwbGF5IGV4Y2VlZGVkIG1heGltdW0gZHVyYXRpb24gKCR7UkVQTEFZX1RJTUVPVVRfTVMgLyAxMDAwfXMpIGFmdGVyICR7bWV0YWRhdGEuYXR0ZW1wdH0gYXR0ZW1wdHNgLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGVycm9yQ29kZTogUlVOX0VSUk9SX0NPREVTLlJFUExBWV9USU1FT1VULFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHsgcmVxdWVzdElkIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBCZXN0IGVmZm9ydCDigJQgcHJvY2VzcyBleGl0cyByZWdhcmRsZXNzXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIE5vdGUgdGhhdCB0aGlzIGFsc28gcHJldmVudHMgdGhlIHJ1bnRpbWUgZnJvbSBhY2tpbmcgdGhlIHF1ZXVlIG1lc3NhZ2UsXG4gICAgICAgICAgLy8gc28gdGhlIHF1ZXVlIHdpbGwgY2FsbCBiYWNrIG9uY2UsIGFmdGVyIHdoaWNoIGEgNDEwIHdpbGwgZ2V0IGl0IHRvIGV4aXQgZWFybHkuXG4gICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9LCBSRVBMQVlfVElNRU9VVF9NUyk7XG4gICAgICAgIHJlcGxheVRpbWVvdXQudW5yZWYoKTtcbiAgICAgIH1cblxuICAgICAgLy8gSW52b2tlIHVzZXIgd29ya2Zsb3cgd2l0aGluIHRoZSBwcm9wYWdhdGVkIHRyYWNlIGNvbnRleHQgYW5kIGJhZ2dhZ2VcbiAgICAgIHJldHVybiBhd2FpdCB3aXRoVHJhY2VDb250ZXh0KHRyYWNlQ29udGV4dCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAvLyBTZXQgd29ya2Zsb3cgY29udGV4dCBhcyBiYWdnYWdlIGZvciBhdXRvbWF0aWMgcHJvcGFnYXRpb25cbiAgICAgICAgcmV0dXJuIGF3YWl0IHdpdGhXb3JrZmxvd0JhZ2dhZ2UoXG4gICAgICAgICAgeyB3b3JrZmxvd1J1bklkOiBydW5JZCwgd29ya2Zsb3dOYW1lIH0sXG4gICAgICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgd29ybGQgPSBnZXRXb3JsZCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRyYWNlKFxuICAgICAgICAgICAgICBgV09SS0ZMT1cgJHt3b3JrZmxvd05hbWV9YCxcbiAgICAgICAgICAgICAgeyBsaW5rczogc3BhbkxpbmtzIH0sXG4gICAgICAgICAgICAgIGFzeW5jIChzcGFuKSA9PiB7XG4gICAgICAgICAgICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dOYW1lKHdvcmtmbG93TmFtZSksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dPcGVyYXRpb24oJ2V4ZWN1dGUnKSxcbiAgICAgICAgICAgICAgICAgIC8vIFN0YW5kYXJkIE9URUwgbWVzc2FnaW5nIGNvbnZlbnRpb25zXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuTWVzc2FnaW5nU3lzdGVtKCd2ZXJjZWwtcXVldWUnKSxcbiAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5NZXNzYWdpbmdEZXN0aW5hdGlvbk5hbWUobWV0YWRhdGEucXVldWVOYW1lKSxcbiAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5NZXNzYWdpbmdNZXNzYWdlSWQobWV0YWRhdGEubWVzc2FnZUlkKSxcbiAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5NZXNzYWdpbmdPcGVyYXRpb25UeXBlKCdwcm9jZXNzJyksXG4gICAgICAgICAgICAgICAgICAuLi5nZXRRdWV1ZU92ZXJoZWFkKHsgcmVxdWVzdGVkQXQgfSksXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiB2YWxpZGF0ZSBgd29ya2Zsb3dOYW1lYCBleGlzdHMgYmVmb3JlIGNvbnN1bWluZyBtZXNzYWdlP1xuXG4gICAgICAgICAgICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5JZChydW5JZCksXG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dUcmFjZVByb3BhZ2F0ZWQoISF0cmFjZUNvbnRleHQpLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgbGV0IHdvcmtmbG93U3RhcnRlZEF0ID0gLTE7XG4gICAgICAgICAgICAgICAgbGV0IHdvcmtmbG93UnVuOiBXb3JrZmxvd1J1biB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAvLyBQcmUtbG9hZGVkIGV2ZW50cyBmcm9tIHRoZSBydW5fc3RhcnRlZCByZXNwb25zZS5cbiAgICAgICAgICAgICAgICAvLyBXaGVuIHByZXNlbnQsIHdlIHNraXAgdGhlIGV2ZW50cy5saXN0IGNhbGwuXG4gICAgICAgICAgICAgICAgbGV0IHByZWxvYWRlZEV2ZW50czogRXZlbnRbXSB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBsZXQgcHJlbG9hZGVkRXZlbnRzQ3Vyc29yOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIEluZnJhc3RydWN0dXJlOiBwcmVwYXJlIHRoZSBydW4gc3RhdGUgLS0tXG4gICAgICAgICAgICAgICAgLy8gQWx3YXlzIGNhbGwgcnVuX3N0YXJ0ZWQgZGlyZWN0bHkg4oCUIHRoaXMgYm90aCB0cmFuc2l0aW9uc1xuICAgICAgICAgICAgICAgIC8vIHRoZSBydW4gdG8gJ3J1bm5pbmcnIEFORCByZXR1cm5zIHRoZSBydW4gZW50aXR5LCBzYXZpbmdcbiAgICAgICAgICAgICAgICAvLyBhIHNlcGFyYXRlIHJ1bnMuZ2V0IHJvdW5kLXRyaXAuXG4gICAgICAgICAgICAgICAgLy8gQ29udHJhY3Q6IGV2ZW50cy5jcmVhdGUoJ3J1bl9zdGFydGVkJykgbXVzdCBiZSBpZGVtcG90ZW50XG4gICAgICAgICAgICAgICAgLy8gZm9yIHJ1bnMgYWxyZWFkeSBpbiAncnVubmluZycgc3RhdHVzIChyZXR1cm4gdGhlIHJ1blxuICAgICAgICAgICAgICAgIC8vIHdpdGhvdXQgZXJyb3IpLCBub3QganVzdCBmb3IgcGVuZGluZyDihpIgcnVubmluZyB0cmFuc2l0aW9ucy5cbiAgICAgICAgICAgICAgICAvLyBOZXR3b3JrL3NlcnZlciBlcnJvcnMgcHJvcGFnYXRlIHRvIHRoZSBxdWV1ZSBoYW5kbGVyIGZvciByZXRyeS5cbiAgICAgICAgICAgICAgICAvLyBXb3JrZmxvd1J1bnRpbWVFcnJvciAoZGF0YSBpbnRlZ3JpdHkgaXNzdWVzKSBhcmUgZmF0YWwgYW5kXG4gICAgICAgICAgICAgICAgLy8gcHJvZHVjZSBydW5fZmFpbGVkIHNpbmNlIHJldHJ5aW5nIHdvbid0IGZpeCB0aGVtLlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3b3JsZC5ldmVudHMuY3JlYXRlKFxuICAgICAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogJ3J1bl9zdGFydGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIHNwZWMgdmVyc2lvbiBmcm9tIHRoZSBvcmlnaW5hbCBzdGFydCgpIGNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAvLyB3aGVuIGF2YWlsYWJsZSwgc28gdGhlIHJlc2lsaWVudCBzdGFydCBwYXRoIGNyZWF0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcnVuIHdpdGggdGhlIGNvcnJlY3QgdmVyc2lvbiAobm90IGFsd2F5cyBjdXJyZW50KS5cbiAgICAgICAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bklucHV0Py5zcGVjVmVyc2lvbiA/PyBTUEVDX1ZFUlNJT05fQ1VSUkVOVCxcbiAgICAgICAgICAgICAgICAgICAgICAvLyBQYXNzIHJ1biBpbnB1dCBmcm9tIHF1ZXVlIHNvIHRoZSBzZXJ2ZXIgY2FuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIHRoZSBydW4gaWYgcnVuX2NyZWF0ZWQgd2FzIG1pc3NlZC5cbiAgICAgICAgICAgICAgICAgICAgICAvLyBVaW50OEFycmF5IHZhbHVlcyBzdXJ2aXZlIHRoZSBxdWV1ZSBuYXRpdmVseVxuICAgICAgICAgICAgICAgICAgICAgIC8vIChDQk9SIG9uIHdvcmxkLXZlcmNlbCwgSlNPTiByZXZpdmVyIG9uIHdvcmxkLWxvY2FsKS5cbiAgICAgICAgICAgICAgICAgICAgICAuLi4ocnVuSW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6IHJ1bklucHV0LmlucHV0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwbG95bWVudElkOiBydW5JbnB1dC5kZXBsb3ltZW50SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd05hbWU6IHJ1bklucHV0LndvcmtmbG93TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGlvbkNvbnRleHQ6IHJ1bklucHV0LmV4ZWN1dGlvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgOiB7fSksXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgcmVxdWVzdElkIH1cbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5ydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgIGBFdmVudCBjcmVhdGlvbiBmb3IgJ3J1bl9zdGFydGVkJyBkaWQgbm90IHJldHVybiB0aGUgcnVuIGVudGl0eSBmb3IgcnVuIFwiJHtydW5JZH1cImBcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuID0gcmVzdWx0LnJ1bjtcblxuICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHJlc3BvbnNlIGluY2x1ZGVzIGV2ZW50cywgdXNlIHRoZW0gdG8gc2tpcFxuICAgICAgICAgICAgICAgICAgLy8gdGhlIGluaXRpYWwgZXZlbnRzLmxpc3QgY2FsbCBhbmQgcmVkdWNlIFRURkIuXG4gICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ldmVudHMgJiZcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmV2ZW50cy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5oYXNNb3JlICE9PSB0cnVlXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlbG9hZGVkRXZlbnRzID0gcmVzdWx0LmV2ZW50cztcbiAgICAgICAgICAgICAgICAgICAgcHJlbG9hZGVkRXZlbnRzQ3Vyc29yID0gcmVzdWx0LmN1cnNvcjtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKCF3b3JrZmxvd1J1bi5zdGFydGVkQXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgIGBXb3JrZmxvdyBydW4gXCIke3J1bklkfVwiIGhhcyBubyBcInN0YXJ0ZWRBdFwiIHRpbWVzdGFtcGBcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFJ1biB3YXMgY29uY3VycmVudGx5IGNvbXBsZXRlZC9mYWlsZWQvY2FuY2VsbGVkXG4gICAgICAgICAgICAgICAgICBpZiAoRW50aXR5Q29uZmxpY3RFcnJvci5pcyhlcnIpIHx8IFJ1bkV4cGlyZWRFcnJvci5pcyhlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVudGl0eUNvbmZsaWN0RXJyb3I6IHJ1biB3YXMgY29uY3VycmVudGx5XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbXBsZXRlZC9mYWlsZWQvY2FuY2VsbGVkIGR1cmluZyBzZXR1cC5cbiAgICAgICAgICAgICAgICAgICAgLy8gUnVuRXhwaXJlZEVycm9yOiBydW4gYWxyZWFkeSBpbiB0ZXJtaW5hbCBzdGF0ZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gYm90aCBjYXNlcywgc2tpcCBwcm9jZXNzaW5nIHRoaXMgbWVzc2FnZS5cbiAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5pbmZvKFxuICAgICAgICAgICAgICAgICAgICAgICdSdW4gYWxyZWFkeSBmaW5pc2hlZCBkdXJpbmcgc2V0dXAsIHNraXBwaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICB7IHdvcmtmbG93UnVuSWQ6IHJ1bklkLCBtZXNzYWdlOiBlcnIubWVzc2FnZSB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgV29ya2Zsb3dSdW50aW1lRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgcnVudGltZSBlcnJvciBkdXJpbmcgd29ya2Zsb3cgc2V0dXAnLFxuICAgICAgICAgICAgICAgICAgICAgIHsgd29ya2Zsb3dSdW5JZDogcnVuSWQsIGVycm9yOiBlcnIubWVzc2FnZSB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246IFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjazogZXJyLnN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuUlVOVElNRV9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZmFpbEVycikge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZmFpbEVycikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJ1bkV4cGlyZWRFcnJvci5pcyhmYWlsRXJyKVxuICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNXb3JsZENvbnRyYWN0RXJyb3IoZmFpbEVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdGYXRhbCB3b3JsZCBjb250cmFjdCBlcnJvciB3aGlsZSByZWNvcmRpbmcgd29ya2Zsb3cgZmFpbHVyZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxFcnIgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGZhaWxFcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFN0cmluZyhmYWlsRXJyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZmFpbEVycjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzV29ybGRDb250cmFjdEVycm9yKGVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAnRmF0YWwgd29ybGQgY29udHJhY3QgZXJyb3IgZHVyaW5nIHdvcmtmbG93IHNldHVwJyxcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZTogUlVOX0VSUk9SX0NPREVTLldPUkxEX0NPTlRSQUNUX0VSUk9SLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB3b3JsZC5ldmVudHMuY3JlYXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogJ3J1bl9mYWlsZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrOiBlcnIuc3RhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZmFpbEVycikge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZmFpbEVycikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJ1bkV4cGlyZWRFcnJvci5pcyhmYWlsRXJyKVxuICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNXb3JsZENvbnRyYWN0RXJyb3IoZmFpbEVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdGYXRhbCB3b3JsZCBjb250cmFjdCBlcnJvciB3aGlsZSByZWNvcmRpbmcgd29ya2Zsb3cgZmFpbHVyZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxFcnIgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGZhaWxFcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFN0cmluZyhmYWlsRXJyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZmFpbEVycjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd29ya2Zsb3dTdGFydGVkQXQgPSArd29ya2Zsb3dSdW4uc3RhcnRlZEF0O1xuXG4gICAgICAgICAgICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5TdGF0dXMod29ya2Zsb3dSdW4uc3RhdHVzKSxcbiAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd1N0YXJ0ZWRBdCh3b3JrZmxvd1N0YXJ0ZWRBdCksXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAod29ya2Zsb3dSdW4uc3RhdHVzICE9PSAncnVubmluZycpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFdvcmtmbG93IGhhcyBhbHJlYWR5IGNvbXBsZXRlZCBvciBmYWlsZWQsIHNvIHdlIGNhbiBza2lwIGl0XG4gICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAgICAgICAgICdXb3JrZmxvdyBhbHJlYWR5IGNvbXBsZXRlZCBvciBmYWlsZWQsIHNraXBwaW5nJyxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogd29ya2Zsb3dSdW4uc3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAvLyBUT0RPOiBmb3IgYGNhbmNlbGAsIHdlIGFjdHVhbGx5IHdhbnQgdG8gcHJvcGFnYXRlIGEgV29ya2Zsb3dDYW5jZWxsZWQgZXZlbnRcbiAgICAgICAgICAgICAgICAgIC8vIGluc2lkZSB0aGUgd29ya2Zsb3cgY29udGV4dCBzbyB0aGUgdXNlciBjYW4gZ3JhY2VmdWxseSBleGl0LiB0aGlzIGlzIFNJR1RFUk1cbiAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGZ1cnRoZXJtb3JlLCB0aGVyZSBzaG91bGQgYmUgYSB0aW1lb3V0IG9yIGEgd2F5IHRvIGZvcmNlIGNhbmNlbCBTSUdLSUxMXG4gICAgICAgICAgICAgICAgICAvLyBzbyB0aGF0IHdlIGFjdHVhbGx5IGV4aXQgaGVyZSB3aXRob3V0IHJlcGxheWluZyB0aGUgd29ya2Zsb3cgYXQgYWxsLCBpbiB0aGUgY2FzZVxuICAgICAgICAgICAgICAgICAgLy8gdGhlIHJlcGxheWluZyB0aGUgd29ya2Zsb3cgaXMgaXRzZWxmIGZhaWxpbmcuXG5cbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBMb2FkIGFsbCBldmVudHMgaW50byBtZW1vcnkgYmVmb3JlIHJ1bm5pbmcuXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgZ290IHByZS1sb2FkZWQgZXZlbnRzIGZyb20gdGhlIHJ1bl9zdGFydGVkIHJlc3BvbnNlLFxuICAgICAgICAgICAgICAgIC8vIHNraXAgdGhlIGV2ZW50cy5saXN0IHJvdW5kLXRyaXAgdG8gcmVkdWNlIFRURkIuXG4gICAgICAgICAgICAgICAgbGV0IGV2ZW50czogRXZlbnRbXTtcbiAgICAgICAgICAgICAgICBsZXQgZXZlbnRzQ3Vyc29yOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBpZiAocHJlbG9hZGVkRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cyA9IHByZWxvYWRlZEV2ZW50cztcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzQ3Vyc29yID0gcHJlbG9hZGVkRXZlbnRzQ3Vyc29yO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZGVkRXZlbnRzID0gYXdhaXQgZ2V0V29ya2Zsb3dSdW5FdmVudHMoXG4gICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWRcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzID0gbG9hZGVkRXZlbnRzLmV2ZW50cztcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzQ3Vyc29yID0gbG9hZGVkRXZlbnRzLmN1cnNvcjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpc1dvcmxkQ29udHJhY3RFcnJvcihlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgJ0ZhdGFsIHdvcmxkIGNvbnRyYWN0IGVycm9yIHdoaWxlIGxvYWRpbmcgd29ya2Zsb3cgZXZlbnRzJyxcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZTogUlVOX0VSUk9SX0NPREVTLldPUkxEX0NPTlRSQUNUX0VSUk9SLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB3b3JsZC5ldmVudHMuY3JlYXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogJ3J1bl9mYWlsZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrOiBlcnIuc3RhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHJlcXVlc3RJZCB9XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZmFpbEVycikge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZmFpbEVycikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJ1bkV4cGlyZWRFcnJvci5pcyhmYWlsRXJyKVxuICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNXb3JsZENvbnRyYWN0RXJyb3IoZmFpbEVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdGYXRhbCB3b3JsZCBjb250cmFjdCBlcnJvciB3aGlsZSByZWNvcmRpbmcgd29ya2Zsb3cgZmFpbHVyZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxFcnIgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGZhaWxFcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFN0cmluZyhmYWlsRXJyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZmFpbEVycjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIG1hdGVyaWFsaXplZCBydW4gcmV0dXJuZWQgYnkgcnVuX3N0YXJ0ZWQgY2FuIHJhY2UgYVxuICAgICAgICAgICAgICAgIC8vIHRlcm1pbmFsIGV2ZW50IGluIHRoZSBsb2FkZWQgc25hcHNob3QuIERvIG5vdCByZXBsYXkgYSBydW5cbiAgICAgICAgICAgICAgICAvLyB3aG9zZSBldmVudCBsb2cgYWxyZWFkeSBlc3RhYmxpc2hlcyBpdHMgdGVybWluYWwgb3V0Y29tZS5cbiAgICAgICAgICAgICAgICBpZiAoaGFzUmVjb3JkZWRUZXJtaW5hbFJ1bkV2ZW50KGV2ZW50cywgcnVuSWQpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGFueSBlbGFwc2VkIHdhaXRzIGFuZCBjcmVhdGUgd2FpdF9jb21wbGV0ZWQgZXZlbnRzXG4gICAgICAgICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblxuICAgICAgICAgICAgICAgIC8vIFByZS1jb21wdXRlIGNvbXBsZXRlZCBjb3JyZWxhdGlvbiBJRHMgZm9yIE8obikgbG9va3VwIGluc3RlYWQgb2YgTyhuwrIpXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcGxldGVkV2FpdElkcyA9IG5ldyBTZXQoXG4gICAgICAgICAgICAgICAgICBldmVudHNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoZSkgPT4gZS5ldmVudFR5cGUgPT09ICd3YWl0X2NvbXBsZXRlZCcpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGUpID0+IGUuY29ycmVsYXRpb25JZClcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgLy8gQ29sbGVjdCBhbGwgd2FpdHMgdGhhdCBuZWVkIGNvbXBsZXRpb25cbiAgICAgICAgICAgICAgICBjb25zdCB3YWl0c1RvQ29tcGxldGUgPSBldmVudHNcbiAgICAgICAgICAgICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgICBlXG4gICAgICAgICAgICAgICAgICAgICk6IGUgaXMgRXh0cmFjdDxFdmVudCwgeyBldmVudFR5cGU6ICd3YWl0X2NyZWF0ZWQnIH0+ICYge1xuICAgICAgICAgICAgICAgICAgICAgIGNvcnJlbGF0aW9uSWQ6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgfSA9PlxuICAgICAgICAgICAgICAgICAgICAgIGUuZXZlbnRUeXBlID09PSAnd2FpdF9jcmVhdGVkJyAmJlxuICAgICAgICAgICAgICAgICAgICAgIGUuY29ycmVsYXRpb25JZCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgICAgICAgIWNvbXBsZXRlZFdhaXRJZHMuaGFzKGUuY29ycmVsYXRpb25JZCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICBub3cgPj0gKGUuZXZlbnREYXRhLnJlc3VtZUF0IGFzIERhdGUpLmdldFRpbWUoKVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgLm1hcCgoZSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiAnd2FpdF9jb21wbGV0ZWQnIGFzIGNvbnN0LFxuICAgICAgICAgICAgICAgICAgICBzcGVjVmVyc2lvbjogU1BFQ19WRVJTSU9OX0NVUlJFTlQsXG4gICAgICAgICAgICAgICAgICAgIGNvcnJlbGF0aW9uSWQ6IGUuY29ycmVsYXRpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnREYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVzdW1lQXQ6IGUuZXZlbnREYXRhLnJlc3VtZUF0LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFsbCB3YWl0X2NvbXBsZXRlZCBldmVudHNcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHdhaXRFdmVudCBvZiB3YWl0c1RvQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHdhaXRMb2c6IE11dGFibGVFdmVudExvZyA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLFxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6IGV2ZW50c0N1cnNvciA/PyBudWxsLFxuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHdpdGhQcmVjb25kaXRpb25SZXRyeShcbiAgICAgICAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICB3YWl0TG9nLFxuICAgICAgICAgICAgICAgICAgICAgIChzdGF0ZVVwZGF0ZWRBdCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmxkLmV2ZW50cy5jcmVhdGUocnVuSWQsIHdhaXRFdmVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlVXBkYXRlZEF0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoRW50aXR5Q29uZmxpY3RFcnJvci5pcyhlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5pbmZvKCdXYWl0IGFscmVhZHkgY29tcGxldGVkLCBza2lwcGluZycsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29ycmVsYXRpb25JZDogd2FpdEV2ZW50LmNvcnJlbGF0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVsb2FkcyBpbnNpZGUgdGhlIGd1YXJkIG1heSBoYXZlIGFkdmFuY2VkIHRoZSBjdXJzb3IuXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50c0N1cnNvciA9IHdhaXRMb2cuY3Vyc29yO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh3YWl0c1RvQ29tcGxldGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgLy8gVGhlIGV2ZW50IGxpc3QgYWJvdmUgbWF5IGJlIHN0YWxlIGJ5IHRoZSB0aW1lIGFuIGVsYXBzZWRcbiAgICAgICAgICAgICAgICAgIC8vIHdhaXQgaXMgY29tbWl0dGVkLiBMb2FkIG9ubHkgZXZlbnRzIGFmdGVyIHRoZSBvcmlnaW5hbFxuICAgICAgICAgICAgICAgICAgLy8gc25hcHNob3QgY3Vyc29yIHNvIGNvbmN1cnJlbnQgZHVyYWJsZSBldmVudHMsIHN1Y2ggYXNcbiAgICAgICAgICAgICAgICAgIC8vIGhvb2tfcmVjZWl2ZWQsIGtlZXAgdGhlaXIgb3JkZXJpbmcgcmVsYXRpdmUgdG9cbiAgICAgICAgICAgICAgICAgIC8vIHdhaXRfY29tcGxldGVkLiBGYWxsIGJhY2sgdG8gYSBmdWxsIHJlbG9hZCBmb3Igb2xkZXIgd29ybGRzXG4gICAgICAgICAgICAgICAgICAvLyB0aGF0IGNhbm5vdCBnaXZlIHVzIGEgc3RhYmxlIGN1cnNvci5cbiAgICAgICAgICAgICAgICAgIGlmIChldmVudHNDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3RXZlbnRzID0gYXdhaXQgZ2V0V29ya2Zsb3dSdW5FdmVudHMoXG4gICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnRzQ3Vyc29yXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBsZXRlZFdhaXRJZHNBZnRlckN1cnNvciA9IG5ldyBTZXQoXG4gICAgICAgICAgICAgICAgICAgICAgbmV3RXZlbnRzLmV2ZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoZSkgPT4gZS5ldmVudFR5cGUgPT09ICd3YWl0X2NvbXBsZXRlZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKChlKSA9PiBlLmNvcnJlbGF0aW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNhd0FsbFdhaXRDb21wbGV0aW9ucyA9IHdhaXRzVG9Db21wbGV0ZS5ldmVyeShcbiAgICAgICAgICAgICAgICAgICAgICAod2FpdEV2ZW50KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGVkV2FpdElkc0FmdGVyQ3Vyc29yLmhhcyh3YWl0RXZlbnQuY29ycmVsYXRpb25JZClcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2F3QWxsV2FpdENvbXBsZXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdJZHMgPSBuZXcgU2V0KFxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLm1hcCgoZXZlbnQpID0+IGV2ZW50LmV2ZW50SWQpXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIG5ld0V2ZW50cy5ldmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RpbmdJZHMuaGFzKGV2ZW50LmV2ZW50SWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nSWRzLmFkZChldmVudC5ldmVudElkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2FkZWRFdmVudHMgPSBhd2FpdCBnZXRXb3JrZmxvd1J1bkV2ZW50cyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuLnJ1bklkXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBldmVudHMgPSBsb2FkZWRFdmVudHMuZXZlbnRzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2FkZWRFdmVudHMgPSBhd2FpdCBnZXRXb3JrZmxvd1J1bkV2ZW50cyhcbiAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bi5ydW5JZFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBldmVudHMgPSBsb2FkZWRFdmVudHMuZXZlbnRzO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAvLyBBIGNvbmN1cnJlbnQgdGVybWluYWwgd3JpdGUgbWF5IGhhdmUgbGFuZGVkIHdoaWxlXG4gICAgICAgICAgICAgICAgICAvLyBjb21taXR0aW5nIGFuIGVsYXBzZWQgd2FpdCBhbmQgcmVmcmVzaGluZyB0aGUgc25hcHNob3QuXG4gICAgICAgICAgICAgICAgICBpZiAoaGFzUmVjb3JkZWRUZXJtaW5hbFJ1bkV2ZW50KGV2ZW50cywgcnVuSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBSZXNvbHZlIHRoZSBlbmNyeXB0aW9uIGtleSBmb3IgdGhpcyBydW4ncyBkZXBsb3ltZW50XG4gICAgICAgICAgICAgICAgY29uc3QgcmF3S2V5ID1cbiAgICAgICAgICAgICAgICAgIGF3YWl0IHdvcmxkLmdldEVuY3J5cHRpb25LZXlGb3JSdW4/Lih3b3JrZmxvd1J1bik7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5jcnlwdGlvbktleSA9IHJhd0tleVxuICAgICAgICAgICAgICAgICAgPyBhd2FpdCBpbXBvcnRLZXkocmF3S2V5KVxuICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gVXNlciBjb2RlIGV4ZWN1dGlvbiAtLS1cbiAgICAgICAgICAgICAgICAvLyBPbmx5IGVycm9ycyBmcm9tIHJ1bldvcmtmbG93KCkgKHVzZXIgd29ya2Zsb3cgY29kZSkgc2hvdWxkXG4gICAgICAgICAgICAgICAgLy8gcHJvZHVjZSBydW5fZmFpbGVkLiBJbmZyYXN0cnVjdHVyZSBlcnJvcnMgKG5ldHdvcmssIHNlcnZlcilcbiAgICAgICAgICAgICAgICAvLyBtdXN0IHByb3BhZ2F0ZSB0byB0aGUgcXVldWUgaGFuZGxlciBmb3IgYXV0b21hdGljIHJldHJ5LlxuICAgICAgICAgICAgICAgIGxldCB3b3JrZmxvd1Jlc3VsdDogdW5rbm93bjtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSZXN1bHQgPSBhd2FpdCB0cmFjZShcbiAgICAgICAgICAgICAgICAgICAgJ3dvcmtmbG93LnJlcGxheScsXG4gICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICBhc3luYyAocmVwbGF5U3BhbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHJlcGxheVNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93RXZlbnRzQ291bnQoZXZlbnRzLmxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHJ1bldvcmtmbG93KFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dDb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudHMsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmNyeXB0aW9uS2V5XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFdvcmtmbG93U3VzcGVuc2lvbiBpcyBub3JtYWwgY29udHJvbCBmbG93IOKAlCBub3QgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICAgIGlmIChXb3JrZmxvd1N1c3BlbnNpb24uaXMoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdXNwZW5zaW9uTWVzc2FnZSA9IGJ1aWxkV29ya2Zsb3dTdXNwZW5zaW9uTWVzc2FnZShcbiAgICAgICAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICBlcnIuc3RlcENvdW50LFxuICAgICAgICAgICAgICAgICAgICAgIGVyci5ob29rQ291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgZXJyLndhaXRDb3VudFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VzcGVuc2lvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmRlYnVnKHN1c3BlbnNpb25NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEVhY2ggZXZlbnQgY3JlYXRpb24gaW5zaWRlIGhhbmRsZVN1c3BlbnNpb24gY2FycmllcyB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gbG9hZGVkIHNuYXBzaG90J3MgYHN0YXRlVXBkYXRlZEF0YDsgb24gYSBzdGFsZSAoNDEyKVxuICAgICAgICAgICAgICAgICAgICAvLyByZWplY3Rpb24gdGhlIGd1YXJkIHJlbG9hZHMgdGhpcyBsb2cgaW4gcGxhY2UgYW5kIHJldHJpZXMuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1c3BlbnNpb25Mb2c6IE11dGFibGVFdmVudExvZyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICBldmVudHMsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiBldmVudHNDdXJzb3IgPz8gbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBoYW5kbGVTdXNwZW5zaW9uPj47XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlU3VzcGVuc2lvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdXNwZW5zaW9uOiBlcnIsXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JsZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bjogd29ya2Zsb3dSdW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFuLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRMb2c6IHN1c3BlbnNpb25Mb2csXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHN1c3BlbnNpb25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBndWFyZCBleGhhdXN0ZWQgaXRzIHJlbG9hZHMgb24gYSBzdGFsZSBldmVudFxuICAgICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0aW9uLiBTY2hlZHVsZSBhbiBleHBsaWNpdCBpbW1lZGlhdGUgcmUtaW52b2NhdGlvblxuICAgICAgICAgICAgICAgICAgICAgIC8vIChhIHJldGhyb3cgcmVsaWVzIG9uIHF1ZXVlIHJlZGVsaXZlcnkpIHNvIGEgZnJlc2hcbiAgICAgICAgICAgICAgICAgICAgICAvLyByZXBsYXkgb2JzZXJ2ZXMgdGhlIG5ld2VyIGV2ZW50LlxuICAgICAgICAgICAgICAgICAgICAgIGlmIChQcmVjb25kaXRpb25GYWlsZWRFcnJvci5pcyhzdXNwZW5zaW9uRXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lTG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdTdXNwZW5zaW9uIGV2ZW50IGNyZWF0aW9uIGV4aGF1c3RlZCBwcmVjb25kaXRpb24gcmV0cmllczsgcmUtaW52b2tpbmcgd2l0aCBhIGZyZXNoIHJlcGxheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsgd29ya2Zsb3dSdW5JZDogcnVuSWQgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHRpbWVvdXRTZWNvbmRzOiAwIH07XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRocm93IHN1c3BlbnNpb25FcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZW91dFNlY29uZHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHRpbWVvdXRTZWNvbmRzOiByZXN1bHQudGltZW91dFNlY29uZHMgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFN1c3BlbnNpb24gaGFuZGxlZCwgbm8gZnVydGhlciB3b3JrIG5lZWRlZFxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIC8vIFRyYW5zaWVudCBpbmZyYXN0cnVjdHVyZSBmYWlsdXJlcyB0YWxraW5nIHRvIHRoZVxuICAgICAgICAgICAgICAgICAgLy8gd29ybGQgKHdvcmtmbG93LXNlcnZlcikg4oCUIGFuIGV4aGF1c3RlZCBSZXRyeUFnZW50XG4gICAgICAgICAgICAgICAgICAvLyAoVU5EX0VSUl9SRVFfUkVUUlkgZnJvbSBhIHN1c3RhaW5lZCA0MjkvNTAzIHN0b3JtKSxcbiAgICAgICAgICAgICAgICAgIC8vIGEgZHJvcHBlZCBzb2NrZXQsIGEgY29ubmVjdC9ETlMgZmFpbHVyZSwgb3IgYSBjbGllbnRcbiAgICAgICAgICAgICAgICAgIC8vIHRpbWVvdXQg4oCUIG11c3QgTk9UIGZhaWwgdGhlIHJ1bi4gUmV0aHJvdyBzbyB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgIC8vIHJlZGVsaXZlcnMgYW5kIGEgZnJlc2ggaW52b2NhdGlvbiByZXRyaWVzIHRoZSByZXBsYXlcbiAgICAgICAgICAgICAgICAgIC8vIG9uY2UgdGhlIGJhY2tlbmQgcmVjb3ZlcnMuIFRoZSBAdmVyY2VsL3F1ZXVlIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgIC8vIGFwcGxpZXMgYSBmYXN0ICgxc+KGkjYwcykgYmFja29mZiBieSBkZWxpdmVyeSBjb3VudCxcbiAgICAgICAgICAgICAgICAgIC8vIGF2b2lkaW5nIHRoZSB+NW1pbiBkZWZhdWx0IHZpc2liaWxpdHktdGltZW91dCByZWRyaXZlXG4gICAgICAgICAgICAgICAgICAvLyAoYW5kIG5ldmVyIGtpbGxpbmcgdGhlIHByb2Nlc3MgdmlhIHJ1bl9mYWlsZWQpLlxuICAgICAgICAgICAgICAgICAgaWYgKGlzUmV0cnlhYmxlV29ybGRFcnJvcihlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIud2FybihcbiAgICAgICAgICAgICAgICAgICAgICAnVHJhbnNpZW50IHdvcmxkIGVycm9yIGR1cmluZyByZXBsYXk7IHJlZGVsaXZlcmluZyB2aWEgcXVldWUgaW5zdGVhZCBvZiBmYWlsaW5nIHRoZSBydW4nLFxuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTmFtZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubmFtZSA6ICdVbmtub3duRXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxpdmVyeUF0dGVtcHQ6IG1ldGFkYXRhLmF0dGVtcHQsXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGxldCB0ZXJtaW5hbEVycm9yID0gZXJyO1xuICAgICAgICAgICAgICAgICAgaWYgKFJlcGxheURpdmVyZ2VuY2VFcnJvci5pcyhlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdmVyZ2VuY2VDb3VudCA9IChyZXBsYXlEaXZlcmdlbmNlPy5jb3VudCA/PyAwKSArIDE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpdmVyZ2VuY2VDb3VudCA8PSBSRVBMQVlfRElWRVJHRU5DRV9NQVhfUkVUUklFUykge1xuICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIud2FybihcbiAgICAgICAgICAgICAgICAgICAgICAgICdXb3JrZmxvdyByZXBsYXkgZGl2ZXJnZWQ7IHF1ZXVlaW5nIGEgcmVjb3ZlcnkgcmVwbGF5IGJlZm9yZSBkZWNsYXJpbmcgdGhlIGV2ZW50IGxvZyBjb3JydXB0ZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiBSVU5fRVJST1JfQ09ERVMuUkVQTEFZX0RJVkVSR0VOQ0UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpdmVyZ2VuY2VFdmVudElkOiBlcnIuZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpb3JEaXZlcmdlbmNlRXZlbnRJZDogcmVwbGF5RGl2ZXJnZW5jZT8uZXZlbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGl2ZXJnZW5jZUNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpdmVyeUF0dGVtcHQ6IG1ldGFkYXRhLmF0dGVtcHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1heFJlY292ZXJ5UmVwbGF5czogUkVQTEFZX0RJVkVSR0VOQ0VfTUFYX1JFVFJJRVMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBxdWV1ZU1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JsZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldFdvcmtmbG93UXVldWVOYW1lKHdvcmtmbG93TmFtZSwgbmFtZXNwYWNlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNlQ2FycmllcjogdHJhY2VDb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGF5RGl2ZXJnZW5jZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SWQ6IGVyci5ldmVudElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBkaXZlcmdlbmNlQ291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBsb3ltZW50SWQ6IHdvcmtmbG93UnVuLmRlcGxveW1lbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY1ZlcnNpb246XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW4uc3BlY1ZlcnNpb24gPz8gU1BFQ19WRVJTSU9OX0xFR0FDWSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRlcm1pbmFsRXJyb3IgPSBuZXcgQ29ycnVwdGVkRXZlbnRMb2dFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICBgV29ya2Zsb3cgcmVwbGF5IGRpdmVyZ2VkICR7ZGl2ZXJnZW5jZUNvdW50fSB0aW1lcyBhZnRlciAke1JFUExBWV9ESVZFUkdFTkNFX01BWF9SRVRSSUVTfSByZWNvdmVyeSByZXBsYXlzOyBsYXRlc3QgZGl2ZXJnZW50IGV2ZW50IHdhcyAke2Vyci5ldmVudElkfS4gTGFzdCBkaXZlcmdlbmNlOiAke2Vyci5tZXNzYWdlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgeyBjYXVzZTogZXJyIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHVzZXIgY29kZSBlcnJvciBvciBhIHRlcm1pbmFsXG4gICAgICAgICAgICAgICAgICAvLyBXb3JrZmxvd1J1bnRpbWVFcnJvci4gRmFpbCB0aGUgd29ya2Zsb3cgcnVuLlxuXG4gICAgICAgICAgICAgICAgICAvLyBSZWNvcmQgZXhjZXB0aW9uIGZvciBPVEVMIGVycm9yIHRyYWNraW5nXG4gICAgICAgICAgICAgICAgICBpZiAodGVybWluYWxFcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwYW4/LnJlY29yZEV4Y2VwdGlvbj8uKHRlcm1pbmFsRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBjb25zdCBub3JtYWxpemVkRXJyb3IgPVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBub3JtYWxpemVVbmtub3duRXJyb3IodGVybWluYWxFcnJvcik7XG4gICAgICAgICAgICAgICAgICBjb25zdCBlcnJvck5hbWUgPVxuICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkRXJyb3IubmFtZSB8fCBnZXRFcnJvck5hbWUodGVybWluYWxFcnJvcik7XG4gICAgICAgICAgICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBub3JtYWxpemVkRXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgIGxldCBlcnJvclN0YWNrID1cbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZEVycm9yLnN0YWNrIHx8IGdldEVycm9yU3RhY2sodGVybWluYWxFcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgIC8vIFJlbWFwIGVycm9yIHN0YWNrIHVzaW5nIHNvdXJjZSBtYXBzIHRvIHNob3cgb3JpZ2luYWwgc291cmNlIGxvY2F0aW9uc1xuICAgICAgICAgICAgICAgICAgaWYgKGVycm9yU3RhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkTmFtZSA9IHBhcnNlV29ya2Zsb3dOYW1lKHdvcmtmbG93TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID1cbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZWROYW1lPy5tb2R1bGVTcGVjaWZpZXIgfHwgd29ya2Zsb3dOYW1lO1xuICAgICAgICAgICAgICAgICAgICBlcnJvclN0YWNrID0gcmVtYXBFcnJvclN0YWNrKFxuICAgICAgICAgICAgICAgICAgICAgIGVycm9yU3RhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dDb2RlXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIC8vIENsYXNzaWZ5IHRoZSBlcnJvcjogV29ya2Zsb3dSdW50aW1lRXJyb3IgaW5kaWNhdGVzXG4gICAgICAgICAgICAgICAgICAvLyBhbiBTREsvcnVudGltZSBpc3N1ZSwgYW5kIHNlbGVjdGVkIHN1YmNsYXNzZXMgdXNlXG4gICAgICAgICAgICAgICAgICAvLyBtb3JlIHNwZWNpZmljIGNvZGVzIGZvciBiYWNrZW5kIHRyYWNraW5nLlxuICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JDb2RlID0gY2xhc3NpZnlSdW5FcnJvcih0ZXJtaW5hbEVycm9yKTtcblxuICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5lcnJvcignRXJyb3Igd2hpbGUgcnVubmluZyB3b3JrZmxvdycsIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dSdW5JZDogcnVuSWQsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JOYW1lLFxuICAgICAgICAgICAgICAgICAgICBlcnJvclN0YWNrLFxuICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgIC8vIEZhaWwgdGhlIHdvcmtmbG93IHJ1biB2aWEgZXZlbnQgKGV2ZW50LXNvdXJjZWQgYXJjaGl0ZWN0dXJlKVxuICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgd29ybGQuZXZlbnRzLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6ICdydW5fZmFpbGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNWZXJzaW9uOiBTUEVDX1ZFUlNJT05fQ1VSUkVOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yTWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjazogZXJyb3JTdGFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHsgcmVxdWVzdElkIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGZhaWxFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgIEVudGl0eUNvbmZsaWN0RXJyb3IuaXMoZmFpbEVycikgfHxcbiAgICAgICAgICAgICAgICAgICAgICBSdW5FeHBpcmVkRXJyb3IuaXMoZmFpbEVycilcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5pbmZvKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ1RyaWVkIGZhaWxpbmcgd29ya2Zsb3cgcnVuLCBidXQgcnVuIGhhcyBhbHJlYWR5IGZpbmlzaGVkLicsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBmYWlsRXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBzcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0Vycm9yQ29kZShlcnJvckNvZGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93RXJyb3JOYW1lKGVycm9yTmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dFcnJvck1lc3NhZ2UoZXJyb3JNZXNzYWdlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5FcnJvclR5cGUoZXJyb3JOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29ybGRDb250cmFjdEVycm9yKGZhaWxFcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcnVudGltZUxvZ2dlci5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICdGYXRhbCB3b3JsZCBjb250cmFjdCBlcnJvciB3aGlsZSByZWNvcmRpbmcgd29ya2Zsb3cgZmFpbHVyZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IHJ1bklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvZGU6IFJVTl9FUlJPUl9DT0RFUy5XT1JMRF9DT05UUkFDVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFpbEVyciBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGZhaWxFcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBTdHJpbmcoZmFpbEVyciksXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZmFpbEVycjtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd1J1blN0YXR1cygnZmFpbGVkJyksXG4gICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0Vycm9yQ29kZShlcnJvckNvZGUpLFxuICAgICAgICAgICAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dFcnJvck5hbWUoZXJyb3JOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93RXJyb3JNZXNzYWdlKGVycm9yTWVzc2FnZSksXG4gICAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5FcnJvclR5cGUoZXJyb3JOYW1lKSxcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIC0tLSBJbmZyYXN0cnVjdHVyZTogY29tcGxldGUgdGhlIHJ1biAtLS1cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIG91dHNpZGUgdGhlIHVzZXItY29kZSB0cnkvY2F0Y2ggc28gdGhhdCBmYWlsdXJlc1xuICAgICAgICAgICAgICAgIC8vIGhlcmUgKGUuZy4sIG5ldHdvcmsgZXJyb3JzKSBwcm9wYWdhdGUgdG8gdGhlIHF1ZXVlIGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgLy8gcnVuX2NvbXBsZXRlZCBjYXJyaWVzIHRoZSBsb2FkZWQgc25hcHNob3QncyBgc3RhdGVVcGRhdGVkQXRgLFxuICAgICAgICAgICAgICAgIC8vIGJ1dCBpcyBpbnRlbnRpb25hbGx5IE5PVCByZXRyaWVkIGluIHBsYWNlIChub1xuICAgICAgICAgICAgICAgIC8vIHdpdGhQcmVjb25kaXRpb25SZXRyeSkgb24gYSBzdGFsZSAoNDEyKSByZWplY3Rpb246IGByZXN1bHRgXG4gICAgICAgICAgICAgICAgLy8gd2FzIGNvbXB1dGVkIGJ5IHRoaXMgcmVwbGF5LCBzbyBhIG5ld2VyIG91dC1vZi1iYW5kIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gbGFuZGluZyBhZnRlciB0aGUgc25hcHNob3QgbXVzdCBmb3JjZSBhICpmcmVzaCByZXBsYXkqXG4gICAgICAgICAgICAgICAgLy8gKHdoaWNoIG1heSBvYnNlcnZlIGl0IGFuZCBwcm9kdWNlIGEgZGlmZmVyZW50IHJlc3VsdCksIG5vdFxuICAgICAgICAgICAgICAgIC8vIHJlLWNvbW1pdCB0aGUgc3RhbGUgcmVzdWx0LiBPbiA0MTIgdGhlIGNhdGNoIGJlbG93IHNjaGVkdWxlc1xuICAgICAgICAgICAgICAgIC8vIGFuIGV4cGxpY2l0IGltbWVkaWF0ZSByZS1pbnZvY2F0aW9uIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgLy8gKHJ1bl9mYWlsZWQgaXMgZGVsaWJlcmF0ZWx5IGxlZnQgdW5ndWFyZGVkIGFuZCBmYWlscyBvcGVuOlxuICAgICAgICAgICAgICAgIC8vIGEgc3B1cmlvdXMgcmUtcnVuIGlzIHNhZmUsIGEgc3B1cmlvdXMgY29tcGxldGlvbiBpcyBub3QsIGFuZFxuICAgICAgICAgICAgICAgIC8vIHRoZSBsb2FkZWQgZXZlbnQgbG9nIGlzIG5vdCBpbiBzY29wZSBvbiB0aGF0IGNhdGNoIHBhdGguKVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBhd2FpdCB3b3JsZC5ldmVudHMuY3JlYXRlKFxuICAgICAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogJ3J1bl9jb21wbGV0ZWQnLFxuICAgICAgICAgICAgICAgICAgICAgIHNwZWNWZXJzaW9uOiBTUEVDX1ZFUlNJT05fQ1VSUkVOVCxcbiAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogd29ya2Zsb3dSZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVVwZGF0ZWRBdDogc3RhdGVVcGRhdGVkQXRGb3JDcmVhdGUoZXZlbnRzKSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChQcmVjb25kaXRpb25GYWlsZWRFcnJvci5pcyhlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICAgICAgICAgICAncnVuX2NvbXBsZXRlZCByZWplY3RlZCBhcyBzdGFsZTsgcmUtaW52b2tpbmcgd2l0aCBhIGZyZXNoIHJlcGxheScsXG4gICAgICAgICAgICAgICAgICAgICAgeyB3b3JrZmxvd1J1bklkOiBydW5JZCB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHRpbWVvdXRTZWNvbmRzOiAwIH07XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoRW50aXR5Q29uZmxpY3RFcnJvci5pcyhlcnIpIHx8IFJ1bkV4cGlyZWRFcnJvci5pcyhlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVMb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICAgICAgICAgICAnVHJpZWQgY29tcGxldGluZyB3b3JrZmxvdyBydW4sIGJ1dCBydW4gaGFzIGFscmVhZHkgZmluaXNoZWQuJyxcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd1J1bklkOiBydW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93UnVuU3RhdHVzKCdjb21wbGV0ZWQnKSxcbiAgICAgICAgICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0V2ZW50c0NvdW50KGV2ZW50cy5sZW5ndGgpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApOyAvLyBFbmQgdHJhY2VcbiAgICAgICAgICB9XG4gICAgICAgICk7IC8vIEVuZCB3aXRoV29ya2Zsb3dCYWdnYWdlXG4gICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgaWYgKHJlcGxheVRpbWVvdXQpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQocmVwbGF5VGltZW91dCk7XG4gICAgICAgIH1cbiAgICAgIH0pOyAvLyBFbmQgd2l0aFRyYWNlQ29udGV4dFxuICAgIH1cbiAgKTtcblxuICByZXR1cm4gd2l0aEhlYWx0aENoZWNrKGhhbmRsZXIsIHdvcmxkU3BlY1ZlcnNpb24pO1xufVxuXG4vLyB0aGlzIGlzIGEgbm8tb3AgcGxhY2Vob2xkZXIgYXMgdGhlIGNsaWVudCBpc1xuLy8gZXhwZWN0aW5nIHRoaXMgdG8gYmUgcHJlc2VudCBidXQgd2UgYXJlbid0IGFjdHVhbGx5IHVzaW5nIGl0XG5leHBvcnQgZnVuY3Rpb24gcnVuU3RlcCgpIHt9XG4iLCAiaW1wb3J0IHtcbiAgRVJST1JfU0xVR1MsXG4gIFJlcGxheURpdmVyZ2VuY2VFcnJvcixcbiAgV29ya2Zsb3dOb3RSZWdpc3RlcmVkRXJyb3IsXG4gIFdvcmtmbG93UnVudGltZUVycm9yLFxufSBmcm9tICdAd29ya2Zsb3cvZXJyb3JzJztcbmltcG9ydCB7IGNyZWF0ZVdvcmtmbG93QmFzZVVybCwgd2l0aFJlc29sdmVycyB9IGZyb20gJ0B3b3JrZmxvdy91dGlscyc7XG5pbXBvcnQgeyBwYXJzZVdvcmtmbG93TmFtZSB9IGZyb20gJ0B3b3JrZmxvdy91dGlscy9wYXJzZS1uYW1lJztcbmltcG9ydCB0eXBlIHsgRXZlbnQsIFdvcmtmbG93UnVuIH0gZnJvbSAnQHdvcmtmbG93L3dvcmxkJztcbmltcG9ydCAqIGFzIG5hbm9pZCBmcm9tICduYW5vaWQnO1xuaW1wb3J0IHsgbW9ub3RvbmljRmFjdG9yeSB9IGZyb20gJ3VsaWQnO1xuaW1wb3J0IHR5cGUgeyBDcnlwdG9LZXkgfSBmcm9tICcuL2VuY3J5cHRpb24uanMnO1xuaW1wb3J0IHsgRXZlbnRDb25zdW1lclJlc3VsdCwgRXZlbnRzQ29uc3VtZXIgfSBmcm9tICcuL2V2ZW50cy1jb25zdW1lci5qcyc7XG5pbXBvcnQgdHlwZSB7IFF1ZXVlSXRlbSB9IGZyb20gJy4vZ2xvYmFsLmpzJztcbmltcG9ydCB7IEVOT1RTVVAsIFdvcmtmbG93U3VzcGVuc2lvbiB9IGZyb20gJy4vZ2xvYmFsLmpzJztcbmltcG9ydCB7IHJ1bnRpbWVMb2dnZXIgfSBmcm9tICcuL2xvZ2dlci5qcyc7XG5pbXBvcnQgdHlwZSB7IFdvcmtmbG93T3JjaGVzdHJhdG9yQ29udGV4dCB9IGZyb20gJy4vcHJpdmF0ZS5qcyc7XG5pbXBvcnQgeyBnZXRQb3J0TGF6eSB9IGZyb20gJy4vcnVudGltZS9nZXQtcG9ydC1sYXp5LmpzJztcbmltcG9ydCB7XG4gIGRlaHlkcmF0ZVdvcmtmbG93UmV0dXJuVmFsdWUsXG4gIGh5ZHJhdGVXb3JrZmxvd0FyZ3VtZW50cyxcbn0gZnJvbSAnLi9zZXJpYWxpemF0aW9uLmpzJztcbmltcG9ydCB7IGNyZWF0ZVVzZVN0ZXAgfSBmcm9tICcuL3N0ZXAuanMnO1xuaW1wb3J0IHR5cGUgeyBTdGVwSHlkcmF0aW9uQ2FjaGUgfSBmcm9tICcuL3N0ZXAtaHlkcmF0aW9uLWNhY2hlLmpzJztcbmltcG9ydCB7XG4gIEJPRFlfSU5JVF9TWU1CT0wsXG4gIFNUQUJMRV9VTElELFxuICBXT1JLRkxPV19DUkVBVEVfSE9PSyxcbiAgV09SS0ZMT1dfR0VUX1NUUkVBTV9JRCxcbiAgV09SS0ZMT1dfU0xFRVAsXG4gIFdPUktGTE9XX1VTRV9TVEVQLFxufSBmcm9tICcuL3N5bWJvbHMuanMnO1xuaW1wb3J0ICogYXMgQXR0cmlidXRlIGZyb20gJy4vdGVsZW1ldHJ5L3NlbWFudGljLWNvbnZlbnRpb25zLmpzJztcbmltcG9ydCB7IHRyYWNlIH0gZnJvbSAnLi90ZWxlbWV0cnkuanMnO1xuaW1wb3J0IHsgZ2V0V29ya2Zsb3dSdW5TdHJlYW1JZCB9IGZyb20gJy4vdXRpbC5qcyc7XG5pbXBvcnQgeyBjcmVhdGVDb250ZXh0IH0gZnJvbSAnLi92bS9pbmRleC5qcyc7XG5pbXBvcnQgeyBydW5DYWNoZWRXb3JrZmxvd1NjcmlwdCB9IGZyb20gJy4vdm0vc2NyaXB0LWNhY2hlLmpzJztcbmltcG9ydCB0eXBlIHsgV29ya2Zsb3dNZXRhZGF0YSB9IGZyb20gJy4vd29ya2Zsb3cvZ2V0LXdvcmtmbG93LW1ldGFkYXRhLmpzJztcbmltcG9ydCB7IFdPUktGTE9XX0NPTlRFWFRfU1lNQk9MIH0gZnJvbSAnLi93b3JrZmxvdy9nZXQtd29ya2Zsb3ctbWV0YWRhdGEuanMnO1xuaW1wb3J0IHsgY3JlYXRlQ3JlYXRlSG9vayB9IGZyb20gJy4vd29ya2Zsb3cvaG9vay5qcyc7XG5pbXBvcnQgeyBjcmVhdGVTbGVlcCB9IGZyb20gJy4vd29ya2Zsb3cvc2xlZXAuanMnO1xuXG4vKipcbiAqIExvZ3MgYSB3YXJuaW5nIHdoZW4gYSB3b3JrZmxvdyBydW4gY29tcGxldGVzIG9yIGZhaWxzIHdpdGggdW5jb21taXR0ZWRcbiAqIG9wZXJhdGlvbnMgc3RpbGwgaW4gdGhlIGludm9jYXRpb25zIHF1ZXVlLiBUaGlzIHR5cGljYWxseSBpbmRpY2F0ZXMgdGhlXG4gKiB1c2VyIGZvcmdvdCB0byBgYXdhaXRgIGEgc3RlcCwgaG9vaywgb3Igc2xlZXAgY2FsbC5cbiAqL1xuZnVuY3Rpb24gd2FyblBlbmRpbmdRdWV1ZUl0ZW1zKFxuICBydW5JZDogc3RyaW5nLFxuICBwZW5kaW5nUXVldWU6IE1hcDxzdHJpbmcsIFF1ZXVlSXRlbT4sXG4gIG91dGNvbWU6ICdjb21wbGV0ZWQnIHwgJ2ZhaWxlZCdcbik6IHZvaWQge1xuICAvLyBGaWx0ZXIgb3V0IGhvb2tzIHRoYXQgYXJlIGVpdGhlciBhbHJlYWR5IGNyZWF0ZWQgKGFsaXZlLCB3YWl0aW5nIGZvciBwYXlsb2FkcylcbiAgLy8gb3IgZXhwbGljaXRseSBkaXNwb3NlZCDigJQgYm90aCBhcmUgYmVuaWduIHNpbmNlIHRoZSBiYWNrZW5kIGF1dG8tZGlzcG9zZXNcbiAgLy8gYWxsIGhvb2tzIHdoZW4gYSBydW4gcmVhY2hlcyBhIHRlcm1pbmFsIHN0YXRlXG4gIGNvbnN0IGl0ZW1zID0gWy4uLnBlbmRpbmdRdWV1ZS52YWx1ZXMoKV0uZmlsdGVyKFxuICAgIChpdGVtKSA9PiAhKGl0ZW0udHlwZSA9PT0gJ2hvb2snICYmIChpdGVtLmhhc0NyZWF0ZWRFdmVudCB8fCBpdGVtLmRpc3Bvc2VkKSlcbiAgKTtcbiAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGNvbnN0IGRldGFpbHMgPSBpdGVtcy5tYXAoKGl0ZW0pID0+IHtcbiAgICBzd2l0Y2ggKGl0ZW0udHlwZSkge1xuICAgICAgY2FzZSAnc3RlcCc6XG4gICAgICAgIHJldHVybiBgc3RlcCBcIiR7aXRlbS5zdGVwTmFtZX1cImA7XG4gICAgICBjYXNlICdob29rJzpcbiAgICAgICAgcmV0dXJuIGBob29rIFwiJHtpdGVtLnRva2VufVwiYDtcbiAgICAgIGNhc2UgJ3dhaXQnOlxuICAgICAgICByZXR1cm4gJ3NsZWVwJztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBgdW5rbm93biAoJHsoaXRlbSBhcyB7IHR5cGU6IHN0cmluZyB9KS50eXBlfSlgO1xuICAgIH1cbiAgfSk7XG5cbiAgcnVudGltZUxvZ2dlci53YXJuKFxuICAgIGBXb3JrZmxvdyBydW4gJHtvdXRjb21lfSB3aXRoICR7aXRlbXMubGVuZ3RofSB1bmNvbW1pdHRlZCBvcGVyYXRpb24ocyk6ICR7ZGV0YWlscy5qb2luKCcsICcpfS4gYCArXG4gICAgICAnRGlkIHlvdSBmb3JnZXQgdG8gYGF3YWl0YCBhIHN0ZXAsIGhvb2ssIG9yIHNsZWVwIGNhbGw/JyxcbiAgICB7IHdvcmtmbG93UnVuSWQ6IHJ1bklkIH1cbiAgKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bldvcmtmbG93KFxuICB3b3JrZmxvd0NvZGU6IHN0cmluZyxcbiAgd29ya2Zsb3dSdW46IFdvcmtmbG93UnVuLFxuICBldmVudHM6IEV2ZW50W10sXG4gIGVuY3J5cHRpb25LZXk6IENyeXB0b0tleSB8IHVuZGVmaW5lZCxcbiAgLyoqXG4gICAqIE9wdGlvbmFsIHBlci1ydW4gY2FjaGUgZm9yIGh5ZHJhdGVkIHN0ZXAgcmV0dXJuIHZhbHVlcywgb3duZWQgYnkgdGhlIGlubGluZVxuICAgKiByZXBsYXkgbG9vcCBzbyBpdCBzdXJ2aXZlcyBhY3Jvc3MgdGhlIGxvb3AncyBpdGVyYXRpb25zIChlYWNoIG9mIHdoaWNoXG4gICAqIGNyZWF0ZXMgYSBmcmVzaCBjb250ZXh0KS4gTWVtb2l6ZXMgdGhlIGRlY3J5cHQgKyBkZXZhbHVlLXBhcnNlIG9mIGNvbXBsZXRlZFxuICAgKiBzdGVwIHJlc3VsdHMgdG8gdHVybiBPKE7CsikgcmVwbGF5IGh5ZHJhdGlvbiBpbnRvIE8oTikuIE9taXR0ZWQgYnkgY2FsbGVyc1xuICAgKiB0aGF0IHJlcGxheSBvbmx5IG9uY2UgKHRoZW4gdGhlcmUgaXMgbm90aGluZyB0byByZXVzZSkuXG4gICAqL1xuICBzdGVwSHlkcmF0aW9uQ2FjaGU/OiBTdGVwSHlkcmF0aW9uQ2FjaGVcbik6IFByb21pc2U8VWludDhBcnJheSB8IHVua25vd24+IHtcbiAgcmV0dXJuIHRyYWNlKGB3b3JrZmxvdy5ydW4gJHt3b3JrZmxvd1J1bi53b3JrZmxvd05hbWV9YCwgYXN5bmMgKHNwYW4pID0+IHtcbiAgICBzcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd05hbWUod29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lKSxcbiAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd1J1bklkKHdvcmtmbG93UnVuLnJ1bklkKSxcbiAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd1J1blN0YXR1cyh3b3JrZmxvd1J1bi5zdGF0dXMpLFxuICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93RXZlbnRzQ291bnQoZXZlbnRzLmxlbmd0aCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGFydGVkQXQgPSB3b3JrZmxvd1J1bi5zdGFydGVkQXQ7XG4gICAgaWYgKCFzdGFydGVkQXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFdvcmtmbG93IHJ1biBcIiR7d29ya2Zsb3dSdW4ucnVuSWR9XCIgaGFzIG5vIFwic3RhcnRlZEF0XCIgdGltZXN0YW1wIChzaG91bGQgbm90IGhhcHBlbilgXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgcG9ydCBiZWZvcmUgY3JlYXRpbmcgVk0gY29udGV4dCB0byBhdm9pZCBhc3luYyBvcGVyYXRpb25zXG4gICAgLy8gYWZmZWN0aW5nIHRoZSBkZXRlcm1pbmlzdGljIHRpbWVzdGFtcFxuICAgIGNvbnN0IGlzVmVyY2VsID0gcHJvY2Vzcy5lbnYuVkVSQ0VMX1VSTCAhPT0gdW5kZWZpbmVkO1xuICAgIC8vIExvYWQgZ2V0UG9ydCBsYXppbHkgdG8gcHJldmVudCBUdXJib3BhY2sgZnJvbSB0cmFjaW5nIGdldC1wb3J0J3NcbiAgICAvLyBmcyBvcHMgKHJlYWRkaXIsIHJlYWRGaWxlKSBpbnRvIHRoZSBmbG93IHJvdXRlIGJ1bmRsZS4gVGhlIHJlc29sdmVkXG4gICAgLy8gcG9ydCBpcyBjYWNoZWQgcGVyIHByb2Nlc3MgKHNlZSBnZXQtcG9ydC1sYXp5LnRzKSwgc28gdGhpcyBpcyBjaGVhcFxuICAgIC8vIG9uIHJlcGxheXMgYWZ0ZXIgdGhlIGZpcnN0IOKAlCBgZ2V0UG9ydCgpYCBvdGhlcndpc2UgcmUtcnVucyBPUyBwb3J0XG4gICAgLy8gZGlzY292ZXJ5IChzcGF3bmluZyBgbHNvZmAgb24gbWFjT1MsIH42MG1zKSBvbiBldmVyeSByZXBsYXkuXG4gICAgY29uc3Qgd29ya2Zsb3dCYXNlVXJsID0gY3JlYXRlV29ya2Zsb3dCYXNlVXJsKFxuICAgICAgaXNWZXJjZWxcbiAgICAgICAgPyBgaHR0cHM6Ly8ke3Byb2Nlc3MuZW52LlZFUkNFTF9VUkx9YFxuICAgICAgICA6IGBodHRwOi8vbG9jYWxob3N0OiR7KGF3YWl0IGdldFBvcnRMYXp5KCkpID8/IDMwMDB9YFxuICAgICk7XG5cbiAgICBjb25zdCB7XG4gICAgICBjb250ZXh0LFxuICAgICAgZ2xvYmFsVGhpczogdm1HbG9iYWxUaGlzLFxuICAgICAgdXBkYXRlVGltZXN0YW1wLFxuICAgIH0gPSBjcmVhdGVDb250ZXh0KHtcbiAgICAgIHNlZWQ6IGAke3dvcmtmbG93UnVuLnJ1bklkfToke3dvcmtmbG93UnVuLndvcmtmbG93TmFtZX06JHsrc3RhcnRlZEF0fWAsXG4gICAgICBmaXhlZFRpbWVzdGFtcDogK3N0YXJ0ZWRBdCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHdvcmtmbG93RGlzY29udGludWF0aW9uID0gd2l0aFJlc29sdmVyczx2b2lkPigpO1xuXG4gICAgY29uc3QgdWxpZCA9IG1vbm90b25pY0ZhY3RvcnkoKCkgPT4gdm1HbG9iYWxUaGlzLk1hdGgucmFuZG9tKCkpO1xuICAgIGNvbnN0IGdlbmVyYXRlTmFub2lkID0gbmFub2lkLmN1c3RvbVJhbmRvbShuYW5vaWQudXJsQWxwaGFiZXQsIDIxLCAoc2l6ZSkgPT5cbiAgICAgIG5ldyBVaW50OEFycmF5KHNpemUpLm1hcCgoKSA9PiAyNTYgKiB2bUdsb2JhbFRoaXMuTWF0aC5yYW5kb20oKSlcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGEgbXV0YWJsZSBob2xkZXIgZm9yIHRoZSBwcm9taXNlIHF1ZXVlIHNvIHRoZSBFdmVudHNDb25zdW1lclxuICAgIC8vIGNhbiBhY2Nlc3MgdGhlIGN1cnJlbnQgcXVldWUgc3RhdGUgdmlhIGEgZ2V0dGVyLiBUaGUgcXVldWUgaXMgbXV0YXRlZFxuICAgIC8vIGJ5IHN0ZXAvaG9vay9zbGVlcCBjYWxsYmFja3MgYXMgZXZlbnRzIGFyZSBwcm9jZXNzZWQuXG4gICAgY29uc3QgcHJvbWlzZVF1ZXVlSG9sZGVyID0geyBjdXJyZW50OiBQcm9taXNlLnJlc29sdmUoKSB9O1xuXG4gICAgY29uc3QgZXZlbnRzQ29uc3VtZXIgPSBuZXcgRXZlbnRzQ29uc3VtZXIoZXZlbnRzLCB7XG4gICAgICBvbkNvbnN1bWVkRXZlbnQ6IChldmVudCkgPT4ge1xuICAgICAgICB1cGRhdGVUaW1lc3RhbXAoK2V2ZW50LmNyZWF0ZWRBdCk7XG4gICAgICB9LFxuICAgICAgb25VbmNvbnN1bWVkRXZlbnQ6IChldmVudCkgPT4ge1xuICAgICAgICB3b3JrZmxvd0Rpc2NvbnRpbnVhdGlvbi5yZWplY3QoXG4gICAgICAgICAgbmV3IFJlcGxheURpdmVyZ2VuY2VFcnJvcihcbiAgICAgICAgICAgIGBSZXBsYXkgY291bGQgbm90IGNvbnN1bWUgZXZlbnQ6IGV2ZW50VHlwZT0ke2V2ZW50LmV2ZW50VHlwZX0sIGNvcnJlbGF0aW9uSWQ9JHtldmVudC5jb3JyZWxhdGlvbklkfSwgZXZlbnRJZD0ke2V2ZW50LmV2ZW50SWR9LmAsXG4gICAgICAgICAgICB7IGV2ZW50SWQ6IGV2ZW50LmV2ZW50SWQgfVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgICBnZXRQcm9taXNlUXVldWU6ICgpID0+IHByb21pc2VRdWV1ZUhvbGRlci5jdXJyZW50LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgd29ya2Zsb3dDb250ZXh0OiBXb3JrZmxvd09yY2hlc3RyYXRvckNvbnRleHQgPSB7XG4gICAgICBydW5JZDogd29ya2Zsb3dSdW4ucnVuSWQsXG4gICAgICBlbmNyeXB0aW9uS2V5LFxuICAgICAgZ2xvYmFsVGhpczogdm1HbG9iYWxUaGlzLFxuICAgICAgb25Xb3JrZmxvd0Vycm9yOiB3b3JrZmxvd0Rpc2NvbnRpbnVhdGlvbi5yZWplY3QsXG4gICAgICBldmVudHNDb25zdW1lcixcbiAgICAgIGdlbmVyYXRlVWxpZDogKCkgPT4gdWxpZCgrc3RhcnRlZEF0KSxcbiAgICAgIGdlbmVyYXRlTmFub2lkLFxuICAgICAgaW52b2NhdGlvbnNRdWV1ZTogbmV3IE1hcCgpLFxuICAgICAgLy8gVXNlIGdldHRlci9zZXR0ZXIgc28gdGhlIEV2ZW50c0NvbnN1bWVyJ3MgZ2V0UHJvbWlzZVF1ZXVlKCkgYWx3YXlzXG4gICAgICAvLyBzZWVzIHRoZSBsYXRlc3QgcXVldWUgc3RhdGUgYXMgaXQncyBtdXRhdGVkIGJ5IHN0ZXAvaG9vay9zbGVlcCBjYWxsYmFja3MuXG4gICAgICBnZXQgcHJvbWlzZVF1ZXVlKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZVF1ZXVlSG9sZGVyLmN1cnJlbnQ7XG4gICAgICB9LFxuICAgICAgc2V0IHByb21pc2VRdWV1ZSh2YWx1ZTogUHJvbWlzZTx2b2lkPikge1xuICAgICAgICBwcm9taXNlUXVldWVIb2xkZXIuY3VycmVudCA9IHZhbHVlO1xuICAgICAgfSxcbiAgICAgIHBlbmRpbmdEZWxpdmVyaWVzOiAwLFxuICAgICAgcGVuZGluZ0RlbGl2ZXJ5QmFycmllcnM6IG5ldyBNYXAoKSxcbiAgICAgIHN0ZXBIeWRyYXRpb25DYWNoZSxcbiAgICB9O1xuXG4gICAgLy8gQ29uc3VtZSBydW4gbGlmZWN5Y2xlIGV2ZW50cyAtIHRoZXNlIGFyZSBzdHJ1Y3R1cmFsIGV2ZW50cyB0aGF0IGRvbid0XG4gICAgLy8gbmVlZCBzcGVjaWFsIGhhbmRsaW5nIGluIHRoZSB3b3JrZmxvdywgYnV0IG11c3QgYmUgY29uc3VtZWQgdG8gYWR2YW5jZVxuICAgIC8vIHBhc3QgdGhlbSBpbiB0aGUgZXZlbnQgbG9nXG4gICAgd29ya2Zsb3dDb250ZXh0LmV2ZW50c0NvbnN1bWVyLnN1YnNjcmliZSgoZXZlbnQpID0+IHtcbiAgICAgIGlmICghZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50Q29uc3VtZXJSZXN1bHQuTm90Q29uc3VtZWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbnN1bWUgcnVuX2NyZWF0ZWQgLSBldmVyeSBydW4gaGFzIGV4YWN0bHkgb25lXG4gICAgICBpZiAoZXZlbnQuZXZlbnRUeXBlID09PSAncnVuX2NyZWF0ZWQnKSB7XG4gICAgICAgIHJldHVybiBFdmVudENvbnN1bWVyUmVzdWx0LkNvbnN1bWVkO1xuICAgICAgfVxuXG4gICAgICAvLyBDb25zdW1lIHJ1bl9zdGFydGVkIC0gZXZlcnkgcnVuIGhhcyBleGFjdGx5IG9uZVxuICAgICAgaWYgKGV2ZW50LmV2ZW50VHlwZSA9PT0gJ3J1bl9zdGFydGVkJykge1xuICAgICAgICByZXR1cm4gRXZlbnRDb25zdW1lclJlc3VsdC5Db25zdW1lZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIEV2ZW50Q29uc3VtZXJSZXN1bHQuTm90Q29uc3VtZWQ7XG4gICAgfSk7XG5cbiAgICBjb25zdCB1c2VTdGVwID0gY3JlYXRlVXNlU3RlcCh3b3JrZmxvd0NvbnRleHQpO1xuICAgIGNvbnN0IGNyZWF0ZUhvb2sgPSBjcmVhdGVDcmVhdGVIb29rKHdvcmtmbG93Q29udGV4dCk7XG4gICAgY29uc3Qgc2xlZXAgPSBjcmVhdGVTbGVlcCh3b3JrZmxvd0NvbnRleHQpO1xuXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGBAdHlwZXMvbm9kZWAgc2F5cyBzeW1ib2wgaXMgbm90IHZhbGlkLCBidXQgaXQgZG9lcyB3b3JrXG4gICAgdm1HbG9iYWxUaGlzW1dPUktGTE9XX1VTRV9TVEVQXSA9IHVzZVN0ZXA7XG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGBAdHlwZXMvbm9kZWAgc2F5cyBzeW1ib2wgaXMgbm90IHZhbGlkLCBidXQgaXQgZG9lcyB3b3JrXG4gICAgdm1HbG9iYWxUaGlzW1dPUktGTE9XX0NSRUFURV9IT09LXSA9IGNyZWF0ZUhvb2s7XG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGBAdHlwZXMvbm9kZWAgc2F5cyBzeW1ib2wgaXMgbm90IHZhbGlkLCBidXQgaXQgZG9lcyB3b3JrXG4gICAgdm1HbG9iYWxUaGlzW1dPUktGTE9XX1NMRUVQXSA9IHNsZWVwO1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBgQHR5cGVzL25vZGVgIHNheXMgc3ltYm9sIGlzIG5vdCB2YWxpZCwgYnV0IGl0IGRvZXMgd29ya1xuICAgIHZtR2xvYmFsVGhpc1tXT1JLRkxPV19HRVRfU1RSRUFNX0lEXSA9IChuYW1lc3BhY2U/OiBzdHJpbmcpID0+XG4gICAgICBnZXRXb3JrZmxvd1J1blN0cmVhbUlkKHdvcmtmbG93UnVuLnJ1bklkLCBuYW1lc3BhY2UpO1xuXG4gICAgLy8gRm9yIHRoZSB3b3JrZmxvdyBWTSwgd2Ugc3RvcmUgdGhlIGNvbnRleHQgaW4gYSBzeW1ib2wgb24gdGhlIGBnbG9iYWxUaGlzYCBvYmplY3RcbiAgICBjb25zdCBjdHg6IFdvcmtmbG93TWV0YWRhdGEgPSB7XG4gICAgICB3b3JrZmxvd05hbWU6IHdvcmtmbG93UnVuLndvcmtmbG93TmFtZSxcbiAgICAgIHdvcmtmbG93UnVuSWQ6IHdvcmtmbG93UnVuLnJ1bklkLFxuICAgICAgd29ya2Zsb3dTdGFydGVkQXQ6IG5ldyB2bUdsb2JhbFRoaXMuRGF0ZSgrc3RhcnRlZEF0KSxcbiAgICAgIHVybDogd29ya2Zsb3dCYXNlVXJsLFxuICAgIH07XG5cbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gYEB0eXBlcy9ub2RlYCBzYXlzIHN5bWJvbCBpcyBub3QgdmFsaWQsIGJ1dCBpdCBkb2VzIHdvcmtcbiAgICB2bUdsb2JhbFRoaXNbV09SS0ZMT1dfQ09OVEVYVF9TWU1CT0xdID0gY3R4O1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBgQHR5cGVzL25vZGVgIHNheXMgc3ltYm9sIGlzIG5vdCB2YWxpZCwgYnV0IGl0IGRvZXMgd29ya1xuICAgIHZtR2xvYmFsVGhpc1tTVEFCTEVfVUxJRF0gPSB1bGlkO1xuXG4gICAgLy8gTk9URTogV2lsbCBoYXZlIGEgY29uZmlnIG92ZXJyaWRlIHRvIHVzZSB0aGUgY3VzdG9tIGZldGNoIHN0ZXAuXG4gICAgLy8gICAgICAgRm9yIG5vdyBgZmV0Y2hgIG11c3QgYmUgZXhwbGljaXRseSBpbXBvcnRlZCBmcm9tIGB3b3JrZmxvd2AuXG4gICAgdm1HbG9iYWxUaGlzLmZldGNoID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IHZtR2xvYmFsVGhpcy5FcnJvcihcbiAgICAgICAgYEdsb2JhbCBcImZldGNoXCIgaXMgdW5hdmFpbGFibGUgaW4gd29ya2Zsb3cgZnVuY3Rpb25zLiBVc2UgdGhlIFwiZmV0Y2hcIiBzdGVwIGZ1bmN0aW9uIGZyb20gXCJ3b3JrZmxvd1wiIHRvIG1ha2UgSFRUUCByZXF1ZXN0cy5cXG5cXG5MZWFybiBtb3JlOiBodHRwczovL3VzZXdvcmtmbG93LmRldi9lcnIvJHtFUlJPUl9TTFVHUy5GRVRDSF9JTl9XT1JLRkxPV19GVU5DVElPTn1gXG4gICAgICApO1xuICAgIH07XG5cbiAgICAvLyBPdmVycmlkZSB0aW1lb3V0L2ludGVydmFsIGZ1bmN0aW9ucyB0byB0aHJvdyBoZWxwZnVsIGVycm9yc1xuICAgIC8vIFRoZXNlIGFyZSBub3Qgc3VwcG9ydGVkIGluIHdvcmtmbG93IGZ1bmN0aW9ucyBiZWNhdXNlIHRoZXkgcmVseSBvblxuICAgIC8vIGFzeW5jaHJvbm91cyBzY2hlZHVsaW5nIHdoaWNoIGJyZWFrcyBkZXRlcm1pbmlzdGljIHJlcGxheVxuICAgIGNvbnN0IHRpbWVvdXRFcnJvck1lc3NhZ2UgPVxuICAgICAgJ1RpbWVvdXQgZnVuY3Rpb25zIGxpa2UgXCJzZXRUaW1lb3V0XCIgYW5kIFwic2V0SW50ZXJ2YWxcIiBhcmUgbm90IHN1cHBvcnRlZCBpbiB3b3JrZmxvdyBmdW5jdGlvbnMuIFVzZSB0aGUgXCJzbGVlcFwiIGZ1bmN0aW9uIGZyb20gXCJ3b3JrZmxvd1wiIGZvciB0aW1lLWJhc2VkIGRlbGF5cy4nO1xuXG4gICAgKHZtR2xvYmFsVGhpcyBhcyBhbnkpLnNldFRpbWVvdXQgPSAoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IodGltZW91dEVycm9yTWVzc2FnZSwge1xuICAgICAgICBzbHVnOiBFUlJPUl9TTFVHUy5USU1FT1VUX0ZVTkNUSU9OU19JTl9XT1JLRkxPVyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgKHZtR2xvYmFsVGhpcyBhcyBhbnkpLnNldEludGVydmFsID0gKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IFdvcmtmbG93UnVudGltZUVycm9yKHRpbWVvdXRFcnJvck1lc3NhZ2UsIHtcbiAgICAgICAgc2x1ZzogRVJST1JfU0xVR1MuVElNRU9VVF9GVU5DVElPTlNfSU5fV09SS0ZMT1csXG4gICAgICB9KTtcbiAgICB9O1xuICAgICh2bUdsb2JhbFRoaXMgYXMgYW55KS5jbGVhclRpbWVvdXQgPSAoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IodGltZW91dEVycm9yTWVzc2FnZSwge1xuICAgICAgICBzbHVnOiBFUlJPUl9TTFVHUy5USU1FT1VUX0ZVTkNUSU9OU19JTl9XT1JLRkxPVyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgKHZtR2xvYmFsVGhpcyBhcyBhbnkpLmNsZWFySW50ZXJ2YWwgPSAoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IodGltZW91dEVycm9yTWVzc2FnZSwge1xuICAgICAgICBzbHVnOiBFUlJPUl9TTFVHUy5USU1FT1VUX0ZVTkNUSU9OU19JTl9XT1JLRkxPVyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgKHZtR2xvYmFsVGhpcyBhcyBhbnkpLnNldEltbWVkaWF0ZSA9ICgpID0+IHtcbiAgICAgIHRocm93IG5ldyBXb3JrZmxvd1J1bnRpbWVFcnJvcih0aW1lb3V0RXJyb3JNZXNzYWdlLCB7XG4gICAgICAgIHNsdWc6IEVSUk9SX1NMVUdTLlRJTUVPVVRfRlVOQ1RJT05TX0lOX1dPUktGTE9XLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICAodm1HbG9iYWxUaGlzIGFzIGFueSkuY2xlYXJJbW1lZGlhdGUgPSAoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IodGltZW91dEVycm9yTWVzc2FnZSwge1xuICAgICAgICBzbHVnOiBFUlJPUl9TTFVHUy5USU1FT1VUX0ZVTkNUSU9OU19JTl9XT1JLRkxPVyxcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBgUmVxdWVzdGAgYW5kIGBSZXNwb25zZWAgYXJlIHNwZWNpYWwgYnVpbHQtaW4gY2xhc3NlcyB0aGF0IGludm9rZSBzdGVwc1xuICAgIC8vIGZvciB0aGUgYGpzb24oKWAsIGB0ZXh0KClgIGFuZCBgYXJyYXlCdWZmZXIoKWAgaW5zdGFuY2UgbWV0aG9kc1xuICAgIGNsYXNzIFJlcXVlc3QgaW1wbGVtZW50cyBnbG9iYWxUaGlzLlJlcXVlc3Qge1xuICAgICAgY2FjaGUhOiBnbG9iYWxUaGlzLlJlcXVlc3RbJ2NhY2hlJ107XG4gICAgICBjcmVkZW50aWFscyE6IGdsb2JhbFRoaXMuUmVxdWVzdFsnY3JlZGVudGlhbHMnXTtcbiAgICAgIGRlc3RpbmF0aW9uITogZ2xvYmFsVGhpcy5SZXF1ZXN0WydkZXN0aW5hdGlvbiddO1xuICAgICAgaGVhZGVycyE6IEhlYWRlcnM7XG4gICAgICBpbnRlZ3JpdHkhOiBzdHJpbmc7XG4gICAgICBtZXRob2QhOiBzdHJpbmc7XG4gICAgICBtb2RlITogZ2xvYmFsVGhpcy5SZXF1ZXN0Wydtb2RlJ107XG4gICAgICByZWRpcmVjdCE6IGdsb2JhbFRoaXMuUmVxdWVzdFsncmVkaXJlY3QnXTtcbiAgICAgIHJlZmVycmVyITogc3RyaW5nO1xuICAgICAgcmVmZXJyZXJQb2xpY3khOiBnbG9iYWxUaGlzLlJlcXVlc3RbJ3JlZmVycmVyUG9saWN5J107XG4gICAgICB1cmwhOiBzdHJpbmc7XG4gICAgICBrZWVwYWxpdmUhOiBib29sZWFuO1xuICAgICAgc2lnbmFsITogQWJvcnRTaWduYWw7XG4gICAgICBkdXBsZXghOiAnaGFsZic7XG4gICAgICBib2R5ITogUmVhZGFibGVTdHJlYW08YW55PiB8IG51bGw7XG5cbiAgICAgIGNvbnN0cnVjdG9yKGlucHV0OiBhbnksIGluaXQ/OiBSZXF1ZXN0SW5pdCkge1xuICAgICAgICAvLyBIYW5kbGUgVVJMIGlucHV0XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnIHx8IGlucHV0IGluc3RhbmNlb2Ygdm1HbG9iYWxUaGlzLlVSTCkge1xuICAgICAgICAgIGNvbnN0IHVybFN0cmluZyA9IFN0cmluZyhpbnB1dCk7XG4gICAgICAgICAgLy8gVmFsaWRhdGUgVVJMIGZvcm1hdFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBuZXcgdm1HbG9iYWxUaGlzLlVSTCh1cmxTdHJpbmcpO1xuICAgICAgICAgICAgdGhpcy51cmwgPSB1cmxTdHJpbmc7XG4gICAgICAgICAgfSBjYXRjaCAoY2F1c2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEZhaWxlZCB0byBwYXJzZSBVUkwgZnJvbSAke3VybFN0cmluZ31gLCB7XG4gICAgICAgICAgICAgIGNhdXNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElucHV0IGlzIGEgUmVxdWVzdCBvYmplY3QgLSBjbG9uZSBpdHMgcHJvcGVydGllc1xuICAgICAgICAgIHRoaXMudXJsID0gaW5wdXQudXJsO1xuICAgICAgICAgIGlmICghaW5pdCkge1xuICAgICAgICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgdm1HbG9iYWxUaGlzLkhlYWRlcnMoaW5wdXQuaGVhZGVycyk7XG4gICAgICAgICAgICB0aGlzLmJvZHkgPSBpbnB1dC5ib2R5O1xuICAgICAgICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbnB1dC5jcmVkZW50aWFscztcbiAgICAgICAgICAgIHRoaXMuY2FjaGUgPSBpbnB1dC5jYWNoZTtcbiAgICAgICAgICAgIHRoaXMucmVkaXJlY3QgPSBpbnB1dC5yZWRpcmVjdDtcbiAgICAgICAgICAgIHRoaXMucmVmZXJyZXIgPSBpbnB1dC5yZWZlcnJlcjtcbiAgICAgICAgICAgIHRoaXMucmVmZXJyZXJQb2xpY3kgPSBpbnB1dC5yZWZlcnJlclBvbGljeTtcbiAgICAgICAgICAgIHRoaXMuaW50ZWdyaXR5ID0gaW5wdXQuaW50ZWdyaXR5O1xuICAgICAgICAgICAgdGhpcy5rZWVwYWxpdmUgPSBpbnB1dC5rZWVwYWxpdmU7XG4gICAgICAgICAgICB0aGlzLnNpZ25hbCA9IGlucHV0LnNpZ25hbDtcbiAgICAgICAgICAgIHRoaXMuZHVwbGV4ID0gaW5wdXQuZHVwbGV4O1xuICAgICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IGlucHV0LmRlc3RpbmF0aW9uO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBJZiBpbml0IGlzIHByb3ZpZGVkLCBtZXJnZTogdXNlIHNvdXJjZSBwcm9wZXJ0aWVzLCB0aGVuIG92ZXJyaWRlIHdpdGggaW5pdFxuICAgICAgICAgIC8vIENvcHkgYWxsIHByb3BlcnRpZXMgZnJvbSB0aGUgc291cmNlIFJlcXVlc3QgZmlyc3RcbiAgICAgICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZDtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgdm1HbG9iYWxUaGlzLkhlYWRlcnMoaW5wdXQuaGVhZGVycyk7XG4gICAgICAgICAgdGhpcy5ib2R5ID0gaW5wdXQuYm9keTtcbiAgICAgICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlO1xuICAgICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbnB1dC5jcmVkZW50aWFscztcbiAgICAgICAgICB0aGlzLmNhY2hlID0gaW5wdXQuY2FjaGU7XG4gICAgICAgICAgdGhpcy5yZWRpcmVjdCA9IGlucHV0LnJlZGlyZWN0O1xuICAgICAgICAgIHRoaXMucmVmZXJyZXIgPSBpbnB1dC5yZWZlcnJlcjtcbiAgICAgICAgICB0aGlzLnJlZmVycmVyUG9saWN5ID0gaW5wdXQucmVmZXJyZXJQb2xpY3k7XG4gICAgICAgICAgdGhpcy5pbnRlZ3JpdHkgPSBpbnB1dC5pbnRlZ3JpdHk7XG4gICAgICAgICAgdGhpcy5rZWVwYWxpdmUgPSBpbnB1dC5rZWVwYWxpdmU7XG4gICAgICAgICAgdGhpcy5zaWduYWwgPSBpbnB1dC5zaWduYWw7XG4gICAgICAgICAgdGhpcy5kdXBsZXggPSBpbnB1dC5kdXBsZXg7XG4gICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IGlucHV0LmRlc3RpbmF0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3ZlcnJpZGUgd2l0aCBpbml0IG9wdGlvbnMgaWYgcHJvdmlkZWRcbiAgICAgICAgLy8gU2V0IG1ldGhvZFxuICAgICAgICBpZiAoaW5pdD8ubWV0aG9kKSB7XG4gICAgICAgICAgdGhpcy5tZXRob2QgPSBpbml0Lm1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLm1ldGhvZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAvLyBGYWxsYmFjayB0byBkZWZhdWx0IGZvciBzdHJpbmcgaW5wdXQgY2FzZVxuICAgICAgICAgIHRoaXMubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgaGVhZGVyc1xuICAgICAgICBpZiAoaW5pdD8uaGVhZGVycykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyB2bUdsb2JhbFRoaXMuSGVhZGVycyhpbml0LmhlYWRlcnMpO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgICBpbnB1dCBpbnN0YW5jZW9mIHZtR2xvYmFsVGhpcy5VUkxcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy8gRm9yIHN0cmluZy9VUkwgaW5wdXQsIGNyZWF0ZSBlbXB0eSBoZWFkZXJzXG4gICAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IHZtR2xvYmFsVGhpcy5IZWFkZXJzKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgb3RoZXIgcHJvcGVydGllcyB3aXRoIGluaXQgdmFsdWVzIG9yIGRlZmF1bHRzXG4gICAgICAgIGlmIChpbml0Py5tb2RlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLm1vZGUgPSBpbml0Lm1vZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMubW9kZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLm1vZGUgPSAnY29ycyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5pdD8uY3JlZGVudGlhbHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbml0LmNyZWRlbnRpYWxzO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLmNyZWRlbnRpYWxzICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSAnc2FtZS1vcmlnaW4nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYGFueWAgY2FzdCBoZXJlIGJlY2F1c2UgQHR5cGVzL25vZGUgdjIyIGRvZXMgbm90IHlldCBoYXZlIGBjYWNoZWBcbiAgICAgICAgaWYgKChpbml0IGFzIGFueSk/LmNhY2hlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLmNhY2hlID0gKGluaXQgYXMgYW55KS5jYWNoZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5jYWNoZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLmNhY2hlID0gJ2RlZmF1bHQnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluaXQ/LnJlZGlyZWN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLnJlZGlyZWN0ID0gaW5pdC5yZWRpcmVjdDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5yZWRpcmVjdCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLnJlZGlyZWN0ID0gJ2ZvbGxvdyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5pdD8ucmVmZXJyZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMucmVmZXJyZXIgPSBpbml0LnJlZmVycmVyO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLnJlZmVycmVyICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMucmVmZXJyZXIgPSAnYWJvdXQ6Y2xpZW50JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbml0Py5yZWZlcnJlclBvbGljeSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5yZWZlcnJlclBvbGljeSA9IGluaXQucmVmZXJyZXJQb2xpY3k7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMucmVmZXJyZXJQb2xpY3kgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5yZWZlcnJlclBvbGljeSA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluaXQ/LmludGVncml0eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5pbnRlZ3JpdHkgPSBpbml0LmludGVncml0eTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5pbnRlZ3JpdHkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5pbnRlZ3JpdHkgPSAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbml0Py5rZWVwYWxpdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMua2VlcGFsaXZlID0gaW5pdC5rZWVwYWxpdmU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMua2VlcGFsaXZlICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICB0aGlzLmtlZXBhbGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluaXQ/LnNpZ25hbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIEFib3J0U2lnbmFsIHN0dWJcbiAgICAgICAgICB0aGlzLnNpZ25hbCA9IGluaXQuc2lnbmFsO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnNpZ25hbCkge1xuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBBYm9ydFNpZ25hbCBzdHViXG4gICAgICAgICAgdGhpcy5zaWduYWwgPSB7IGFib3J0ZWQ6IGZhbHNlIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuZHVwbGV4KSB7XG4gICAgICAgICAgdGhpcy5kdXBsZXggPSAnaGFsZic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuZGVzdGluYXRpb24pIHtcbiAgICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gJ2RvY3VtZW50JztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJvZHkgPSBpbml0Py5ib2R5O1xuXG4gICAgICAgIC8vIFZhbGlkYXRlIHRoYXQgR0VUL0hFQUQgbWV0aG9kcyBkb24ndCBoYXZlIGEgYm9keVxuICAgICAgICBpZiAoXG4gICAgICAgICAgYm9keSAhPT0gbnVsbCAmJlxuICAgICAgICAgIGJvZHkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgUmVxdWVzdCB3aXRoIEdFVC9IRUFEIG1ldGhvZCBjYW5ub3QgaGF2ZSBib2R5LmApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RvcmUgdGhlIG9yaWdpbmFsIEJvZHlJbml0IGZvciBzZXJpYWxpemF0aW9uXG4gICAgICAgIGlmIChib2R5ICE9PSBudWxsICYmIGJvZHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIENyZWF0ZSBhIFwiZmFrZVwiIFJlYWRhYmxlU3RyZWFtIHRoYXQgc3RvcmVzIHRoZSBvcmlnaW5hbCBib2R5XG4gICAgICAgICAgLy8gVGhpcyBhdm9pZHMgZG9pbmcgYXN5bmMgd29yayBkdXJpbmcgd29ya2Zsb3cgcmVwbGF5XG4gICAgICAgICAgdGhpcy5ib2R5ID0gT2JqZWN0LmNyZWF0ZSh2bUdsb2JhbFRoaXMuUmVhZGFibGVTdHJlYW0ucHJvdG90eXBlLCB7XG4gICAgICAgICAgICBbQk9EWV9JTklUX1NZTUJPTF06IHtcbiAgICAgICAgICAgICAgdmFsdWU6IGJvZHksXG4gICAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5ib2R5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjbG9uZSgpOiBSZXF1ZXN0IHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBnZXQgYm9keVVzZWQoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogaW1wbGVtZW50IHRoZXNlXG4gICAgICBibG9iITogKCkgPT4gUHJvbWlzZTxCbG9iPjtcbiAgICAgIGZvcm1EYXRhITogKCkgPT4gUHJvbWlzZTxGb3JtRGF0YT47XG5cbiAgICAgIGFycmF5QnVmZmVyITogKCkgPT4gUHJvbWlzZTxBcnJheUJ1ZmZlcj47XG4gICAgICBqc29uITogKCkgPT4gUHJvbWlzZTxhbnk+O1xuICAgICAgdGV4dCE6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcblxuICAgICAgYXN5bmMgYnl0ZXMoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShhd2FpdCB0aGlzLmFycmF5QnVmZmVyKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICB2bUdsb2JhbFRoaXMuUmVxdWVzdCA9IFJlcXVlc3Q7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhSZXF1ZXN0LnByb3RvdHlwZSwge1xuICAgICAgYXJyYXlCdWZmZXI6IHtcbiAgICAgICAgdmFsdWU6IHVzZVN0ZXA8W10sIEFycmF5QnVmZmVyPignX19idWlsdGluX3Jlc3BvbnNlX2FycmF5X2J1ZmZlcicpLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGpzb246IHtcbiAgICAgICAgdmFsdWU6IHVzZVN0ZXA8W10sIGFueT4oJ19fYnVpbHRpbl9yZXNwb25zZV9qc29uJyksXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgICAgdGV4dDoge1xuICAgICAgICB2YWx1ZTogdXNlU3RlcDxbXSwgc3RyaW5nPignX19idWlsdGluX3Jlc3BvbnNlX3RleHQnKSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjbGFzcyBSZXNwb25zZSBpbXBsZW1lbnRzIGdsb2JhbFRoaXMuUmVzcG9uc2Uge1xuICAgICAgdHlwZSE6IGdsb2JhbFRoaXMuUmVzcG9uc2VbJ3R5cGUnXTtcbiAgICAgIHVybCE6IHN0cmluZztcbiAgICAgIHN0YXR1cyE6IG51bWJlcjtcbiAgICAgIHN0YXR1c1RleHQhOiBzdHJpbmc7XG4gICAgICBib2R5ITogUmVhZGFibGVTdHJlYW08VWludDhBcnJheT4gfCBudWxsO1xuICAgICAgaGVhZGVycyE6IEhlYWRlcnM7XG4gICAgICByZWRpcmVjdGVkITogYm9vbGVhbjtcblxuICAgICAgY29uc3RydWN0b3IoYm9keT86IGFueSwgaW5pdD86IFJlc3BvbnNlSW5pdCkge1xuICAgICAgICB0aGlzLnN0YXR1cyA9IGluaXQ/LnN0YXR1cyA/PyAyMDA7XG4gICAgICAgIHRoaXMuc3RhdHVzVGV4dCA9IGluaXQ/LnN0YXR1c1RleHQgPz8gJyc7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyB2bUdsb2JhbFRoaXMuSGVhZGVycyhpbml0Py5oZWFkZXJzKTtcbiAgICAgICAgdGhpcy50eXBlID0gJ2RlZmF1bHQnO1xuICAgICAgICB0aGlzLnVybCA9ICcnO1xuICAgICAgICB0aGlzLnJlZGlyZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICAvLyBWYWxpZGF0ZSB0aGF0IG51bGwtYm9keSBzdGF0dXMgY29kZXMgZG9uJ3QgaGF2ZSBhIGJvZHlcbiAgICAgICAgLy8gUGVyIEhUVFAgc3BlYzogMjA0IChObyBDb250ZW50KSwgMjA1IChSZXNldCBDb250ZW50KSwgYW5kIDMwNCAoTm90IE1vZGlmaWVkKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgYm9keSAhPT0gbnVsbCAmJlxuICAgICAgICAgIGJvZHkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICh0aGlzLnN0YXR1cyA9PT0gMjA0IHx8IHRoaXMuc3RhdHVzID09PSAyMDUgfHwgdGhpcy5zdGF0dXMgPT09IDMwNClcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIGBSZXNwb25zZSBjb25zdHJ1Y3RvcjogSW52YWxpZCByZXNwb25zZSBzdGF0dXMgY29kZSAke3RoaXMuc3RhdHVzfWBcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RvcmUgdGhlIG9yaWdpbmFsIEJvZHlJbml0IGZvciBzZXJpYWxpemF0aW9uXG4gICAgICAgIGlmIChib2R5ICE9PSBudWxsICYmIGJvZHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIENyZWF0ZSBhIFwiZmFrZVwiIFJlYWRhYmxlU3RyZWFtIHRoYXQgc3RvcmVzIHRoZSBvcmlnaW5hbCBib2R5XG4gICAgICAgICAgLy8gVGhpcyBhdm9pZHMgZG9pbmcgYXN5bmMgd29yayBkdXJpbmcgd29ya2Zsb3cgcmVwbGF5XG4gICAgICAgICAgdGhpcy5ib2R5ID0gT2JqZWN0LmNyZWF0ZSh2bUdsb2JhbFRoaXMuUmVhZGFibGVTdHJlYW0ucHJvdG90eXBlLCB7XG4gICAgICAgICAgICBbQk9EWV9JTklUX1NZTUJPTF06IHtcbiAgICAgICAgICAgICAgdmFsdWU6IGJvZHksXG4gICAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5ib2R5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUT0RPOiBpbXBsZW1lbnQgdGhlc2VcbiAgICAgIGNsb25lITogKCkgPT4gUmVzcG9uc2U7XG4gICAgICBibG9iITogKCkgPT4gUHJvbWlzZTxnbG9iYWxUaGlzLkJsb2I+O1xuICAgICAgZm9ybURhdGEhOiAoKSA9PiBQcm9taXNlPGdsb2JhbFRoaXMuRm9ybURhdGE+O1xuXG4gICAgICBnZXQgb2soKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5zdGF0dXMgPCAzMDA7XG4gICAgICB9XG5cbiAgICAgIGdldCBib2R5VXNlZCgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBhcnJheUJ1ZmZlciE6ICgpID0+IFByb21pc2U8QXJyYXlCdWZmZXI+O1xuICAgICAganNvbiE6ICgpID0+IFByb21pc2U8YW55PjtcbiAgICAgIHRleHQhOiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG5cbiAgICAgIGFzeW5jIGJ5dGVzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgdGhpcy5hcnJheUJ1ZmZlcigpKTtcbiAgICAgIH1cblxuICAgICAgc3RhdGljIGpzb24oZGF0YTogYW55LCBpbml0PzogUmVzcG9uc2VJbml0KTogUmVzcG9uc2Uge1xuICAgICAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSBuZXcgdm1HbG9iYWxUaGlzLkhlYWRlcnMoaW5pdD8uaGVhZGVycyk7XG4gICAgICAgIGlmICghaGVhZGVycy5oYXMoJ2NvbnRlbnQtdHlwZScpKSB7XG4gICAgICAgICAgaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7IC4uLmluaXQsIGhlYWRlcnMgfSk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyBlcnJvcigpOiBSZXNwb25zZSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgc3RhdGljIHJlZGlyZWN0KHVybDogc3RyaW5nIHwgVVJMLCBzdGF0dXM6IG51bWJlciA9IDMwMik6IFJlc3BvbnNlIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgc3RhdHVzIGNvZGUgLSBvbmx5IHNwZWNpZmljIHJlZGlyZWN0IGNvZGVzIGFyZSBhbGxvd2VkXG4gICAgICAgIGlmICghWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XS5pbmNsdWRlcyhzdGF0dXMpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICAgICAgICBgSW52YWxpZCByZWRpcmVjdCBzdGF0dXMgY29kZTogJHtzdGF0dXN9LiBNdXN0IGJlIG9uZSBvZjogMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSByZXNwb25zZSB3aXRoIExvY2F0aW9uIGhlYWRlclxuICAgICAgICBjb25zdCBoZWFkZXJzID0gbmV3IHZtR2xvYmFsVGhpcy5IZWFkZXJzKCk7XG4gICAgICAgIGhlYWRlcnMuc2V0KCdMb2NhdGlvbicsIFN0cmluZyh1cmwpKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IE9iamVjdC5jcmVhdGUoUmVzcG9uc2UucHJvdG90eXBlKTtcbiAgICAgICAgcmVzcG9uc2Uuc3RhdHVzID0gc3RhdHVzO1xuICAgICAgICByZXNwb25zZS5zdGF0dXNUZXh0ID0gJyc7XG4gICAgICAgIHJlc3BvbnNlLmhlYWRlcnMgPSBoZWFkZXJzO1xuICAgICAgICByZXNwb25zZS5ib2R5ID0gbnVsbDtcbiAgICAgICAgcmVzcG9uc2UudHlwZSA9ICdkZWZhdWx0JztcbiAgICAgICAgcmVzcG9uc2UudXJsID0gJyc7XG4gICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHZtR2xvYmFsVGhpcy5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoUmVzcG9uc2UucHJvdG90eXBlLCB7XG4gICAgICBhcnJheUJ1ZmZlcjoge1xuICAgICAgICB2YWx1ZTogdXNlU3RlcDxbXSwgQXJyYXlCdWZmZXI+KCdfX2J1aWx0aW5fcmVzcG9uc2VfYXJyYXlfYnVmZmVyJyksXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgICAganNvbjoge1xuICAgICAgICB2YWx1ZTogdXNlU3RlcDxbXSwgYW55PignX19idWlsdGluX3Jlc3BvbnNlX2pzb24nKSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB0ZXh0OiB7XG4gICAgICAgIHZhbHVlOiB1c2VTdGVwPFtdLCBzdHJpbmc+KCdfX2J1aWx0aW5fcmVzcG9uc2VfdGV4dCcpLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNsYXNzIFJlYWRhYmxlU3RyZWFtPFQ+IGltcGxlbWVudHMgZ2xvYmFsVGhpcy5SZWFkYWJsZVN0cmVhbTxUPiB7XG4gICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBnZXQgbG9ja2VkKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNhbmNlbCgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIGdldFJlYWRlcigpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIHBpcGVUaHJvdWdoKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgcGlwZVRvKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgdGVlKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgdmFsdWVzKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgc3RhdGljIGZyb20oKTogYW55IHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuXG4gICAgICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdm1HbG9iYWxUaGlzLlJlYWRhYmxlU3RyZWFtID0gUmVhZGFibGVTdHJlYW07XG5cbiAgICBjbGFzcyBXcml0YWJsZVN0cmVhbTxUPiBpbXBsZW1lbnRzIGdsb2JhbFRoaXMuV3JpdGFibGVTdHJlYW08VD4ge1xuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0IGxvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBhYm9ydCgpOiBhbnkge1xuICAgICAgICBFTk9UU1VQKCk7XG4gICAgICB9XG5cbiAgICAgIGNsb3NlKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0V3JpdGVyKCk6IGFueSB7XG4gICAgICAgIEVOT1RTVVAoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdm1HbG9iYWxUaGlzLldyaXRhYmxlU3RyZWFtID0gV3JpdGFibGVTdHJlYW07XG5cbiAgICBjbGFzcyBUcmFuc2Zvcm1TdHJlYW08SSwgTz4gaW1wbGVtZW50cyBnbG9iYWxUaGlzLlRyYW5zZm9ybVN0cmVhbTxJLCBPPiB7XG4gICAgICByZWFkYWJsZTogZ2xvYmFsVGhpcy5SZWFkYWJsZVN0cmVhbTxPPjtcbiAgICAgIHdyaXRhYmxlOiBnbG9iYWxUaGlzLldyaXRhYmxlU3RyZWFtPEk+O1xuXG4gICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgRU5PVFNVUCgpO1xuICAgICAgfVxuICAgIH1cbiAgICB2bUdsb2JhbFRoaXMuVHJhbnNmb3JtU3RyZWFtID0gVHJhbnNmb3JtU3RyZWFtO1xuXG4gICAgLy8gRXZlbnR1YWxseSB3ZSdsbCBwcm9iYWJseSB3YW50IHRvIHByb3ZpZGUgb3VyIG93biBgY29uc29sZWAgb2JqZWN0LFxuICAgIC8vIGJ1dCBmb3Igbm93IHdlJ2xsIGp1c3QgZXhwb3NlIHRoZSBnbG9iYWwgb25lLlxuICAgIHZtR2xvYmFsVGhpcy5jb25zb2xlID0gZ2xvYmFsVGhpcy5jb25zb2xlO1xuXG4gICAgLy8gSEFDSzogcHJvcGFnYXRlIHN5bWJvbCBuZWVkZWQgZm9yIEFJIGdhdGV3YXkgdXNhZ2VcbiAgICBjb25zdCBTWU1CT0xfRk9SX1JFUV9DT05URVhUID0gU3ltYm9sLmZvcignQHZlcmNlbC9yZXF1ZXN0LWNvbnRleHQnKTtcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gYEB0eXBlcy9ub2RlYCBzYXlzIHN5bWJvbCBpcyBub3QgdmFsaWQsIGJ1dCBpdCBkb2VzIHdvcmtcbiAgICB2bUdsb2JhbFRoaXNbU1lNQk9MX0ZPUl9SRVFfQ09OVEVYVF0gPSAoZ2xvYmFsVGhpcyBhcyBhbnkpW1xuICAgICAgU1lNQk9MX0ZPUl9SRVFfQ09OVEVYVFxuICAgIF07XG5cbiAgICAvLyBHZXQgYSByZWZlcmVuY2UgdG8gdGhlIHVzZXItZGVmaW5lZCB3b3JrZmxvdyBmdW5jdGlvbi5cbiAgICAvLyBUaGUgZmlsZW5hbWUgcGFyYW1ldGVyIGVuc3VyZXMgc3RhY2sgdHJhY2VzIHNob3cgYSBtZWFuaW5nZnVsIG5hbWVcbiAgICAvLyAoZS5nLiwgXCJleGFtcGxlL3dvcmtmbG93cy85OV9lMmUudHNcIikgaW5zdGVhZCBvZiBcImV2YWxtYWNoaW5lLjxhbm9ueW1vdXM+XCIuXG4gICAgY29uc3QgcGFyc2VkTmFtZSA9IHBhcnNlV29ya2Zsb3dOYW1lKHdvcmtmbG93UnVuLndvcmtmbG93TmFtZSk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBwYXJzZWROYW1lPy5tb2R1bGVTcGVjaWZpZXIgfHwgd29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lO1xuXG4gICAgLy8gRXZhbHVhdGUgdGhlIHdvcmtmbG93IGJ1bmRsZSBhZ2FpbnN0IHRoZSBmcmVzaCBjb250ZXh0IHVzaW5nIGFcbiAgICAvLyBwcm9jZXNzLXdpZGUgY2FjaGUgb2YgdGhlIGNvbXBpbGVkIGB2bS5TY3JpcHRgLiBUaGUgYnVuZGxlIGlzIHRoZSBzYW1lXG4gICAgLy8gc3RyaW5nIGZvciBldmVyeSByZXBsYXkgYW5kIGV2ZXJ5IGludm9jYXRpb24gaW4gdGhpcyBwcm9jZXNzLCBhbmRcbiAgICAvLyBjb21waWxhdGlvbiBpcyBhIHB1cmUgZnVuY3Rpb24gb2YgYChjb2RlLCBmaWxlbmFtZSlgLCBzbyByZXVzaW5nIHRoZVxuICAgIC8vIGNvbXBpbGVkIFNjcmlwdCBhY3Jvc3MgcmVwbGF5cyBpcyBkZXRlcm1pbmlzbS1zYWZlOiBpdCBwcm9kdWNlcyB0aGUgc2FtZVxuICAgIC8vIHdvcmtmbG93IGZ1bmN0aW9uIGFuZCB0aGUgc2FtZSBgZmlsZW5hbWVgIHNvdXJjZSBhdHRyaWJ1dGlvbiBhc1xuICAgIC8vIHJlLXBhcnNpbmcgdGhlIGJ1bmRsZSBldmVyeSB0aW1lLCBidXQgc2tpcHMgdGhlIChleHBlbnNpdmUpIHJlLXBhcnNlLlxuICAgIC8vIEV2YWx1YXRpbmcgdGhlIGJ1bmRsZSByZWdpc3RlcnMgZXZlcnkgd29ya2Zsb3cgb25cbiAgICAvLyBgZ2xvYmFsVGhpcy5fX3ByaXZhdGVfd29ya2Zsb3dzYDsgdGhlIHRyYWlsaW5nIGxvb2t1cCBleHByZXNzaW9uIHRoZW5cbiAgICAvLyByZXRyaWV2ZXMgdGhlIHJlcXVlc3RlZCB3b3JrZmxvdyBmdW5jdGlvbi4gVGhlIGxvb2t1cCBpcyBldmFsdWF0ZWQgYXMgYVxuICAgIC8vIHNlcGFyYXRlIGNhY2hlZCBTY3JpcHQgdW5kZXIgdGhlIHNhbWUgYGZpbGVuYW1lYCwgc28gZXJyb3Igc3RhY2sgZnJhbWVzXG4gICAgLy8gc3RpbGwgYXR0cmlidXRlIHRvIHRoZSB3b3JrZmxvdydzIHNvdXJjZSBmaWxlIChgcmVtYXBFcnJvclN0YWNrYCBrZXlzIG9uXG4gICAgLy8gYGZpbGVuYW1lYCkuIFRoZSBvbmUgYmVoYXZpb3VyYWwgZGlmZmVyZW5jZSBmcm9tIHRoZSBwcmV2aW91c1xuICAgIC8vIHNpbmdsZS1jb21iaW5lZC1zdHJpbmcgYXBwcm9hY2ggaXMgdGhlICpsaW5lIG51bWJlciogb2YgYW4gZXJyb3IgdGhyb3duXG4gICAgLy8gYnkgdGhlIGxvb2t1cCBleHByZXNzaW9uIGl0c2VsZjogaXQgbm93IHJlcG9ydHMgbGluZSAxIG9mIHRoZSBsb29rdXBcbiAgICAvLyBTY3JpcHQgcmF0aGVyIHRoYW4gdGhlIGxpbmUganVzdCBwYXN0IHRoZSBlbmQgb2YgdGhlIGJ1bmRsZS4gVGhhdCBwYXRoXG4gICAgLy8gaXMgcmFyZSAoaXQgcmVxdWlyZXMgdGhlIGxvb2t1cCBgPy5nZXQoLi4uKWAgZXhwcmVzc2lvbiB0byB0aHJvdykgYW5kXG4gICAgLy8gZG9lcyBub3QgYWZmZWN0IHRoZSB3b3JrZmxvdyBmdW5jdGlvbiBvciByZXBsYXkgZGV0ZXJtaW5pc20uXG4gICAgcnVuQ2FjaGVkV29ya2Zsb3dTY3JpcHQod29ya2Zsb3dDb2RlLCBmaWxlbmFtZSwgY29udGV4dCk7XG4gICAgY29uc3Qgd29ya2Zsb3dGbiA9IHJ1bkNhY2hlZFdvcmtmbG93U2NyaXB0KFxuICAgICAgYGdsb2JhbFRoaXMuX19wcml2YXRlX3dvcmtmbG93cz8uZ2V0KCR7SlNPTi5zdHJpbmdpZnkod29ya2Zsb3dSdW4ud29ya2Zsb3dOYW1lKX0pYCxcbiAgICAgIGZpbGVuYW1lLFxuICAgICAgY29udGV4dFxuICAgICk7XG5cbiAgICBpZiAodHlwZW9mIHdvcmtmbG93Rm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBXb3JrZmxvd05vdFJlZ2lzdGVyZWRFcnJvcih3b3JrZmxvd1J1bi53b3JrZmxvd05hbWUpO1xuICAgIH1cblxuICAgIC8vIENoYWluIHdvcmtmbG93IGFyZ3VtZW50IGh5ZHJhdGlvbiBvbnRvIHRoZSBwcm9taXNlUXVldWUgc28gdGhhdCB0aGVcbiAgICAvLyB1bmNvbnN1bWVkIGV2ZW50IGNoZWNrICh3aGljaCB3YWl0cyBmb3IgdGhlIHF1ZXVlIHRvIGRyYWluKSBkb2Vzbid0XG4gICAgLy8gZmlyZSBkdXJpbmcgdGhlIGFzeW5jIGdhcCBiZXR3ZWVuIHJ1bl9zdGFydGVkIGNvbnN1bXB0aW9uIGFuZCB0aGVcbiAgICAvLyB3b3JrZmxvdyBmdW5jdGlvbiBzdWJzY3JpYmluZyBpdHMgZmlyc3Qgc3RlcCBjYWxsYmFja3MuXG4gICAgbGV0IGFyZ3M6IHVua25vd25bXSA9IFtdO1xuICAgIHdvcmtmbG93Q29udGV4dC5wcm9taXNlUXVldWUgPSB3b3JrZmxvd0NvbnRleHQucHJvbWlzZVF1ZXVlLnRoZW4oXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIGFyZ3MgPSBhd2FpdCBoeWRyYXRlV29ya2Zsb3dBcmd1bWVudHMoXG4gICAgICAgICAgd29ya2Zsb3dSdW4uaW5wdXQsXG4gICAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWQsXG4gICAgICAgICAgZW5jcnlwdGlvbktleSxcbiAgICAgICAgICB2bUdsb2JhbFRoaXNcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICApO1xuICAgIGF3YWl0IHdvcmtmbG93Q29udGV4dC5wcm9taXNlUXVldWU7XG5cbiAgICBzcGFuPy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd0FyZ3VtZW50c0NvdW50KGFyZ3MubGVuZ3RoKSxcbiAgICB9KTtcblxuICAgIC8vIEludm9rZSB1c2VyIHdvcmtmbG93XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgIHdvcmtmbG93Rm4oLi4uYXJncyksXG4gICAgICAgIHdvcmtmbG93RGlzY29udGludWF0aW9uLnByb21pc2UsXG4gICAgICBdKTtcblxuICAgICAgY29uc3QgZGVoeWRyYXRlZCA9IGF3YWl0IGRlaHlkcmF0ZVdvcmtmbG93UmV0dXJuVmFsdWUoXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWQsXG4gICAgICAgIGVuY3J5cHRpb25LZXksXG4gICAgICAgIHZtR2xvYmFsVGhpc1xuICAgICAgKTtcblxuICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgIC4uLkF0dHJpYnV0ZS5Xb3JrZmxvd1Jlc3VsdFR5cGUodHlwZW9mIHJlc3VsdCksXG4gICAgICB9KTtcblxuICAgICAgd2FyblBlbmRpbmdRdWV1ZUl0ZW1zKFxuICAgICAgICB3b3JrZmxvd1J1bi5ydW5JZCxcbiAgICAgICAgd29ya2Zsb3dDb250ZXh0Lmludm9jYXRpb25zUXVldWUsXG4gICAgICAgICdjb21wbGV0ZWQnXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gZGVoeWRyYXRlZDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIENvbnRyb2wtZmxvdyBzaWduYWxzIGFyZSBoYW5kbGVkIGJ5IHRoZSBydW50aW1lIGFuZCBkbyBub3QgbWVhbiB0aGVcbiAgICAgIC8vIHdvcmtmbG93IGhhcyB0ZXJtaW5hbGx5IGZhaWxlZC5cbiAgICAgIGlmIChXb3JrZmxvd1N1c3BlbnNpb24uaXMoZXJyKSB8fCBSZXBsYXlEaXZlcmdlbmNlRXJyb3IuaXMoZXJyKSkge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG5cbiAgICAgIHdhcm5QZW5kaW5nUXVldWVJdGVtcyhcbiAgICAgICAgd29ya2Zsb3dSdW4ucnVuSWQsXG4gICAgICAgIHdvcmtmbG93Q29udGV4dC5pbnZvY2F0aW9uc1F1ZXVlLFxuICAgICAgICAnZmFpbGVkJ1xuICAgICAgKTtcblxuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfSk7XG59XG4iLCAiaW1wb3J0IHtcbiAgRVJST1JfU0xVR1MsXG4gIEhvb2tOb3RGb3VuZEVycm9yLFxuICBXb3JrZmxvd1J1bnRpbWVFcnJvcixcbn0gZnJvbSAnQHdvcmtmbG93L2Vycm9ycyc7XG5pbXBvcnQge1xuICB0eXBlIEhvb2ssXG4gIGlzTGVnYWN5U3BlY1ZlcnNpb24sXG4gIFNQRUNfVkVSU0lPTl9DVVJSRU5ULFxuICBTUEVDX1ZFUlNJT05fTEVHQUNZLFxuICB0eXBlIFdvcmtmbG93SW52b2tlUGF5bG9hZCxcbiAgdHlwZSBXb3JrZmxvd1J1bixcbn0gZnJvbSAnQHdvcmtmbG93L3dvcmxkJztcbmltcG9ydCB7IGdldFJ1bkNhcGFiaWxpdGllcyB9IGZyb20gJy4uL2NhcGFiaWxpdGllcy5qcyc7XG5pbXBvcnQgeyB0eXBlIENyeXB0b0tleSwgaW1wb3J0S2V5IH0gZnJvbSAnLi4vZW5jcnlwdGlvbi5qcyc7XG5pbXBvcnQgeyBydW50aW1lTG9nZ2VyIH0gZnJvbSAnLi4vbG9nZ2VyLmpzJztcbmltcG9ydCB7XG4gIGRlaHlkcmF0ZVN0ZXBSZXR1cm5WYWx1ZSxcbiAgaHlkcmF0ZVN0ZXBBcmd1bWVudHMsXG4gIFNlcmlhbGl6YXRpb25Gb3JtYXQsXG59IGZyb20gJy4uL3NlcmlhbGl6YXRpb24uanMnO1xuaW1wb3J0IHsgV0VCSE9PS19SRVNQT05TRV9XUklUQUJMRSB9IGZyb20gJy4uL3N5bWJvbHMuanMnO1xuaW1wb3J0ICogYXMgQXR0cmlidXRlIGZyb20gJy4uL3RlbGVtZXRyeS9zZW1hbnRpYy1jb252ZW50aW9ucy5qcyc7XG5pbXBvcnQgeyBnZXRTcGFuQ29udGV4dEZvclRyYWNlQ2FycmllciwgdHJhY2UgfSBmcm9tICcuLi90ZWxlbWV0cnkuanMnO1xuaW1wb3J0IHsgZ2V0V29ya2Zsb3dRdWV1ZU5hbWUgfSBmcm9tICcuL2hlbHBlcnMuanMnO1xuaW1wb3J0IHsgc2FmZVdhaXRVbnRpbCwgd2FpdGVkVW50aWwgfSBmcm9tICcuL3dhaXQtdW50aWwuanMnO1xuaW1wb3J0IHsgZ2V0V29ybGQgfSBmcm9tICcuL3dvcmxkLmpzJztcblxuYXN5bmMgZnVuY3Rpb24gbWF0ZXJpYWxpemVSZXNwb25zZUJvZHkocmVzcG9uc2U6IFJlc3BvbnNlKTogUHJvbWlzZTxSZXNwb25zZT4ge1xuICBpZiAoIXJlc3BvbnNlLmJvZHkpIHtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKTtcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7XG4gICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgc3RhdHVzVGV4dDogcmVzcG9uc2Uuc3RhdHVzVGV4dCxcbiAgICBoZWFkZXJzOiByZXNwb25zZS5oZWFkZXJzLFxuICB9KTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgdGhhdCByZXR1cm5zIHRoZSBob29rLCB0aGUgYXNzb2NpYXRlZCB3b3JrZmxvdyBydW4sXG4gKiBhbmQgdGhlIHJlc29sdmVkIGVuY3J5cHRpb24ga2V5LlxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRIb29rQnlUb2tlbldpdGhLZXkodG9rZW46IHN0cmluZyk6IFByb21pc2U8e1xuICBob29rOiBIb29rO1xuICBydW46IFdvcmtmbG93UnVuO1xuICBlbmNyeXB0aW9uS2V5OiBDcnlwdG9LZXkgfCB1bmRlZmluZWQ7XG59PiB7XG4gIGNvbnN0IHdvcmxkID0gZ2V0V29ybGQoKTtcbiAgY29uc3QgaG9vayA9IGF3YWl0IHdvcmxkLmhvb2tzLmdldEJ5VG9rZW4odG9rZW4pO1xuICBjb25zdCBydW4gPSBhd2FpdCB3b3JsZC5ydW5zLmdldChob29rLnJ1bklkKTtcbiAgY29uc3QgcmF3S2V5ID0gYXdhaXQgd29ybGQuZ2V0RW5jcnlwdGlvbktleUZvclJ1bj8uKHJ1bik7XG4gIGNvbnN0IGVuY3J5cHRpb25LZXkgPSByYXdLZXkgPyBhd2FpdCBpbXBvcnRLZXkocmF3S2V5KSA6IHVuZGVmaW5lZDtcbiAgaWYgKHR5cGVvZiBob29rLm1ldGFkYXRhICE9PSAndW5kZWZpbmVkJykge1xuICAgIGhvb2subWV0YWRhdGEgPSBhd2FpdCBoeWRyYXRlU3RlcEFyZ3VtZW50cyhcbiAgICAgIGhvb2subWV0YWRhdGEgYXMgYW55LFxuICAgICAgaG9vay5ydW5JZCxcbiAgICAgIGVuY3J5cHRpb25LZXlcbiAgICApO1xuICB9XG4gIHJldHVybiB7IGhvb2ssIHJ1biwgZW5jcnlwdGlvbktleSB9O1xufVxuXG4vKipcbiAqIEdldCB0aGUgaG9vayBieSB0b2tlbiB0byBmaW5kIHRoZSBhc3NvY2lhdGVkIHdvcmtmbG93IHJ1bixcbiAqIGFuZCBoeWRyYXRlIHRoZSBgbWV0YWRhdGFgIHByb3BlcnR5IGlmIGl0IHdhcyBzZXQgZnJvbSB3aXRoaW5cbiAqIHRoZSB3b3JrZmxvdyBydW4uXG4gKlxuICogQHBhcmFtIHRva2VuIC0gVGhlIHVuaXF1ZSB0b2tlbiBpZGVudGlmeWluZyB0aGUgaG9va1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0SG9va0J5VG9rZW4odG9rZW46IHN0cmluZyk6IFByb21pc2U8SG9vaz4ge1xuICBjb25zdCB7IGhvb2sgfSA9IGF3YWl0IGdldEhvb2tCeVRva2VuV2l0aEtleSh0b2tlbik7XG4gIHJldHVybiBob29rO1xufVxuXG4vKipcbiAqIFJlc3VtZXMgYSB3b3JrZmxvdyBydW4gYnkgc2VuZGluZyBhIHBheWxvYWQgdG8gYSBob29rIGlkZW50aWZpZWQgYnkgaXRzIHRva2VuLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGV4dGVybmFsbHkgKGUuZy4sIGZyb20gYW4gQVBJIHJvdXRlIG9yIHNlcnZlciBhY3Rpb24pXG4gKiB0byBzZW5kIGRhdGEgdG8gYSBob29rIGFuZCByZXN1bWUgdGhlIGFzc29jaWF0ZWQgd29ya2Zsb3cgcnVuLlxuICpcbiAqIEBwYXJhbSB0b2tlbk9ySG9vayAtIFRoZSB1bmlxdWUgdG9rZW4gaWRlbnRpZnlpbmcgdGhlIGhvb2ssIG9yIHRoZSBob29rIG9iamVjdCBpdHNlbGZcbiAqIEBwYXJhbSBwYXlsb2FkIC0gVGhlIGRhdGEgcGF5bG9hZCB0byBzZW5kIHRvIHRoZSBob29rXG4gKiBAcmV0dXJucyBQcm9taXNlIHJlc29sdmluZyB0byB0aGUgaG9va1xuICogQHRocm93cyBFcnJvciBpZiB0aGUgaG9vayBpcyBub3QgZm91bmQgb3IgaWYgdGhlcmUncyBhbiBlcnJvciBkdXJpbmcgdGhlIHByb2Nlc3NcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYHRzXG4gKiAvLyBJbiBhbiBBUEkgcm91dGVcbiAqIGltcG9ydCB7IHJlc3VtZUhvb2sgfSBmcm9tICdAd29ya2Zsb3cvY29yZS9ydW50aW1lJztcbiAqXG4gKiBleHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gKiAgIGNvbnN0IHsgdG9rZW4sIGRhdGEgfSA9IGF3YWl0IHJlcXVlc3QuanNvbigpO1xuICpcbiAqICAgdHJ5IHtcbiAqICAgICBjb25zdCBob29rID0gYXdhaXQgcmVzdW1lSG9vayh0b2tlbiwgZGF0YSk7XG4gKiAgICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBydW5JZDogaG9vay5ydW5JZCB9KTtcbiAqICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAqICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKCdIb29rIG5vdCBmb3VuZCcsIHsgc3RhdHVzOiA0MDQgfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdW1lSG9vazxUID0gYW55PihcbiAgdG9rZW5Pckhvb2s6IHN0cmluZyB8IEhvb2ssXG4gIHBheWxvYWQ6IFQsXG4gIGVuY3J5cHRpb25LZXlPdmVycmlkZT86IENyeXB0b0tleVxuKTogUHJvbWlzZTxIb29rPiB7XG4gIHJldHVybiBhd2FpdCB3YWl0ZWRVbnRpbCgoKSA9PiB7XG4gICAgcmV0dXJuIHRyYWNlKCdob29rLnJlc3VtZScsIGFzeW5jIChzcGFuKSA9PiB7XG4gICAgICBjb25zdCB3b3JsZCA9IGdldFdvcmxkKCk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCBob29rOiBIb29rO1xuICAgICAgICBsZXQgd29ya2Zsb3dSdW46IFdvcmtmbG93UnVuO1xuICAgICAgICBsZXQgZW5jcnlwdGlvbktleTogQ3J5cHRvS2V5IHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodHlwZW9mIHRva2VuT3JIb29rID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdldEhvb2tCeVRva2VuV2l0aEtleSh0b2tlbk9ySG9vayk7XG4gICAgICAgICAgaG9vayA9IHJlc3VsdC5ob29rO1xuICAgICAgICAgIHdvcmtmbG93UnVuID0gcmVzdWx0LnJ1bjtcbiAgICAgICAgICBlbmNyeXB0aW9uS2V5ID0gZW5jcnlwdGlvbktleU92ZXJyaWRlID8/IHJlc3VsdC5lbmNyeXB0aW9uS2V5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhvb2sgPSB0b2tlbk9ySG9vaztcbiAgICAgICAgICB3b3JrZmxvd1J1biA9IGF3YWl0IHdvcmxkLnJ1bnMuZ2V0KGhvb2sucnVuSWQpO1xuICAgICAgICAgIGlmIChlbmNyeXB0aW9uS2V5T3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIGVuY3J5cHRpb25LZXkgPSBlbmNyeXB0aW9uS2V5T3ZlcnJpZGU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHJhd0tleSA9IGF3YWl0IHdvcmxkLmdldEVuY3J5cHRpb25LZXlGb3JSdW4/Lih3b3JrZmxvd1J1bik7XG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5ID0gcmF3S2V5ID8gYXdhaXQgaW1wb3J0S2V5KHJhd0tleSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgLi4uQXR0cmlidXRlLkhvb2tUb2tlbihob29rLnRva2VuKSxcbiAgICAgICAgICAuLi5BdHRyaWJ1dGUuSG9va0lkKGhvb2suaG9va0lkKSxcbiAgICAgICAgICAuLi5BdHRyaWJ1dGUuV29ya2Zsb3dSdW5JZChob29rLnJ1bklkKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhlIHRhcmdldCBydW4ncyBjYXBhYmlsaXRpZXMgdG8gZW5zdXJlIHdlIGVuY29kZSB0aGVcbiAgICAgICAgLy8gcGF5bG9hZCBpbiBhIGZvcm1hdCB0aGUgcnVuJ3MgZGVwbG95bWVudCBjYW4gZGVjb2RlLiBGb3IgZXhhbXBsZSxcbiAgICAgICAgLy8gcnVucyBjcmVhdGVkIGJlZm9yZSBlbmNyeXB0aW9uIHN1cHBvcnQgd2FzIGFkZGVkIGNhbm5vdCBkZWNvZGVcbiAgICAgICAgLy8gdGhlICdlbmNyJyBzZXJpYWxpemF0aW9uIGZvcm1hdCwgYW5kIHJ1bnMgY3JlYXRlZCBiZWZvcmVcbiAgICAgICAgLy8gYnl0ZS1zdHJlYW0gZnJhbWluZyBzdXBwb3J0IGNhbm5vdCBkZWNvZGUgZnJhbWVkIGJ5dGUgc3RyZWFtcy5cbiAgICAgICAgY29uc3QgcmF3VmVyc2lvbiA9IHdvcmtmbG93UnVuLmV4ZWN1dGlvbkNvbnRleHQ/LndvcmtmbG93Q29yZVZlcnNpb247XG4gICAgICAgIGNvbnN0IGNhcGFiaWxpdGllcyA9IGdldFJ1bkNhcGFiaWxpdGllcyhcbiAgICAgICAgICB0eXBlb2YgcmF3VmVyc2lvbiA9PT0gJ3N0cmluZycgPyByYXdWZXJzaW9uIDogdW5kZWZpbmVkXG4gICAgICAgICk7XG4gICAgICAgIGlmICghY2FwYWJpbGl0aWVzLnN1cHBvcnRlZEZvcm1hdHMuaGFzKFNlcmlhbGl6YXRpb25Gb3JtYXQuRU5DUllQVEVEKSkge1xuICAgICAgICAgIGVuY3J5cHRpb25LZXkgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWh5ZHJhdGUgdGhlIHBheWxvYWQgZm9yIHN0b3JhZ2VcbiAgICAgICAgY29uc3Qgb3BzOiBQcm9taXNlPGFueT5bXSA9IFtdO1xuICAgICAgICBjb25zdCB2MUNvbXBhdCA9IGlzTGVnYWN5U3BlY1ZlcnNpb24oaG9vay5zcGVjVmVyc2lvbik7XG4gICAgICAgIGNvbnN0IGRlaHlkcmF0ZWRQYXlsb2FkID0gYXdhaXQgZGVoeWRyYXRlU3RlcFJldHVyblZhbHVlKFxuICAgICAgICAgIHBheWxvYWQsXG4gICAgICAgICAgaG9vay5ydW5JZCxcbiAgICAgICAgICBlbmNyeXB0aW9uS2V5LFxuICAgICAgICAgIG9wcyxcbiAgICAgICAgICBnbG9iYWxUaGlzLFxuICAgICAgICAgIHYxQ29tcGF0LFxuICAgICAgICAgIGNhcGFiaWxpdGllcy5mcmFtZWRCeXRlU3RyZWFtc1xuICAgICAgICApO1xuICAgICAgICAvLyBUaGVzZSBwYXlsb2FkLXN0cmVhbSBvcHMgYXJlIGZsdXNoZWQgaW4gdGhlIGJhY2tncm91bmQ7IHRoZVxuICAgICAgICAvLyBwcm9taXNlIGhhbmRlZCB0byB3YWl0VW50aWwgbXVzdCBuZXZlciByZWplY3QgKGFuIHVuY29uc3VtZWRcbiAgICAgICAgLy8gd2FpdFVudGlsIHJlamVjdGlvbiBjcmFzaGVzIHRoZSBwcm9jZXNzIGFzIHVuaGFuZGxlZFJlamVjdGlvbiksXG4gICAgICAgIC8vIHNvIHVuZXhwZWN0ZWQgZmFpbHVyZXMgYXJlIGxvZ2dlZCBpbnN0ZWFkLlxuICAgICAgICAvLyBOT1RFOiByZWplY3Rpb25zIHdpdGggYHVuZGVmaW5lZGAgYXJlIGFuIGV4cGVjdGVkIGFydGlmYWN0IG9mIHRoZVxuICAgICAgICAvLyB3ZWJob29rIGJ1bmRsZSBhbmQgYXJlIGlnbm9yZWQgZW50aXJlbHkuXG4gICAgICAgIHNhZmVXYWl0VW50aWwoUHJvbWlzZS5hbGwob3BzKSwgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICAgIHJ1bnRpbWVMb2dnZXIud2FybignQmFja2dyb3VuZCBmbHVzaCBvZiBob29rIHBheWxvYWQgb3BzIGZhaWxlZCcsIHtcbiAgICAgICAgICAgIHdvcmtmbG93UnVuSWQ6IGhvb2sucnVuSWQsXG4gICAgICAgICAgICBob29rSWQ6IGhvb2suaG9va0lkLFxuICAgICAgICAgICAgZXJyb3I6IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgaG9va19yZWNlaXZlZCBldmVudCB3aXRoIHRoZSBwYXlsb2FkXG4gICAgICAgIGF3YWl0IHdvcmxkLmV2ZW50cy5jcmVhdGUoXG4gICAgICAgICAgaG9vay5ydW5JZCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBldmVudFR5cGU6ICdob29rX3JlY2VpdmVkJyxcbiAgICAgICAgICAgIHNwZWNWZXJzaW9uOiBTUEVDX1ZFUlNJT05fQ1VSUkVOVCxcbiAgICAgICAgICAgIGNvcnJlbGF0aW9uSWQ6IGhvb2suaG9va0lkLFxuICAgICAgICAgICAgZXZlbnREYXRhOiB7XG4gICAgICAgICAgICAgIC4uLih2MUNvbXBhdCA/IHt9IDogeyB0b2tlbjogaG9vay50b2tlbiB9KSxcbiAgICAgICAgICAgICAgcGF5bG9hZDogZGVoeWRyYXRlZFBheWxvYWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyB2MUNvbXBhdCB9XG4gICAgICAgICk7XG5cbiAgICAgICAgc3Bhbj8uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgLi4uQXR0cmlidXRlLldvcmtmbG93TmFtZSh3b3JrZmxvd1J1bi53b3JrZmxvd05hbWUpLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCB0cmFjZUNhcnJpZXIgPSB3b3JrZmxvd1J1bi5leGVjdXRpb25Db250ZXh0Py50cmFjZUNhcnJpZXI7XG5cbiAgICAgICAgaWYgKHRyYWNlQ2Fycmllcikge1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCBnZXRTcGFuQ29udGV4dEZvclRyYWNlQ2Fycmllcih0cmFjZUNhcnJpZXIpO1xuICAgICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBzcGFuPy5hZGRMaW5rPy4oeyBjb250ZXh0IH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlLXRyaWdnZXIgdGhlIHdvcmtmbG93IGFnYWluc3QgdGhlIGRlcGxveW1lbnQgSUQgYXNzb2NpYXRlZFxuICAgICAgICAvLyB3aXRoIHRoZSB3b3JrZmxvdyBydW4gdGhhdCB0aGUgaG9vayBiZWxvbmdzIHRvXG4gICAgICAgIGF3YWl0IHdvcmxkLnF1ZXVlKFxuICAgICAgICAgIGdldFdvcmtmbG93UXVldWVOYW1lKHdvcmtmbG93UnVuLndvcmtmbG93TmFtZSksXG4gICAgICAgICAge1xuICAgICAgICAgICAgcnVuSWQ6IGhvb2sucnVuSWQsXG4gICAgICAgICAgICAvLyBhdHRhY2ggdGhlIHRyYWNlIGNhcnJpZXIgZnJvbSB0aGUgd29ya2Zsb3cgcnVuXG4gICAgICAgICAgICB0cmFjZUNhcnJpZXI6XG4gICAgICAgICAgICAgIHdvcmtmbG93UnVuLmV4ZWN1dGlvbkNvbnRleHQ/LnRyYWNlQ2FycmllciA/PyB1bmRlZmluZWQsXG4gICAgICAgICAgfSBzYXRpc2ZpZXMgV29ya2Zsb3dJbnZva2VQYXlsb2FkLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRlcGxveW1lbnRJZDogd29ya2Zsb3dSdW4uZGVwbG95bWVudElkLFxuICAgICAgICAgICAgc3BlY1ZlcnNpb246IHdvcmtmbG93UnVuLnNwZWNWZXJzaW9uID8/IFNQRUNfVkVSU0lPTl9MRUdBQ1ksXG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBob29rO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHNwYW4/LnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgIC4uLkF0dHJpYnV0ZS5Ib29rVG9rZW4oXG4gICAgICAgICAgICB0eXBlb2YgdG9rZW5Pckhvb2sgPT09ICdzdHJpbmcnID8gdG9rZW5Pckhvb2sgOiB0b2tlbk9ySG9vay50b2tlblxuICAgICAgICAgICksXG4gICAgICAgICAgLi4uQXR0cmlidXRlLkhvb2tGb3VuZChmYWxzZSksXG4gICAgICAgIH0pO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFJlc3VtZXMgYSB3ZWJob29rIGJ5IHNlbmRpbmcgYSB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1JlcXVlc3QgfCBSZXF1ZXN0fVxuICogb2JqZWN0IHRvIGEgaG9vayBpZGVudGlmaWVkIGJ5IGl0cyB0b2tlbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBleHRlcm5hbGx5IChlLmcuLCBmcm9tIGFuIEFQSSByb3V0ZSBvciBzZXJ2ZXIgYWN0aW9uKVxuICogdG8gc2VuZCBhIHJlcXVlc3QgdG8gYSB3ZWJob29rIGFuZCByZXN1bWUgdGhlIGFzc29jaWF0ZWQgd29ya2Zsb3cgcnVuLlxuICpcbiAqIEBwYXJhbSB0b2tlbiAtIFRoZSB1bmlxdWUgdG9rZW4gaWRlbnRpZnlpbmcgdGhlIGhvb2tcbiAqIEBwYXJhbSByZXF1ZXN0IC0gVGhlIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgaG9va1xuICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIHJlc3BvbnNlXG4gKiBAdGhyb3dzIEVycm9yIGlmIHRoZSBob29rIGlzIG5vdCBmb3VuZCBvciBpZiB0aGVyZSdzIGFuIGVycm9yIGR1cmluZyB0aGUgcHJvY2Vzc1xuICpcbiAqIEBleGFtcGxlXG4gKlxuICogYGBgdHNcbiAqIC8vIEluIGFuIEFQSSByb3V0ZVxuICogaW1wb3J0IHsgcmVzdW1lV2ViaG9vayB9IGZyb20gJ0B3b3JrZmxvdy9jb3JlL3J1bnRpbWUnO1xuICpcbiAqIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBQT1NUKHJlcXVlc3Q6IFJlcXVlc3QpIHtcbiAqICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXF1ZXN0LnVybCk7XG4gKiAgIGNvbnN0IHRva2VuID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ3Rva2VuJyk7XG4gKlxuICogICBpZiAoIXRva2VuKSB7XG4gKiAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnTWlzc2luZyB0b2tlbicsIHsgc3RhdHVzOiA0MDAgfSk7XG4gKiAgIH1cbiAqXG4gKiAgIHRyeSB7XG4gKiAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXN1bWVXZWJob29rKHRva2VuLCByZXF1ZXN0KTtcbiAqICAgICByZXR1cm4gcmVzcG9uc2U7XG4gKiAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnV2ViaG9vayBub3QgZm91bmQnLCB7IHN0YXR1czogNDA0IH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3VtZVdlYmhvb2soXG4gIHRva2VuOiBzdHJpbmcsXG4gIHJlcXVlc3Q6IFJlcXVlc3Rcbik6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgY29uc3QgeyBob29rLCBlbmNyeXB0aW9uS2V5IH0gPSBhd2FpdCBnZXRIb29rQnlUb2tlbldpdGhLZXkodG9rZW4pO1xuXG4gIC8vIE9ubHkgd2ViaG9va3MgY2FuIGJlIHJlc3VtZWQgdmlhIHRoZSBwdWJsaWMgZW5kcG9pbnQuXG4gIC8vIElmIHRoZSBob29rIHdhcyBjcmVhdGVkIHZpYSBjcmVhdGVIb29rKCkgKGlzV2ViaG9vayAhPT0gdHJ1ZSksXG4gIC8vIHRocm93IHRoZSBzYW1lIFwibm90IGZvdW5kXCIgZXJyb3IgdGhlIHdvcmxkIHdvdWxkIHRocm93IGZvciBhIG1pc3NpbmdcbiAgLy8gdG9rZW4uIFRoaXMgcHJldmVudHMgbGVha2luZyB0aGF0IHRoZSB0b2tlbiBpcyB2YWxpZC5cbiAgaWYgKGhvb2suaXNXZWJob29rID09PSBmYWxzZSkge1xuICAgIHRocm93IG5ldyBIb29rTm90Rm91bmRFcnJvcih0b2tlbik7XG4gIH1cblxuICBsZXQgcmVzcG9uc2U6IFJlc3BvbnNlIHwgdW5kZWZpbmVkO1xuICBsZXQgcmVzcG9uc2VSZWFkYWJsZTogUmVhZGFibGVTdHJlYW08UmVzcG9uc2U+IHwgdW5kZWZpbmVkO1xuICBpZiAoXG4gICAgaG9vay5tZXRhZGF0YSAmJlxuICAgIHR5cGVvZiBob29rLm1ldGFkYXRhID09PSAnb2JqZWN0JyAmJlxuICAgICdyZXNwb25kV2l0aCcgaW4gaG9vay5tZXRhZGF0YVxuICApIHtcbiAgICBpZiAoaG9vay5tZXRhZGF0YS5yZXNwb25kV2l0aCA9PT0gJ21hbnVhbCcpIHtcbiAgICAgIGNvbnN0IHsgcmVhZGFibGUsIHdyaXRhYmxlIH0gPSBuZXcgVHJhbnNmb3JtU3RyZWFtPFJlc3BvbnNlLCBSZXNwb25zZT4oKTtcbiAgICAgIHJlc3BvbnNlUmVhZGFibGUgPSByZWFkYWJsZTtcblxuICAgICAgLy8gVGhlIHJlcXVlc3QgaW5zdGFuY2UgaW5jbHVkZXMgdGhlIHdyaXRhYmxlIHN0cmVhbSB3aGljaCB3aWxsIGJlIHVzZWRcbiAgICAgIC8vIHRvIHdyaXRlIHRoZSByZXNwb25zZSB0byB0aGUgY2xpZW50IGZyb20gd2l0aGluIHRoZSB3b3JrZmxvdyBydW5cbiAgICAgIChyZXF1ZXN0IGFzIGFueSlbV0VCSE9PS19SRVNQT05TRV9XUklUQUJMRV0gPSB3cml0YWJsZTtcbiAgICB9IGVsc2UgaWYgKGhvb2subWV0YWRhdGEucmVzcG9uZFdpdGggaW5zdGFuY2VvZiBSZXNwb25zZSkge1xuICAgICAgcmVzcG9uc2UgPSBob29rLm1ldGFkYXRhLnJlc3BvbmRXaXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgV29ya2Zsb3dSdW50aW1lRXJyb3IoXG4gICAgICAgIGBJbnZhbGlkIFxcYHJlc3BvbmRXaXRoXFxgIHZhbHVlOiAke2hvb2subWV0YWRhdGEucmVzcG9uZFdpdGh9YCxcbiAgICAgICAgeyBzbHVnOiBFUlJPUl9TTFVHUy5XRUJIT09LX0lOVkFMSURfUkVTUE9ORF9XSVRIX1ZBTFVFIH1cbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIE5vIGByZXNwb25kV2l0aGAgdmFsdWUgaW1wbGllcyB0aGUgZGVmYXVsdCBiZWhhdmlvciBvZiByZXR1cm5pbmcgYSAyMDJcbiAgICByZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7IHN0YXR1czogMjAyIH0pO1xuICB9XG5cbiAgYXdhaXQgcmVzdW1lSG9vayhob29rLCByZXF1ZXN0LCBlbmNyeXB0aW9uS2V5KTtcblxuICBpZiAocmVzcG9uc2VSZWFkYWJsZSkge1xuICAgIC8vIFdhaXQgZm9yIHRoZSByZWFkYWJsZSBzdHJlYW0gdG8gZW1pdCBvbmUgY2h1bmssXG4gICAgLy8gd2hpY2ggaXMgdGhlIGBSZXNwb25zZWAgb2JqZWN0XG4gICAgY29uc3QgcmVhZGVyID0gcmVzcG9uc2VSZWFkYWJsZS5nZXRSZWFkZXIoKTtcbiAgICBjb25zdCBjaHVuayA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgaWYgKGNodW5rLnZhbHVlKSB7XG4gICAgICByZXNwb25zZSA9IGF3YWl0IG1hdGVyaWFsaXplUmVzcG9uc2VCb2R5KGNodW5rLnZhbHVlKTtcbiAgICB9XG4gICAgYXdhaXQgcmVhZGVyLmNhbmNlbCgpO1xuICB9XG5cbiAgaWYgKCFyZXNwb25zZSkge1xuICAgIHRocm93IG5ldyBXb3JrZmxvd1J1bnRpbWVFcnJvcignV29ya2Zsb3cgcnVuIGRpZCBub3Qgc2VuZCBhIHJlc3BvbnNlJywge1xuICAgICAgc2x1ZzogRVJST1JfU0xVR1MuV0VCSE9PS19SRVNQT05TRV9OT1RfU0VOVCxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXNwb25zZTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQVMsWUFBWSxVQUFVO0FBQy9CLE9BQU8sVUFBVTtBQUVWLFNBQVMsaUJBQWlCLElBQUk7QUFDakMsU0FBTyxRQUFRLEtBQUssRUFBRTtBQUMxQjtBQUNBLFNBQVMsU0FBUyxJQUFJO0FBQ2xCLE1BQUksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHO0FBQ3ZCLFVBQU0sSUFBSSxNQUFNLHVCQUF1QixHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUMsRUFBRTtBQUFBLEVBQzVEO0FBQ0o7QUE2RUEsU0FBUyxhQUFhLEtBQUs7QUFDdkIsU0FBTztBQUFBLElBQ0gsSUFBSSxJQUFJO0FBQUEsSUFDUixRQUFRLElBQUksV0FBVztBQUFBLElBQ3ZCLE9BQU8sSUFBSTtBQUFBLElBQ1gsZ0JBQWdCLElBQUk7QUFBQSxJQUNwQixNQUFNLElBQUksUUFBUTtBQUFBLElBQ2xCLFNBQVMsSUFB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Q0Q7QUFDRCxTQUtFLGFBQ0Q7QUFDRCxTQUFTLHNCQUFzQjtBQUMvQixTQUNFLGFBQ0EsWUFBQUMsV0FDQSxvQkFBQUMsbUJBQ0EsZ0JBQ0Q7IiwKICAibmFtZXMiOiBbInN0YXJ0IiwgIkZhdGFsRXJyb3IiLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAiZmV0Y2giLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAicmVnaXN0ZXJTdGVwRnVuY3Rpb24iLCAiZ2V0U3RvcmUiLCAiZXh0cmFjdFBkZlRleHQiLCAic3RvcmUiLCAiZ2VuZXJhdGVQb2RjYXN0U2NyaXB0IiwgInZlcmJhdGltU2NyaXB0IiwgInNjcmlwdFByb3ZpZGVyTmFtZSIsICJub3JtYWxpemVPcHRpb25zIiwgIkxFTkdUSF9CVURHRVRTIiwgInN5bnRoZXNpemVEaWFsb2d1ZSIsICJ0dHNQcm92aWRlck5hbWUiLCAicmVmdW5kRXBpc29kZSIsICJyZWdpc3RlclN0ZXBGdW5jdGlvbiIsICJidWlsdGluTW9kdWxlcyIsICJub2RlQnVpbHRpbnMiLCAiYnVpbHRpbk1vZHVsZXMiLCAibm9kZUltcG9ydEV4dHJhY3RSZWdleCIsICJSZXBsYXlEaXZlcmdlbmNlRXJyb3IiLCAiV29ya2Zsb3dSdW50aW1lRXJyb3IiLCAicGFyc2VXb3JrZmxvd05hbWUiLCAiU1BFQ19WRVJTSU9OX0NVUlJFTlQiLCAiU1BFQ19WRVJTSU9OX0xFR0FDWSIsICJpbXBvcnRLZXkiLCAiV29ya2Zsb3dTdXNwZW5zaW9uIiwgInJ1bnRpbWVMb2dnZXIiLCAiZ2V0V29ya2Zsb3dRdWV1ZU5hbWUiLCAiZ2V0V29ybGQiLCAiQXR0cmlidXRlIiwgInRyYWNlIiwgIldvcmtmbG93U3VzcGVuc2lvbiIsICJFUlJPUl9TTFVHUyIsICJXb3JrZmxvd1J1bnRpbWVFcnJvciIsICJydW50aW1lTG9nZ2VyIiwgIkF0dHJpYnV0ZSIsICJ0cmFjZSIsICJnZXRXb3JsZCIsICJnZXRXb3JsZEhhbmRsZXJzIl0KfQo=
