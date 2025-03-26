import { InfoCardProps } from "./types";
import { colorMap } from "./constants";

export function InfoCard({
  title,
  description,
  color = "indigo",
  icon,
  children,
}: InfoCardProps) {
  const { bg, border, text, dot } = colorMap[color];

  return (
    <div className={`bg-gradient-to-br ${bg} p-4 rounded-xl border ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        {!icon && <div className={`w-2 h-2 rounded-full ${dot}`}></div>}
        {icon && <div className={text}>{icon}</div>}
        <h4 className={`${text} font-medium`}>{title}</h4>
      </div>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {children}
    </div>
  );
}
