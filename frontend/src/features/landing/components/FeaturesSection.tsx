import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";

import { features } from "../utils/landingPageConstants";

const FeaturesSection: React.FC = () => (
  <section className="relative z-10 py-24 px-6 sm:px-8 lg:px-16 overflow-visible">
    <div className="mx-auto">
      <ScrollTriggeredDiv className="text-center mb-20 overflow-visible">
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-surface text-transparent bg-clip-text mb-6 pb-2">
          Everything You Need to Succeed
        </h2>
        <p className="text-xl text-foreground max-w-3xl mx-auto">
          Comprehensive tools designed to make macro tracking simple, accurate,
          and effective.
        </p>
      </ScrollTriggeredDiv>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {features.map((feature, index) => (
          <ScrollTriggeredDiv key={feature.title} delay={0.1 + index * 0.1}>
            <div className="group relative bg-surface/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:bg-surface/70 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-modal hover:shadow-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
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
