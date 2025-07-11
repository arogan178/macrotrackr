import React from "react";

import CustomPricingCards from "./CustomPricingCards";

const PricingSection: React.FC = () => (
  <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6 pb-2">
          Choose Your Plan
        </h2>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
          Start free and unlock powerful features when you're ready. No hidden
          fees, cancel anytime.
        </p>
      </div>

      <CustomPricingCards showUpgradeButtons={false} />
    </div>
  </section>
);

export default PricingSection;
