import { memo } from "react";

import { ProFeature } from "@/components/billing/ProFeature";
import { Button, ChevronRightIcon, IconButton } from "@/components/ui";
import { addDaysISO } from "@/utils/dateUtilities";

interface DayNavigatorProps {
  date: string;
  today: string;
  /** Oldest day a free account can open; unset for Pro. */
  oldestDate?: string;
  onChange: (date: string) => void;
}

function DayNavigator({ date, today, oldestDate, onChange }: DayNavigatorProps) {
  const isToday = date === today;
  const isAtFreeLimit = oldestDate !== undefined && date <= oldestDate;

  const previousButton = (
    <IconButton
      variant="custom"
      ariaLabel="Previous day"
      icon={<ChevronRightIcon className="h-5 w-5 rotate-180" />}
      // Locked, the click belongs to ProFeature's upgrade prompt.
      onClick={isAtFreeLimit ? undefined : () => onChange(addDaysISO(date, -1))}
    />
  );

  return (
    <div className="flex items-center gap-1">
      {isAtFreeLimit ? <ProFeature>{previousButton}</ProFeature> : previousButton}
      <Button
        variant="secondary"
        buttonSize="sm"
        text="Today"
        disabled={isToday}
        onClick={() => onChange(today)}
      />
      <IconButton
        variant="custom"
        ariaLabel="Next day"
        icon={<ChevronRightIcon className="h-5 w-5" />}
        disabled={isToday}
        onClick={() => onChange(addDaysISO(date, 1))}
      />
    </div>
  );
}

export default memo(DayNavigator);
