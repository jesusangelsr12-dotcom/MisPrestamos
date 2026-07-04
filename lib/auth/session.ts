// Sesión de PIN firmada con HMAC-SHA256 (Web Crypto).
// Funciona tanto en el runtime Edge (middleware) como en Node (route handlers),
// por lo que la cookie no puede falsificarse desde el cliente.

const encoder = new TextEncoder();

export const SESSION_COOKIE = "cuotas_auth";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas

function getSecret(): string {
  const secret = process.env.PIN_SESSION_SECRET;
  if (secret) return secret;
  // En desarrollo permitimos un secreto por defecto para no romper el flujo local;
  // en producción es obligatorio configurar PIN_SESSION_SECRET.
  if (process.env.NODE_ENV !== "production") {
    return "dev-insecure-secret-change-me";
  }
  throw new Error("PIN_SESSION_SECRET es requerido en producción");
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Comparación en tiempo constante para evitar timing attacks sobre la firma.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function sign(payload: string): Promise<string> {
  const key = await importKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(sig);
}

/** Genera un token de sesión firmado que expira en 24h. `now` = Date.now(). */
export async function createSessionToken(now: number): Promise<string> {
  const payload = String(now + SESSION_TTL_MS);
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

/** Valida firma y expiración. `now` = Date.now(). */
export async function verifySessionToken(
  token: string | undefined,
  now: number
): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < now) return false;

  const expected = await sign(payload);
  return safeEqual(signature, expected);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_TTL_MS / 1000,
  path: "/",
};
