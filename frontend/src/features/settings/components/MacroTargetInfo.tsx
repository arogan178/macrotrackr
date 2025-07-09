import { memo } from "react";
import { InfoCard } from "@/components/form";
import { InfoIcon } from "@/components/Icons";
import { MacroTargetInfoProps } from "@/types/macro";

/**
 * Component that displays help information for the macro target distribution
 */
function MacroTargetInfo({ isVisible }: MacroTargetInfoProps) {
  if (!isVisible) return null;

  return (
    <InfoCard
      title="Tips for adjusting your macros:"
      color="indigo"
      icon={<InfoIcon className="w-5 h-5" />}
    >
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-300 mt-2">
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
