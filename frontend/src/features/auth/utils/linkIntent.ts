const LINK_INTENT_STORAGE_KEY = "authLinkIntent";
const LINK_INTENT_VERSION = 1;
const LINK_INTENT_TTL_MS = 10 * 60 * 1000;

export interface AuthLinkIntent {
  reason: "ACCOUNT_LINK_REQUIRED";
}

interface AuthLinkIntentRecord {
  version: number;
  createdAt: number;
  intent: AuthLinkIntent;
}

function isBrowserEnvironment(): boolean {
  return typeof globalThis !== "undefined" && "sessionStorage" in globalThis;
}

function isValidIntentRecord(value: unknown): value is AuthLinkIntentRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (
    record.version !== LINK_INTENT_VERSION ||
    typeof record.createdAt !== "number" ||
    !record.intent
  ) {
    return false;
  }

  if (typeof record.intent !== "object") {
    return false;
  }

  const intent = record.intent as { reason?: unknown };

  return intent.reason === "ACCOUNT_LINK_REQUIRED";
}

export function setAuthLinkIntent(intent: AuthLinkIntent): void {
  if (!isBrowserEnvironment()) {
    return;
  }

  const record: AuthLinkIntentRecord = {
    version: LINK_INTENT_VERSION,
    createdAt: Date.now(),
    intent,
  };

  globalThis.sessionStorage.setItem(
    LINK_INTENT_STORAGE_KEY,
    JSON.stringify(record),
  );
}

export function clearAuthLinkIntent(): void {
  if (!isBrowserEnvironment()) {
    return;
  }

  globalThis.sessionStorage.removeItem(LINK_INTENT_STORAGE_KEY);
}

export function getAuthLinkIntent(): AuthLinkIntent | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const rawValue = globalThis.sessionStorage.getItem(LINK_INTENT_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!isValidIntentRecord(parsed)) {
      clearAuthLinkIntent();

      return null;
    }

    const isExpired = Date.now() - parsed.createdAt > LINK_INTENT_TTL_MS;
    if (isExpired) {
      clearAuthLinkIntent();

      return null;
    }

    return parsed.intent;
  } catch {
    clearAuthLinkIntent();

    return null;
  }
}
