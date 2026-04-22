const DEFAULT_AUTH_REDIRECT = "/home";

function normalizeCandidate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}

export function buildRedirectFromLocation(location: {
  pathname?: string;
  search?: Record<string, unknown>;
}): string {
  const pathname = location.pathname ?? DEFAULT_AUTH_REDIRECT;
  const search = location.search;

  if (!search || typeof search !== "object" || Array.isArray(search)) {
    return pathname;
  }

  const searchParameters = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParameters.append(key, String(item));
        }
      }
      continue;
    }

    searchParameters.set(key, String(value));
  }

  const query = searchParameters.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function isSafeAppRedirect(value: string | undefined): value is string {
  const candidate = normalizeCandidate(value);

  if (!candidate) {
    return false;
  }

  return candidate.startsWith("/") && !candidate.startsWith("//");
}

export function normalizeAuthRedirect(value: string | undefined): string {
  const candidate = normalizeCandidate(value);

  if (!candidate || !isSafeAppRedirect(candidate)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (
    candidate.startsWith("/auth-ready") ||
    candidate.startsWith("/sso-callback")
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (candidate.startsWith("/profile-setup")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return candidate;
}

export function shouldBypassSyncForRedirect(value: string | undefined): boolean {
  const candidate = normalizeCandidate(value);

  if (!candidate || !isSafeAppRedirect(candidate)) {
    return false;
  }

  return candidate.startsWith("/profile-setup");
}

function readProfileSetupRedirect(value: string): string | undefined {
  const queryStart = value.indexOf("?");
  if (queryStart === -1) {
    return undefined;
  }

  const params = new URLSearchParams(value.slice(queryStart + 1));
  const redirectTo = params.get("redirectTo");

  return redirectTo ?? undefined;
}

export function resolveProfileSetupRedirect(value: string | undefined): string {
  const candidate = normalizeCandidate(value);

  if (!candidate || !isSafeAppRedirect(candidate)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (!candidate.startsWith("/profile-setup")) {
    return normalizeAuthRedirect(candidate);
  }

  return normalizeAuthRedirect(readProfileSetupRedirect(candidate));
}

export function encodeAuthRedirect(value: string | undefined): string {
  return encodeURIComponent(normalizeAuthRedirect(value));
}

export function resolveAuthReturnTo(value: string | undefined):
  | string
  | undefined {
  const normalized = normalizeAuthRedirect(value);

  return normalized === DEFAULT_AUTH_REDIRECT ? undefined : normalized;
}

export function buildSocialAuthRedirectUrls(
  value: string | undefined,
  flow: "signin" | "signup" = "signup",
): {
  redirectUrl: string;
  redirectUrlComplete: string;
} {
  const encodedRedirect = encodeAuthRedirect(value);

  return {
    redirectUrl: `/sso-callback?flow=${flow}&redirectTo=${encodedRedirect}`,
    redirectUrlComplete: `/auth-ready?redirectTo=${encodedRedirect}`,
  };
}

export function resolveProfileCompletion(user: unknown): boolean | undefined {
  if (!user || typeof user !== "object") {
    return undefined;
  }

  const userRecord = user as Record<string, unknown>;

  if (typeof userRecord.isProfileComplete === "boolean") {
    return userRecord.isProfileComplete;
  }

  if ("dateOfBirth" in userRecord) {
    return Boolean(userRecord.dateOfBirth);
  }

  return undefined;
}
