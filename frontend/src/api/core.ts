// API Core utilities - authentication, headers, base URL, error handling

import { type Treaty, treaty } from "@elysiajs/eden";

import { getToken } from "@/utils/tokenStorage";

import type { App } from "../../../backend/src/app";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function getFullUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, "");

  return base.endsWith("/api") && path.startsWith("/api/")
    ? `${base.slice(0, -4)}${path}`
    : `${base}${path}`;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(message: string, status: number, code: string, details?: unknown, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: unknown;
}

export interface GetHeadersOptions {
  includeContentType?: boolean;
  includeAuth?: boolean;
}

function resolveHeaderOptions(
  options: GetHeadersOptions | boolean | undefined,
): Required<GetHeadersOptions> {
  if (typeof options === "boolean") {
    return {
      includeContentType: options,
      includeAuth: true,
    };
  }

  return {
    includeContentType: options?.includeContentType ?? true,
    includeAuth: options?.includeAuth ?? true,
  };
}

export class ApiClient {
  private getClerkToken: (() => Promise<string | null>) | null = null;
  private staticAuthToken: string | null = null;
  private authTokenProviderInitialized = false;

  initializeAuthTokenProvider(
    provider: (() => Promise<string | null>) | null = null,
    fallbackToken: string | null = null,
  ) {
    this.getClerkToken = provider;
    this.staticAuthToken = fallbackToken ?? getToken() ?? null;
    this.authTokenProviderInitialized = true;
  }

  isAuthTokenProviderInitialized(): boolean {
    return this.authTokenProviderInitialized;
  }

  resetAuthTokenProviderForTests() {
    this.getClerkToken = null;
    this.staticAuthToken = null;
    this.authTokenProviderInitialized = false;
  }

  setGetToken(function_: () => Promise<string | null>) {
    this.getClerkToken = function_;
    this.authTokenProviderInitialized = true;
  }

  setAuthToken(token: string | null) {
    this.staticAuthToken = token;
    this.authTokenProviderInitialized = true;
  }

  async getAuthToken(): Promise<string | null> {
    if (!this.authTokenProviderInitialized) {
      throw new ApiError(
        "Auth token provider has not been initialized",
        500,
        "AUTH_TOKEN_PROVIDER_UNINITIALIZED",
      );
    }

    if (this.getClerkToken) {
      const freshToken = await this.getClerkToken();
      if (freshToken) {
        return freshToken;
      }
    }
    if (this.staticAuthToken) {
      return this.staticAuthToken;
    }

    return null;
  }

  async getHeaders(
    options: GetHeadersOptions | boolean = true,
  ): Promise<Record<string, string>> {
    const { includeContentType, includeAuth } = resolveHeaderOptions(options);
    const headers: Record<string, string> = {};

    if (includeAuth) {
      const token = await this.getAuthToken();

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }
}

export const apiClient = new ApiClient();

export function initializeAuthTokenProvider(
  provider: (() => Promise<string | null>) | null = null,
  fallbackToken: string | null = null,
) {
  apiClient.initializeAuthTokenProvider(provider, fallbackToken);
}

// Same base as getFullUrl: routes already start with /api. keepDomain keeps an
// empty VITE_API_URL relative, and parseDate stops "2026-04-01" becoming a Date.
export const api: Treaty.Create<App> = treaty<App>(
  API_BASE_URL.replace(/\/+$/, "").replace(/\/api$/, ""),
  {
    keepDomain: true,
    parseDate: false,
    fetch: { credentials: "include", cache: "no-store" },
    headers: () => apiClient.getHeaders({ includeContentType: false }),
  },
);

type EdenResult =
  | { data: unknown; error: null }
  | { data: unknown; error: { status: unknown; value: unknown }; response?: Response };

/**
 * Resolves with Eden's data or throws ApiError, like the old fetch wrapper.
 * @throws {ApiError}
 */
export async function unwrap<Result extends EdenResult>(
  request: Promise<Result>,
): Promise<Extract<Result, { error: null }>["data"]> {
  const result = await request;
  if (result.error === null) {
    return result.data;
  }

  const { response } = result;
  if (!response) {
    throw result.error.value;
  }

  const payload = (
    typeof result.error.value === "object" && result.error.value !== null
      ? result.error.value
      : {}
  ) as ApiErrorResponse;
  throw new ApiError(
    payload.message ?? `API error (${response.status}): ${response.statusText}`,
    response.status,
    payload.code ?? `HTTP_${response.status}`,
    payload.details,
  );
}
