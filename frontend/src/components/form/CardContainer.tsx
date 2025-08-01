/**
 * CardContainer – Standardized card wrapper for consistent layout and styling.
 *
 * Applies shared card styles and allows additional classes.
 *
 * Props:
 * @prop {React.ReactNode} children - Card content
 * @prop {string} [className] - Additional classes for the card
 *
 * @example
 * <CardContainer>
 *   <h2>Section Title</h2>
 *   <p>Some content here.</p>
 * </CardContainer>
 */
import { memo } from "react";

import { formStyles } from "@/components/form/styles";
import type { CardContainerProps } from "@/components/form/types";

function CardContainer({ children, className = "" }: CardContainerProps) {
  return (
    <div className={`${formStyles.card.container} ${className}`}>
      {children}
    </div>
  );
}

export default memo(CardContainer);
