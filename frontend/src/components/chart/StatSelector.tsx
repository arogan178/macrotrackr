import { motion } from "motion/react";
import { STAT_COLORS } from "@/utils/chart-colors";
import FormButton from "../form/FormButton";

interface StatSelectorProps {
  selectedStat: string;
  onStatChange: (stat: string) => void;
  availableStats: string[];
}

/**
 * StatSelector - A reusable component for selecting stats in charts
 */
function StatSelector({
  selectedStat,
  onStatChange,
  availableStats,
}: StatSelectorProps) {
  return (
    <div className="relative flex flex-wrap space-x-1 p-0.5 bg-gray-700/60 rounded-lg">
      {availableStats.map((stat) => {
        const bgColor =
          STAT_COLORS[stat as keyof typeof STAT_COLORS] || "bg-indigo-600";

        return (
          <FormButton
            key={stat}
            onClick={() => onStatChange(stat)}
            ariaLabel={`Select ${stat}`}
            className={`relative px-2 py-0.5 rounded text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50 ${
              selectedStat === stat
                ? "text-white"
                : "text-gray-300 hover:bg-gray-600/50 hover:text-white"
            }`}
            variant={selectedStat === stat ? "primary" : "ghost"}
            buttonSize="sm"
            aria-selected={selectedStat === stat}
            role="tab"
          >
            {selectedStat === stat && (
              <motion.div
                className={`absolute inset-0 rounded shadow-md ${bgColor}`}
                layoutId="statHighlight"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                style={{ zIndex: 0 }}
              />
            )}
            <span className="relative z-10">
              {stat.charAt(0).toUpperCase() + stat.slice(1)}
            </span>
          </FormButton>
        );
      })}
    </div>
  );
}

export default StatSelector;
