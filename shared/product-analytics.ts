import type { ImportFormat } from "./importer";

export const PRODUCT_ANALYTICS_SCHEMA_VERSION = 3;

export type AppMode = "managed" | "self-hosted";
export type BillingPlan = "monthly" | "yearly";
export type AnalyticsTrafficType = "customer" | "internal" | "synthetic";
export const SWITCHING_SOURCES = [
  "cronometer",
  "loseit",
  "macrofactor",
  "myfitnesspal",
  "new_to_tracking",
  "other",
  "spreadsheet",
  "unknown",
] as const;
export type SwitchingSource = (typeof SWITCHING_SOURCES)[number];

export const SWITCHING_SOURCE_OPTIONS: ReadonlyArray<{
  label: string;
  value: Exclude<SwitchingSource, "unknown">;
}> = [
  { label: "I'm new to macro tracking", value: "new_to_tracking" },
  { label: "MyFitnessPal", value: "myfitnesspal" },
  { label: "Cronometer", value: "cronometer" },
  { label: "MacroFactor", value: "macrofactor" },
  { label: "Lose It!", value: "loseit" },
  { label: "A spreadsheet", value: "spreadsheet" },
  { label: "Another app", value: "other" },
];

export function isSwitchingSource(value: unknown): value is SwitchingSource {
  return SWITCHING_SOURCES.some((source) => source === value);
}

export type SignupSource =
  | "blog"
  | "calculator"
  | "direct"
  | "migration"
  | "pricing"
  | "unknown";

export type ProductEvent =
  | {
      event: "landing_cta_clicked";
      properties: {
        destination: "docs" | "github" | "pricing" | "register";
        source:
          | "blog"
          | "footer"
          | "header"
          | "hero"
          | "migration_banner"
          | "pricing_free"
          | "pricing_pro"
          | "pricing_section"
          | "self_hosted_docs"
          | "self_hosted_github"
          | "tools_banner";
      };
    }
  | {
      event: "signup_started";
      properties: {
        authMethod: "email" | "oauth_apple" | "oauth_google";
        source: SignupSource;
      };
    }
  | {
      event: "signup_completed";
      properties: { authMethod: "clerk" };
    }
  | {
      event: "profile_completed";
      properties: { switchingSource: SwitchingSource };
    }
  | {
      event: "first_meal_logged";
      properties:
        | { entryMethod: "manual" }
        | { entryMethod: "import"; importSource: ImportFormat };
    }
  | {
      event: "third_tracked_day";
      properties: { distinctDays: 3 };
    }
  | {
      event: "import_previewed" | "import_completed";
      properties: {
        importSource: ImportFormat;
        mealCount: number;
        weightLogCount: number;
      };
    }
  | {
      event: "paywall_viewed";
      properties: {
        featureName: string;
        surface: "upgrade_modal";
      };
    }
  | {
      event: "checkout_started";
      properties: {
        plan: BillingPlan;
        source: "pricing_page";
      };
    }
  | {
      event: "subscription_started";
      properties: { plan: BillingPlan | "unknown" };
    }
  | {
      event: "subscription_canceled";
      properties: { plan: BillingPlan | "unknown" };
    };

export type IdentifiedProductEvent = ProductEvent & {
  distinctId: number | string;
};

export type SerializedProductProperties = Record<
  string,
  boolean | number | string
>;

export function resolveAnalyticsTrafficType(
  email: string,
  internalEmails: readonly string[],
): AnalyticsTrafficType {
  const normalizedEmail = email.trim().toLowerCase();
  const localPart = normalizedEmail.split("@", 1)[0] ?? "";

  if (
    localPart.includes("+clerk_test") ||
    localPart.includes("-clerk-test-")
  ) {
    return "synthetic";
  }
  if (
    internalEmails.some(
      (internalEmail) => internalEmail.trim().toLowerCase() === normalizedEmail,
    )
  ) {
    return "internal";
  }

  return "customer";
}

export function resolveSignupSource(redirectTo?: string): SignupSource {
  if (!redirectTo || redirectTo === "/home") return "direct";
  if (redirectTo.includes("from=migration")) return "migration";
  if (redirectTo.startsWith("/pricing")) return "pricing";
  if (redirectTo.startsWith("/tools")) return "calculator";
  if (redirectTo.startsWith("/blog")) return "blog";

  return "unknown";
}

export function serializeProductProperties(
  productEvent: ProductEvent,
): SerializedProductProperties {
  switch (productEvent.event) {
    case "landing_cta_clicked":
      return productEvent.properties;
    case "signup_started":
      return {
        auth_method: productEvent.properties.authMethod,
        source: productEvent.properties.source,
      };
    case "signup_completed":
      return { auth_method: productEvent.properties.authMethod };
    case "profile_completed":
      return { switching_source: productEvent.properties.switchingSource };
    case "first_meal_logged":
      return productEvent.properties.entryMethod === "import"
        ? {
            entry_method: productEvent.properties.entryMethod,
            import_source: productEvent.properties.importSource,
          }
        : { entry_method: productEvent.properties.entryMethod };
    case "third_tracked_day":
      return { distinct_days: productEvent.properties.distinctDays };
    case "import_previewed":
    case "import_completed":
      return {
        import_source: productEvent.properties.importSource,
        meal_count: productEvent.properties.mealCount,
        weight_log_count: productEvent.properties.weightLogCount,
      };
    case "paywall_viewed":
      return {
        feature_name: productEvent.properties.featureName,
        surface: productEvent.properties.surface,
      };
    case "checkout_started":
      return productEvent.properties;
    case "subscription_started":
    case "subscription_canceled":
      return productEvent.properties;
    default: {
      const exhaustive: never = productEvent;
      return exhaustive;
    }
  }
}
