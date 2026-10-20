import { useState } from "react";
import { motion } from "motion/react";

import UpgradeModal from "@/components/billing/UpgradeModal";
import {
  Button,
  ExportIcon,
  LockIcon,
  ShareIcon,
  TabBar,
} from "@/components/ui";
import { DATE_RANGE_OPTIONS } from "@/components/utils";
import { isLocalAuthMode } from "@/config/runtime";

interface DateRangeSelectorProps {
  currentRange: string;
  onRangeChange: (range: string) => void;
  onExportClick: () => void;
  onShareClick?: () => void;
  isExportDisabled: boolean;
  disabledRanges?: string[];
  isPro?: boolean;
}

export default function DateRangeSelector({
  currentRange,
  onRangeChange,
  onExportClick,
  onShareClick,
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
      className="z-30 mb-6 max-md:mb-0 md:sticky rounded-card border border-border bg-surface p-3 max-md:rounded-none max-md:border-0 max-md:bg-background max-md:p-0"
      style={{ top: "var(--header-offset)" }}
    >
      {/* On a phone the tabs are the whole bar and it scrolls away: the label
          repeats the tabs, and share and export sit on the page title's row. */}
      <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3">
        <span className="hidden shrink-0 text-sm font-medium text-foreground md:inline">Time Period:</span>
        <TabBar
          items={items}
          activeKey={currentRange}
          onChange={handleRangeChange}
          isMotion
          layoutId="activeRangeHighlight"
          size="sm"
          fullWidth
          className="order-last border border-border bg-surface-2 flex-nowrap sm:order-none"
        />
        {!hasProAccess && (
          <span className="order-last w-full text-xs text-muted sm:order-none sm:w-auto">
            30 and 90 day views are Pro
          </span>
        )}

        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          {onShareClick && (
            <Button
              onClick={onShareClick}
              disabled={isExportDisabled}
              ariaLabel="Share macro snapshot"
              variant="secondary"
              leftIcon={<ShareIcon size="sm" />}
            >
              Share Snapshot
            </Button>
          )}
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
