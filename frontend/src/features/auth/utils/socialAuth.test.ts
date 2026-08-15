import { describe, expect, it } from "vitest";

import { resolveSocialAuthError } from "./socialAuth";

describe("resolveSocialAuthError", () => {
  it("redirects duplicate signup attempts to sign in", () => {
    expect(
      resolveSocialAuthError(
        {
          errors: [{ code: "identifier_already_signed_up" }],
        },
        "signup",
      ),
    ).toEqual({
      message: "That account already exists. Redirecting you to sign in instead.",
      action: "switch-to-signin",
      tone: "info",
    });
  });

  it("does not tell a first-time user we cannot link their account", () => {
    // Signing in with Google when no account exists produced Clerk's raw
    // "unable to link that account", which describes an operation the reader
    // never asked for.
    const resolution = resolveSocialAuthError(
      {
        errors: [
          {
            code: "external_account_not_found",
            message: "We are unable to link that account",
          },
        ],
      },
      "signin",
    );

    expect(resolution.message).not.toMatch(/link/i);
    expect(resolution.message).toMatch(/sign up first/i);
    expect(resolution.action).toBe("show-email");
  });

  it("points a blocked social sign-up at email, not at nothing", () => {
    const resolution = resolveSocialAuthError(
      { errors: [{ code: "external_account_exists" }] },
      "signup",
    );

    expect(resolution.message).toMatch(/email instead/i);
    expect(resolution.action).toBe("show-email");
  });

  it("surfaces provider configuration problems as email fallback", () => {
    expect(
      resolveSocialAuthError(
        new Error("Missing required parameter: client_id"),
        "signin",
      ),
    ).toEqual({
      message:
        "Social sign-in is temporarily unavailable. Please continue with email while we sort out the provider configuration.",
      action: "show-email",
      tone: "error",
    });
  });

  it("keeps signup provider failures worded for sign-up", () => {
    expect(
      resolveSocialAuthError(
        new Error("Missing required parameter: client_id"),
        "signup",
      ),
    ).toEqual({
      message:
        "Social sign-up is temporarily unavailable. Please continue with email while we sort out the provider configuration.",
      action: "show-email",
      tone: "error",
    });
  });

  it("handles cancelled oauth flows with a gentle fallback", () => {
    expect(
      resolveSocialAuthError(
        {
          errors: [{ code: "oauth_access_denied", message: "Access denied" }],
        },
        "signin",
      ),
    ).toEqual({
      message:
        "Social sign-in was cancelled or blocked. Please try again or continue with email.",
      action: "show-email",
      tone: "warning",
    });
  });
});