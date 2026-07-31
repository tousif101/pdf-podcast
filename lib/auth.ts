import { createClient } from "./supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  return {
    id: user.id,
    email: user.email,
    isAdmin: Boolean(adminEmail && user.email.toLowerCase() === adminEmail),
  };
}

export function canAccessEpisode(
  user: SessionUser,
  episodeUserId: string | undefined,
): boolean {
  if (episodeUserId === user.id) return true;
  // Legacy pre-auth episodes have no owner; only the admin can touch them.
  return episodeUserId === undefined && user.isAdmin;
}
