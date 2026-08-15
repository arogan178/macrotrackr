import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

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

export async function nativeGoogleSignIn(): Promise<{ idToken: string; email?: string } | null> {
  if (!isNativePlatform()) return null;

  try {
    initNativeGoogleAuth();
    const user = await GoogleAuth.signIn();
    // The token only ever hangs off `authentication`; the old `user.idToken`
    // fallback read a property the plugin does not define.
    const idToken = user?.authentication?.idToken;
    if (idToken) {
      return { idToken, email: user.email };
    }
    logger.warn("Native GoogleAuth succeeded but no idToken returned:", user);

    return null;
  } catch (error: any) {
    const errString = String(error?.message || error || "");
    if (
      errString.includes("12501") ||
      errString.includes("cancel") ||
      errString.includes("popup_closed") ||
      error?.code === 12501
    ) {
      logger.info("Native GoogleAuth user cancelled sign-in");

      return null;
    }
    logger.warn("Native GoogleAuth signIn failed or cancelled:", error);

    return null;
  }
}

export async function exchangeNativeGoogleTokenWithClerk({
  idToken,
  clerk,
  signIn,
  signUp,
  setActive,
}: {
  idToken: string;
  clerk?: any;
  signIn?: any;
  signUp?: any;
  setActive: (params: { session: string }) => Promise<void>;
}): Promise<boolean> {
  const getSessionId = (res: any) =>
    res?.createdSessionId ||
    res?.signIn?.createdSessionId ||
    res?.signUp?.createdSessionId ||
    (res?.status === "complete" ? res?.createdSessionId : null);

  const tryTransfer = async (): Promise<boolean> => {
    try {
      logger.info("[ClerkNativeAuth] Attempting signIn.create({ transfer: true })...");
      const transferRes = await signIn?.create?.({ transfer: true });
      const transferSessionId = getSessionId(transferRes);
      if (transferSessionId) {
        logger.info("[ClerkNativeAuth] signIn.create({ transfer: true }) succeeded!", transferSessionId);
        await setActive({ session: transferSessionId });

        return true;
      }
      if (transferRes?.status === "complete") {
        logger.info("[ClerkNativeAuth] signIn.create({ transfer: true }) status complete:", transferRes);

        return true;
      }
    } catch (transferError: any) {
      const message = transferError?.errors
        ? JSON.stringify(transferError.errors)
        : transferError?.message || JSON.stringify(transferError);
      logger.warn(`[ClerkNativeAuth] transfer failed: ${message}`);
    }

    return false;
  };

  // Step 1: Official Clerk method for Google ID Tokens
  if (clerk?.authenticateWithGoogleOneTap) {
    try {
      logger.info("[ClerkNativeAuth] Attempting clerk.authenticateWithGoogleOneTap...");
      const res = await clerk.authenticateWithGoogleOneTap({ token: idToken });
      const createdSessionId = getSessionId(res);

      if (createdSessionId) {
        logger.info("[ClerkNativeAuth] clerk.authenticateWithGoogleOneTap succeeded!", createdSessionId);
        await setActive({ session: createdSessionId });

        return true;
      }

      if (clerk?.handleGoogleOneTapCallback) {
        try {
          await clerk.handleGoogleOneTapCallback(res, {
            signInFallbackRedirectUrl: "/sso-callback",
          });

          return true;
        } catch (callbackError) {
          logger.warn("[ClerkNativeAuth] handleGoogleOneTapCallback warning:", callbackError);
        }
      }

      if (res?.status === "complete") {
        logger.info("[ClerkNativeAuth] clerk.authenticateWithGoogleOneTap complete:", res);

        return true;
      }
    } catch (err: any) {
      const isTooManyRequests = err?.errors?.some((e: any) => e?.code === "too_many_requests") || err?.code === "too_many_requests";
      const isExternalAccountExists = err?.errors?.some(
        (e: any) => e?.code === "external_account_exists" || e?.code === "form_identifier_exists"
      );
      const message = err?.errors
        ? JSON.stringify(err.errors)
        : err?.message || JSON.stringify(err);
      logger.warn(`[ClerkNativeAuth] clerk.authenticateWithGoogleOneTap failed: ${message}`);

      if (isTooManyRequests) {
        logger.warn("[ClerkNativeAuth] Rate limit reached on Clerk API.");

        return false;
      }

      if (isExternalAccountExists) {
        const transferred = await tryTransfer();
        if (transferred) return true;
      }
    }
  }

  // Step 2: Fallback attempt via signIn / signUp google_one_tap (single pair)
  try {
    logger.info("[ClerkNativeAuth] Trying signIn.create({ strategy: 'google_one_tap' })...");
    const res = await signIn?.create?.({ strategy: "google_one_tap", token: idToken });
    const createdSessionId = getSessionId(res);
    if (createdSessionId) {
      await setActive({ session: createdSessionId });

      return true;
    }
  } catch (err: any) {
    const isTooManyRequests = err?.errors?.some((e: any) => e?.code === "too_many_requests");
    const isExternalAccountExists = err?.errors?.some(
      (e: any) => e?.code === "external_account_exists" || e?.code === "form_identifier_exists"
    );
    if (isTooManyRequests) return false;
    if (isExternalAccountExists) {
      const transferred = await tryTransfer();
      if (transferred) return true;
    }

    try {
      logger.info("[ClerkNativeAuth] Trying signUp.create({ strategy: 'google_one_tap' })...");
      const signUpRes = await signUp?.create?.({ strategy: "google_one_tap", token: idToken });
      const createdSessionId = getSessionId(signUpRes);
      if (createdSessionId) {
        await setActive({ session: createdSessionId });

        return true;
      }
    } catch (signUpError: any) {
      const isTransferred = signUpError?.errors?.some(
        (e: any) => e?.code === "external_account_exists" || e?.code === "form_identifier_exists"
      );
      if (isTransferred) {
        const transferred = await tryTransfer();
        if (transferred) return true;
      }
    }
  }

  return false;
}
