import { motion } from "motion/react";

import {
  Button,
  ExportIcon,
  IconButton,
  LockIcon,
  TabBar,
} from "@/components/ui";
import { DATE_RANGE_OPTIONS } from "@/components/utils";
import { isLocalAuthMode } from "@/config/runtime";

interface DateRangeSelectorProps {
  currentRange: string;
  onRangeChange: (range: string) => void;
  onExportClick: () => void;
  isExportDisabled: boolean;
  disabledRanges?: string[];
  isPro?: boolean;
}

export default function DateRangeSelector({
  currentRange,
  onRangeChange,
  onExportClick,
  isExportDisabled,
  disabledRanges = [],
  isPro = false,
}: DateRangeSelectorProps) {
  const hasProAccess = isLocalAuthMode || isPro;

  // Handle range change with free tier restrictions
  const handleRangeChange = (range: string) => {
    if (disabledRanges.includes(range)) {
      return; // Don't allow selection of disabled ranges
    }
    onRangeChange(range);
  };

  // Map date ranges to TabBar items
  const items = DATE_RANGE_OPTIONS.map((option) => ({
    key: option.value,
    label: (
      <span className="flex items-center gap-1">
        {option.label}
        {disabledRanges.includes(option.value) && (
          <LockIcon className="h-3 w-3 text-muted" />
        )}
      </span>
    ),
    disabled: disabledRanges.includes(option.value),
  }));

  return (
    <motion.div
      layout
      className="sticky top-24 z-30 mb-6 rounded-xl border border-border/70 bg-surface/92 p-3 shadow-lg backdrop-blur-md"
      style={{ position: "sticky" }}
    >
      <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs sm:text-sm font-medium text-foreground shrink-0">Time Period:</span>
          <TabBar
            items={items}
            activeKey={currentRange}
            onChange={handleRangeChange}
            rounded="rounded-lg"
            isMotion
            layoutId="activeRangeHighlight"
            size="sm"
            className="border border-border bg-surface-2 flex-nowrap shrink-0"
          />
          {!hasProAccess && (
            <span className="w-full text-xs text-muted sm:w-auto">
              Pro: Unlock 30 & 90 day views
            </span>
          )}
        </div>

        {/* Export CSV Button aligned right on same line */}
        <div className="shrink-0">
          <div className="flex lg:hidden">
            <IconButton
              variant="export"
              ariaLabel="Export data as CSV file"
              onClick={onExportClick}
              disabled={isExportDisabled}
            />
          </div>
          <div className="hidden lg:flex">
            <Button
              onClick={onExportClick}
              disabled={isExportDisabled}
              ariaLabel="Export data as CSV file"
              className="flex items-center rounded-lg border border-primary/30 bg-primary/60 font-medium text-foreground transition-colors duration-200 hover:bg-primary/80 disabled:opacity-50"
              leftIcon={<ExportIcon />}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
