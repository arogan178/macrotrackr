import React from "react";

import Reveal from "@/components/animation/Reveal";
import Heading from "@/components/ui/Heading";

import { FEATURES } from "../utils/landingPageConstants";

interface FeatureItemProps {
  name: string;
  description: string;
}

// A ruled list, as the app's own rows are: each feature is a line and a
// sentence, not a card that lights up on hover as if it led somewhere.
const FeatureItem: React.FC<FeatureItemProps> = ({ name, description }) => (
  <li className="border-t border-border pt-5">
    <Heading level="panel" as="h3">
      {name}
    </Heading>
    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
  </li>
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

      {/* Static: the features are meant to be read, and a marquee that
          pauses only on hover is unreadable on touch. */}
      <ul
        className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Features"
      >
        {FEATURES.map((feature) => (
          <FeatureItem
            key={feature.name}
            name={feature.name}
            description={feature.description}
          />
        ))}
      </ul>
    </div>
  </section>
);

export default FeaturesSection;
