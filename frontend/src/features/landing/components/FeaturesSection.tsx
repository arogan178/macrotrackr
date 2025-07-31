import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";

import { features } from "../utils/landingPageConstants";

const FeaturesSection: React.FC = () => (
  <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 overflow-visible">
    <div className="max-w-6xl mx-auto">
      <ScrollTriggeredDiv className="text-center mb-16 overflow-visible">
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Everything You Need to Succeed
        </h2>
        <p className="text-xl text-foreground/90 max-w-3xl mx-auto">
          Comprehensive tools designed to make macro tracking simple, accurate,
          and effective.
        </p>
      </ScrollTriggeredDiv>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
        {features.map((feature, index) => (
          <ScrollTriggeredDiv key={feature.title} delay={0.1 + index * 0.1}>
            <div className="relative bg-surface backdrop-blur-sm border border-border/50 rounded-2xl p-8 transition-all duration-300 hover:bg-surface">
              <div className="relative">
                <div className="w-16 h-16 bg-surface border border-border/50 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-foreground leading-relaxed">
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
