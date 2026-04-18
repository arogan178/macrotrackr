import { describe, expect, it } from "vitest";

import { hasStatus, queryClient, queryConfigs } from "./queryClient";

describe("queryClient", () => {
  describe("hasStatus", () => {
    it("returns true for error with status", () => {
      const error = new Error("Not found") as Error & { status: number };
      error.status = 404;
      expect(hasStatus(error)).toBe(true);
    });

    it("returns false for regular error", () => {
      const error = new Error("Regular error");
      expect(hasStatus(error)).toBe(false);
    });

    it("returns false for error with non-number status", () => {
      const error = new Error("Error") as Error & { status: string };
      error.status = "not a number";
      expect(hasStatus(error)).toBe(false);
    });
  });

  describe("queryClient", () => {
    it("creates query client with default options", () => {
      expect(queryClient).toBeDefined();
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
      expect(defaults.queries?.retry).toBe(1);
      expect(defaults.mutations?.retry).toBe(0);
    });
  });

  describe("queryConfigs", () => {
    it("has auth config", () => {
      expect(queryConfigs.auth).toBeDefined();
      expect(queryConfigs.auth.staleTime).toBe(60 * 1000);
    });

    it("has longLived config", () => {
      expect(queryConfigs.longLived).toBeDefined();
      expect(queryConfigs.longLived.staleTime).toBe(5 * 60 * 1000);
    });

    it("has macros config", () => {
      expect(queryConfigs.macros).toBeDefined();
      expect(queryConfigs.macros.staleTime).toBe(2 * 60 * 1000);
    });
  });
});
