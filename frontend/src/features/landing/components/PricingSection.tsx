import React from "react";

import CustomPricingCards from "./CustomPricingCards";

const PricingSection: React.FC = () => (
  <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
          Choose Your Plan
        </h2>
        <p className="text-xl text-foreground/90 max-w-3xl mx-auto">
          Start free and unlock powerful features when you're ready. No hidden
          fees, cancel anytime.
        </p>
      </div>

      <CustomPricingCards showUpgradeButtons={false} />
    </div>
  </section>
);

export default PricingSection;
