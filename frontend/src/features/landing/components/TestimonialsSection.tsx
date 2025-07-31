import { Star } from "lucide-react";
import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";

import { testimonials } from "../utils/landingPageConstants";

const TestimonialsSection: React.FC = () => (
  <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <ScrollTriggeredDiv className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
          What Users Say
        </h2>
        <p className="text-xl text-foreground/90 mb-8">
          Real feedback from MacroTrackr users on their nutrition journey.
        </p>
      </ScrollTriggeredDiv>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <ScrollTriggeredDiv key={testimonial.name} delay={0.1 + index * 0.1}>
            <div className="bg-surface backdrop-blur-sm border border-border/50 rounded-2xl p-8 transition-all duration-300 hover:bg-surface">
              <div className="flex items-start space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-5 h-5 text-warning"
                    fill="currentColor"
                  />
                ))}
              </div>
              <blockquote className="text-foreground text-lg leading-relaxed mb-6">
                {testimonial.quote}
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-surface border border-border/50 rounded-full flex items-center justify-center">
                  <span className="text-foreground font-semibold">
                    {testimonial.initials}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-foreground/90">{testimonial.title}</div>
                </div>
              </div>
            </div>
          </ScrollTriggeredDiv>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
