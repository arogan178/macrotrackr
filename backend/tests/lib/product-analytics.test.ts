import { afterEach, describe, expect, it, vi } from "vitest";

import { setConfigOverrides } from "../../src/config";
import { captureProductEvent } from "../../src/lib/analytics/product-analytics";
import {
  resolveAnalyticsTrafficType,
  serializeProductProperties,
} from "../../../shared/product-analytics";

describe("product analytics contract", () => {
  it("serializes the switching source without health details", () => {
    expect(
      serializeProductProperties({
        event: "profile_completed",
        properties: { switchingSource: "myfitnesspal" },
      }),
    ).toEqual({ switching_source: "myfitnesspal" });
  });

  it("classifies Clerk test aliases as synthetic traffic", () => {
    expect(
      resolveAnalyticsTrafficType("growth+clerk_test@example.com", []),
    ).toBe("synthetic");
  });

  it("classifies configured team addresses as internal traffic", () => {
    expect(
      resolveAnalyticsTrafficType("Owner@Example.com", [" owner@example.com "]),
    ).toBe("internal");
  });

  it("treats every other address as customer traffic", () => {
    expect(
      resolveAnalyticsTrafficType("customer@example.com", [
        "owner@example.com",
      ]),
    ).toBe("customer");
  });
});

describe("captureProductEvent", () => {
  afterEach(() => {
    setConfigOverrides(null);
    vi.unstubAllGlobals();
  });

  it("does not make a request when analytics is disabled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setConfigOverrides({ ANALYTICS_MODE: "disabled" });

    await captureProductEvent({
      distinctId: 42,
      event: "profile_completed",
      properties: { switchingSource: "unknown" },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never captures from self-hosted mode", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setConfigOverrides({
      ANALYTICS_MODE: "posthog",
      APP_MODE: "self-hosted",
      POSTHOG_HOST: "https://eu.i.posthog.com",
      POSTHOG_KEY: "phc_test",
    });

    await captureProductEvent({
      distinctId: 42,
      event: "first_meal_logged",
      properties: { entryMethod: "manual" },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends typed events to the configured PostHog capture endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ status: 1 }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    setConfigOverrides({
      ANALYTICS_MODE: "posthog",
      APP_MODE: "managed",
      POSTHOG_HOST: "https://eu.i.posthog.com/",
      POSTHOG_KEY: "phc_test",
    });

    await captureProductEvent({
      distinctId: 42,
      event: "checkout_started",
      properties: { plan: "yearly", source: "pricing_page" },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://eu.i.posthog.com/capture/");
    expect(JSON.parse(String(request.body))).toEqual({
      api_key: "phc_test",
      event: "checkout_started",
      properties: {
        $distinct_id: "42",
        app_mode: "managed",
        plan: "yearly",
        schema_version: 2,
        source: "pricing_page",
      },
    });
  });
});
