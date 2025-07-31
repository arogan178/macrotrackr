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
    className={`relative bg-surface backdrop-blur-sm border border-border/50 rounded-2xl p-8 lg:p-10 flex flex-col h-full outline-none ${focusRingColor} ${cardClassName}`}
  >
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="bg-primary text-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-surface">
          Most Popular
        </span>
      </div>
    )}
    <div className="text-center mb-8 mt-4">
      <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
      <div className="text-4xl font-bold text-foreground mb-2">
        {price}
        {suffix && (
          <span className="text-lg font-normal text-foreground">{suffix}</span>
        )}
      </div>
      {equivalent && (
        <p className="text-success text-sm font-medium">{equivalent}</p>
      )}
      {children}
    </div>
    <motion.ul
      className="space-y-4 mb-8"
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
          <CheckIcon className={`w-5 h-5 ${featureIconColor} flex-shrink-0`} />
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
