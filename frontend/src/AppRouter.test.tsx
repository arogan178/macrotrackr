import { describe, expect,it } from "vitest";

describe("AppRouter", () => {
  it("should be defined", async () => {
    const module = await import("./AppRouter");
    expect(module).toBeDefined();
  });
});
