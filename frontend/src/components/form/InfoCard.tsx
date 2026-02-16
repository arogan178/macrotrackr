import { memo } from "react";

import type { InfoCardProps } from "@/components/form/Types";
import { COLOR_MAP } from "@/components/utils/Constants";

function InfoCard({
  title,
  description,
  color = "accent",
  icon,
  children,
}: InfoCardProps) {
  // Narrow the color key to the known COLOR_MAP keys to satisfy TypeScript
  const colorKey = (
    color in COLOR_MAP ? color : "accent"
  ) as keyof typeof COLOR_MAP;
  const { border, text, dot } = COLOR_MAP[colorKey];

  return (
    <div
      className={`rounded-xl border bg-surface-2 p-4 shadow-card transition-colors duration-150 hover:border-border-2 hover:shadow-card-hover ${border}`}
    >
      <div className="mb-2 flex items-center gap-2">
        {!icon && <div className={`h-2 w-2 rounded-full ${dot}`}></div>}
        {icon && <div className={text}>{icon}</div>}
        <h4 className={`${text} font-medium`}>{title}</h4>
      </div>
      {description && <p className="text-sm text-foreground">{description}</p>}
      {children}
    </div>
  );
}

export default memo(InfoCard);
