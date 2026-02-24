import { Link } from "@tanstack/react-router";
import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";
import { getButtonClasses } from "@/components/ui/Button";

const FinalCTASection: React.FC = () => (
  <section className="relative z-10 overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/5 via-transparent to-transparent" />

    <ScrollTriggeredDiv className="relative mx-auto max-w-4xl text-center">
      <h2 className="mb-4 text-4xl font-bold text-balance text-foreground sm:text-5xl">
        Ready to Transform Your Nutrition?
      </h2>
      <p className="mb-10 text-lg text-balance text-muted">
        Start your journey to better health and nutrition today.
      </p>
      <Link
        to="/register"
        search={{ returnTo: undefined }}
        className={getButtonClasses("primary", "lg", false, "px-10 py-3 text-lg font-semibold")}
      >
        Get Started For Free
      </Link>
    </ScrollTriggeredDiv>
  </section>
);

export default FinalCTASection;
