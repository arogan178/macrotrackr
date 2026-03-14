// API Core utilities - authentication, headers, base URL, error handling

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

export function setGetToken(function_: () => Promise<string | null>) {
  getClerkToken = function_;
}

let staticAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  staticAuthToken = token;
}

export async function getAuthToken(): Promise<string | null> {
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

export function getHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export async function getHeadersAsync(
  includeContentType = true,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await getAuthToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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
      errorMessage = errorPayload.message || errorMessage;
      errorCode = errorPayload.code || errorCode;
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
    headers: await getHeadersAsync(),
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  return handleResponse(response) as Promise<T>;
}
