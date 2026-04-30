import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "pdf_chat_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET env var is required (min 16 chars). Set it in .env.local"
    );
  }
  return secret;
}

export function sign(value: string): string {
  const h = createHmac("sha256", getSecret()).update(value).digest("hex");
  return `${value}.${h}`;
}

export function verify(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", getSecret()).update(value).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return value;
  } catch {
    return null;
  }
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.AUTH_USERNAME;
  const p = process.env.AUTH_PASSWORD;
  if (!u || !p) return false;
  if (username.length !== u.length || password.length !== p.length) return false;
  return (
    timingSafeEqual(Buffer.from(username), Buffer.from(u)) &&
    timingSafeEqual(Buffer.from(password), Buffer.from(p))
  );
}
