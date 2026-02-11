import { motion } from "motion/react";

import { Button, ExportIcon, IconButton, TabBar } from "@/components/ui";
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
  // Map date ranges to TabBar items
  const items = DATE_RANGE_OPTIONS.map((option) => ({
    key: option.value,
    label: option.label,
    // activeBg inherits TabButton default bg-primary; can be themed later if needed
  }));

  return (
    <motion.div
      layout
      className="sticky top-24 z-40 mb-6 rounded-xl border border-border bg-surface p-3"
      style={{ position: "sticky" as const }}
    >
      <div className="flex w-full flex-wrap items-center gap-4">
        {/* Time Period Selector */}
        <div className="flex items-center">
          <span className="mr-3 font-medium text-foreground">Time Period:</span>
          <TabBar
            items={items}
            activeKey={currentRange}
            onChange={onRangeChange}
            rounded="rounded-lg"
            isMotion
            layoutId="activeRangeHighlight"
            size="sm"
            className="border border-border/50 bg-surface-2"
          />
        </div>

        {/* Mobile Export CSV IconButton aligned right */}
        <div className="ml-auto flex lg:hidden">
          <IconButton
            variant="export"
            ariaLabel="Export data as CSV file"
            onClick={onExportClick}
            disabled={isExportDisabled}
          />
        </div>

        {/* Desktop Export CSV Button */}
        <div className="ml-auto hidden lg:flex">
          <Button
            onClick={onExportClick}
            disabled={isExportDisabled}
            ariaLabel="Export data as CSV file"
            className="flex items-center rounded-lg border border-primary/30 bg-primary/60 font-medium text-foreground transition-all duration-200 hover:bg-primary/80 disabled:opacity-50"
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
