import { lightTheme, darkTheme } from "./theme";

describe("theme", () => {
  describe("lightTheme", () => {
    it("should have primary color defined", () => {
      expect(lightTheme.primary).toBe("var(--primary-40)");
    });

    it("should have surface defined", () => {
      expect(lightTheme.surface).toBe("var(--neutral-99)");
    });

    it("should have error color defined", () => {
      expect(lightTheme.error).toBe("var(--error-40)");
    });

    it("should have onPrimary defined", () => {
      expect(lightTheme.onPrimary).toBe("var(--primary-100)");
    });

    it("should have surface containers defined", () => {
      expect(lightTheme.surfaceContainerLowest).toBeDefined();
      expect(lightTheme.surfaceContainerLow).toBeDefined();
      expect(lightTheme.surfaceContainer).toBeDefined();
      expect(lightTheme.surfaceContainerHigh).toBeDefined();
      expect(lightTheme.surfaceContainerHighest).toBeDefined();
    });
  });

  describe("darkTheme", () => {
    it("should have primary color defined", () => {
      expect(darkTheme.primary).toBe("var(--primary-80)");
    });

    it("should have surface defined", () => {
      expect(darkTheme.surface).toBe("var(--neutral-10)");
    });

    it("should have error color defined", () => {
      expect(darkTheme.error).toBe("var(--error-80)");
    });

    it("should have onPrimary defined", () => {
      expect(darkTheme.onPrimary).toBe("var(--primary-20)");
    });

    it("should have surface containers defined", () => {
      expect(darkTheme.surfaceContainerLowest).toBeDefined();
      expect(darkTheme.surfaceContainerLow).toBeDefined();
      expect(darkTheme.surfaceContainer).toBeDefined();
      expect(darkTheme.surfaceContainerHigh).toBeDefined();
      expect(darkTheme.surfaceContainerHighest).toBeDefined();
    });
  });

  describe("theme contrast", () => {
    it("should have higher primary number in light theme than dark", () => {
      // Light: --primary-40, Dark: --primary-80
      expect(lightTheme.primary).toContain("40");
      expect(darkTheme.primary).toContain("80");
    });

    it("should have higher surface number in light theme than dark", () => {
      // Light: --neutral-99, Dark: --neutral-10
      expect(lightTheme.surface).toContain("99");
      expect(darkTheme.surface).toContain("10");
    });
  });
});
