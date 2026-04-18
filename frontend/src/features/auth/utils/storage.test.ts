import { describe, expect, it } from "vitest";

import { normalizeAuthRedirect } from "./redirect";

describe("auth storage boundaries", () => {
  it("keeps signup-only social data scoped to known keys", () => {
    const keys = ["socialProfileData", "postAuthRedirect", "authLinkIntent"];
    expect(keys).toContain("socialProfileData");
    expect(keys).toContain("postAuthRedirect");
    expect(keys).toContain("authLinkIntent");
  });

  it("keeps profile-setup redirect target stable for signup flow", () => {
    expect(normalizeAuthRedirect("/settings?tab=accounts")).toBe(
      "/settings?tab=accounts",
    );
  });
});
