import { describe, expect, it } from "vitest";

import { hasStatus, queryClient, queryConfigs, shouldPersistQuery } from "./queryClient";
import { queryKeys } from "./queryKeys";

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
      expect(defaults.queries?.staleTime).toBe(30 * 1000);
      expect(defaults.queries?.refetchOnWindowFocus).toBe(true);
      expect(defaults.queries?.retry).toBe(1);
      expect(defaults.mutations?.retry).toBe(0);
    });
  });

  describe("queryConfigs", () => {
    it("has auth config", () => {
      expect(queryConfigs.auth).toBeDefined();
      expect(queryConfigs.auth.staleTime).toBe(30 * 1000);
      expect(queryConfigs.auth.refetchOnWindowFocus).toBe(true);
    });

    it("has longLived config", () => {
      expect(queryConfigs.longLived).toBeDefined();
      expect(queryConfigs.longLived.staleTime).toBe(30 * 1000);
      expect(queryConfigs.longLived.refetchOnWindowFocus).toBe(true);
    });

    it("has macros config", () => {
      expect(queryConfigs.macros).toBeDefined();
      expect(queryConfigs.macros.staleTime).toBe(10 * 1000);
      expect(queryConfigs.macros.refetchOnWindowFocus).toBe(true);
    });
  });

  it("keeps only what an offline start and offline logging need on the device", () => {
    const keys = [
      queryKeys.auth.user(),
      queryKeys.auth.session(),
      queryKeys.macros.recentEntries(1),
      queryKeys.macros.targets(),
      queryKeys.savedMeals.list(),
      queryKeys.goals.weight(),
      queryKeys.goals.weightLog(),
      queryKeys.habits.list(),
      queryKeys.macros.historyRange("2026-01-01", "2026-02-01"),
      queryKeys.macros.historyInfinite(20),
      queryKeys.settings.user(),
      queryKeys.settings.billing(),
      ["reporting", "summary"],
    ];

    expect(keys.filter((key) => shouldPersistQuery(key))).toEqual(keys.slice(0, 6));
  });
});
