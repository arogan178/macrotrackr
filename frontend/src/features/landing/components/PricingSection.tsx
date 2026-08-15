import React from "react";
import { Link } from "@tanstack/react-router";

import { getButtonClasses } from "@/components/ui/Button";
import { TOOLS_HUB_PATH } from "@/features/landing/tools/toolsCatalog";

import CustomPricingCards from "./CustomPricingCards";

/**
 * The cards render with `showUpgradeButtons={false}`, which is right on a
 * marketing page: nobody upgrades before they have an account. It also left the
 * section with nothing at all to click, so a reader who had just decided the
 * price was fine had to scroll back up to act on it. The action belongs here.
 */
const PricingSection: React.FC = () => (
  <section
    id="pricing"
    className="relative z-10 px-4 pt-16 pb-24 sm:px-6 lg:px-8"
  >
    <div className="mx-auto max-w-7xl">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
          Free to track. Pro when you want the long view.
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-balance text-muted">
          Logging, targets and your last seven days cost nothing, permanently.
          Pro adds 30 and 90 day history, trends and unlimited habits. Prefer to
          run it yourself? It is open source.
        </p>
      </div>

      <CustomPricingCards showUpgradeButtons={false} />

      <div className="mt-12 flex flex-col items-center gap-3">
        <Link
          to="/register"
          search={{ returnTo: undefined }}
          className={getButtonClasses("primary", "lg", false, "px-8")}
        >
          Start on the free plan
        </Link>
        <p className="text-sm text-muted">
          No card needed.{" "}
          <Link
            to={TOOLS_HUB_PATH}
            className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Or try a calculator first
          </Link>
          .
        </p>
      </div>
    </div>
  </section>
);

export default PricingSection;
