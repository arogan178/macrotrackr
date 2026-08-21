import React from "react";

import { Button, CheckIcon } from "@/components/ui";

interface PricingCardProps {
  title: string;
  price: React.ReactNode | string;
  suffix?: string;
  equivalent?: string;
  features: string[];
  isPopular?: boolean;
  /** Omit to render the card with no call to action at all. */
  buttonText?: string;
  buttonVariant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  buttonSize?: "sm" | "md" | "lg";
  buttonClassName?: string;
  buttonDisabled?: boolean;
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
  buttonDisabled = false,
  onButtonClick,
  focusRingColor = "focus-visible:outline-primary/50",
  featureIconColor = "text-primary",
  featureTextClass = "text-foreground font-medium",
  cardClassName = "",
  children,
}) => (
  <div
    role="region"
    aria-label={`${title} pricing plan`}
    className={`group relative flex h-full flex-col rounded-card border p-8 transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out sm:p-10 ${focusRingColor} ${cardClassName}`}
  >
    {isPopular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground uppercase">
          Most Popular
        </span>
      </div>
    )}
    <div className="mt-4 mb-8 text-center">
      <h3 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="mb-2 flex min-h-14 items-center justify-center text-4xl font-bold tracking-tight text-foreground">
        {price}
        {suffix && (
          <span className="ml-1 text-lg font-normal tracking-normal text-muted">
            {suffix}
          </span>
        )}
      </div>
      <div className="min-h-6">
        {equivalent && (
          <p className="text-sm font-medium tracking-wide text-muted">
            {equivalent}
          </p>
        )}
      </div>
      {children}
    </div>
    <ul className="mb-10 space-y-4">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-4">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 ${isPopular ? "border border-border-2 bg-surface-3" : "border border-border"}`}
          >
            <CheckIcon
              className={`h-3.5 w-3.5 ${featureIconColor} shrink-0`}
              aria-hidden="true"
            />
          </div>
          <span
            className={`leading-relaxed tracking-tight ${featureTextClass}`}
          >
            {feature}
          </span>
        </li>
      ))}
    </ul>
    {buttonText ? (
      <div className="mt-auto">
        <Button
          text={buttonText}
          variant={buttonVariant}
          buttonSize={buttonSize}
          className={buttonClassName}
          onClick={onButtonClick}
          disabled={buttonDisabled}
        />
      </div>
    ) : null}
  </div>
);

export default PricingCard;
