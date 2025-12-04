import { Star } from "lucide-react";
import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";

import { testimonials } from "../utils/landingPageConstants";

const TestimonialsSection: React.FC = () => (
  <section className="relative z-10 px-4 py-24 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <ScrollTriggeredDiv className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
          What Users Say
        </h2>
        <p className="text-lg text-muted">
          Real feedback from MacroTrackr users on their nutrition journey.
        </p>
      </ScrollTriggeredDiv>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <ScrollTriggeredDiv key={testimonial.name} delay={0.1 + index * 0.1}>
            <div className="rounded-2xl border border-border/50 bg-surface p-8 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-surface-2">
              <div className="mb-4 flex items-start space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-4 w-4 text-warning"
                    fill="currentColor"
                  />
                ))}
              </div>
              <blockquote className="mb-6 text-base leading-relaxed text-foreground">
                {testimonial.quote}
              </blockquote>
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-surface-2">
                  <span className="text-sm font-semibold text-foreground">
                    {testimonial.initials}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted">{testimonial.title}</div>
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
