import { promises as fs } from "fs";
import path from "path";
import type { Episode } from "./types";

export interface EpisodeStore {
  list(): Promise<Episode[]>;
  get(id: string): Promise<Episode | null>;
  put(episode: Episode): Promise<void>;
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

class FsStore implements EpisodeStore {
  private root = path.join(process.cwd(), ".data");

  private episodePath(id: string) {
    return path.join(this.root, "episodes", `${id}.json`);
  }

  private async ensureDirs() {
    await fs.mkdir(path.join(this.root, "episodes"), { recursive: true });
    await fs.mkdir(path.join(this.root, "audio"), { recursive: true });
    await fs.mkdir(path.join(this.root, "sources"), { recursive: true });
  }

  async list(): Promise<Episode[]> {
    await this.ensureDirs();
    const files = await fs.readdir(path.join(this.root, "episodes"));
    const episodes = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const raw = await fs.readFile(
            path.join(this.root, "episodes", f),
            "utf8",
          );
          return JSON.parse(raw) as Episode;
        }),
    );
    return episodes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Episode | null> {
    try {
      const raw = await fs.readFile(this.episodePath(id), "utf8");
      return JSON.parse(raw) as Episode;
    } catch {
      return null;
    }
  }

  async put(episode: Episode): Promise<void> {
    await this.ensureDirs();
    await fs.writeFile(
      this.episodePath(episode.id),
      JSON.stringify(episode, null, 2),
    );
  }

  async delete(id: string): Promise<void> {
    const episode = await this.get(id);
    await fs.rm(this.episodePath(id), { force: true });
    await fs.rm(path.join(this.root, "sources", `${id}.pdf`), { force: true });
    const ext = episode?.audioMimeType ? AUDIO_EXT[episode.audioMimeType] : null;
    for (const e of ext ? [ext] : Object.values(AUDIO_EXT)) {
      await fs.rm(path.join(this.root, "audio", `${id}.${e}`), { force: true });
    }
  }

  async saveSource(id: string, data: Uint8Array): Promise<void> {
    await this.ensureDirs();
    await fs.writeFile(path.join(this.root, "sources", `${id}.pdf`), data);
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
    await this.ensureDirs();
    const ext = AUDIO_EXT[mimeType] ?? "bin";
    await fs.writeFile(path.join(this.root, "audio", `${id}.${ext}`), data);
    return {};
  }

  async getAudio(id: string) {
    const episode = await this.get(id);
    const mimeType = episode?.audioMimeType ?? "audio/wav";
    const ext = AUDIO_EXT[mimeType] ?? "bin";
    try {
      const data = new Uint8Array(
        await fs.readFile(path.join(this.root, "audio", `${id}.${ext}`)),
      );
      return { data, mimeType };
    } catch {
      return null;
    }
  }
}

class BlobStore implements EpisodeStore {
  private async blob() {
    return import("@vercel/blob");
  }

  async list(): Promise<Episode[]> {
    const { list } = await this.blob();
    const { blobs } = await list({ prefix: "episodes/" });
    const episodes = await Promise.all(
      blobs
        .filter((b) => b.pathname.endsWith(".json"))
        .map(async (b) => {
          const res = await fetch(b.url, { cache: "no-store" });
          return (await res.json()) as Episode;
        }),
    );
    return episodes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Episode | null> {
    const { list } = await this.blob();
    const { blobs } = await list({ prefix: `episodes/${id}.json` });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    return (await res.json()) as Episode;
  }

  async put(episode: Episode): Promise<void> {
    const { put } = await this.blob();
    await put(`episodes/${episode.id}.json`, JSON.stringify(episode), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  }

  async delete(id: string): Promise<void> {
    const { list, del } = await this.blob();
    for (const prefix of [
      `episodes/${id}.json`,
      `sources/${id}.pdf`,
      `audio/${id}.`,
    ]) {
      const { blobs } = await list({ prefix });
      if (blobs.length > 0) await del(blobs.map((b) => b.url));
    }
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

  async getAudio(id: string) {
    const episode = await this.get(id);
    if (!episode?.audioUrl) return null;
    return { url: episode.audioUrl, mimeType: episode.audioMimeType ?? "audio/wav" };
  }
}

let store: EpisodeStore | null = null;

export function getStore(): EpisodeStore {
  if (!store) {
    store = process.env.BLOB_READ_WRITE_TOKEN ? new BlobStore() : new FsStore();
  }
  return store;
}
