import { memo, useMemo } from "react";

import { formStyles } from "@/components/form/FormStyles";
import type { CardContainerProps } from "@/components/form/FormTypes";
import { cn } from "@/lib/classnameUtilities";

const cardVariants = {
  default: formStyles.card.container,
  transparent: cn(
    "rounded-control border border-border",
    "bg-transparent p-4",
    "hover:border-border-2",
    "transition-colors duration-150",
  ),
  interactive: cn(
    formStyles.card.container,
    "group cursor-pointer",
    "transition-colors duration-300 ease-out",
    "hover:border-border-2"
  )
};

function CardContainer({
  children,
  className = "",
  variant = "default",
  ...properties
}: CardContainerProps) {
  const containerClasses = useMemo(() => {
    return cn(cardVariants[variant ?? "default"], className);
  }, [variant, className]);

  return <div className={containerClasses} {...properties}>{children}</div>;
}

export default memo(CardContainer);
