import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import { usePostHog } from "@posthog/react";
import {
  type AppMode,
  PRODUCT_ANALYTICS_SCHEMA_VERSION,
  type ProductEvent,
  serializeProductProperties,
} from "@shared/product-analytics";

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

export function ProductAnalyticsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const posthog = usePostHog();
  const analytics = useMemo(
    () =>
      createBrowserProductAnalytics({
        appMode: "managed",
        capture: (event, properties) => posthog.capture(event, properties),
        enabled: true,
      }),
    [posthog],
  );

  return createElement(
    ProductAnalyticsContext.Provider,
    { value: analytics },
    children,
  );
}

export function useProductAnalytics(): ProductAnalyticsClient {
  return useContext(ProductAnalyticsContext);
}
