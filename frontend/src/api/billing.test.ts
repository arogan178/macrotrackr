import { describe, expect,it } from "vitest";

import { billingApi } from "./billing";

describe("billingApi", () => {
  it("should be defined", () => {
    expect(billingApi).toBeDefined();
  });
});
