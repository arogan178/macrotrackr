import { describe, expect,it } from "vitest";

import { goalsApi } from "./goals";

describe("goalsApi", () => {
  it("should be defined", () => {
    expect(goalsApi).toBeDefined();
  });
});
