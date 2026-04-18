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