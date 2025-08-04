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
      <div className="mb-4 flex items-center">
        <div className={`${bgColor} mr-2 rounded-full p-1.5`}>{icon}</div>
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      </div>
      <p className="text-sm text-foreground">{message}</p>
    </CardContainer>
  );
}
