import { describe, expect, it } from "vitest";

import {
  buildRedirectFromLocation,
  isSafeAppRedirect,
  normalizeAuthRedirect,
  resolveProfileSetupRedirect,
  shouldBypassSyncForRedirect,
} from "./redirect";

describe("auth redirect helpers", () => {
  it("allows safe in-app redirects", () => {
    expect(isSafeAppRedirect("/settings?tab=accounts")).toBe(true);
    expect(normalizeAuthRedirect("/settings?tab=accounts")).toBe(
      "/settings?tab=accounts",
    );
  });

  it("rejects external or auth-loop redirects", () => {
    expect(isSafeAppRedirect("https://example.com")).toBe(false);
    expect(normalizeAuthRedirect("https://example.com")).toBe("/home");
    expect(normalizeAuthRedirect("//evil.example")).toBe("/home");
    expect(normalizeAuthRedirect("/auth-ready?redirectTo=/home")).toBe(
      "/home",
    );
    expect(normalizeAuthRedirect("/sso-callback?redirectTo=/home")).toBe(
      "/home",
    );
    expect(normalizeAuthRedirect("/profile-setup?redirectTo=/home")).toBe(
      "/home",
    );
  });

  it("marks profile setup redirects to skip sync", () => {
    expect(shouldBypassSyncForRedirect("/profile-setup")).toBe(true);
    expect(shouldBypassSyncForRedirect("/profile-setup?redirectTo=%2Fpricing")).toBe(
      true,
    );
    expect(shouldBypassSyncForRedirect("/home")).toBe(false);
  });

  it("extracts profile setup destination redirects", () => {
    expect(
      resolveProfileSetupRedirect("/profile-setup?redirectTo=%2Fpricing"),
    ).toBe("/pricing");
    expect(
      resolveProfileSetupRedirect(
        "/profile-setup?redirectTo=%2Fauth-ready%3FredirectTo%3D%252Fhome",
      ),
    ).toBe("/home");
    expect(resolveProfileSetupRedirect("/profile-setup")).toBe("/home");
    expect(resolveProfileSetupRedirect("/settings?tab=accounts")).toBe(
      "/settings?tab=accounts",
    );
  });

  it("preserves pathname and query string from router state", () => {
    expect(
      buildRedirectFromLocation({
        pathname: "/settings",
        search: { tab: "accounts", page: 2 },
      }),
    ).toBe("/settings?tab=accounts&page=2");
  });
});
