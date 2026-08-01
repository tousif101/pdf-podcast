const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

export function isValidShareToken(token: string): boolean {
  return SHARE_TOKEN_RE.test(token);
}

export function newShareToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
