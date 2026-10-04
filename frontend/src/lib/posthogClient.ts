import type { PostHog, PostHogConfig } from "posthog-js";

let client: PostHog | undefined;
const pending: Array<(posthog: PostHog) => void> = [];

/** Runs now if PostHog has loaded, otherwise once it does, in call order. */
export function withPostHog(callback: (posthog: PostHog) => void): void {
  if (client) {
    callback(client);

    return;
  }
  pending.push(callback);
}

// Dynamic so posthog-js stays off the first load.
export async function loadPostHog(
  apiKey: string,
  config: Partial<PostHogConfig>,
): Promise<void> {
  const { default: posthog } = await import("posthog-js");
  posthog.init(apiKey, config);
  client = posthog;
  for (const callback of pending.splice(0)) callback(posthog);
}
