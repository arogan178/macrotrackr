import React from "react";

import CustomPricingCards from "./CustomPricingCards";

const PricingSection: React.FC = () => (
  <section
    id="pricing"
    className="relative z-10 px-4 pt-16 pb-24 sm:px-6 lg:px-8"
  >
    <div className="mx-auto max-w-7xl">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
          Simple pricing, powerful results
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-balance text-muted">
          Start free, upgrade when you're ready for deeper insights. No hidden
          fees, no long-term commitments. Prefer running it yourself? Explore
          the self-hosted option below.
        </p>
      </div>

      <CustomPricingCards showUpgradeButtons={false} />
    </div>
  </section>
);

export default PricingSection;
