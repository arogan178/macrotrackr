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
  const pathname = location.pathname || DEFAULT_AUTH_REDIRECT;
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

  if (candidate.startsWith("/auth-ready") || candidate.startsWith("/sso-callback")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return candidate;
}

export function shouldBypassSyncForRedirect(value: string | undefined): boolean {
  return normalizeAuthRedirect(value) === "/profile-setup";
}

export function encodeAuthRedirect(value: string | undefined): string {
  return encodeURIComponent(normalizeAuthRedirect(value));
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
