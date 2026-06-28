// Signed session token utilities.
//
// The session cookie is an HMAC-SHA256-signed token of the form
// `<base64url(payload)>.<base64url(signature)>`. The payload carries an
// expiry timestamp. Because the value is signed with SESSION_SECRET (which
// never leaves the server) it cannot be forged, unlike the previous static
// `cuotas_auth=true` cookie.
//
// This module is intentionally free of `next/headers` imports so it can run in
// both the Edge runtime (middleware) and the Node.js runtime (route handlers).
// It only uses Web Crypto / TextEncoder / btoa, all available in both.

export const SESSION_COOKIE_NAME = "cuotas_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET no está configurado (mínimo 16 caracteres). " +
        "Agrégalo a las variables de entorno del proyecto."
    );
  }
  return secret;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(): Promise<string> {
  const enc = new TextEncoder();
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = bytesToBase64url(enc.encode(JSON.stringify({ exp })));
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${bytesToBase64url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  try {
    const enc = new TextEncoder();
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(signature) as BufferSource,
      enc.encode(payload)
    );
    if (!valid) return false;

    const data = JSON.parse(
      new TextDecoder().decode(base64urlToBytes(payload))
    ) as { exp?: number };
    if (typeof data.exp !== "number") return false;
    return data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}
