import { describe, expect, it } from "vitest";

import { hasClerkSessionCookie, pathNeedsClerk } from "./clerkRuntime";

describe("pathNeedsClerk", () => {
  it.each([
    "/login",
    "/register",
    "/reset-password",
    "/sso-callback",
    "/profile-setup",
    "/auth-ready",
    "/home",
    "/goals",
    "/reporting",
    "/settings",
  ])("requires Clerk for %s", (path) => {
    expect(pathNeedsClerk(path)).toBe(true);
  });

  it("matches nested paths under a Clerk route", () => {
    expect(pathNeedsClerk("/settings/billing")).toBe(true);
  });

  it.each([
    "/",
    "/pricing",
    "/privacy",
    "/terms",
    "/contact",
    "/open-source",
    "/blog",
    "/blog/understanding-protein-intake",
    "/tools",
    "/tools/tdee-calculator",
    "/tools/bmr-vs-tdee",
    "/compare/myfitnesspal",
    "/migrate/lose-it",
    "/delete-account",
  ])("leaves %s public", (path) => {
    expect(pathNeedsClerk(path)).toBe(false);
  });

  // "/homework" starts with "/home" but is a different route.
  it("does not match a route that merely shares a prefix", () => {
    expect(pathNeedsClerk("/homework")).toBe(false);
    expect(pathNeedsClerk("/settingsomething")).toBe(false);
  });
});

describe("hasClerkSessionCookie", () => {
  it("reads no session from the signed-out value Clerk sets", () => {
    expect(hasClerkSessionCookie("__client_uat=0")).toBe(false);
  });

  it("reads no session when the cookie was never set", () => {
    expect(hasClerkSessionCookie("")).toBe(false);
    expect(hasClerkSessionCookie("ph_posthog=abc; other=1")).toBe(false);
  });

  it("reads a session from a non-zero timestamp", () => {
    expect(hasClerkSessionCookie("__client_uat=1789468213")).toBe(true);
  });

  it("reads the suffixed cookie Clerk sets alongside the plain one", () => {
    expect(hasClerkSessionCookie("__client_uat=0; __client_uat_a4FUklym=1789468213")).toBe(true);
  });

  it("ignores surrounding cookies and whitespace", () => {
    expect(
      hasClerkSessionCookie("ph_posthog=%7B%22a%22%3A1%7D; __client_uat=1789468213; __cf_bm=x"),
    ).toBe(true);
  });

  it("treats an empty value as no session", () => {
    expect(hasClerkSessionCookie("__client_uat=")).toBe(false);
  });
});
