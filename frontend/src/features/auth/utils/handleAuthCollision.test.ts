import { describe, expect, it, vi } from "vitest";

import { handleAccountCollision } from "./handleAuthCollision";
import { getAuthLinkIntent } from "./linkIntent";

describe("handleAccountCollision", () => {
  it("signs out, stores intent, and navigates to login", async () => {
    sessionStorage.clear();
    const signOut = vi.fn(async () => undefined);
    const navigate = vi.fn(async () => undefined);

    await handleAccountCollision({ signOut, navigate });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(getAuthLinkIntent()).toEqual({ reason: "ACCOUNT_LINK_REQUIRED" });
    expect(navigate).toHaveBeenCalledWith({
      to: "/login",
      search: { returnTo: "/settings?tab=accounts" },
      replace: true,
    });
  });

  it("continues even when sign out fails", async () => {
    sessionStorage.clear();
    const signOut = vi.fn(async () => {
      throw new Error("boom");
    });
    const navigate = vi.fn(async () => undefined);

    await handleAccountCollision({ signOut, navigate });

    expect(getAuthLinkIntent()).toEqual({ reason: "ACCOUNT_LINK_REQUIRED" });
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
