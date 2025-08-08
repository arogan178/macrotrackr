import { memo } from "react";

import { InfoCard } from "@/components/form";
import { InfoIcon } from "@/components/ui";

interface MacroTargetInfoProps {
  isVisible: boolean;
}

/**
 * Component that displays help information for the macro target distribution
 */
function MacroTargetInfo({ isVisible }: MacroTargetInfoProps) {
  if (!isVisible) return;

  return (
    <InfoCard
      title="Tips for adjusting your macros:"
      color="indigo"
      icon={<InfoIcon className="" />}
    >
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-foreground">
        <li>Drag the sliders to adjust percentages</li>
        <li>
          Click the lock icon to keep a macro fixed while adjusting others
        </li>
        <li>Total will always equal 100%</li>
        <li>Each macro requires at least 5%</li>
      </ul>
    </InfoCard>
  );
}

export default memo(MacroTargetInfo);
