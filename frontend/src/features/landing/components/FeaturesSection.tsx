import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";

import { features } from "../utils/landingPageConstants";

const FeaturesSection: React.FC = () => (
  <section className="relative z-10 overflow-visible px-4 py-24 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <ScrollTriggeredDiv className="mb-16 overflow-visible text-center">
        <h2 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
          Everything You Need to Succeed
        </h2>
        <p className="mx-auto max-w-3xl text-xl text-foreground/90">
          Comprehensive tools designed to make macro tracking simple, accurate,
          and effective.
        </p>
      </ScrollTriggeredDiv>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-10">
        {features.map((feature, index) => (
          <ScrollTriggeredDiv key={feature.title} delay={0.1 + index * 0.1}>
            <div className="relative rounded-2xl border border-border/50 bg-surface p-8 backdrop-blur-sm transition-all duration-300 hover:bg-surface">
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-border/50 bg-surface">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </ScrollTriggeredDiv>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
