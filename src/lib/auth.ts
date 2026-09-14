/**
 * Session handling.
 *
 * The token is a signed, self-contained string so it can be verified in the
 * edge runtime by `proxy.ts`, where Prisma is not available. The proxy only
 * establishes that a session is valid and unexpired; anything that needs the
 * user record loads it in the node runtime via `getCurrentUser`.
 */

export const SESSION_COOKIE = "methodology_session";
const SESSION_DAYS = 30;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return base64UrlEncode(new Uint8Array(signature));
}

/** Constant-time comparison, so a bad signature leaks nothing through timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionToken(userId: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<{ userId: string } | null> {
  if (!token) return null;

  const index = token.lastIndexOf(".");
  if (index === -1) return null;

  const payload = token.slice(0, index);
  const signature = token.slice(index + 1);
  if (!safeEqual(signature, await sign(payload))) return null;

  const [userId, expiresAt] = payload.split(".");
  if (!userId || !expiresAt) return null;
  if (Number.parseInt(expiresAt, 10) < Date.now()) return null;

  return { userId };
}

export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
