// API Core utilities - authentication, headers, base URL, error handling

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
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

let getClerkToken: (() => Promise<string | null>) | null = null;
let authTokenProviderInitialized = false;

export function initializeAuthTokenProvider(
  provider: (() => Promise<string | null>) | null = null,
  fallbackToken: string | null = null,
) {
  getClerkToken = provider;
  staticAuthToken = fallbackToken;
  authTokenProviderInitialized = true;
}

export function isAuthTokenProviderInitialized(): boolean {
  return authTokenProviderInitialized;
}

export function resetAuthTokenProviderForTests() {
  getClerkToken = null;
  staticAuthToken = null;
  authTokenProviderInitialized = false;
}

export function setGetToken(function_: () => Promise<string | null>) {
  getClerkToken = function_;
  authTokenProviderInitialized = true;
}

let staticAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  staticAuthToken = token;
  authTokenProviderInitialized = true;
}

export async function getAuthToken(): Promise<string | null> {
  if (!authTokenProviderInitialized) {
    throw new ApiError(
      "Auth token provider has not been initialized",
      500,
      "AUTH_TOKEN_PROVIDER_UNINITIALIZED",
    );
  }

  if (getClerkToken) {
    const freshToken = await getClerkToken();
    if (freshToken) {
      return freshToken;
    }
  }
  if (staticAuthToken) {
    return staticAuthToken;
  }

  return null;
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

export async function getHeaders(
  options: GetHeadersOptions | boolean = true,
): Promise<Record<string, string>> {
  const { includeContentType, includeAuth } = resolveHeaderOptions(options);
  const headers: Record<string, string> = {};

  if (includeAuth) {
    const token = await getAuthToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export async function handleResponse(response: Response): Promise<unknown> {
  if (response.ok) {
    if (response.status === 204) {
      return { success: true };
    }

    try {
      const responseBodyText = await response.clone().text();
      if (!responseBodyText) {
        return undefined;
      }

      return await response.json();
    } catch {
      if (response.status === 200) {
        return undefined;
      }
      throw new Error("Received an invalid or unparsable response from the server.");
    }
  }

  let errorMessage = `API error (${response.status}): ${response.statusText}`;
  let errorCode = `HTTP_${response.status}`;
  let errorDetails: unknown = undefined;
  try {
    const errorPayload = await response.json() as ApiErrorResponse;
    if (errorPayload && typeof errorPayload === "object") {
      errorMessage = errorPayload.message ?? errorMessage;
      errorCode = errorPayload.code ?? errorCode;
      errorDetails = errorPayload.details;
    }
  } catch {
    // Response body is not valid JSON
  }
  throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
}

export async function post<T = unknown>(
  url: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: await getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  return handleResponse(response) as Promise<T>;
}
