import { useState } from "react";
import { motion } from "motion/react";

import UpgradeModal from "@/components/billing/UpgradeModal";
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
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // A locked range used to look clickable and then do nothing at all. It now
  // says what it is and offers the one thing that unlocks it.
  const handleRangeChange = (range: string) => {
    if (disabledRanges.includes(range)) {
      setUpgradeOpen(true);

      return;
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
          <LockIcon className="h-3 w-3 text-muted" aria-label="Pro only" />
        )}
      </span>
    ),
  }));

  return (
    <motion.div
      layout
      className="sticky z-30 mb-6 rounded-card border border-border bg-surface p-3"
      style={{ top: "var(--header-offset)" }}
    >
      <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs sm:text-sm font-medium text-foreground shrink-0">Time Period:</span>
          <TabBar
            items={items}
            activeKey={currentRange}
            onChange={handleRangeChange}
            isMotion
            layoutId="activeRangeHighlight"
            size="sm"
            className="border border-border bg-surface-2 flex-nowrap shrink-0"
          />
          {!hasProAccess && (
            <span className="w-full text-xs text-muted sm:w-auto">
              30 and 90 day views are Pro
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
              className="flex items-center rounded-control border border-primary/30 bg-primary/60 font-medium text-foreground transition-colors duration-200 hover:bg-primary/80 disabled:opacity-50"
              leftIcon={<ExportIcon />}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgrade={() => {
          setUpgradeOpen(false);
          globalThis.location.href = "/pricing";
        }}
      />
    </motion.div>
  );
}
