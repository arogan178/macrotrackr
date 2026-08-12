import { beforeEach, describe, expect, it, vi } from "vitest";

import { navigateWithRouter, toInternalPath } from "./clerkNavigation";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

// Mocked via the relative path: the "@" alias does not resolve from test
// files here, so vi.mock("@/AppRouter") would silently miss and the real
// router would load.
vi.mock("../AppRouter", () => ({ router: { navigate } }));

const assign = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  navigate.mockResolvedValue(undefined);
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { ...globalThis.location, origin: "https://macrotrackr.com", assign },
  });
});

describe("toInternalPath", () => {
  it("keeps same-origin absolute URLs, preserving search and hash", () => {
    expect(
      toInternalPath("https://macrotrackr.com/auth-ready?redirectTo=%2Fhome"),
    ).toBe("/auth-ready?redirectTo=%2Fhome");

    expect(toInternalPath("https://macrotrackr.com/home#section")).toBe(
      "/home#section",
    );
  });

  it("keeps relative paths", () => {
    expect(toInternalPath("/sso-callback?flow=signin")).toBe(
      "/sso-callback?flow=signin",
    );
  });

  it("rejects other origins, including Clerk's own subdomains", () => {
    // The Account Portal is a different origin even though it shares the
    // apex domain, so it must not be routed through the SPA.
    expect(toInternalPath("https://accounts.macrotrackr.com/sign-in")).toBeNull();
    expect(toInternalPath("https://clerk.macrotrackr.com/v1/foo")).toBeNull();
    expect(toInternalPath("https://accounts.google.com/o/oauth2/auth")).toBeNull();
  });
});

describe("navigateWithRouter", () => {
  it("routes internal destinations through the SPA router", async () => {
    await navigateWithRouter("https://macrotrackr.com/auth-ready", false);

    expect(navigate).toHaveBeenCalledWith({ to: "/auth-ready", replace: false });
    expect(assign).not.toHaveBeenCalled();
  });

  it("honours replace semantics", async () => {
    await navigateWithRouter("/home", true);

    expect(navigate).toHaveBeenCalledWith({ to: "/home", replace: true });
  });

  it("falls back to a real navigation for external destinations", async () => {
    await navigateWithRouter("https://accounts.macrotrackr.com/sign-in", false);

    expect(assign).toHaveBeenCalledWith("https://accounts.macrotrackr.com/sign-in");
    expect(navigate).not.toHaveBeenCalled();
  });
});
