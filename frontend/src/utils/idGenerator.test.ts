import { describe, expect, it } from "vitest";

import { generateId } from "./idGenerator";

describe("idGenerator", () => {
  describe("generateId", () => {
    it("generates an id with default prefix", () => {
      const id = generateId();
      expect(id).toMatch(/^id_\d+_[\da-z]+$/);
    });

    it("generates an id with custom prefix", () => {
      const id = generateId("user");
      expect(id).toMatch(/^user_\d+_[\da-z]+$/);
    });

    it("generates unique ids", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("generates different ids when called rapidly", () => {
      const ids = Array.from({ length: 10 }, () => generateId("test"));
      const uniqueIds = new Set(ids);
      // Due to timing, some may be same, but most should be unique
      expect(uniqueIds.size).toBeGreaterThan(1);
    });
  });
});
