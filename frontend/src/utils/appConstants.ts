// Application URLs and constants for SEO and external links
function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveFallbackAppUrl(): string {
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    return globalThis.location.origin;
  }

  return "http://localhost:5173";
}

function resolveExternalUrl(rawValue: string | undefined, fallback: string): string {
  const trimmed = rawValue?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

const rawAppUrl = import.meta.env.VITE_APP_URL ?? resolveFallbackAppUrl();
const rawGitHubRepoUrl = resolveExternalUrl(
  import.meta.env.VITE_GITHUB_REPO_URL,
  "https://github.com/arogan178/macro_tracker",
);
const rawDocumentationUrl = resolveExternalUrl(
  import.meta.env.VITE_DOCS_URL,
  `${rawGitHubRepoUrl}/tree/main/docs`,
);

export const APP_URL = trimTrailingSlash(rawAppUrl);
export const APP_NAME = import.meta.env.VITE_PUBLIC_APP_NAME ?? "Macro Tracker";
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? "support@local.invalid";
export const SUPPORT_EMAIL_MAILTO = `mailto:${SUPPORT_EMAIL}`;
export const GITHUB_REPO_URL = rawGitHubRepoUrl;
export const DOCS_URL = rawDocumentationUrl;
export const SETUP_DOCS_URL = `${GITHUB_REPO_URL}#self-hosting-with-docker-compose`;

export const APP_ICON_URL = `${APP_URL}/icon.png`;
export const PRICING_URL = `${APP_URL}/pricing`;
export const SCHEMA_ORG_CONTEXT = "https://schema.org";

export function buildCanonicalUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${APP_URL}${normalizedPath}`;
}
