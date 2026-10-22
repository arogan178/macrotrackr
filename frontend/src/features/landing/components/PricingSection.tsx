import React from "react";
import { Link } from "@tanstack/react-router";

import { TOOLS_HUB_PATH } from "@/features/landing/tools/toolsCatalog";

import CustomPricingCards from "./CustomPricingCards";

/**
 * The cards render with `showUpgradeButtons={false}`, which is right on a
 * marketing page: nobody upgrades before they have an account. It also left the
 * section with nothing at all to click, so a reader who had just decided the
 * price was fine had to scroll back up to act on it. The action belongs here.
 */
const PricingSection: React.FC = () => {
  return (
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
            Pro adds 30 and 90 day history, trends and unlimited habits. Prefer
            to run it yourself? It is open source.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <CustomPricingCards showUpgradeButtons={false} />
        </div>

        {/* The Free plan's own button is the call to action; a second one
            under it said the same thing. */}
        <p className="mt-8 text-center text-sm text-muted">
          Not ready to sign up?{" "}
          <Link
            to={TOOLS_HUB_PATH}
            className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Try a calculator first
          </Link>
          .
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
