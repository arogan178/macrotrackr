import { describe, expect, it } from "vitest";
import { AuthSchemas } from "../../../src/modules/auth/schemas";

describe("auth schemas", () => {
  describe("AuthSchemas", () => {
    it("should be defined", () => {
      expect(AuthSchemas).toBeDefined();
    });

    it("should have changePassword schema", () => {
      expect(AuthSchemas.changePassword).toBeDefined();
    });
  });
});
