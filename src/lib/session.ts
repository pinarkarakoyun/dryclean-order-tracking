// Signed session token for the admin login cookie.
// Uses only the Web Crypto API, so it works both in src/proxy.ts and in server code.
//
// Token format: "<expiresAtMs>.<signature>"
// The signature is an HMAC of the expiry time with AUTH_SECRET. Without the secret
// nobody can create a valid token, and changing the expiry breaks the signature.

export const SESSION_COOKIE = "mustan_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days: the shop device stays logged in

const encoder = new TextEncoder();

function getSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Creates a new session token, or null if AUTH_SECRET is not configured. */
export async function createSessionToken(): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;

  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(secret),
    encoder.encode(expiresAt),
  );
  return `${expiresAt}.${toBase64Url(signature)}`;
}

/** True if the token was signed with our secret and has not expired. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;

  const [expiresAt, signature] = token.split(".");
  const signatureBytes = signature ? fromBase64Url(signature) : null;
  if (!expiresAt || !signatureBytes) return false;

  // crypto.subtle.verify compares in constant time (no timing attacks).
  const isValid = await crypto.subtle.verify(
    "HMAC",
    await getKey(secret),
    signatureBytes,
    encoder.encode(expiresAt),
  );
  return isValid && Number(expiresAt) > Date.now();
}
