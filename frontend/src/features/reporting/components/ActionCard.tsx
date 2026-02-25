import CardContainer from "@/components/form/CardContainer";
import type { ActionCardProps as ActionCardProps } from "../types/insightsTypes";

export default function ActionCard({
  title,
  icon,
  message,
  bgColor,
}: ActionCardProps) {
  return (
    <CardContainer className="p-5 hover:border-border-hover transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
      <div className="mb-3 flex items-center">
        <div className={`mr-3 rounded-xl p-2 ${bgColor}`}>{icon}</div>
        <h4 className="text-base font-semibold tracking-tight text-foreground/90">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </CardContainer>
  );
}
