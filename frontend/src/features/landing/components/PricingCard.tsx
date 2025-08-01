import { motion } from "motion/react";
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
  focusRingColor = "focus-visible:ring-primary/50",
  featureIconColor = "text-primary",
  featureTextClass = "text-foreground font-medium",
  cardClassName = "",
  children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
    transition={{ duration: 0.3, type: "spring", stiffness: 280, damping: 26 }}
    tabIndex={0}
    role="region"
    aria-label={`${title} pricing plan`}
    className={`relative flex h-full flex-col rounded-2xl border border-border/50 bg-surface p-8 backdrop-blur-sm outline-none lg:p-10 ${focusRingColor} ${cardClassName}`}
  >
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-foreground shadow-surface">
          Most Popular
        </span>
      </div>
    )}
    <div className="mt-4 mb-8 text-center">
      <h3 className="mb-2 text-2xl font-bold text-foreground">{title}</h3>
      <div className="mb-2 text-4xl font-bold text-foreground">
        {price}
        {suffix && (
          <span className="text-lg font-normal text-foreground">{suffix}</span>
        )}
      </div>
      {equivalent && (
        <p className="text-sm font-medium text-success">{equivalent}</p>
      )}
      {children}
    </div>
    <motion.ul
      className="mb-8 space-y-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
        hidden: {},
      }}
    >
      {features.map((feature, index) => (
        <motion.li
          key={index}
          className="flex items-center space-x-3"
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 360, damping: 26 },
            },
          }}
        >
          <CheckIcon className={`h-5 w-5 ${featureIconColor} flex-shrink-0`} />
          <span className={featureTextClass}>{feature}</span>
        </motion.li>
      ))}
    </motion.ul>
    <div className="mt-auto">
      <motion.div
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
      >
        <Button
          text={buttonText}
          variant={buttonVariant}
          buttonSize={buttonSize}
          className={buttonClassName}
          onClick={onButtonClick}
        />
      </motion.div>
    </div>
  </motion.div>
);

export default PricingCard;
