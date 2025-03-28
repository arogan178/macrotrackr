import { CardContainerProps } from "../utils/types";
import { formStyles } from "../utils/styles";

export function CardContainer({
  children,
  className = "",
}: CardContainerProps) {
  return (
    <div className={`${formStyles.card.container} ${className}`}>
      {children}
    </div>
  );
}
