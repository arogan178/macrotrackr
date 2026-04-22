import type { Database } from "bun:sqlite";
import { Elysia } from "elysia";
import { randomBytes, createHash } from "node:crypto";
import {
  type UserRow,
  safeExecute,
  safeQuery,
  withTransaction,
} from "../../lib/data/database";
import {
  AccountLinkRequiredError,
  AuthenticationError,
  ConflictError,
  BadRequestError,
  NotFoundError,
} from "../../lib/http/errors";
import { logger } from "../../lib/observability/logger";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import type { RouteContext } from "../../types";
import { resolveClerkIdentity } from "../../lib/auth/route-adapter";
import {
  createExpiredSessionCookieValue,
  createSession,
  createSessionCookieValue,
  deleteAllSessionsExcept,
  deleteAllUserSessions,
  deleteSession,
  readSessionTokenFromRequest,
} from "../../lib/auth/session";
import { emailService } from "../../services/email-service";
import { generateId } from "../../utils/id-generator";
import { getConfig } from "../../config";
import { AuthSchemas } from "./schemas";

interface ClerkUserRecord {
  emailAddresses?: Array<{ id?: string; emailAddress?: string }>;
  primaryEmailAddressId?: string;
  firstName?: string;
  lastName?: string;
}

function getPrimaryClerkEmail(user: ClerkUserRecord | undefined): string | undefined {
  if (!user?.emailAddresses || user.emailAddresses.length === 0) {
    return undefined;
  }

  if (user.primaryEmailAddressId) {
    const primary = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    if (primary?.emailAddress) {
      return primary.emailAddress;
    }
  }

  return user.emailAddresses[0]?.emailAddress;
}

interface ClerkApiClient {
  users?: {
    getUser?: (userId: string) => Promise<ClerkUserRecord | undefined>;
    deleteUser?: (userId: string) => Promise<void>;
  };
}

async function cleanupTransientClerkUser(
  clerkClient: ClerkApiClient | undefined,
  currentClerkUserId: string,
  existingClerkUserId: string | null,
): Promise<void> {
  if (
    !currentClerkUserId ||
    currentClerkUserId === existingClerkUserId ||
    !clerkClient?.users?.deleteUser
  ) {
    return;
  }

  try {
    await clerkClient.users.deleteUser(currentClerkUserId);
    logger.info(
      { currentClerkUserId },
      "[clerk-sync] Deleted transient Clerk user",
    );
  } catch (error) {
    logger.error(
      { currentClerkUserId, error },
      "[clerk-sync] Failed to delete transient Clerk user (continuing)",
    );
  }
}

type AuthRouteContext<TBody = Record<string, unknown>> = RouteContext<
  TBody,
  Record<string, string>,
  Record<string, string | undefined>
> & {
  db: Database;
  clerkClient?: ClerkApiClient;
  authenticatedUser?: {
    userId: number | null;
    providerUserId: string;
    authProvider: "clerk" | "local";
    sessionId?: string;
    clerkUserId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

type RegisterRequestBody = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type LoginRequestBody = {
  email: string;
  password: string;
};

type ForgotPasswordRequestBody = {
  email: string;
};

type ResetPasswordRequestBody = {
  token: string;
  newPassword: string;
};

type ChangePasswordRequestBody = {
  currentPassword: string;
  newPassword: string;
};

const SESSION_SLIDING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function setSessionCookie(context: { set: { headers?: unknown } }, token: string): void {
  const headers = (context.set.headers ?? {}) as Record<string, string>;
  headers["Set-Cookie"] = createSessionCookieValue(token);
  context.set.headers = headers;
}

function clearSessionCookie(context: { set: { headers?: unknown } }): void {
  const headers = (context.set.headers ?? {}) as Record<string, string>;
  headers["Set-Cookie"] = createExpiredSessionCookieValue();
  context.set.headers = headers;
}

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createPasswordResetTokenPair(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: hashResetToken(rawToken),
  };
}

function buildResetTokenExpiry(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

function userHasLocalCredential(user: Pick<UserRow, "password">): boolean {
  return user.password !== "clerk-auth";
}

function getHeaderValue(headers: unknown, key: string): string | null {
  if (!headers || typeof headers !== "object") {
    return null;
  }

  const record = headers as Record<string, unknown>;
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function assertLocalRouteAccess(context: {
  authenticatedUser?: AuthRouteContext["authenticatedUser"];
  set: { status?: number };
}): NonNullable<AuthRouteContext["authenticatedUser"]> {
  const auth = context.authenticatedUser;

  if (!auth) {
    context.set.status = 401;
    throw new AuthenticationError("Authentication required. Please sign in.");
  }

  if (auth.authProvider !== "local") {
    context.set.status = 404;
    throw new NotFoundError("Not found");
  }

  return auth;
}

export const authRoutes = (app: Elysia) =>
  app.group("/api/auth", (group) =>
    group
      .post(
        "/register",
        async (context) => {
          const { db, body, request } =
            context as unknown as AuthRouteContext<RegisterRequestBody> & {
              body: RegisterRequestBody;
            };

          const authHeader = getHeaderValue(context.headers, "authorization");
          if (authHeader) {
            context.set.status = 404;
            throw new NotFoundError("Not found");
          }

          if (getConfig().AUTH_MODE !== "local") {
            context.set.status = 404;
            throw new NotFoundError("Not found");
          }

          const email = body.email.trim().toLowerCase();
          const existing = safeQuery<{ id: number }>(
            db,
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
            [email],
          );
          if (existing) {
            throw new ConflictError("An account with this email already exists.");
          }

          const passwordHash = await hashPassword(body.password);

          const userId = withTransaction(db, () => {
            const result = safeExecute(
              db,
              "INSERT INTO users (email, first_name, last_name, password) VALUES (?, ?, ?, ?)",
              [email, body.firstName.trim(), body.lastName.trim(), passwordHash],
            );
            const insertedId = Number(result.lastInsertRowid);

            safeExecute(
              db,
              `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
               VALUES (?, NULL, NULL, NULL, NULL, NULL)`,
              [insertedId],
            );

            safeExecute(
              db,
              `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
               VALUES (?, 30, 40, 30, '[]')`,
              [insertedId],
            );

            return insertedId;
          });

          const { token } = createSession(db, userId, {
            ip: getClientIp(request),
            userAgent: request.headers.get("user-agent"),
          });
          setSessionCookie(context, token);

          return {
            success: true,
            message: "Account created successfully",
          };
        },
        {
          body: AuthSchemas.register,
          response: AuthSchemas.successResponse,
          detail: {
            summary: "Register local account",
            tags: ["Auth"],
          },
        },
      )
      .post(
        "/login",
        async (context) => {
          const { db, body, request } =
            context as unknown as AuthRouteContext<LoginRequestBody> & {
              body: LoginRequestBody;
            };

          const authHeader = getHeaderValue(context.headers, "authorization");
          if (authHeader) {
            context.set.status = 404;
            throw new NotFoundError("Not found");
          }

          if (getConfig().AUTH_MODE !== "local") {
            context.set.status = 404;
            throw new NotFoundError("Not found");
          }

          const email = body.email.trim().toLowerCase();
          const user = safeQuery<UserRow>(
            db,
            "SELECT id, email, password FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
            [email],
          );

          if (!user || !userHasLocalCredential(user)) {
            throw new AuthenticationError("Invalid email or password.");
          }

          const validPassword = await verifyPassword(body.password, user.password);
          if (!validPassword) {
            throw new AuthenticationError("Invalid email or password.");
          }

          deleteAllUserSessions(db, user.id);

          const { token } = createSession(db, user.id, {
            ip: getClientIp(request),
            userAgent: request.headers.get("user-agent"),
          });
          setSessionCookie(context, token);

          return {
            success: true,
            message: "Signed in successfully",
          };
        },
        {
          body: AuthSchemas.login,
          response: AuthSchemas.successResponse,
          detail: {
            summary: "Login local account",
            tags: ["Auth"],
          },
        },
      )
      .post(
        "/logout",
        async (context) => {
          const { db } = context as unknown as AuthRouteContext;
          const auth = assertLocalRouteAccess(context as unknown as AuthRouteContext);
          if (!auth.sessionId || !auth.userId) {
            context.set.status = 401;
            throw new AuthenticationError("Authentication required. Please sign in.");
          }

          deleteSession(db, auth.sessionId);
          clearSessionCookie(context);

          return {
            success: true,
            message: "Signed out successfully",
          };
        },
        {
          response: AuthSchemas.successResponse,
          detail: {
            summary: "Logout current session",
            tags: ["Auth"],
          },
        },
      )
      .post(
        "/logout-all",
        async (context) => {
          const { db } = context as unknown as AuthRouteContext;
          const auth = assertLocalRouteAccess(context as unknown as AuthRouteContext);
          if (!auth.userId || !auth.sessionId) {
            context.set.status = 401;
            throw new AuthenticationError("Authentication required. Please sign in.");
          }

          deleteAllUserSessions(db, auth.userId);
          clearSessionCookie(context);

          return {
            success: true,
            message: "Signed out from all sessions",
          };
        },
        {
          response: AuthSchemas.successResponse,
          detail: {
            summary: "Logout all sessions",
            tags: ["Auth"],
          },
        },
      )
      .get(
        "/session",
        async (context) => {
          const { db } = context as unknown as AuthRouteContext;
          const auth = context as unknown as AuthRouteContext;
          if (getConfig().AUTH_MODE !== "local") {
            return {
              authenticated: false,
              user: null,
            };
          }

          if (!auth.authenticatedUser?.userId) {
            return {
              authenticated: false,
              user: null,
            };
          }

          const user = safeQuery<{
            id: number;
            email: string;
            first_name: string;
            last_name: string;
          }>(
            db,
            "SELECT id, email, first_name, last_name FROM users WHERE id = ? LIMIT 1",
            [auth.authenticatedUser.userId],
          );

          if (!user) {
            return {
              authenticated: false,
              user: null,
            };
          }

          return {
            authenticated: true,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
            },
          };
        },
        {
          response: AuthSchemas.sessionResponse,
          detail: {
            summary: "Get local session status",
            tags: ["Auth"],
          },
        },
      )
      .post(
        "/forgot-password",
        async (context) => {
          const { db, body } =
            context as unknown as AuthRouteContext<ForgotPasswordRequestBody> & {
              body: ForgotPasswordRequestBody;
            };

          const authHeader = getHeaderValue(context.headers, "authorization");
          if (authHeader) {
            context.set.status = 404;
            throw new NotFoundError("Not found");
          }

          if (getConfig().AUTH_MODE !== "local") {
            context.set.status = 404;
            throw new NotFoundError("Not found");
          }

          const email = body.email.trim().toLowerCase();
          const user = safeQuery<{ id: number; email: string }>(
            db,
            "SELECT id, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
            [email],
          );

          if (!user) {
            return {
              success: true,
              message: "If this email exists, a reset link has been sent.",
            };
          }

          const { rawToken, tokenHash } = createPasswordResetTokenPair();
          const expiresAt = buildResetTokenExpiry();

          safeExecute(
            db,
            "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL",
            [user.id],
          );

          safeExecute(
            db,
            `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
             VALUES (?, ?, ?, ?)`,
            [generateId(), user.id, tokenHash, expiresAt],
          );

          await emailService.sendPasswordResetEmail(user.email, rawToken);

          return {
            success: true,
            message: "If this email exists, a reset link has been sent.",
          };
        },
        {
          body: AuthSchemas.forgotPassword,
          response: AuthSchemas.successResponse,
          detail: {
            summary: "Request password reset",
            tags: ["Auth"],
          },
        },
      )
      .post(
        "/reset-password",
        async (context) => {
          const { db, body } =
            context as unknown as AuthRouteContext<ResetPasswordRequestBody> & {
              body: ResetPasswordRequestBody;
            };

          const tokenHash = hashResetToken(body.token);

          const tokenRecord = safeQuery<{
            id: string;
            user_id: number;
            expires_at: string;
            used_at: string | null;
          }>(
            db,
            `SELECT id, user_id, expires_at, used_at
             FROM password_reset_tokens
             WHERE token_hash = ?
             LIMIT 1`,
            [tokenHash],
          );

          if (!tokenRecord || tokenRecord.used_at) {
            throw new AuthenticationError("Invalid or expired password reset token.");
          }

          const expiresAt = new Date(tokenRecord.expires_at);
          if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
            throw new AuthenticationError("Invalid or expired password reset token.");
          }

          const newPasswordHash = await hashPassword(body.newPassword);

          withTransaction(db, () => {
            safeExecute(
              db,
              "UPDATE users SET password = ? WHERE id = ?",
              [newPasswordHash, tokenRecord.user_id],
            );
            safeExecute(
              db,
              "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?",
              [tokenRecord.id],
            );
            deleteAllUserSessions(db, tokenRecord.user_id);
          });

          return {
            success: true,
            message: "Password has been reset successfully.",
          };
        },
        {
          body: AuthSchemas.resetPassword,
          response: AuthSchemas.successResponse,
          detail: {
            summary: "Reset password with token",
            description: "Resets a password using a valid password reset token",
            tags: ["Auth"],
          },
        },
      )
      .post(
        "/change-password",
        async (context) => {
          const { db, body, request } =
            context as unknown as AuthRouteContext<ChangePasswordRequestBody> & {
              body: ChangePasswordRequestBody;
            };

          const auth = assertLocalRouteAccess(context as unknown as AuthRouteContext);
          if (!auth.userId || !auth.sessionId) {
            context.set.status = 401;
            throw new AuthenticationError("Authentication required. Please sign in.");
          }

          const userId = auth.userId;
          const sessionId = auth.sessionId;

          const currentUser = safeQuery<Pick<UserRow, "password">>(
            db,
            "SELECT password FROM users WHERE id = ? LIMIT 1",
            [userId],
          );
          if (!currentUser || !userHasLocalCredential(currentUser)) {
            throw new AuthenticationError("Current password is incorrect.");
          }

          const validPassword = await verifyPassword(body.currentPassword, currentUser.password);
          if (!validPassword) {
            throw new AuthenticationError("Current password is incorrect.");
          }

          const nextPasswordHash = await hashPassword(body.newPassword);

          withTransaction(db, () => {
            safeExecute(db, "UPDATE users SET password = ? WHERE id = ?", [nextPasswordHash, userId]);
            deleteAllUserSessions(db, userId);
          });

          const { token } = createSession(db, userId, {
            ip: getClientIp(request),
            userAgent: request.headers.get("user-agent"),
          });
          setSessionCookie(context, token);

          const newSessionId = token.split(".")[0];
          if (!newSessionId) {
            throw new BadRequestError("Unable to rotate session");
          }

          deleteAllSessionsExcept(db, userId, newSessionId);
          deleteSession(db, sessionId);

          return {
            success: true,
            message: "Password updated successfully.",
          };
        },
        {
          body: AuthSchemas.changePassword,
          response: AuthSchemas.successResponse,
          detail: {
            summary: "Change local account password",
            tags: ["Auth"],
          },
        },
      )
      .post(
        "/clerk-sync",
        async (context) => {
          const config = getConfig();
          if (config.AUTH_MODE !== "clerk") {
            context.set.status = 404;
            throw new NotFoundError("Not found");
          }

          const { db, clerkClient } = context as unknown as AuthRouteContext;
          const {
            clerkUserId,
            email: initialEmail,
            firstName: initialFirstName,
            lastName: initialLastName,
          } = resolveClerkIdentity(context as unknown as RouteContext);

          let email = initialEmail;
          let firstName = initialFirstName ?? "";
          let lastName = initialLastName ?? "";

          if (!email || !firstName || !lastName) {
            try {
              const clerkUser = await clerkClient?.users?.getUser?.(clerkUserId);
              email = email ?? getPrimaryClerkEmail(clerkUser);
              firstName = firstName || (clerkUser?.firstName ?? "");
              lastName = lastName || (clerkUser?.lastName ?? "");
            } catch (error) {
              logger.warn(
                { clerkUserId, error },
                "Failed to resolve Clerk user details during sync",
              );
            }
          }

          if (!email) {
            throw new AuthenticationError(
              "Unable to resolve Clerk account email. Please verify your email and try again.",
            );
          }

          const existingByClerkId = safeQuery<UserRow & { email: string }>(
            db,
            "SELECT id, email FROM users WHERE clerk_id = ?",
            [clerkUserId],
          );

          const existingByEmail = safeQuery<UserRow & { clerk_id: string | null; email: string }>(
            db,
            "SELECT id, clerk_id, email FROM users WHERE LOWER(email) = LOWER(?)",
            [email],
          );

          if (existingByClerkId) {
            const currentEmail = existingByClerkId.email;
            let emailToUpdate = email;

            const emailOwner = safeQuery<{ id: number; clerk_id: string | null }>(
              db,
              "SELECT id, clerk_id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
              [email, existingByClerkId.id],
            );

            if (emailOwner) {
              emailToUpdate = currentEmail;
            }

            safeExecute(
              db,
              "UPDATE users SET clerk_id = ?, email = ?, first_name = ?, last_name = ? WHERE id = ?",
              [clerkUserId, emailToUpdate, firstName, lastName, existingByClerkId.id],
            );

            return {
              id: existingByClerkId.id,
              clerkId: clerkUserId,
              email: emailToUpdate,
              firstName,
              lastName,
              message: "User synced successfully",
            };
          }

          if (existingByEmail) {
            await cleanupTransientClerkUser(
              clerkClient,
              clerkUserId,
              existingByEmail.clerk_id,
            );
            throw new AccountLinkRequiredError(
              "A user with this email already exists. Please sign in with your existing method to link accounts.",
            );
          }

          const userData = withTransaction(db, () => {
            const userResult = safeExecute(
              db,
              "INSERT INTO users (email, first_name, last_name, clerk_id, password) VALUES (?, ?, ?, ?, ?)",
              [email, firstName, lastName, clerkUserId, "clerk-auth"],
            );
            const userId = Number(userResult.lastInsertRowid);

            safeExecute(
              db,
              `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
               VALUES (?, NULL, NULL, NULL, NULL, NULL)`,
              [userId],
            );

            safeExecute(
              db,
              `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
               VALUES (?, 30, 40, 30, '[]')`,
              [userId],
            );

            return { userId };
          });

          return {
            id: userData.userId,
            clerkId: clerkUserId,
            email,
            firstName,
            lastName,
            message: "User created and synced successfully",
          };
        },
        {
          detail: {
            summary: "Sync Clerk user with database",
            description: "Creates or updates a user in our database based on Clerk authentication",
            tags: ["Auth"],
          },
        },
      ),
  );

export function isSessionFresh(lastUsedAt: string): boolean {
  const last = new Date(lastUsedAt).getTime();
  if (!Number.isFinite(last)) {
    return false;
  }

  return Date.now() - last <= SESSION_SLIDING_TTL_MS;
}

export function clearCurrentSession(db: Database, request: Request): void {
  const token = readSessionTokenFromRequest(request);
  if (!token) {
    return;
  }

  const sessionId = token.split(".")[0];
  if (!sessionId) {
    return;
  }

  deleteSession(db, sessionId);
}
