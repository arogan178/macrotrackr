import { describe, expect, it } from "vitest";

import { resolveAnalyticsMode } from "./runtime";

describe("resolveAnalyticsMode", () => {
  it("keeps analytics disabled for self-hosted local-auth builds", () => {
    expect(resolveAnalyticsMode("posthog", "local")).toBe("disabled");
  });

  it("enables PostHog only when managed auth explicitly requests it", () => {
    expect(resolveAnalyticsMode("posthog", "clerk")).toBe("posthog");
    expect(resolveAnalyticsMode(undefined, "clerk")).toBe("disabled");
  });
});
