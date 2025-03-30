import { memo, useCallback } from "react";
import { MacroTargetSettings } from "@/features/macroTracking/types";
import { InfoCard, CardContainer } from "@/components/form";
import { InfoIcon } from "@/components/Icons";
import MacroDistribution from "./MacroDistribution";
import { useStore } from "@/store/store";

function MacroTargetsForm() {
  const { macroTargets, updateMacroDistribution } = useStore();

  const handleMacroDistributionChange = useCallback(
    (distribution: MacroTargetSettings) => {
      updateMacroDistribution(distribution);
    },
    [updateMacroDistribution]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
      {/* Left side - Main content (4 cols) */}
      <div className="lg:col-span-4 flex flex-col h-full">
        <CardContainer className="p-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-200">
              Macro Distribution Settings
            </h3>
            <div className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full">
              <span className="text-sm text-indigo-300">Daily Targets</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            Adjust the sliders below to set your preferred macronutrient
            distribution. These percentages will be used to calculate your daily
            macro targets based on your calorie needs.
          </p>

          {macroTargets?.macro_distribution && (
            <MacroDistribution
              initialValues={macroTargets.macro_distribution}
              onDistributionChange={handleMacroDistributionChange}
            />
          )}
        </CardContainer>
      </div>

      {/* Right side - Info panel (2 cols) */}
      <div className="lg:col-span-2 flex flex-col h-full">
        <CardContainer className="p-6 h-full">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">
            Understanding Macros
          </h3>
          <div className="space-y-4 flex-1">
            <InfoCard
              title="Protein"
              description="Essential for muscle repair and growth."
              color="green"
            />

            <InfoCard
              title="Carbohydrates"
              description="Your body's primary energy source."
              color="blue"
            />

            <InfoCard
              title="Fats"
              description="Essential for hormone production and nutrient absorption."
              color="red"
            />

            <InfoCard
              title="Tips"
              color="indigo"
              icon={<InfoIcon className="w-4 h-4 text-indigo-400" />}
            >
              <ul className="text-sm text-gray-400 space-y-2 mt-2">
                <li>• For muscle growth keep protein between 20-35% </li>
                <li>• Carbs work best at 45-65%</li>
                <li>• Fats should stay between 20-35%</li>
              </ul>
            </InfoCard>
          </div>
        </CardContainer>
      </div>
    </div>
  );
}

export default memo(MacroTargetsForm);
