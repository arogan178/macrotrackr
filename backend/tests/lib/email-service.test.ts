import { describe, expect, it } from "vitest";

describe("email-service", () => {
  describe("emailService", () => {
    it("exports sendPasswordResetEmail function", async () => {
      const { emailService } = await import("../../src/services/email-service");
      
      expect(emailService).toBeDefined();
      expect(typeof emailService.sendPasswordResetEmail).toBe("function");
    });
  });
});
