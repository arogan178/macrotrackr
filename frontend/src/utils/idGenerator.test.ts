import { describe, expect, it } from "vitest";

import { generateId } from "./idGenerator";

describe("idGenerator", () => {
  describe("generateId", () => {
    it("generates unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("generates ID with default prefix", () => {
      const id = generateId();
      expect(id.startsWith("id_")).toBe(true);
    });

    it("generates ID with custom prefix", () => {
      const id = generateId("custom");
      expect(id.startsWith("custom_")).toBe(true);
    });

    it("generates ID with correct format", () => {
      const id = generateId();
      const parts = id.split("_");
      expect(parts).toHaveLength(3);
    });
  });
});
