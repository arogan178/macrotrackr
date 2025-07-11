import type { ActionCardProps as ActionCardProps } from "../types/insightsTypes";

export default function ActionCard({
  title,
  icon,
  message,
  bgColor,
}: ActionCardProps) {
  return (
    <div className="rounded-lg bg-gray-800/50 p-3 border border-gray-700/50">
      <div className="flex items-center mb-2">
        <div className={`${bgColor} rounded-full p-1.5 mr-2`}>{icon}</div>
        <h4 className="text-sm font-medium text-gray-300">{title}</h4>
      </div>
      <p className="text-gray-300 text-sm">{message}</p>
    </div>
  );
}
