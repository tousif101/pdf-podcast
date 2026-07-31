import { promises as fs } from "fs";
import path from "path";
import type { Episode } from "./types";

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

export interface EpisodeStore {
  list(): Promise<Episode[]>;
  get(id: string): Promise<Episode | null>;
  create(episode: Episode): Promise<void>;
  /** Updates only the given fields. Returns null if the episode no longer exists. */
  patch(id: string, fields: Partial<Episode>): Promise<Episode | null>;
  delete(id: string): Promise<void>;
  saveSource(id: string, data: Uint8Array): Promise<void>;
  getSource(id: string): Promise<Uint8Array | null>;
  saveAudio(
    id: string,
    data: Uint8Array,
    mimeType: string,
  ): Promise<{ url?: string }>;
  getAudio(
    id: string,
  ): Promise<{ data?: Uint8Array; url?: string; mimeType: string } | null>;
}

const AUDIO_EXT: Record<string, string> = {
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
};

// ---------------------------------------------------------------------------
// Metadata drivers

interface MetaDriver {
  list(): Promise<Episode[]>;
  get(id: string): Promise<Episode | null>;
  create(episode: Episode): Promise<void>;
  patch(id: string, fields: Partial<Episode>): Promise<Episode | null>;
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

  async list(): Promise<Episode[]> {
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
    return episodes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Episode | null> {
    try {
      return JSON.parse(await fs.readFile(this.file(id), "utf8"));
    } catch {
      return null;
    }
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

  async delete(id: string): Promise<void> {
    await fs.rm(this.file(id), { force: true });
  }
}

type EpisodeRow = {
  id: string;
  title: string;
  source_filename: string;
  status: Episode["status"];
  error: string | null;
  created_at: string;
  total_pages: number | null;
  extracted_chars: number | null;
  script: Episode["script"] | null;
  audio_mime_type: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  providers: Episode["providers"] | null;
};

function rowToEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    title: row.title,
    sourceFilename: row.source_filename,
    status: row.status,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    totalPages: row.total_pages ?? undefined,
    extractedChars: row.extracted_chars ?? undefined,
    script: row.script ?? undefined,
    audioMimeType: row.audio_mime_type ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    providers: row.providers ?? undefined,
  };
}

function episodeToRow(fields: Partial<Episode>): Partial<EpisodeRow> {
  const row: Partial<EpisodeRow> = {};
  if (fields.id !== undefined) row.id = fields.id;
  if (fields.title !== undefined) row.title = fields.title;
  if (fields.sourceFilename !== undefined)
    row.source_filename = fields.sourceFilename;
  if (fields.status !== undefined) row.status = fields.status;
  if (fields.error !== undefined) row.error = fields.error;
  if (fields.createdAt !== undefined) row.created_at = fields.createdAt;
  if (fields.totalPages !== undefined) row.total_pages = fields.totalPages;
  if (fields.extractedChars !== undefined)
    row.extracted_chars = fields.extractedChars;
  if (fields.script !== undefined) row.script = fields.script;
  if (fields.audioMimeType !== undefined)
    row.audio_mime_type = fields.audioMimeType;
  if (fields.audioUrl !== undefined) row.audio_url = fields.audioUrl;
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

  async list(): Promise<Episode[]> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .order("created_at", { ascending: false });
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

  async delete(id: string): Promise<void> {
    const supabase = await this.client();
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    if (error) throw new Error(`episode delete failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Binary drivers (source PDFs + rendered audio)

interface BinaryDriver {
  saveSource(id: string, data: Uint8Array): Promise<void>;
  getSource(id: string): Promise<Uint8Array | null>;
  saveAudio(
    id: string,
    data: Uint8Array,
    mimeType: string,
  ): Promise<{ url?: string }>;
  getAudio(
    id: string,
    mimeType: string,
  ): Promise<{ data?: Uint8Array; url?: string } | null>;
  delete(id: string, mimeType?: string): Promise<void>;
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
    await fs.writeFile(
      path.join(await this.dir("audio"), `${id}.${ext}`),
      data,
    );
    return {};
  }

  async getAudio(id: string, mimeType: string) {
    const ext = AUDIO_EXT[mimeType] ?? "bin";
    try {
      return {
        data: new Uint8Array(
          await fs.readFile(path.join(this.root, "audio", `${id}.${ext}`)),
        ),
      };
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
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/pdf",
    });
  }

  async getSource(id: string): Promise<Uint8Array | null> {
    const { list } = await this.blob();
    const { blobs } = await list({ prefix: `sources/${id}.pdf` });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  }

  async saveAudio(id: string, data: Uint8Array, mimeType: string) {
    const { put } = await this.blob();
    const ext = AUDIO_EXT[mimeType] ?? "bin";
    const blob = await put(`audio/${id}.${ext}`, Buffer.from(data), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: mimeType,
    });
    return { url: blob.url };
  }

  async getAudio(): Promise<null> {
    // Blob audio is always reached via the stored public URL on the episode.
    return null;
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

  list() {
    return this.meta.list();
  }

  get(id: string) {
    assertId(id);
    return this.meta.get(id);
  }

  create(episode: Episode) {
    assertId(episode.id);
    return this.meta.create(episode);
  }

  patch(id: string, fields: Partial<Episode>) {
    assertId(id);
    return this.meta.patch(id, fields);
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

  async getAudio(id: string) {
    assertId(id);
    const episode = await this.meta.get(id);
    if (!episode) return null;
    const mimeType = episode.audioMimeType ?? "audio/wav";
    if (episode.audioUrl) return { url: episode.audioUrl, mimeType };
    const audio = await this.binary.getAudio(id, mimeType);
    return audio?.data ? { data: audio.data, mimeType } : null;
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
