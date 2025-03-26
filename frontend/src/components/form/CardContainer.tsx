import { CardContainerProps } from "./types";
import { formStyles } from "./styles";

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
