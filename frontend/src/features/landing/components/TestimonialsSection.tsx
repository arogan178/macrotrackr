import { Star } from "lucide-react";
import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";

import { testimonials } from "../utils/landingPageConstants";

const TestimonialsSection: React.FC = () => (
  <section className="relative z-10 px-4 py-24 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <ScrollTriggeredDiv className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
          What Users Say
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-balance text-muted">
          Real feedback from MacroTrackr users on their nutrition journey.
        </p>
      </ScrollTriggeredDiv>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <ScrollTriggeredDiv key={testimonial.name} delay={0.1 + index * 0.1}>
            <div className="group rounded-2xl border border-border bg-surface p-8 transition-colors duration-200 ease-out hover:border-border-2 hover:bg-surface-2">
              <div className="mb-4 flex items-start space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-4 w-4 text-warning opacity-90 transition-opacity duration-200 group-hover:opacity-100"
                    fill="currentColor"
                  />
                ))}
              </div>
              <blockquote className="mb-6 text-base leading-relaxed text-foreground transition-colors duration-200">
                {testimonial.quote}
              </blockquote>
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 transition-colors duration-200 group-hover:border-border-2 group-hover:bg-surface-3">
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {testimonial.initials}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-semibold tracking-tight text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm tracking-tight text-muted transition-colors duration-200 group-hover:text-foreground/80">
                    {testimonial.title}
                  </div>
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
