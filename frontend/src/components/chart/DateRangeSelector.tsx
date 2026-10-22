import { useState } from "react";

import UpgradeModal from "@/components/billing/UpgradeModal";
import { LockIcon, TabBar } from "@/components/ui";
import { DATE_RANGE_OPTIONS } from "@/components/utils";
import { isLocalAuthMode } from "@/config/runtime";

interface DateRangeSelectorProps {
  currentRange: string;
  onRangeChange: (range: string) => void;
  disabledRanges?: string[];
  isPro?: boolean;
}

export default function DateRangeSelector({
  currentRange,
  onRangeChange,
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
    // The tabs are the whole bar and it scrolls away with the page; share and
    // export sit on the page title's row.
    <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3">
      <TabBar
        items={items}
        activeKey={currentRange}
        onChange={handleRangeChange}
        isMotion
        layoutId="activeRangeHighlight"
        size="sm"
        fullWidth
        className="flex-nowrap border border-border bg-surface-2"
      />
      {!hasProAccess && (
        <span className="w-full text-xs text-muted sm:w-auto">
          30 and 90 day views are Pro
        </span>
      )}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgrade={() => {
          setUpgradeOpen(false);
          globalThis.location.href = "/pricing";
        }}
      />
    </div>
  );
}
