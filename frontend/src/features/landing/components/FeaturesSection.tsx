import React from "react";

import Reveal from "@/components/animation/Reveal";
import type { IconProps } from "@/components/ui/Icons";

import { FEATURES } from "../utils/landingPageConstants";

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
  <div className="group relative rounded-card border border-border bg-surface p-6 transition-colors duration-200 ease-in-out hover:border-border-2">
    <div className="relative z-10">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-control border border-border bg-surface-2 transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/10">
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

const FeaturesSection: React.FC = () => (
  <section
    id="features"
    className="relative z-10 overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
  >
    <div className="mx-auto max-w-[85rem]">
      <Reveal className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          What you get
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-balance text-muted">
          Log a meal, set a target, and see where the week actually went.
        </p>
      </Reveal>

      {/* A static grid: the cards are meant to be read, and a marquee that
          pauses only on hover is unreadable on touch. */}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label="Features"
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
    </div>
  </section>
);

export default FeaturesSection;
