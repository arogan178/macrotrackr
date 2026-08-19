import {
  PRODUCT_ANALYTICS_SCHEMA_VERSION,
  serializeProductProperties,
  type IdentifiedProductEvent,
} from "@shared/product-analytics";

import { getConfig } from "../../config";
import { logger } from "../observability/logger";

export async function captureProductEvent(
  productEvent: IdentifiedProductEvent,
): Promise<void> {
  const config = getConfig();

  if (
    config.APP_MODE !== "managed" ||
    config.ANALYTICS_MODE !== "posthog" ||
    !config.POSTHOG_HOST ||
    !config.POSTHOG_KEY
  ) {
    return;
  }

  const endpoint = `${config.POSTHOG_HOST.replace(/\/$/u, "")}/capture/`;

  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify({
        api_key: config.POSTHOG_KEY,
        event: productEvent.event,
        properties: {
          ...serializeProductProperties(productEvent),
          $distinct_id: String(productEvent.distinctId),
          app_mode: config.APP_MODE,
          schema_version: PRODUCT_ANALYTICS_SCHEMA_VERSION,
        },
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      logger.warn(
        {
          event: productEvent.event,
          operation: "posthog_capture",
          statusCode: response.status,
        },
        "PostHog rejected a product analytics event",
      );
    }
  } catch (error) {
    logger.warn(
      {
        error,
        event: productEvent.event,
        operation: "posthog_capture",
      },
      "PostHog product analytics capture failed",
    );
  }
}
