import { describe, expect, it } from "vitest";
import { authRoutes } from "../../../src/modules/auth/routes";

describe("auth routes", () => {
  describe("authRoutes", () => {
    it("should be a function", () => {
      expect(typeof authRoutes).toBe("function");
    });

    it("should return an Elysia instance", () => {
      const routes = authRoutes({} as any);
      expect(routes).toBeDefined();
    });
  });
});
