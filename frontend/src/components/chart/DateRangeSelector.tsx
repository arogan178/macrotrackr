import { DATE_RANGE_OPTIONS } from "@/components/utils/constants";
import { motion } from "motion/react";
import FormButton from "../form/FormButton";

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
      <div className="flex flex-wrap items-center justify-between gap-4">
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
                size="sm"
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

        <FormButton
          onClick={onExportClick}
          disabled={isExportDisabled}
          ariaLabel="Export data as CSV file"
          className="px-4 py-2 bg-indigo-700/60 hover:bg-indigo-700/80 text-indigo-100 rounded-lg font-medium flex items-center transition-all duration-200 border border-indigo-600/30 disabled:opacity-50 "
          variant="primary"
          size="md"
          icon={
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              ></path>
            </svg>
          }
          iconPosition="left"
        >
          Export CSV
        </FormButton>
      </div>
    </motion.div>
  );
}
