
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str) {
  let normalized = str.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET nao configurada. Defina uma string aleatoria longa nas variaveis de ambiente (ex: openssl rand -base64 32)."
    );
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken() {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS });
  const payloadB64 = bytesToBase64Url(encoder.encode(payload));
  const key = await getKey();
  const signatureBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(signatureBuf));
  return `${payloadB64}.${sigB64}`;
}

// Nunca lança erro pra fora — qualquer token malformado, assinatura
// inválida ou expirada simplesmente resulta em "não autenticado".
export async function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;

  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;

  try {
    const key = await getKey();
    const signature = base64UrlToBytes(sigB64);
    const valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(payloadB64));
    if (!valid) return false;

    const payload = JSON.parse(decoder.decode(base64UrlToBytes(payloadB64)));
    if (!payload.exp || Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
