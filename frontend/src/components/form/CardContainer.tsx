import { memo } from "react";
import { CardContainerProps } from "../utils/types";
import { formStyles } from "../utils/styles";

function CardContainer({ children, className = "" }: CardContainerProps) {
  return (
    <div className={`${formStyles.card.container} ${className}`}>
      {children}
    </div>
  );
}

export default memo(CardContainer);
