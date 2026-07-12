import { randomBytes } from "crypto";

// 24 random bytes → 32-char base64url (~192 bits). The token IS the capability,
// so it must never appear in listings or export backups.
export function newShareToken(): string {
  return randomBytes(24).toString("base64url");
}

const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;

export function isShareToken(raw: string): boolean {
  return TOKEN_RE.test(raw);
}
