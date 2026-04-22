import type { Database } from "bun:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { generateId } from "../../utils/id-generator";

const SESSION_COOKIE_NAME = "mt_session";
const SESSION_TTL_DAYS = 30;

interface SessionRow {
  id: string;
  user_id: number;
  secret_hash: string;
  expires_at: string;
}

export interface SessionUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ResolvedSession {
  sessionId: string;
  userId: number;
  user: SessionUser;
}

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function createRawSecret(): string {
  return randomBytes(32).toString("base64url");
}

function makeExpiryDate(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_TTL_DAYS);
  return expires;
}

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) {
    return map;
  }

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey || rawValue.length === 0) {
      continue;
    }
    map.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }

  return map;
}

function buildCookieFlags(maxAgeSeconds: number): string {
  const isProduction = process.env.NODE_ENV === "production";
  const flags = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    isProduction ? "Secure" : undefined,
  ].filter(Boolean);

  return flags.join("; ");
}

export function createSessionCookieValue(token: string): string {
  const maxAgeSeconds = SESSION_TTL_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ${buildCookieFlags(maxAgeSeconds)}`;
}

export function createExpiredSessionCookieValue(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readSessionTokenFromRequest(request: Request): string | null {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  return cookies.get(SESSION_COOKIE_NAME) ?? null;
}

export function createSession(
  db: Database,
  userId: number,
  options: { ip?: string | null; userAgent?: string | null } = {},
): { token: string; sessionId: string } {
  const sessionId = generateId();
  const rawSecret = createRawSecret();
  const secretHash = hashSecret(rawSecret);
  const expiresAt = makeExpiryDate().toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, secret_hash, expires_at, last_used_at, ip, user_agent)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
  ).run(sessionId, userId, secretHash, expiresAt, options.ip ?? null, options.userAgent ?? null);

  return {
    token: `${sessionId}.${rawSecret}`,
    sessionId,
  };
}

export function deleteSession(db: Database, sessionId: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function deleteAllUserSessions(db: Database, userId: number): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function deleteAllSessionsExcept(
  db: Database,
  userId: number,
  keepSessionId: string,
): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(
    userId,
    keepSessionId,
  );
}

export function resolveSession(
  db: Database,
  request: Request,
): ResolvedSession | null {
  const token = readSessionTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const [sessionId, rawSecret] = token.split(".");
  if (!sessionId || !rawSecret) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT s.id, s.user_id, s.secret_hash, s.expires_at,
              u.id as user_db_id, u.email, u.first_name, u.last_name
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.id = ?
       LIMIT 1`,
    )
    .get(sessionId) as
    | (SessionRow & {
        user_db_id: number;
        email: string;
        first_name: string;
        last_name: string;
      })
    | undefined;

  if (!row) {
    return null;
  }

  if (row.secret_hash !== hashSecret(rawSecret)) {
    return null;
  }

  const expiresAt = new Date(row.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    deleteSession(db, sessionId);
    return null;
  }

  const nextExpiry = makeExpiryDate().toISOString();
  db.prepare(
    "UPDATE sessions SET last_used_at = CURRENT_TIMESTAMP, expires_at = ? WHERE id = ?",
  ).run(nextExpiry, sessionId);

  return {
    sessionId: row.id,
    userId: row.user_id,
    user: {
      id: row.user_db_id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
    },
  };
}
