import { expect, it, vi } from "vitest";

const calls: string[] = [];
const posthog = {
  init: vi.fn(() => calls.push("init")),
  capture: vi.fn((event: string) => calls.push(`capture:${event}`)),
};

vi.mock("posthog-js", () => ({ default: posthog }));

const { loadPostHog, withPostHog } = await import("./posthogClient");

it("keeps calls made before posthog-js loads and replays them in order after init", async () => {
  withPostHog((client) => client.capture("first"));
  withPostHog((client) => client.capture("second"));
  expect(calls).toEqual([]);

  await loadPostHog("phc_key", { api_host: "https://eu.i.posthog.com" });
  withPostHog((client) => client.capture("third"));

  expect(posthog.init).toHaveBeenCalledWith("phc_key", {
    api_host: "https://eu.i.posthog.com",
  });
  expect(calls).toEqual([
    "init",
    "capture:first",
    "capture:second",
    "capture:third",
  ]);
});
