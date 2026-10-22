import React from "react";

import { CheckIcon } from "@/components/ui";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";

interface PricingCardProps {
  title: string;
  price: React.ReactNode;
  suffix?: string;
  /** The yearly price per month, under the figure. */
  equivalent?: string;
  description: string;
  features: string[];
  /** One step up the surfaces, for the plan being offered. */
  raised?: boolean;
  /** Omit to render the plan with no call to action at all. */
  action?: React.ReactNode;
}

/**
 * One plan, read top to bottom like the app's panels: name, price, what it is
 * for, then what it includes. The action sits at the foot so two plans side by
 * side end on the same line.
 */
const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  suffix,
  equivalent,
  description,
  features,
  raised = false,
  action,
}) => (
  <Panel
    padding="none"
    raised={raised}
    className="flex h-full flex-col"
    role="region"
    aria-label={`${title} pricing plan`}
  >
    <div className="flex h-full flex-col p-6 sm:p-8">
      <Heading level="panel" as="h3">
        {title}
      </Heading>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className={`${TYPE_SCALE.display} tabular-nums`}>{price}</span>
        {suffix ? <span className="text-sm text-muted">{suffix}</span> : null}
      </p>
      <p className="mt-1 min-h-5 text-sm text-muted">{equivalent}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted">{description}</p>

      <ul className="mt-6 space-y-3 border-t border-border pt-6">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm text-foreground">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      {action ? <div className="mt-auto pt-8">{action}</div> : null}
    </div>
  </Panel>
);

export default PricingCard;
