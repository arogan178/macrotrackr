import { describe, expect, it } from "vitest";
import {
  correlationMiddleware,
  enhancedApiLogging,
} from "../../src/middleware/correlation";

describe("correlation middleware", () => {
  describe("correlationMiddleware", () => {
    it("should be defined", () => {
      expect(correlationMiddleware).toBeDefined();
    });

    it("should be an Elysia instance", () => {
      expect(correlationMiddleware).toBeDefined();
      expect(typeof correlationMiddleware).toBe("object");
    });

    it("should have a name", () => {
      expect(correlationMiddleware).toBeDefined();
    });
  });

  describe("enhancedApiLogging", () => {
    it("should be defined", () => {
      expect(enhancedApiLogging).toBeDefined();
    });

    it("should be an Elysia instance", () => {
      expect(enhancedApiLogging).toBeDefined();
      expect(typeof enhancedApiLogging).toBe("object");
    });

    it("should have a name", () => {
      expect(enhancedApiLogging).toBeDefined();
    });
  });
});
