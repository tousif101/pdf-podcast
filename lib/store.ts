import { promises as fs } from "fs";
import path from "path";
import type { Episode, EpisodeStatus } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidEpisodeId(id: string): boolean {
  return UUID_RE.test(id);
}

function assertId(id: string): void {
  if (!isValidEpisodeId(id)) {
    throw new Error(`Invalid episode id: ${id.slice(0, 40)}`);
  }
}

export interface ListFilter {
  userId: string;
  includeUnowned?: boolean;
}

export interface EpisodeStore {
  list(filter?: ListFilter): Promise<Episode[]>;
  get(id: string): Promise<Episode | null>;
  getByShareToken(token: string): Promise<Episode | null>;
  setShareToken(id: string, token: string | null): Promise<void>;
  create(episode: Episode): Promise<void>;
  /** Updates only the given fields. Returns null if the episode no longer exists. */
  patch(id: string, fields: Partial<Episode>): Promise<Episode | null>;
  /** Atomic conditional update: applies fields only if current status matches
   *  expectedStatus. Returns the updated episode, or null if no row matched
   *  (missing or wrong status) — the caller uses null to reject races. */
  patchIf(
    id: string,
    expectedStatus: EpisodeStatus,
    fields: Partial<Episode>,
  ): Promise<Episode | null>;
  delete(id: string): Promise<void>;
  saveSource(id: string, data: Uint8Array): Promise<void>;
  getSource(id: string): Promise<Uint8Array | null>;
  saveAudio(id: string, data: Uint8Array, mimeType: string): Promise<void>;
  /** Streaming audio response honoring an optional Range header, or null. */
  openAudio(id: string, range: string | null): Promise<AudioResponse | null>;
}

const AUDIO_EXT: Record<string, string> = {
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
};

// ---------------------------------------------------------------------------
// Metadata drivers

interface MetaDriver {
  list(filter?: ListFilter): Promise<Episode[]>;
  get(id: string): Promise<Episode | null>;
  getByShareToken(token: string): Promise<Episode | null>;
  setShareToken(id: string, token: string | null): Promise<void>;
  create(episode: Episode): Promise<void>;
  patch(id: string, fields: Partial<Episode>): Promise<Episode | null>;
  patchIf(
    id: string,
    expectedStatus: EpisodeStatus,
    fields: Partial<Episode>,
  ): Promise<Episode | null>;
  delete(id: string): Promise<void>;
}

class FsMeta implements MetaDriver {
  constructor(private dir: string) {}

  private file(id: string) {
    return path.join(this.dir, `${id}.json`);
  }

  private async write(episode: Episode) {
    await fs.mkdir(this.dir, { recursive: true });
    const target = this.file(episode.id);
    const tmp = `${target}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(episode, null, 2));
    await fs.rename(tmp, target);
  }

  async list(filter?: ListFilter): Promise<Episode[]> {
    await fs.mkdir(this.dir, { recursive: true });
    const files = await fs.readdir(this.dir);
    const episodes: Episode[] = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        episodes.push(
          JSON.parse(await fs.readFile(path.join(this.dir, f), "utf8")),
        );
      } catch {
        // skip torn/corrupt entries rather than failing the whole listing
      }
    }
    const visible = filter
      ? episodes.filter(
          (e) =>
            e.userId === filter.userId ||
            (filter.includeUnowned && e.userId === undefined),
        )
      : episodes;
    return visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Episode | null> {
    try {
      return JSON.parse(await fs.readFile(this.file(id), "utf8"));
    } catch {
      return null;
    }
  }

  async getByShareToken(token: string): Promise<Episode | null> {
    const all = await this.list();
    return all.find((e) => e.shareToken === token) ?? null;
  }

  async setShareToken(id: string, token: string | null): Promise<void> {
    const existing = await this.get(id);
    if (!existing) return;
    await this.write({ ...existing, shareToken: token ?? undefined });
  }

  async create(episode: Episode): Promise<void> {
    await this.write(episode);
  }

  async patch(id: string, fields: Partial<Episode>): Promise<Episode | null> {
    const existing = await this.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...fields, id };
    await this.write(updated);
    return updated;
  }

  async patchIf(
    id: string,
    expectedStatus: EpisodeStatus,
    fields: Partial<Episode>,
  ): Promise<Episode | null> {
    const existing = await this.get(id);
    if (!existing || existing.status !== expectedStatus) return null;
    const updated = { ...existing, ...fields, id };
    await this.write(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await fs.rm(this.file(id), { force: true });
  }
}

type EpisodeRow = {
  id: string;
  user_id: string | null;
  title: string;
  source_filename: string;
  mode: Episode["mode"];
  options: Episode["options"] | null;
  share_token: string | null;
  status: Episode["status"];
  error: string | null;
  created_at: string;
  total_pages: number | null;
  extracted_chars: number | null;
  script: Episode["script"] | null;
  audio_mime_type: string | null;
  duration_seconds: number | null;
  providers: Episode["providers"] | null;
};

function rowToEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    title: row.title,
    sourceFilename: row.source_filename,
    mode: row.mode ?? "conversation",
    options: row.options ?? undefined,
    shareToken: row.share_token ?? undefined,
    status: row.status,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    totalPages: row.total_pages ?? undefined,
    extractedChars: row.extracted_chars ?? undefined,
    script: row.script ?? undefined,
    audioMimeType: row.audio_mime_type ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    providers: row.providers ?? undefined,
  };
}

function episodeToRow(fields: Partial<Episode>): Partial<EpisodeRow> {
  const row: Partial<EpisodeRow> = {};
  if (fields.id !== undefined) row.id = fields.id;
  if (fields.userId !== undefined) row.user_id = fields.userId;
  if (fields.title !== undefined) row.title = fields.title;
  if (fields.sourceFilename !== undefined)
    row.source_filename = fields.sourceFilename;
  if (fields.mode !== undefined) row.mode = fields.mode;
  if (fields.options !== undefined) row.options = fields.options;
  if (fields.shareToken !== undefined)
    row.share_token = fields.shareToken ?? null;
  if (fields.status !== undefined) row.status = fields.status;
  if (fields.error !== undefined) row.error = fields.error;
  if (fields.createdAt !== undefined) row.created_at = fields.createdAt;
  if (fields.totalPages !== undefined) row.total_pages = fields.totalPages;
  if (fields.extractedChars !== undefined)
    row.extracted_chars = fields.extractedChars;
  if (fields.script !== undefined) row.script = fields.script;
  if (fields.audioMimeType !== undefined)
    row.audio_mime_type = fields.audioMimeType;
  if (fields.durationSeconds !== undefined)
    row.duration_seconds = fields.durationSeconds;
  if (fields.providers !== undefined) row.providers = fields.providers;
  return row;
}

class SupabaseMeta implements MetaDriver {
  private clientPromise: Promise<
    import("@supabase/supabase-js").SupabaseClient
  > | null = null;

  private client() {
    if (!this.clientPromise) {
      this.clientPromise = import("@supabase/supabase-js").then(
        ({ createClient }) =>
          createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!,
            { auth: { persistSession: false } },
          ),
      );
    }
    return this.clientPromise;
  }

  async list(filter?: ListFilter): Promise<Episode[]> {
    const supabase = await this.client();
    let query = supabase
      .from("episodes")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter) {
      query = filter.includeUnowned
        ? query.or(`user_id.eq.${filter.userId},user_id.is.null`)
        : query.eq("user_id", filter.userId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`episodes list failed: ${error.message}`);
    return (data as EpisodeRow[]).map(rowToEpisode);
  }

  async get(id: string): Promise<Episode | null> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`episode get failed: ${error.message}`);
    return data ? rowToEpisode(data as EpisodeRow) : null;
  }

  async getByShareToken(token: string): Promise<Episode | null> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();
    if (error) throw new Error(`episode share lookup failed: ${error.message}`);
    return data ? rowToEpisode(data as EpisodeRow) : null;
  }

  async setShareToken(id: string, token: string | null): Promise<void> {
    const supabase = await this.client();
    const { error } = await supabase
      .from("episodes")
      .update({ share_token: token })
      .eq("id", id);
    if (error) throw new Error(`set share token failed: ${error.message}`);
  }

  async create(episode: Episode): Promise<void> {
    const supabase = await this.client();
    const { error } = await supabase
      .from("episodes")
      .insert(episodeToRow(episode));
    if (error) throw new Error(`episode create failed: ${error.message}`);
  }

  async patch(id: string, fields: Partial<Episode>): Promise<Episode | null> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("episodes")
      .update(episodeToRow(fields))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`episode patch failed: ${error.message}`);
    return data ? rowToEpisode(data as EpisodeRow) : null;
  }

  async patchIf(
    id: string,
    expectedStatus: EpisodeStatus,
    fields: Partial<Episode>,
  ): Promise<Episode | null> {
    const supabase = await this.client();
    // Atomic compare-and-set: the status predicate makes concurrent PATCHes
    // race for the single row that still matches expectedStatus.
    const { data, error } = await supabase
      .from("episodes")
      .update(episodeToRow(fields))
      .eq("id", id)
      .eq("status", expectedStatus)
      .select()
      .maybeSingle();
    if (error) throw new Error(`episode patchIf failed: ${error.message}`);
    return data ? rowToEpisode(data as EpisodeRow) : null;
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.client();
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    if (error) throw new Error(`episode delete failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Binary drivers (source PDFs + rendered audio)

export interface AudioResponse {
  status: number;
  headers: Record<string, string>;
  body: ReadableStream<Uint8Array> | Uint8Array;
}

interface BinaryDriver {
  saveSource(id: string, data: Uint8Array): Promise<void>;
  getSource(id: string): Promise<Uint8Array | null>;
  saveAudio(id: string, data: Uint8Array, mimeType: string): Promise<void>;
  /** Streams audio (honoring an optional Range header) through the caller. */
  openAudio(
    id: string,
    mimeType: string,
    range: string | null,
  ): Promise<AudioResponse | null>;
  delete(id: string, mimeType?: string): Promise<void>;
}

function sliceRange(
  data: Uint8Array,
  mimeType: string,
  range: string | null,
): AudioResponse {
  const total = data.byteLength;
  const base: Record<string, string> = {
    "Content-Type": mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
  };
  const match = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
  if (match && (match[1] || match[2])) {
    let start: number;
    let end: number;
    if (!match[1]) {
      const suffix = Math.min(parseInt(match[2], 10), total);
      start = total - suffix;
      end = total - 1;
    } else {
      start = parseInt(match[1], 10);
      end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;
    }
    if (start <= end && start < total) {
      const chunk = data.slice(start, end + 1);
      return {
        status: 206,
        headers: {
          ...base,
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Length": String(chunk.byteLength),
        },
        body: chunk,
      };
    }
    return {
      status: 416,
      headers: { "Accept-Ranges": "bytes", "Content-Range": `bytes */${total}` },
      body: new Uint8Array(0),
    };
  }
  return {
    status: 200,
    headers: { ...base, "Content-Length": String(total) },
    body: data,
  };
}

class FsBinary implements BinaryDriver {
  constructor(private root: string) {}

  private async dir(sub: string) {
    const p = path.join(this.root, sub);
    await fs.mkdir(p, { recursive: true });
    return p;
  }

  async saveSource(id: string, data: Uint8Array): Promise<void> {
    await fs.writeFile(path.join(await this.dir("sources"), `${id}.pdf`), data);
  }

  async getSource(id: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(
        await fs.readFile(path.join(this.root, "sources", `${id}.pdf`)),
      );
    } catch {
      return null;
    }
  }

  async saveAudio(id: string, data: Uint8Array, mimeType: string) {
    const ext = AUDIO_EXT[mimeType] ?? "bin";
    await fs.writeFile(path.join(await this.dir("audio"), `${id}.${ext}`), data);
  }

  async openAudio(id: string, mimeType: string, range: string | null) {
    const ext = AUDIO_EXT[mimeType] ?? "bin";
    try {
      const data = new Uint8Array(
        await fs.readFile(path.join(this.root, "audio", `${id}.${ext}`)),
      );
      return sliceRange(data, mimeType, range);
    } catch {
      return null;
    }
  }

  async delete(id: string, mimeType?: string): Promise<void> {
    await fs.rm(path.join(this.root, "sources", `${id}.pdf`), { force: true });
    const exts = mimeType ? [AUDIO_EXT[mimeType] ?? "bin"] : Object.values(AUDIO_EXT);
    for (const ext of exts) {
      await fs.rm(path.join(this.root, "audio", `${id}.${ext}`), {
        force: true,
      });
    }
  }
}

class BlobBinary implements BinaryDriver {
  private blob() {
    return import("@vercel/blob");
  }

  async saveSource(id: string, data: Uint8Array): Promise<void> {
    const { put } = await this.blob();
    await put(`sources/${id}.pdf`, Buffer.from(data), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/pdf",
    });
  }

  async getSource(id: string): Promise<Uint8Array | null> {
    const { get } = await this.blob();
    const result = await get(`sources/${id}.pdf`, { access: "private" });
    if (!result?.stream) return null;
    return new Uint8Array(await new Response(result.stream).arrayBuffer());
  }

  async saveAudio(id: string, data: Uint8Array, mimeType: string) {
    const { put } = await this.blob();
    const ext = AUDIO_EXT[mimeType] ?? "bin";
    await put(`audio/${id}.${ext}`, Buffer.from(data), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: mimeType,
    });
  }

  async openAudio(id: string, mimeType: string, range: string | null) {
    const { get } = await this.blob();
    const ext = AUDIO_EXT[mimeType] ?? "bin";
    // Pass the client's Range through to origin so we stream partial content
    // without buffering the whole file in the function.
    const result = await get(`audio/${id}.${ext}`, {
      access: "private",
      ...(range ? { headers: { Range: range } } : {}),
    });
    if (!result?.stream) return null;
    const src = result.headers;
    const headers: Record<string, string> = {
      "Content-Type": src.get("content-type") ?? mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=31536000, immutable",
    };
    const contentRange = src.get("content-range");
    const contentLength = src.get("content-length");
    if (contentRange) headers["Content-Range"] = contentRange;
    if (contentLength) headers["Content-Length"] = contentLength;
    return {
      status: range && contentRange ? 206 : 200,
      headers,
      body: result.stream,
    };
  }

  async delete(id: string, mimeType?: string): Promise<void> {
    const { list, del } = await this.blob();
    const exts = mimeType ? [AUDIO_EXT[mimeType] ?? "bin"] : Object.values(AUDIO_EXT);
    const prefixes = [
      `sources/${id}.pdf`,
      ...exts.map((ext) => `audio/${id}.${ext}`),
    ];
    for (const prefix of prefixes) {
      const { blobs } = await list({ prefix });
      if (blobs.length > 0) await del(blobs.map((b) => b.url));
    }
  }
}

// ---------------------------------------------------------------------------

class CompositeStore implements EpisodeStore {
  constructor(
    private meta: MetaDriver,
    private binary: BinaryDriver,
  ) {}

  list(filter?: ListFilter) {
    return this.meta.list(filter);
  }

  get(id: string) {
    assertId(id);
    return this.meta.get(id);
  }

  getByShareToken(token: string) {
    return this.meta.getByShareToken(token);
  }

  setShareToken(id: string, token: string | null) {
    assertId(id);
    return this.meta.setShareToken(id, token);
  }

  create(episode: Episode) {
    assertId(episode.id);
    return this.meta.create(episode);
  }

  patch(id: string, fields: Partial<Episode>) {
    assertId(id);
    return this.meta.patch(id, fields);
  }

  patchIf(id: string, expectedStatus: EpisodeStatus, fields: Partial<Episode>) {
    assertId(id);
    return this.meta.patchIf(id, expectedStatus, fields);
  }

  async delete(id: string) {
    assertId(id);
    const episode = await this.meta.get(id);
    await this.meta.delete(id);
    await this.binary.delete(id, episode?.audioMimeType);
  }

  saveSource(id: string, data: Uint8Array) {
    assertId(id);
    return this.binary.saveSource(id, data);
  }

  getSource(id: string) {
    assertId(id);
    return this.binary.getSource(id);
  }

  saveAudio(id: string, data: Uint8Array, mimeType: string) {
    assertId(id);
    return this.binary.saveAudio(id, data, mimeType);
  }

  async openAudio(id: string, range: string | null) {
    assertId(id);
    const episode = await this.meta.get(id);
    if (!episode) return null;
    return this.binary.openAudio(
      id,
      episode.audioMimeType ?? "audio/wav",
      range,
    );
  }
}

let store: EpisodeStore | null = null;

export function getStore(): EpisodeStore {
  if (!store) {
    const hasSupabase = Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
    );
    const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    if (process.env.VERCEL && (!hasSupabase || !hasBlob)) {
      throw new Error(
        "Production requires SUPABASE_URL + SUPABASE_SECRET_KEY and BLOB_READ_WRITE_TOKEN; the filesystem fallback does not work on Vercel.",
      );
    }
    const dataRoot = path.join(process.cwd(), ".data");
    store = new CompositeStore(
      hasSupabase ? new SupabaseMeta() : new FsMeta(path.join(dataRoot, "episodes")),
      hasBlob ? new BlobBinary() : new FsBinary(dataRoot),
    );
  }
  return store;
}
