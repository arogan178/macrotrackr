/**
 * CardContainer – Standardized card wrapper for consistent layout and styling.
 *
 * Applies shared card styles and allows additional classes.
 *
 * Props:
 * @prop {React.ReactNode} children - Card content
 * @prop {string} [className] - Additional classes for the card
 * @prop {"default" | "transparent"} [variant="default"] - Visual style variant
 *
 * @example
 * <CardContainer>
 *   <h2>Section Title</h2>
 *   <p>Some content here.</p>
 * </CardContainer>
 *
 * @example
 * <CardContainer variant="transparent">
 *   <h2>Transparent Card</h2>
 * </CardContainer>
 */
import { memo, useMemo } from "react";

import { formStyles } from "@/components/form/Styles";
import type { CardContainerProps } from "@/components/form/Types";
import { cn } from "@/lib/classnameUtilities";

/**
 * Card variant styles following Memoria Design System
 */
const cardVariants = {
  default: formStyles.card.container,
  transparent: cn(
    "rounded-xl border border-border",
    "bg-transparent p-4",
    "hover:border-border-2",
    "transition-colors duration-150",
  ),
};

function CardContainer({
  children,
  className = "",
  variant = "default",
}: CardContainerProps) {
  const containerClasses = useMemo(() => {
    return cn(cardVariants[variant ?? "default"], className);
  }, [variant, className]);

  return <div className={containerClasses}>{children}</div>;
}

export default memo(CardContainer);
