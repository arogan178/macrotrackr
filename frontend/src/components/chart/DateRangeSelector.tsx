import { motion } from "motion/react";

import { ActionButton, FormButton } from "@/components/form";
import { ExportIcon } from "@/components/ui";
import { DATE_RANGE_OPTIONS } from "@/components/utils";

interface DateRangeSelectorProps {
  currentRange: string;
  onRangeChange: (range: string) => void;
  onExportClick: () => void;
  isExportDisabled: boolean;
}

export default function DateRangeSelector({
  currentRange,
  onRangeChange,
  onExportClick,
  isExportDisabled,
}: DateRangeSelectorProps) {
  return (
    // Wrap with motion.div and add layout prop
    <motion.div
      layout // Add layout for smooth transition
      className="sticky top-20 z-30 bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-700/50 p-3 mb-6 shadow-xl transition-all duration-300"
      // Increased top to 20, slightly increased blur/opacity for sticky state
    >
      <div className="flex flex-wrap items-center gap-4 w-full">
        {/* Time Period Selector */}
        <div className="flex items-center">
          <span className="text-gray-300 font-medium mr-3">Time Period:</span>
          <div className="relative flex bg-gray-900/50 rounded-lg p-1 border border-gray-700/50">
            {DATE_RANGE_OPTIONS.map((option) => (
              <FormButton
                key={option.value}
                onClick={() => onRangeChange(option.value)}
                ariaLabel={`Set time period to ${option.label}`}
                className={`relative px-4 py-1.5 rounded-md font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                  currentRange === option.value
                    ? "text-white"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
                variant={currentRange === option.value ? "primary" : "ghost"}
                buttonSize="sm"
                aria-selected={currentRange === option.value}
                role="tab"
              >
                <span className="relative z-10">{option.label}</span>
                {currentRange === option.value && (
                  <motion.div
                    className="absolute inset-0 bg-indigo-600 rounded-md shadow-md"
                    layoutId="activeRangeHighlight"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </FormButton>
            ))}
          </div>
        </div>
        {/* Mobile Export CSV ActionButton aligned right */}
        <div className="flex lg:hidden ml-auto">
          <ActionButton
            variant="export"
            ariaLabel="Export data as CSV file"
            onClick={onExportClick}
            disabled={isExportDisabled}
          />
        </div>
        {/* Desktop Export CSV Button */}
        <div className="hidden lg:flex ml-auto">
          <FormButton
            onClick={onExportClick}
            disabled={isExportDisabled}
            ariaLabel="Export data as CSV file"
            className=" bg-indigo-700/60 hover:bg-indigo-700/80 text-indigo-100 rounded-lg font-medium flex items-center transition-all duration-200 border border-indigo-600/30 disabled:opacity-50 "
            variant="primary"
            icon={<ExportIcon />}
            iconPosition="left"
          >
            Export CSV
          </FormButton>
        </div>
      </div>
    </motion.div>
  );
}
