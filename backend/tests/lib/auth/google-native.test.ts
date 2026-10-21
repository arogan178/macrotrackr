import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  findClerkUserForGoogle,
  resetGoogleKeyCache,
  verifyGoogleIdToken,
} from "../../../src/lib/auth/google-native";

const WEB = "web-client.apps.googleusercontent.com";
const ANDROID = "android-client.apps.googleusercontent.com";
const KID = "google-key-1";

async function generateKeyPair() {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );

  return {
    privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
    publicJwk: await crypto.subtle.exportKey("jwk", pair.publicKey),
  };
}

let google: Awaited<ReturnType<typeof generateKeyPair>>;
let attacker: Awaited<ReturnType<typeof generateKeyPair>>;

beforeAll(async () => {
  google = await generateKeyPair();
  attacker = await generateKeyPair();
});

beforeEach(() => {
  resetGoogleKeyCache();
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ keys: [{ ...google.publicJwk, kid: KID, alg: "RS256" }] }), {
      headers: { "cache-control": "public, max-age=3600" },
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function sign(
  claims: Record<string, unknown> = {},
  key: JsonWebKey = google.privateJwk,
  header: Record<string, unknown> = { alg: "RS256", kid: KID, typ: "JWT" },
) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const signingInput = `${encode(header)}.${encode({
    iss: "https://accounts.google.com",
    aud: WEB,
    azp: ANDROID,
    sub: "google-sub-1",
    email: "player@gmail.com",
    email_verified: true,
    iat: now,
    exp: now + 3600,
    ...claims,
  })}`;
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${Buffer.from(signature).toString("base64url")}`;
}

const verify = (token: string) =>
  verifyGoogleIdToken(token, { webClientId: WEB, androidClientIds: ["debug-client", ANDROID] });

describe("verifyGoogleIdToken", () => {
  it("returns the identity of a valid token from one of our Android clients", async () => {
    expect(await verify(await sign())).toEqual({ sub: "google-sub-1", email: "player@gmail.com" });
  });

  it.each([
    ["signed by another key", () => sign({}, attacker.privateJwk)],
    ["minted for another audience", () => sign({ aud: "someone-else" })],
    ["requested by another app", () => sign({ azp: "someone-elses-android-client" })],
    ["missing azp", () => sign({ azp: undefined })],
    ["with an unverified email", () => sign({ email_verified: false })],
    ["from another issuer", () => sign({ iss: "https://evil.example" })],
    ["expired", () => sign({ exp: Math.floor(Date.now() / 1000) - 600 })],
    ["claiming an unsigned algorithm", () => sign({}, google.privateJwk, { alg: "none", kid: KID })],
    ["naming an unknown key", () => sign({}, google.privateJwk, { alg: "RS256", kid: "other" })],
  ])("rejects a token %s", async (_label, makeToken) => {
    expect(await verify(await makeToken())).toBeNull();
  });

  it("rejects a token that is not a JWT", async () => {
    expect(await verify("not-a-token")).toBeNull();
  });

  it("reuses Google's keys until they expire", async () => {
    await verify(await sign());
    await verify(await sign());
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

function clerkWithUsers(users: unknown[]) {
  return { users: { getUserList: vi.fn().mockResolvedValue({ data: users }) } } as never;
}

function googleAccount(providerUserId: string, status = "verified") {
  return { provider: "oauth_google", providerUserId, verification: { status } };
}

describe("findClerkUserForGoogle", () => {
  const identity = { sub: "google-sub-1", email: "player@gmail.com" };

  it("finds the user who linked this Google account", async () => {
    const clerk = clerkWithUsers([{ id: "user_owner", externalAccounts: [googleAccount("google-sub-1")] }]);
    expect(await findClerkUserForGoogle(clerk, identity)).toBe("user_owner");
  });

  it("ignores a user who only has the email address", async () => {
    // An admin-asserted address must not hand its holder this Google identity.
    const clerk = clerkWithUsers([{ id: "user_squatter", externalAccounts: [] }]);
    expect(await findClerkUserForGoogle(clerk, identity)).toBeNull();
  });

  it("ignores a different Google account on the same address", async () => {
    const clerk = clerkWithUsers([{ id: "user_other", externalAccounts: [googleAccount("google-sub-2")] }]);
    expect(await findClerkUserForGoogle(clerk, identity)).toBeNull();
  });

  it("ignores a link that was never verified", async () => {
    const clerk = clerkWithUsers([
      { id: "user_pending", externalAccounts: [googleAccount("google-sub-1", "unverified")] },
    ]);
    expect(await findClerkUserForGoogle(clerk, identity)).toBeNull();
  });
});
