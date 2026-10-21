import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

import { authApi } from "@/api/auth";
import { ApiError } from "@/api/core";
import { logger } from "@/lib/logger";

import { isNativePlatform } from "./platform";

const GOOGLE_CLIENT_ID =
  "880247591600-g42kbb95b131mcjfrn838ruj89pe0mp5.apps.googleusercontent.com";

let isInitialized = false;

export function initNativeGoogleAuth(): void {
  if (!isNativePlatform() || isInitialized) return;

  try {
    // serverClientId is a plugin-config option, not an initialize() one; it is
    // already set under GoogleAuth in capacitor.config.ts.
    GoogleAuth.initialize({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ["profile", "email"],
      grantOfflineAccess: true,
    });
    isInitialized = true;
  } catch (err) {
    logger.warn("GoogleAuth.initialize error:", err);
  }
}

type GoogleSignInResult = { idToken: string } | "cancelled" | null;

async function pickGoogleAccount(): Promise<GoogleSignInResult> {
  try {
    initNativeGoogleAuth();
    // The plugin silently reuses the last account; forgetting it first shows
    // the picker, so someone with two Google accounts can choose.
    await GoogleAuth.signOut().catch(() => undefined);
    const user = await GoogleAuth.signIn();
    const idToken = user?.authentication?.idToken;
    if (idToken) {
      return { idToken };
    }
    logger.warn("Native GoogleAuth succeeded but no idToken returned");

    return null;
  } catch (error: any) {
    const errString = String(error?.message || error || "");
    if (
      errString.includes("12501") ||
      errString.includes("cancel") ||
      errString.includes("popup_closed") ||
      error?.code === 12501
    ) {
      return "cancelled";
    }
    logger.warn("Native GoogleAuth signIn failed:", error);

    return null;
  }
}

/**
 * `use_web` means continue with Clerk's web OAuth: the picker failed, or no
 * account has this Google login linked yet, so it has to sign up there.
 */
export type NativeGoogleOutcome = "signed_in" | "cancelled" | "use_web" | "failed";

/**
 * Clerk refuses the picker's ID token itself (its `azp` is the Android client),
 * so the backend verifies it and returns a one-time sign-in ticket.
 */
export async function signInWithNativeGoogle({
  signIn,
  setActive,
}: {
  signIn: {
    create: (params: { strategy: "ticket"; ticket: string }) => Promise<{
      status: string | null;
      createdSessionId: string | null;
    }>;
  };
  setActive: (params: { session: string }) => Promise<void>;
}): Promise<NativeGoogleOutcome> {
  const picked = await pickGoogleAccount();
  if (picked === "cancelled") return "cancelled";
  if (!picked) return "use_web";

  let ticket: string | null;
  try {
    ({ ticket } = await authApi.exchangeGoogleIdToken(picked.idToken));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return "use_web";
    logger.warn("Google ID token exchange failed:", error);

    return "failed";
  }
  if (!ticket) return "use_web";

  try {
    const result = await signIn.create({ strategy: "ticket", ticket });
    if (result.status === "complete" && result.createdSessionId) {
      await setActive({ session: result.createdSessionId });

      return "signed_in";
    }
    logger.warn("Google sign-in ticket did not complete:", result.status);
  } catch (error) {
    logger.warn("Google sign-in ticket was refused:", error);
  }

  return "failed";
}
