import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
} from "react";
import {
  type AppMode,
  PRODUCT_ANALYTICS_SCHEMA_VERSION,
  type ProductEvent,
  serializeProductProperties,
} from "@shared/product-analytics";

import { withPostHog } from "./posthogClient";

interface BrowserProductAnalyticsOptions {
  appMode: AppMode;
  capture: (
    event: string,
    properties: Record<string, boolean | number | string>,
  ) => void;
  enabled: boolean;
}

export function createBrowserProductAnalytics({
  appMode,
  capture,
  enabled,
}: BrowserProductAnalyticsOptions) {
  return {
    capture(productEvent: ProductEvent): void {
      if (!enabled) return;

      capture(productEvent.event, {
        ...serializeProductProperties(productEvent),
        app_mode: appMode,
        schema_version: PRODUCT_ANALYTICS_SCHEMA_VERSION,
      });
    },
  };
}

export type ProductAnalyticsClient = ReturnType<
  typeof createBrowserProductAnalytics
>;

const disabledProductAnalytics = createBrowserProductAnalytics({
  appMode: "self-hosted",
  capture: () => undefined,
  enabled: false,
});

const ProductAnalyticsContext = createContext<ProductAnalyticsClient>(
  disabledProductAnalytics,
);

const managedProductAnalytics = createBrowserProductAnalytics({
  appMode: "managed",
  capture: (event, properties) =>
    withPostHog((posthog) => posthog.capture(event, properties)),
  enabled: true,
});

export function ProductAnalyticsProvider({
  children,
}: {
  children: ReactNode;
}) {
  return createElement(
    ProductAnalyticsContext.Provider,
    { value: managedProductAnalytics },
    children,
  );
}

export function useProductAnalytics(): ProductAnalyticsClient {
  return useContext(ProductAnalyticsContext);
}
