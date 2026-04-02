import { describe, expect,it } from "vitest";

import { habitsApi } from "./habits";

describe("habitsApi", () => {
  it("should be defined", () => {
    expect(habitsApi).toBeDefined();
  });
});
