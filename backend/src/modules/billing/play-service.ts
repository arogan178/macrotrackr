// src/modules/billing/play-service.ts

import { config } from "../../config";
import { logger } from "../../lib/observability/logger";
import { BadRequestError } from "../../lib/http/errors";
import type { ProviderSubscriptionStatus } from "./subscription-service";

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ANDROID_PUBLISHER = "https://androidpublisher.googleapis.com";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

/**
 * Play's own subscription states. Worth reading before touching the mapping
 * below, because two of them are counter-intuitive: CANCELED still grants
 * access until the period ends, and IN_GRACE_PERIOD does too.
 */
type PlaySubscriptionState =
  | "SUBSCRIPTION_STATE_ACTIVE"
  | "SUBSCRIPTION_STATE_CANCELED"
  | "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
  | "SUBSCRIPTION_STATE_ON_HOLD"
  | "SUBSCRIPTION_STATE_PAUSED"
  | "SUBSCRIPTION_STATE_PENDING"
  | "SUBSCRIPTION_STATE_EXPIRED"
  | "SUBSCRIPTION_STATE_UNSPECIFIED";

interface PlaySubscriptionLineItem {
  productId?: string;
  expiryTime?: string;
}

export interface PlaySubscriptionPurchase {
  subscriptionState?: PlaySubscriptionState;
  lineItems?: PlaySubscriptionLineItem[];
  acknowledgementState?: "ACKNOWLEDGEMENT_STATE_PENDING" | "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED";
  /**
   * Present when this purchase replaced an earlier one, which happens on
   * resubscribe and on plan changes. The old token must stop granting access.
   */
  linkedPurchaseToken?: string;
  externalAccountIdentifiers?: {
    obfuscatedExternalAccountId?: string;
  };
  testPurchase?: Record<string, unknown>;
}

export interface NormalizedPlaySubscription {
  status: ProviderSubscriptionStatus;
  currentPeriodEnd: string;
  productId: string | null;
  plan: "monthly" | "yearly" | "unknown";
  needsAcknowledgement: boolean;
  linkedPurchaseToken: string | null;
  /**
   * The token the app passed at purchase time, echoed back by Play. The last
   * resort for matching a notification to an account.
   */
  obfuscatedAccountId: string | null;
  isTestPurchase: boolean;
}

function requirePlayConfig(): {
  packageName: string;
  serviceAccount: ServiceAccount;
} {
  if (config.PLAY_BILLING_MODE !== "enabled") {
    throw new BadRequestError("Google Play billing is not enabled");
  }

  const packageName = config.GOOGLE_PLAY_PACKAGE_NAME;
  const rawServiceAccount = config.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;

  if (!packageName || !rawServiceAccount) {
    throw new Error("Google Play billing is enabled but not configured");
  }

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(rawServiceAccount) as ServiceAccount;
  } catch {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error(
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is missing client_email or private_key",
    );
  }

  return { packageName, serviceAccount };
}

function base64Url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Turn the PEM in the service account into a Web Crypto key. Hand-rolled to
 * avoid pulling google-auth-library in for one signature.
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/\s/g, "");

  const der = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Google's tokens last an hour. Re-use with a minute of headroom rather
  // than paying a round trip on every verification.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { serviceAccount } = requirePlayConfig();
  const issuedAt = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: SCOPE,
    aud: OAUTH_TOKEN_URL,
    exp: issuedAt + 3600,
    iat: issuedAt,
  };

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify(claims));
  const key = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  );

  const assertion = `${header}.${payload}.${base64Url(signature)}`;

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    logger.error(
      { operation: "play_access_token", status: response.status, detail },
      "Failed to mint a Google Play access token",
    );
    throw new Error("Could not authenticate with Google Play");
  }

  const token = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };

  return token.access_token;
}

function resolvePlan(productId: string | null): "monthly" | "yearly" | "unknown" {
  if (!productId) return "unknown";
  if (productId === config.GOOGLE_PLAY_PRODUCT_ID_MONTHLY) return "monthly";
  if (productId === config.GOOGLE_PLAY_PRODUCT_ID_YEARLY) return "yearly";
  return "unknown";
}

/**
 * Map Play's state onto the four statuses the subscriptions table knows.
 *
 * The two that trip people up: CANCELED means auto-renew is off, not that
 * access stopped, so it stays active until expiryTime passes. IN_GRACE_PERIOD
 * is a failed payment where Google still grants entitlement while it retries.
 */
function mapState(
  state: PlaySubscriptionState | undefined,
  expiryTime: string | null,
): ProviderSubscriptionStatus {
  const stillWithinPeriod = expiryTime
    ? new Date(expiryTime).getTime() > Date.now()
    : false;

  switch (state) {
    case "SUBSCRIPTION_STATE_ACTIVE":
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return "active";
    case "SUBSCRIPTION_STATE_CANCELED":
      return stillWithinPeriod ? "active" : "canceled";
    case "SUBSCRIPTION_STATE_ON_HOLD":
    case "SUBSCRIPTION_STATE_PENDING":
      return "unpaid";
    case "SUBSCRIPTION_STATE_PAUSED":
    case "SUBSCRIPTION_STATE_EXPIRED":
      return "canceled";
    default:
      return "unpaid";
  }
}

export class PlayService {
  static isEnabled(): boolean {
    return config.PLAY_BILLING_MODE === "enabled";
  }

  /**
   * Ask Google what this purchase token is actually worth. Never trust the
   * client's word for it: the token is the only thing the app sends us, and
   * entitlement follows this call, not the request body.
   */
  static async getSubscription(
    purchaseToken: string,
  ): Promise<NormalizedPlaySubscription> {
    const { packageName } = requirePlayConfig();
    const accessToken = await getAccessToken();

    const url = `${ANDROID_PUBLISHER}/androidpublisher/v3/applications/${encodeURIComponent(
      packageName,
    )}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

    const response = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 404 || response.status === 400) {
      throw new BadRequestError("That Google Play purchase is not recognised");
    }

    if (!response.ok) {
      const detail = await response.text();
      logger.error(
        {
          operation: "play_get_subscription",
          status: response.status,
          detail,
        },
        "Google Play subscription lookup failed",
      );
      throw new Error("Could not verify the Google Play purchase");
    }

    const purchase = (await response.json()) as PlaySubscriptionPurchase;
    const lineItem = purchase.lineItems?.[0] ?? null;
    const expiryTime = lineItem?.expiryTime ?? null;
    const productId = lineItem?.productId ?? null;

    return {
      status: mapState(purchase.subscriptionState, expiryTime),
      // Without an expiry we would hand out access forever, so treat a
      // missing one as already over and let the next notification correct it.
      currentPeriodEnd: expiryTime ?? new Date(0).toISOString(),
      productId,
      plan: resolvePlan(productId),
      needsAcknowledgement:
        purchase.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING",
      linkedPurchaseToken: purchase.linkedPurchaseToken ?? null,
      obfuscatedAccountId:
        purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
      isTestPurchase: purchase.testPurchase !== undefined,
    };
  }

  /**
   * Google refunds anything left unacknowledged for three days, so this is
   * not optional bookkeeping.
   */
  static async acknowledge(
    purchaseToken: string,
    productId: string,
  ): Promise<void> {
    const { packageName } = requirePlayConfig();
    const accessToken = await getAccessToken();

    const url = `${ANDROID_PUBLISHER}/androidpublisher/v3/applications/${encodeURIComponent(
      packageName,
    )}/purchases/subscriptions/${encodeURIComponent(
      productId,
    )}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const detail = await response.text();
      logger.error(
        {
          operation: "play_acknowledge",
          status: response.status,
          detail,
        },
        "Failed to acknowledge a Google Play purchase",
      );
      throw new Error("Could not acknowledge the Google Play purchase");
    }

    logger.info(
      { operation: "play_acknowledge", productId },
      "Acknowledged Google Play purchase",
    );
  }
}

/** Exported for tests. */
export const __testing = { mapState, resolvePlan };
