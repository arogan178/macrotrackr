import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";
import type { IconProps } from "@/components/ui/Icons";
import { usePrefersReducedMotion } from "@/hooks";

import { FEATURES } from "../utils/landingPageConstants";

/**
 * Feature card component for the horizontal ticker
 */
interface FeatureCardProps {
  name: string;
  description: string;
  icon: React.ComponentType<IconProps>;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  name,
  description,
  icon: Icon,
}) => (
  <div className="group relative min-w-[320px] flex-shrink-0 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-border-2 hover:bg-surface-2 hover:shadow-sm">
    <div className="relative z-10">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-2 transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/10">
        <Icon
          className="h-5 w-5 text-muted transition-colors duration-200 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
      <h3 className="mb-2 text-lg font-medium tracking-tight text-foreground transition-colors duration-200">
        {name}
      </h3>
      <p className="text-sm leading-relaxed text-balance text-muted transition-colors duration-200 group-hover:text-foreground/80">
        {description}
      </p>
    </div>
  </div>
);

/**
 * Horizontal scrolling ticker with feature cards.
 * Falls back to a static grid for users who prefer reduced motion.
 */
const FeaturesSection: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section
      id="features"
      className="relative z-10 overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[85rem]">
        <ScrollTriggeredDiv className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Powerful tools, effortless tracking
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-balance text-muted">
            Every feature designed to help you track smarter, stay consistent,
            and see real results faster.
          </p>
        </ScrollTriggeredDiv>

        {prefersReducedMotion ? (
          // Static grid fallback for reduced motion preference
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="list"
            aria-label="Features list"
          >
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.name}
                name={feature.name}
                description={feature.description}
                icon={feature.icon}
              />
            ))}
          </div>
        ) : (
          // Animated seamless horizontal card ticker
          <div
            className="group relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] py-8"
            role="region"
            aria-label="Features carousel"
          >
            <div className="animate-marquee flex w-max shrink-0 items-center gap-6 pr-6 group-hover:[animation-play-state:paused]">
              {FEATURES.map((feature, index) => (
                <FeatureCard
                  key={`first-${feature.name}-${index}`}
                  name={feature.name}
                  description={feature.description}
                  icon={feature.icon}
                />
              ))}
            </div>
            <div
              className="animate-marquee flex w-max shrink-0 items-center gap-6 pr-6 group-hover:[animation-play-state:paused]"
              aria-hidden="true"
            >
              {FEATURES.map((feature, index) => (
                <FeatureCard
                  key={`second-${feature.name}-${index}`}
                  name={feature.name}
                  description={feature.description}
                  icon={feature.icon}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturesSection;
