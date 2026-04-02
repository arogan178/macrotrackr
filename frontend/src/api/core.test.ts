import { beforeEach,describe, expect, it } from "vitest";

import {
  ApiError,
  getAuthToken,
  getHeaders,
  setAuthToken,
  setGetToken,
} from "./core";

describe("api/core", () => {
  describe("ApiError", () => {
    it("creates error with status and code", () => {
      const error = new ApiError("Not found", 404, "HTTP_404");
      expect(error.message).toBe("Not found");
      expect(error.status).toBe(404);
      expect(error.code).toBe("HTTP_404");
      expect(error.name).toBe("ApiError");
    });

    it("includes details when provided", () => {
      const error = new ApiError("Bad request", 400, "BAD_REQUEST", { field: "email" });
      expect(error.details).toEqual({ field: "email" });
    });

    it("is an instance of Error", () => {
      const error = new ApiError("Error", 500, "ERROR");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("getHeaders", () => {
    it("returns Content-Type by default", async () => {
      const headers = await getHeaders({ includeAuth: false });
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("skips Content-Type when disabled", async () => {
      const headers = await getHeaders({
        includeContentType: false,
        includeAuth: false,
      });
      expect(headers["Content-Type"]).toBeUndefined();
    });

    beforeEach(() => {
      setAuthToken(null);
      setGetToken(async () => null);
    });

    it("returns Content-Type by default", async () => {
      const headers = await getHeaders();
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("includes auth token when available", async () => {
      setAuthToken("test-token");
      const headers = await getHeaders();
      expect(headers["Authorization"]).toBe("Bearer test-token");
    });

    it("skips Content-Type when disabled", async () => {
      const headers = await getHeaders({ includeContentType: false });
      expect(headers["Content-Type"]).toBeUndefined();
    });
  });

  describe("token management", () => {
    beforeEach(() => {
      setAuthToken(null);
      setGetToken(async () => null);
    });

    it("setAuthToken stores token", async () => {
      setAuthToken("my-token");
      const token = await getAuthToken();
      expect(token).toBe("my-token");
    });

    it("getAuthToken returns null when no token set", async () => {
      const token = await getAuthToken();
      expect(token).toBeNull();
    });

    it("setGetToken overrides static token", async () => {
      setAuthToken("static-token");
      setGetToken(async () => "dynamic-token");
      const token = await getAuthToken();
      expect(token).toBe("dynamic-token");
    });

    it("falls back to static token when dynamic returns null", async () => {
      setAuthToken("static-token");
      setGetToken(async () => null);
      const token = await getAuthToken();
      expect(token).toBe("static-token");
    });
  });
});
