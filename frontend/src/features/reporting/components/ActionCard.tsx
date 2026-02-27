import CardContainer from "@/components/form/CardContainer";
import { cn } from "@/lib/classnameUtilities";

import type { ActionCardProps as ActionCardProps } from "../types/insightsTypes";

export default function ActionCard({
  title,
  icon,
  message,
  bgColor,
}: ActionCardProps) {
  return (
    <CardContainer variant="interactive" className="p-5">
      <div className="mb-3 flex items-center">
        <div className={cn("mr-3 rounded-xl p-2", bgColor)}>{icon}</div>
        <h4 className="text-base font-semibold tracking-tight text-foreground/90">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </CardContainer>
  );
}
