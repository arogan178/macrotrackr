import { describe, expect, it } from "vitest";

import { queryKeys } from "./queryKeys";

describe("queryKeys", () => {
  describe("auth", () => {
    it("generates correct auth all key", () => {
      expect(queryKeys.auth.all()).toEqual(["auth"]);
    });

    it("generates correct auth user key", () => {
      expect(queryKeys.auth.user()).toEqual(["auth", "user"]);
    });
  });

  describe("habits", () => {
    it("generates correct habits all key", () => {
      expect(queryKeys.habits.all()).toEqual(["habits"]);
    });

    it("generates correct habits list key", () => {
      expect(queryKeys.habits.list()).toEqual(["habits", "list"]);
    });

    it("generates correct habits byId key", () => {
      expect(queryKeys.habits.byId("123")).toEqual(["habits", "detail", "123"]);
    });
  });

  describe("goals", () => {
    it("generates correct goals all key", () => {
      expect(queryKeys.goals.all()).toEqual(["goals"]);
    });

    it("generates correct weight key", () => {
      expect(queryKeys.goals.weight()).toEqual(["goals", "weight"]);
    });
  });

  describe("macros", () => {
    it("generates correct macros all key", () => {
      expect(queryKeys.macros.all()).toEqual(["macros"]);
    });

    it("generates correct search key", () => {
      expect(queryKeys.macros.search("chicken")).toEqual(["macros", "search", "chicken"]);
    });

    it("generates correct daily totals key", () => {
      expect(queryKeys.macros.dailyTotals("2024-01-01")).toEqual(["macros", "daily-totals", "2024-01-01"]);
    });

    it("generates correct targets key", () => {
      expect(queryKeys.macros.targets()).toEqual(["macros", "targets"]);
    });
  });

  describe("settings", () => {
    it("generates correct settings all key", () => {
      expect(queryKeys.settings.all()).toEqual(["settings"]);
    });

    it("generates correct settings user key", () => {
      expect(queryKeys.settings.user()).toEqual(["settings", "user"]);
    });

    it("generates correct settings billing key", () => {
      expect(queryKeys.settings.billing()).toEqual(["settings", "billing"]);
    });
  });

  describe("savedMeals", () => {
    it("generates correct savedMeals all key", () => {
      expect(queryKeys.savedMeals.all()).toEqual(["saved-meals"]);
    });

    it("generates correct savedMeals list key", () => {
      expect(queryKeys.savedMeals.list()).toEqual(["saved-meals", "list"]);
    });
  });
});
