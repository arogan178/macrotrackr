import { describe, expect, it, vi } from "vitest";

import { createBrowserProductAnalytics } from "./productAnalytics";

describe("createBrowserProductAnalytics", () => {
  it("does not capture when analytics is disabled", () => {
    const capture = vi.fn();
    const analytics = createBrowserProductAnalytics({
      appMode: "managed",
      capture,
      enabled: false,
    });

    analytics.capture({
      event: "landing_cta_clicked",
      properties: {
        destination: "register",
        source: "hero",
      },
    });

    expect(capture).not.toHaveBeenCalled();
  });

  it("adds stable context without accepting health data", () => {
    const capture = vi.fn();
    const analytics = createBrowserProductAnalytics({
      appMode: "managed",
      capture,
      enabled: true,
    });

    analytics.capture({
      event: "signup_started",
      properties: {
        authMethod: "email",
        source: "pricing",
      },
    });

    expect(capture).toHaveBeenCalledWith("signup_started", {
      app_mode: "managed",
      auth_method: "email",
      schema_version: 3,
      source: "pricing",
    });
  });
});
