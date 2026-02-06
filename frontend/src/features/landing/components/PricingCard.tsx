import React from "react";

import { Button, CheckIcon } from "@/components/ui";

interface PricingCardProps {
  title: string;
  price: React.ReactNode | string;
  suffix?: string;
  equivalent?: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  buttonVariant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  buttonSize?: "sm" | "md" | "lg";
  buttonClassName?: string;
  onButtonClick?: () => void;
  focusRingColor?: string;
  featureIconColor?: string;
  featureTextClass?: string;
  cardClassName?: string;
  children?: React.ReactNode;
}

/**
 * PricingCard renders a single pricing plan card for the pricing section.
 */
const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  suffix,
  equivalent,
  features,
  isPopular = false,
  buttonText,
  buttonVariant = "primary",
  buttonSize = "lg",
  buttonClassName = "",
  onButtonClick,
  focusRingColor = "focus-visible:outline-primary/50",
  featureIconColor = "text-primary",
  featureTextClass = "text-foreground font-medium",
  cardClassName = "",
  children,
}) => (
  <div
    tabIndex={0}
    role="region"
    aria-label={`${title} pricing plan`}
    className={`relative flex h-full flex-col rounded-xl border border-border bg-surface p-8 outline-none lg:p-10 ${focusRingColor} ${cardClassName}`}
  >
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="rounded-full border border-primary/30 bg-primary px-4 py-1.5 text-xs font-semibold tracking-wide text-background uppercase">
          Most Popular
        </span>
      </div>
    )}
    <div className="mt-4 mb-8 text-center">
      <h3 className="mb-2 text-2xl font-bold text-foreground">{title}</h3>
      <div className="mb-2 text-4xl font-bold text-foreground">
        {price}
        {suffix && (
          <span className="text-lg font-normal text-muted">{suffix}</span>
        )}
      </div>
      {equivalent && (
        <p className="text-sm font-medium text-success">{equivalent}</p>
      )}
      {children}
    </div>
    <ul className="mb-8 space-y-4">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-3">
          <CheckIcon className={`${featureIconColor} shrink-0`} />
          <span className={featureTextClass}>{feature}</span>
        </li>
      ))}
    </ul>
    <div className="mt-auto">
      <Button
        text={buttonText}
        variant={buttonVariant}
        buttonSize={buttonSize}
        className={buttonClassName}
        onClick={onButtonClick}
      />
    </div>
  </div>
);

export default PricingCard;
