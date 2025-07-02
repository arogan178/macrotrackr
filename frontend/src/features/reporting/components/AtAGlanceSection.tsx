import { motion } from "motion/react";
import type { NutritionAverage } from "../types/insights-types";
import { DAILY_AVERAGES_CONFIG } from "../constants";
import AnimatedNumber from "@/components/animation/AnimatedNumber";

interface AtAGlanceSectionProps {
  averages: NutritionAverage;
}

export default function AtAGlanceSection({ averages }: AtAGlanceSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="p-4 rounded-lg border border-purple-500/20 bg-purple-900/10 mb-4"
    >
      <h3 className="text-md font-medium text-purple-300 mb-3">At a Glance</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
        {" "}
        {DAILY_AVERAGES_CONFIG.map((config, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-gray-400 text-xs">Daily Average</span>
            <span className={`text-xl font-bold ${config.color}`}>
              <AnimatedNumber
                value={Math.round(averages[config.key])}
                toFixedValue={0}
                suffix={config.unit}
                duration={0.6}
              />
            </span>
            <span className="text-gray-400 text-xs mt-1">{config.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
