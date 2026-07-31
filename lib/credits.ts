import { getAdminClient, supabaseConfigured } from "./supabase/admin";
import { LENGTH_BUDGETS } from "./options";
import type { EpisodeLength, EpisodeMode } from "./types";

// 1 credit ≈ 25 minutes of read-aloud audio; conversations are a fixed-length
// summary regardless of input size.
const READ_CHARS_PER_CREDIT = 25_000;
// Read-aloud is capped by the selected length, so cost tops out here; the cap
// also guards against any extraction anomaly inflating the charge.
const MAX_CREDITS_PER_EPISODE = 8;

/** Chars actually spoken = min(extracted, the length budget's read cap). */
function readableChars(extractedChars: number, length: EpisodeLength): number {
  return Math.min(Math.max(0, extractedChars), LENGTH_BUDGETS[length].readChars);
}

export function creditCost(
  mode: EpisodeMode,
  extractedChars: number,
  length: EpisodeLength = "standard",
): number {
  if (mode === "reading") {
    const chars = readableChars(extractedChars, length);
    return Math.min(
      MAX_CREDITS_PER_EPISODE,
      Math.max(1, Math.ceil(chars / READ_CHARS_PER_CREDIT)),
    );
  }
  return 1;
}

export function estimateMinutes(
  mode: EpisodeMode,
  extractedChars: number,
  length: EpisodeLength = "standard",
): number {
  if (mode === "reading") {
    return Math.max(1, Math.round(readableChars(extractedChars, length) / 1_000));
  }
  return LENGTH_BUDGETS[length].approxMinutes;
}

/** Credits are enforced only when Supabase is configured (always, in production). */
export function creditsEnabled(): boolean {
  return supabaseConfigured();
}

export async function getBalance(userId: string): Promise<number> {
  if (!creditsEnabled()) return Infinity;
  const supabase = await getAdminClient();
  const { data, error } = await supabase.rpc("credit_balance", {
    p_user: userId,
  });
  if (error) throw new Error(`credit balance failed: ${error.message}`);
  return Number(data ?? 0);
}

export async function spendCredits(
  userId: string,
  amount: number,
  episodeId: string,
): Promise<boolean> {
  if (!creditsEnabled()) return true;
  const supabase = await getAdminClient();
  const { data, error } = await supabase.rpc("spend_credits", {
    p_user: userId,
    p_amount: amount,
    p_ref: `episode:${episodeId}`,
  });
  if (error) throw new Error(`credit spend failed: ${error.message}`);
  return data === true;
}

export async function refundEpisode(
  userId: string,
  episodeId: string,
): Promise<void> {
  if (!creditsEnabled()) return;
  const supabase = await getAdminClient();
  const { error } = await supabase.rpc("refund_episode", {
    p_user: userId,
    p_episode: episodeId,
  });
  if (error) throw new Error(`credit refund failed: ${error.message}`);
}
