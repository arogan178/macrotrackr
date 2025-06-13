import { motion } from "motion/react";
import type { MetricCardProps } from "../types/insights-types";
import { getScoreColor } from "../utils/insights-calculations";
import AnimatedNumber from "@/components/animation/AnimatedNumber";

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
      className={`rounded-lg ${bgGradient} p-4 ${borderColor} h-[160px] flex flex-col`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
        <div className={`h-2 w-2 rounded-full ${getScoreColor(score)}`} />
      </div>{" "}
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold text-white">
          <AnimatedNumber
            value={
              typeof value === "number" ? value : parseFloat(value.toString())
            }
            toFixedValue={0}
            duration={0.8}
          />
        </span>
        <span className={`text-xs ${textColor}/70`}>{subtitle}</span>
      </div>
      <div className="flex-1 flex flex-col justify-between">{children}</div>
    </motion.div>
  );
}
