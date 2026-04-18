// API Core utilities - authentication, headers, base URL, error handling

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
    this.staticAuthToken = fallbackToken;
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

  async handleResponse(response: Response): Promise<unknown> {
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
      } catch (error) {
        if (response.status === 200) {
          console.error("Failed to parse 200 OK response as JSON", error);
          return undefined;
        }
        throw new Error("Received an invalid or unparsable response from the server.", { cause: error });
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
    } catch (error) {
      // Failed to parse error response JSON
      console.error("Failed to parse error response JSON", error);
      throw new ApiError(errorMessage, response.status, errorCode, errorDetails, { cause: error });
    }
    throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
  }

  async get<T = unknown>(
    url: string,
    options: { headers?: GetHeadersOptions | boolean; customHeaders?: Record<string, string> } = {},
  ): Promise<T> {
    const headers = options.customHeaders ?? await this.getHeaders(options.headers ?? false);
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    return this.handleResponse(response) as Promise<T>;
  }

  async post<T = unknown>(
    url: string,
    body?: unknown,
    options: { headers?: GetHeadersOptions | boolean; customHeaders?: Record<string, string> } = {},
  ): Promise<T> {
    const headers = options.customHeaders ?? await this.getHeaders(options.headers ?? true);
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    return this.handleResponse(response) as Promise<T>;
  }

  async put<T = unknown>(
    url: string,
    body?: unknown,
    options: { headers?: GetHeadersOptions | boolean; customHeaders?: Record<string, string> } = {},
  ): Promise<T> {
    const headers = options.customHeaders ?? await this.getHeaders(options.headers ?? true);
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    return this.handleResponse(response) as Promise<T>;
  }

  async del<T = unknown>(
    url: string,
    options: { headers?: GetHeadersOptions | boolean; customHeaders?: Record<string, string> } = {},
  ): Promise<T> {
    const headers = options.customHeaders ?? await this.getHeaders(options.headers ?? false);
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    return this.handleResponse(response) as Promise<T>;
  }
}

export const apiClient = new ApiClient();

export function initializeAuthTokenProvider(
  provider: (() => Promise<string | null>) | null = null,
  fallbackToken: string | null = null,
) {
  apiClient.initializeAuthTokenProvider(provider, fallbackToken);
}

export function setGetToken(function_: () => Promise<string | null>) {
  apiClient.setGetToken(function_);
}

export function setAuthToken(token: string | null) {
  apiClient.setAuthToken(token);
}

export async function getAuthToken() {
  return apiClient.getAuthToken();
}

export async function getHeaders(options: GetHeadersOptions | boolean = true) {
  return apiClient.getHeaders(options);
}

export async function handleResponse(response: Response) {
  return apiClient.handleResponse(response);
}
