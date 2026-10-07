// Type-level test, run by `tsc` (see tsconfig include). Fails the typecheck
// if route response types stop flowing through App, e.g. widened to unknown.
import type { App } from "../src/app";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type Api = App["~Routes"]["api"];
type UserMe = Api["user"]["me"]["get"]["response"][200];
type MacroHistory = Api["macros"]["history"]["get"]["response"][200];
type BillingSubscription =
  Api["billing"]["subscription"]["get"]["response"][200];

export type AppRouteTypeChecks = [
  Expect<Equal<UserMe["email"], string>>,
  Expect<Equal<UserMe["subscription"]["status"], "free" | "pro" | "canceled">>,
  Expect<Equal<UserMe["unitSystem"], "metric" | "imperial">>,
  Expect<Equal<MacroHistory["hasMore"], boolean>>,
  Expect<
    Equal<
      MacroHistory["entries"][number]["mealType"],
      "breakfast" | "lunch" | "dinner" | "snack"
    >
  >,
  Expect<Equal<MacroHistory["entries"][number]["clientUpdatedAt"], number | null>>,
  Expect<Equal<BillingSubscription["hasStripeCustomer"], boolean>>,
  Expect<
    Equal<
      NonNullable<BillingSubscription["subscription"]>["provider"],
      "stripe" | "play"
    >
  >,
];
