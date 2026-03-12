import crypto from "crypto";

const COOKIE_NAME = "fan_dashboard_session";

function getSecret() {
  const secret = process.env.DASHBOARD_COOKIE_SECRET;
  if (!secret) {
    throw new Error("DASHBOARD_COOKIE_SECRET não configurado");
  }
  return secret;
}

function sign(value) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("hex");
}

export function createSessionToken() {
  const payload = JSON.stringify({
    ok: true,
    ts: Date.now(),
  });

  const base = Buffer.from(payload).toString("base64url");
  const sig = sign(base);
  return `${base}.${sig}`;
}

export function isValidSessionToken(token) {
  if (!token || !token.includes(".")) return false;

  const [base, sig] = token.split(".");
  const expected = sign(base);

  try {
    const same = crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expected)
    );

    if (!same) return false;

    const json = JSON.parse(Buffer.from(base, "base64url").toString("utf8"));

    if (!json?.ok || !json?.ts) return false;

    const ageMs = Date.now() - json.ts;
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 dias

    return ageMs <= maxAgeMs;
  } catch {
    return false;
  }
}

export function getCookieValue(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return rest.join("=");
    }
  }

  return null;
}

export function isAuthenticated(req) {
  const token = getCookieValue(req, COOKIE_NAME);
  return isValidSessionToken(token);
}

export function buildSessionCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=604800`;
}

export function buildLogoutCookie() {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=0`;
}