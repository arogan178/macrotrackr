import { registerPlugin } from "@capacitor/core";

import { isAndroid, isNativePlatform } from "./platform";

/**
 * The native side of Play Billing.
 *
 * registerPlugin only names the bridge, so nothing is added to the web bundle
 * and the web build never calls it. On Android the name must match the
 * @CapacitorPlugin annotation of the implementing plugin.
 */
export interface PlayBillingPlugin {
  /**
   * Launch Play's purchase sheet and resolve once the user finishes with it.
   * The purchase token is the only thing worth keeping: the server asks Google
   * what it is worth rather than trusting anything else returned here.
   */
  purchase(options: {
    productId: string;
    basePlanId?: string;
    /**
     * Opaque per-account token. Play echoes it back on notifications about
     * this purchase, which is how the server matches a renewal to an account
     * when the app never reported the purchase.
     */
    obfuscatedAccountId?: string;
  }): Promise<{
    purchaseToken: string | null;
    /** userCancelled is a normal outcome, not an error. */
    userCancelled: boolean;
  }>;

  /**
   * Purchases Play knows about for this user that we may not have recorded,
   * for instance when the app was reinstalled or the verify call failed after
   * a successful payment.
   */
  getPurchases(): Promise<{ purchaseTokens: string[] }>;
}

const PlayBilling = registerPlugin<PlayBillingPlugin>("PlayBilling");

/**
 * Play Billing only exists in the Android build. Everything else, including
 * the iOS build and the browser, has to go through Stripe on the web.
 */
export function isPlayBillingAvailable(): boolean {
  return isNativePlatform() && isAndroid();
}

export type PlayPurchaseOutcome =
  | { kind: "purchased"; purchaseToken: string }
  | { kind: "cancelled" }
  | { kind: "unavailable" }
  | { kind: "failed"; message: string };

/**
 * Run a purchase and normalise every ending into one of four outcomes, so
 * callers never have to tell a user cancelling apart from a real failure.
 */
export async function purchasePro(
  productId: string,
  options: { basePlanId?: string; obfuscatedAccountId?: string } = {},
): Promise<PlayPurchaseOutcome> {
  if (!isPlayBillingAvailable()) {
    return { kind: "unavailable" };
  }

  try {
    const result = await PlayBilling.purchase({
      productId,
      basePlanId: options.basePlanId,
      obfuscatedAccountId: options.obfuscatedAccountId,
    });

    if (result.userCancelled) {
      return { kind: "cancelled" };
    }

    if (!result.purchaseToken) {
      return {
        kind: "failed",
        message: "Google Play did not return a purchase to verify.",
      };
    }

    return { kind: "purchased", purchaseToken: result.purchaseToken };
  } catch (error) {
    return {
      kind: "failed",
      message: error instanceof Error ? error.message : "Purchase failed.",
    };
  }
}

/**
 * Purchase tokens Play is holding for this user. Used to recover an entitlement
 * that was paid for but never reached our server.
 */
export async function getUnverifiedPurchases(): Promise<string[]> {
  if (!isPlayBillingAvailable()) {
    return [];
  }

  try {
    const { purchaseTokens } = await PlayBilling.getPurchases();

    return purchaseTokens;
  } catch {
    return [];
  }
}
