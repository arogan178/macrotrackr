import type { ClerkClient } from "elysia-clerk";

const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const CLOCK_SKEW_SECONDS = 60;

type GoogleKey = JsonWebKey & { kid?: string };

let cachedKeys: { keys: GoogleKey[]; expiresAt: number } | null = null;

async function getGoogleKey(kid: string): Promise<GoogleKey | undefined> {
  const find = () => cachedKeys?.keys.find((key) => key.kid === kid);
  if (cachedKeys && cachedKeys.expiresAt > Date.now() && find()) {
    return find();
  }

  const response = await fetch(GOOGLE_CERTS_URL, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error(`Google certificates request failed: ${response.status}`);
  }
  const maxAge = Number(
    /max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 3600,
  );
  const { keys } = (await response.json()) as { keys: GoogleKey[] };
  cachedKeys = { keys, expiresAt: Date.now() + maxAge * 1000 };

  return find();
}

export function resetGoogleKeyCache(): void {
  cachedKeys = null;
}

function decodeSegment(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

export interface GoogleIdentity {
  sub: string;
  email: string;
}

/**
 * Returns the identity only for a Google-signed token minted for our web
 * client at the request of one of our Android clients, with a verified email.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  { webClientId, androidClientIds }: { webClientId: string; androidClientIds: string[] },
): Promise<GoogleIdentity | null> {
  const [headerPart, payloadPart, signaturePart] = idToken.split(".");
  if (!headerPart || !payloadPart || !signaturePart) {
    return null;
  }

  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = decodeSegment(headerPart) as typeof header;
    payload = decodeSegment(payloadPart) as typeof payload;
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || !header.kid) {
    return null;
  }

  const jwk = await getGoogleKey(header.kid);
  if (!jwk) {
    return null;
  }
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signed = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    Buffer.from(signaturePart, "base64url"),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`),
  );
  if (!signed) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const { iss, aud, azp, exp, email_verified, sub, email } = payload;
  if (
    typeof iss !== "string" ||
    !GOOGLE_ISSUERS.has(iss) ||
    aud !== webClientId ||
    typeof azp !== "string" ||
    !androidClientIds.includes(azp) ||
    typeof exp !== "number" ||
    exp + CLOCK_SKEW_SECONDS < now ||
    email_verified !== true ||
    typeof sub !== "string" ||
    typeof email !== "string"
  ) {
    return null;
  }

  return { sub, email };
}

/**
 * The Clerk user who linked this exact Google account through Clerk's own
 * OAuth. Email only narrows the search: an address on a Clerk user can be
 * admin-asserted, so it never proves ownership on its own.
 */
export async function findClerkUserForGoogle(
  clerk: Pick<ClerkClient, "users">,
  identity: GoogleIdentity,
): Promise<string | null> {
  const { data } = await clerk.users.getUserList({
    emailAddress: [identity.email],
    limit: 20,
  });
  const owner = data.find((user) =>
    user.externalAccounts.some(
      (account) =>
        account.provider === "oauth_google" &&
        account.providerUserId === identity.sub &&
        account.verification?.status === "verified",
    ),
  );

  return owner?.id ?? null;
}
