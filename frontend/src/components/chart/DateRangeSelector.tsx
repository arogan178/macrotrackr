import {
  Button,
  ExportIcon,
  IconButton,
  LockIcon,
  TabBar,
} from "@/components/ui";
import { DATE_RANGE_OPTIONS } from "@/components/utils";

import AnalyticsToolbar from "./AnalyticsToolbar";

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
    <AnalyticsToolbar>
      <div className="flex w-full flex-wrap items-center gap-4">
        <div className="flex items-center">
          <span className="mr-3 font-medium text-foreground">Time Period:</span>
          <TabBar
            items={items}
            activeKey={currentRange}
            onChange={handleRangeChange}
            rounded="rounded-lg"
            isMotion
            layoutId="activeRangeHighlight"
            size="sm"
            className="border border-border bg-surface-2"
          />
          {!isPro && (
            <span className="ml-2 text-xs text-muted">
              Pro: Unlock 30 & 90 day views
            </span>
          )}
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
            className="flex items-center rounded-lg border border-primary/30 bg-primary/60 font-medium text-foreground transition-colors duration-200 hover:bg-primary/80 disabled:opacity-50"
            leftIcon={<ExportIcon />}
          >
            Export CSV
          </Button>
        </div>
      </div>
    </AnalyticsToolbar>
  );
}
