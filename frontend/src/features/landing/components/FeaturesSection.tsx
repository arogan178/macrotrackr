import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";

import { features } from "../utils/landingPageConstants";

const FeaturesSection: React.FC = () => (
  <section id="features" className="relative z-10 overflow-visible px-4 py-24 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <ScrollTriggeredDiv className="mb-16 overflow-visible text-center">
        <h2 className="mb-4 text-4xl font-bold text-balance text-foreground sm:text-5xl">
          Everything You Need to Succeed
        </h2>
        <p className="mx-auto max-w-3xl text-lg text-balance text-muted">
          Comprehensive tools designed to make macro tracking simple, accurate,
          and effective. No distractions.
        </p>
      </ScrollTriggeredDiv>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <ScrollTriggeredDiv key={feature.title} delay={0.1 + index * 0.1}>
            <div className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-8 transition-colors hover:border-primary/50 hover:bg-surface-2">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-3 transition-colors group-hover:bg-primary/10">
                <feature.icon className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          </ScrollTriggeredDiv>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
