import { CardContainer } from "@/components/form";

import type { ActionCardProps as ActionCardProps } from "../types/insightsTypes";

export default function ActionCard({
  title,
  icon,
  message,
  bgColor,
}: ActionCardProps) {
  return (
    <CardContainer className="p-3">
      <div className="flex items-center mb-2">
        <div className={`${bgColor} rounded-full p-1.5 mr-2`}>{icon}</div>
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      </div>
      <p className="text-foreground text-sm">{message}</p>
    </CardContainer>
  );
}
