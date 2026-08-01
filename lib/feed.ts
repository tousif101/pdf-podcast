import { getAdminClient, supabaseConfigured } from "./supabase/admin";
import type { Episode } from "./types";
import { promises as fs } from "fs";
import path from "path";

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

export function isValidFeedToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().slice(0, 8);
}

// --- token store (Supabase in prod, filesystem locally) ---

async function fsTokenPath() {
  const dir = path.join(process.cwd(), ".data");
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, "feed-tokens.json");
}

async function fsReadTokens(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fs.readFile(await fsTokenPath(), "utf8"));
  } catch {
    return {};
  }
}

export async function getOrCreateFeedToken(userId: string): Promise<string> {
  if (supabaseConfigured()) {
    const supabase = await getAdminClient();
    const existing = await supabase
      .from("feed_tokens")
      .select("token")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing.data?.token) return existing.data.token as string;
    const token = newToken();
    const { error } = await supabase
      .from("feed_tokens")
      .insert({ token, user_id: userId });
    if (error) throw new Error(`feed token create failed: ${error.message}`);
    return token;
  }
  // Filesystem dev store keyed by userId.
  const map = await fsReadTokens();
  const found = Object.entries(map).find(([, uid]) => uid === userId);
  if (found) return found[0];
  const token = newToken();
  map[token] = userId;
  await fs.writeFile(await fsTokenPath(), JSON.stringify(map));
  return token;
}

export async function userIdForFeedToken(token: string): Promise<string | null> {
  if (!isValidFeedToken(token)) return null;
  if (supabaseConfigured()) {
    const supabase = await getAdminClient();
    const { data } = await supabase
      .from("feed_tokens")
      .select("user_id")
      .eq("token", token)
      .maybeSingle();
    return (data?.user_id as string) ?? null;
  }
  const map = await fsReadTokens();
  return map[token] ?? null;
}

// --- RSS rendering ---

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rssDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}

export interface FeedContext {
  feedUrl: string;
  audioBase: string; // e.g. https://host/api/feed/<token>/audio
  imageUrl: string;
}

export function buildRssXml(episodes: Episode[], ctx: FeedContext): string {
  const ready = episodes.filter(
    (e) => e.status === "ready" && typeof e.durationSeconds === "number",
  );
  const items = ready
    .map((e) => {
      const url = `${ctx.audioBase}/${e.id}.mp3`;
      const pub = new Date(e.createdAt).toUTCString();
      return `    <item>
      <title>${escapeXml(e.title)}</title>
      <guid isPermaLink="false">${escapeXml(e.id)}</guid>
      <pubDate>${pub}</pubDate>
      <enclosure url="${escapeXml(url)}" type="${e.audioMimeType ?? "audio/mpeg"}" length="0" />
      <itunes:duration>${rssDuration(e.durationSeconds ?? 0)}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>My PDF Podcast</title>
    <link>${escapeXml(ctx.feedUrl)}</link>
    <description>Documents turned into audio, generated with PDF Podcast.</description>
    <language>en</language>
    <itunes:author>PDF Podcast</itunes:author>
    <itunes:image href="${escapeXml(ctx.imageUrl)}" />
    <itunes:category text="Technology" />
    <itunes:explicit>false</itunes:explicit>
${items}
  </channel>
</rss>`;
}
