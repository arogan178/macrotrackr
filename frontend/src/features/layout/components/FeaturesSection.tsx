import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";

import { features } from "../utils/landingPageConstants";

const FeaturesSection: React.FC = () => (
  <section className="relative z-10 py-24 px-6 sm:px-8 lg:px-16 overflow-visible">
    <div className="mx-auto">
      <ScrollTriggeredDiv className="text-center mb-20 overflow-visible">
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6 pb-2">
          Everything You Need to Succeed
        </h2>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
          Comprehensive tools designed to make macro tracking simple, accurate,
          and effective.
        </p>
      </ScrollTriggeredDiv>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {features.map((feature, index) => (
          <ScrollTriggeredDiv key={feature.title} delay={0.1 + index * 0.1}>
            <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
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
