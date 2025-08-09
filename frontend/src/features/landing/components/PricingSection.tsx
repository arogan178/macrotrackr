import React from "react";

import CustomPricingCards from "./CustomPricingCards";

const PricingSection: React.FC = () => (
  <section className="relative z-10 px-4 py-24 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-16 text-center">
        <h2 className="mb-6 text-4xl font-bold text-foreground sm:text-5xl">
          Choose Your Plan
        </h2>
        <p className="mx-auto max-w-3xl text-xl text-foreground/90">
          Start free and unlock powerful features when you're ready. No hidden
          fees, cancel anytime.
        </p>
      </div>

      <CustomPricingCards showUpgradeButtons={false} />
    </div>
  </section>
);

export default PricingSection;
