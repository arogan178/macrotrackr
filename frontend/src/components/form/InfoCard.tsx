import { memo } from "react";

import type { InfoCardProps } from "@/components/form/types";
import { COLOR_MAP } from "@/components/utils/Constants";

function InfoCard({
  title,
  description,
  color = "accent",
  icon,
  children,
}: InfoCardProps) {
  const { bg, border, text, dot } = COLOR_MAP[color];

  return (
    <div className={`bg-gradient-to-br ${bg} rounded-xl border p-4 ${border}`}>
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
