import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthLinkIntent,
  getAuthLinkIntent,
  setAuthLinkIntent,
} from "./linkIntent";

describe("auth link intent storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores and retrieves valid link intent", () => {
    setAuthLinkIntent({ reason: "ACCOUNT_LINK_REQUIRED" });

    expect(getAuthLinkIntent()).toEqual({ reason: "ACCOUNT_LINK_REQUIRED" });
  });

  it("returns null for malformed payload and clears it", () => {
    sessionStorage.setItem("authLinkIntent", "not-json");

    expect(getAuthLinkIntent()).toBeNull();
    expect(sessionStorage.getItem("authLinkIntent")).toBeNull();
  });

  it("expires stale link intent payloads", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    setAuthLinkIntent({ reason: "ACCOUNT_LINK_REQUIRED" });
    vi.spyOn(Date, "now").mockReturnValue(now + 10 * 60 * 1000 + 1);

    expect(getAuthLinkIntent()).toBeNull();
    expect(sessionStorage.getItem("authLinkIntent")).toBeNull();
  });

  it("clears intent explicitly", () => {
    setAuthLinkIntent({ reason: "ACCOUNT_LINK_REQUIRED" });

    clearAuthLinkIntent();

    expect(getAuthLinkIntent()).toBeNull();
  });
});
