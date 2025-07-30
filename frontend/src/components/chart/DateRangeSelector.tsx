import { motion } from "motion/react";

import { Button, ExportIcon, IconButton } from "@/components/ui";
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
      className="sticky top-20 z-30 bg-surface/80 backdrop-blur-md rounded-xl border border-border/50 p-3 mb-6 shadow-modal transition-all duration-300"
      // Increased top to 20, slightly increased blur/opacity for sticky state
    >
      <div className="flex flex-wrap items-center gap-4 w-full">
        {/* Time Period Selector */}
        <div className="flex items-center">
          <span className="text-foreground font-medium mr-3">Time Period:</span>
          <div className="relative flex bg-surface/50 rounded-lg p-1 border border-border/50">
            {DATE_RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => onRangeChange(option.value)}
                ariaLabel={`Set time period to ${option.label}`}
                className={`relative px-4 py-1.5 rounded-md font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                  currentRange === option.value
                    ? "text-foreground"
                    : "text-foreground hover:bg-surface/50 hover:text-foreground"
                }`}
                variant={currentRange === option.value ? "primary" : "ghost"}
                buttonSize="sm"
                aria-selected={currentRange === option.value}
                role="tab"
              >
                <span className="relative z-10">{option.label}</span>
                {currentRange === option.value && (
                  <motion.div
                    className="absolute inset-0 bg-primary rounded-md shadow-surface"
                    layoutId="activeRangeHighlight"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Button>
            ))}
          </div>
        </div>
        {/* Mobile Export CSV IconButton aligned right */}
        <div className="flex lg:hidden ml-auto">
          <IconButton
            variant="export"
            ariaLabel="Export data as CSV file"
            onClick={onExportClick}
            disabled={isExportDisabled}
          />
        </div>
        {/* Desktop Export CSV Button */}
        <div className="hidden lg:flex ml-auto">
          <Button
            onClick={onExportClick}
            disabled={isExportDisabled}
            ariaLabel="Export data as CSV file"
            className=" bg-primary/60 hover:bg-primary/80 text-foreground rounded-lg font-medium flex items-center transition-all duration-200 border border-primary/30 disabled:opacity-50 "
            icon={<ExportIcon />}
            iconPosition="left"
          >
            Export CSV
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
