import React from "react";
import { motion } from "motion/react";
import { CheckIcon } from "@/components/ui";
import FormButton from "@/components/form/FormButton";

interface PricingCardProps {
  title: string;
  price: string;
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
 * Usage example:
 *   <PricingCard title="Pro" price="$6.99" features={[...]} buttonText="Get Pro Now" onButtonClick={...} />
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
  focusRingColor = "focus:ring-indigo-500/40",
  featureIconColor = "text-indigo-400",
  featureTextClass = "text-white font-medium",
  cardClassName = "",
  children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{
      scale: 1.025,
      boxShadow: "0 8px 32px 0 rgba(99,102,241,0.15)",
    }}
    whileFocus={{
      scale: 1.02,
      boxShadow: "0 8px 32px 0 rgba(99,102,241,0.18)",
    }}
    transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
    tabIndex={0}
    role="region"
    aria-label={`${title} pricing plan`}
    className={`relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 lg:p-10 flex flex-col h-full outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/70 ${focusRingColor} ${cardClassName}`}
  >
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
          Most Popular
        </span>
      </div>
    )}
    <div className="text-center mb-8 mt-4">
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <div className="text-4xl font-bold text-white mb-2">
        {price}
        {suffix && (
          <span className="text-lg font-normal text-slate-300">{suffix}</span>
        )}
      </div>
      {equivalent && (
        <p className="text-green-400 text-sm font-medium">{equivalent}</p>
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
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 400, damping: 30 },
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
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <FormButton
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
