import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";

import { DAILY_AVERAGES_CONFIG } from "../constants";
import type { NutritionAverage } from "../types/insightsTypes";

interface AtAGlanceSectionProps {
  averages: NutritionAverage;
}

export default function AtAGlanceSection({ averages }: AtAGlanceSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="mb-8 rounded-2xl border border-border/60 bg-surface-2 p-6"
    >
      <h3 className="mb-4 text-xl font-bold tracking-tight text-foreground/90">
        At a Glance
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {" "}
        {DAILY_AVERAGES_CONFIG.map((config, index) => (
          <div key={index} className="flex flex-col rounded-xl border border-border/40 bg-surface p-4 transition-colors hover:border-border/80">
            <span className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
              Daily Average
            </span>
            <span className={`text-2xl font-bold tracking-tight ${config.color}`}>
              <AnimatedNumber
                value={Math.round(averages[config.key])}
                toFixedValue={0}
                suffix={config.unit}
                duration={0.6}
              />
            </span>
            <span className="mt-1 text-sm font-medium text-foreground/80">{config.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
