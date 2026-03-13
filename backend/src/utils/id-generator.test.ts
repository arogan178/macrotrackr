import { describe, expect, it } from "vitest";

import { generateId, generateUUID, generateNumericId } from "./id-generator";

describe("id-generator", () => {
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
  });

  describe("generateUUID", () => {
    it("generates valid UUID format", () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it("generates unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("generateNumericId", () => {
    it("generates numeric IDs", () => {
      const id = generateNumericId();
      expect(typeof id).toBe("number");
    });

    it("generates unique numeric IDs", () => {
      const id1 = generateNumericId();
      const id2 = generateNumericId();
      expect(id1).not.toBe(id2);
    });
  });
});
