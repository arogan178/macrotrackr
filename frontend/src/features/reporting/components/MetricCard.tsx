import { motion } from "motion/react";
import type { MetricCardProps } from "../types/insights-types";
import { getScoreColor } from "../utils/insights-calculations";

export default function MetricCard({
  title,
  value,
  subtitle,
  score,
  bgGradient,
  borderColor,
  textColor,
  delay = 0,
  children,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-lg ${bgGradient} p-4 ${borderColor} min-h-[120px] flex flex-col`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
        <div className={`h-2 w-2 rounded-full ${getScoreColor(score)}`} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className={`text-xs ${textColor}/70`}>{subtitle}</span>
      </div>
      <div className="flex-1 flex flex-col justify-end">{children}</div>
    </motion.div>
  );
}
