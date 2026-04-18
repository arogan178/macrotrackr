import { describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

describe("logger", () => {
  describe("warn", () => {
    it("is a function", () => {
      expect(typeof logger.warn).toBe("function");
    });

    it("calls console.warn with arguments", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("test", "args");
      expect(spy).toHaveBeenCalledWith("test", "args");
      spy.mockRestore();
    });
  });

  describe("error", () => {
    it("is a function", () => {
      expect(typeof logger.error).toBe("function");
    });

    it("calls console.error with arguments", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("error", "message");
      expect(spy).toHaveBeenCalledWith("error", "message");
      spy.mockRestore();
    });
  });
});
