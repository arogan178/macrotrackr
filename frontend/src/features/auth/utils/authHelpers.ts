import { authApi } from "@/api/auth";
import { userApi } from "@/api/user";
import { logger } from "@/lib/logger";

interface AuthenticationResult {
  token: string | null;
  error?: string;
}

export async function getAuthTokenWithRetry(
  getToken: () => Promise<string | null>,
  maxRetries = 3,
): Promise<AuthenticationResult> {
  let token: string | null = null;
  let retries = maxRetries;

  while (retries > 0 && !token) {
    token = await getToken();
    if (!token && retries > 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    retries--;
  }

  if (!token) {
    return { token: null, error: "Authentication failed. Please sign in again." };
  }

  return { token };
}

export async function syncUserWithBackend(
  token: string,
  setAuthTokenFunction: (token: string) => void,
): Promise<{ success: boolean; error?: string }> {
  try {
    setAuthTokenFunction(token);
    await authApi.syncUser(token);

    return { success: true };
  } catch (syncError: unknown) {
    if (
      syncError instanceof Error &&
      "status" in syncError &&
      (syncError as { status: number }).status === 409
    ) {
      return { success: true }; // User already exists, continue
    }
    logger.error("Failed to sync user:", syncError);

    return { success: false, error: "We couldn't link your account. Please try again." };
  }
}

export async function completeProfileAndNavigate(
  profileData: Record<string, unknown>,
  navigate: (options: { to: string }) => void,
): Promise<{ success: boolean; error?: string }> {
  try {
    await userApi.completeProfile(profileData);

    return { success: true };
  } catch (error: unknown) {
    logger.error("Profile completion failed:", error);
    
    if (
      error instanceof Error &&
      "status" in error &&
      (error as { status: number }).status === 409
    ) {
      navigate({ to: "/home" });

      return { success: true };
    }

    return {
      success: false,
      error: "We couldn't save your profile. Please try again.",
    };
  }
}
