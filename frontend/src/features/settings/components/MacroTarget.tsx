import { useState, useEffect } from "react";
import MacroSlider, { MacroBadge } from "./MacroSlider";
import { InfoCard } from "@/components/form";
import { InfoIcon } from "@/components/Icons";

interface Target {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

interface MacroTargetProps {
  initialValues?: Target & {
    locked_macros?: string[];
  };
  onTargetChange: (
    target: Target & {
      locked_macros?: ("protein" | "carbs" | "fats")[];
    }
  ) => void;
}

export default function MacroTarget({
  initialValues = {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
    locked_macros: [],
  },
  onTargetChange,
}: MacroTargetProps) {
  const [target, setTarget] = useState<Target>(initialValues);
  const [isAdjusting, setIsAdjusting] = useState<
    "protein" | "carbs" | "fats" | null
  >(null);
  const [lockedMacros, setLockedMacros] = useState<
    ("protein" | "carbs" | "fats")[]
  >(
    (initialValues.locked_macros || []).filter(
      (m): m is "protein" | "carbs" | "fats" =>
        m === "protein" || m === "carbs" || m === "fats"
    )
  );
  const [helpVisible, setHelpVisible] = useState(false);

  // Sync with initial values when they change
  useEffect(() => {
    if (initialValues && !isAdjusting) {
      setTarget(initialValues);
      setLockedMacros(
        (initialValues.locked_macros || []).filter(
          (m): m is "protein" | "carbs" | "fats" =>
            m === "protein" || m === "carbs" || m === "fats"
        )
      );
    }
  }, [initialValues, isAdjusting]);

  // Make sure percentages always sum to 100
  useEffect(() => {
    const sum =
      target.proteinPercentage + target.carbsPercentage + target.fatsPercentage;
    if (sum !== 100 && !isAdjusting) {
      // Adjust to make sum 100%
      const adjusted = { ...target };
      if (sum > 100) {
        // Reduce the largest percentage to make sum 100
        const largest = Object.entries(target).reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0] as keyof Target;
        adjusted[largest] -= sum - 100;
      } else {
        // Increase the smallest percentage to make sum 100
        const smallest = Object.entries(target).reduce((a, b) =>
          a[1] < b[1] ? a : b
        )[0] as keyof Target;
        adjusted[smallest] += 100 - sum;
      }
      setTarget(adjusted);
      onTargetChange({ ...adjusted, locked_macros: lockedMacros });
    }
  }, [target, isAdjusting, onTargetChange, lockedMacros]);

  // Toggle lock status for a macro
  const toggleLock = (macro: "protein" | "carbs" | "fats") => {
    let newLockedMacros: ("protein" | "carbs" | "fats")[];
    if (lockedMacros.includes(macro)) {
      newLockedMacros = lockedMacros.filter((m) => m !== macro);
    } else {
      // Don't allow locking all three macros
      if (lockedMacros.length < 2) {
        newLockedMacros = [...lockedMacros, macro];
      } else {
        return;
      }
    }
    setLockedMacros(newLockedMacros);
    onTargetChange({ ...target, locked_macros: newLockedMacros });
  };

  const handleChange = (macro: "protein" | "carbs" | "fats", value: number) => {
    setIsAdjusting(macro);
    value = Math.round(Math.max(5, Math.min(70, value)));

    const updatedTarget: Target = { ...target };
    const macroKey =
      macro === "protein"
        ? "proteinPercentage"
        : macro === "carbs"
        ? "carbsPercentage"
        : "fatsPercentage";

    // Store the initial locked macro values to preserve them
    const lockedValues: Record<string, number> = {};
    lockedMacros.forEach((lockedMacro) => {
      const lockedKey =
        lockedMacro === "protein"
          ? "proteinPercentage"
          : lockedMacro === "carbs"
          ? "carbsPercentage"
          : "fatsPercentage";
      lockedValues[lockedKey] = updatedTarget[lockedKey as keyof Target];
    });

    // Don't adjust a macro if it's locked (unless it's the current one being adjusted)
    const isCurrentMacroLocked = lockedMacros.includes(macro);

    if (lockedMacros.length === 0) {
      // Set the clicked macro's value
      updatedTarget[macroKey] = value;

      // Get other macros
      const otherMacros = (["protein", "carbs", "fats"] as const).filter(
        (m) => m !== macro
      );
      const otherKeys = otherMacros.map((m) =>
        m === "protein"
          ? "proteinPercentage"
          : m === "carbs"
          ? "carbsPercentage"
          : "fatsPercentage"
      ) as Array<keyof Target>;

      // Calculate remaining percentage
      const remainingTotal = 100 - value;

      // Get current values of other macros
      const otherValues = otherKeys.map((key) => updatedTarget[key]);
      const otherTotal = otherValues.reduce((sum, val) => sum + val, 0);

      if (otherTotal > 0) {
        // Distribute the remaining percentage proportionally
        const ratio = remainingTotal / otherTotal;

        // Calculate new values while preserving proportions
        let newOtherValues = otherValues.map((val) => Math.round(val * ratio));

        // Ensure minimum 5%
        newOtherValues = newOtherValues.map((val) => Math.max(5, val));

        // Check if we exceeded the remaining total
        const newOtherTotal = newOtherValues.reduce((sum, val) => sum + val, 0);

        if (newOtherTotal !== remainingTotal) {
          // Adjust the values to match the remaining total
          const diff = newOtherTotal - remainingTotal;

          // If the difference is positive, we need to reduce values
          if (diff > 0) {
            // Find the larger value that we can reduce
            if (
              newOtherValues[0] > newOtherValues[1] &&
              newOtherValues[0] - diff >= 5
            ) {
              newOtherValues[0] -= diff;
            } else if (newOtherValues[1] - diff >= 5) {
              newOtherValues[1] -= diff;
            } else {
              // If we can't reduce either value, adjust both as much as possible
              newOtherValues = [5, 5];
              // And adjust the main value to make sum 100%
              updatedTarget[macroKey] = 90; // 100 - (5 + 5)
            }
          } else {
            // If the difference is negative, add to the larger value
            if (newOtherValues[0] >= newOtherValues[1]) {
              newOtherValues[0] += Math.abs(diff);
            } else {
              newOtherValues[1] += Math.abs(diff);
            }
          }
        }

        // Apply the calculated values
        updatedTarget[otherKeys[0]] = newOtherValues[0];
        updatedTarget[otherKeys[1]] = newOtherValues[1];
      } else {
        // If other values are 0, distribute evenly
        updatedTarget[otherKeys[0]] = Math.round(remainingTotal / 2);
        updatedTarget[otherKeys[1]] =
          remainingTotal - updatedTarget[otherKeys[0]];
      }
    } else {
      const unlockedMacros = (["protein", "carbs", "fats"] as const).filter(
        (m) => m !== macro && !lockedMacros.includes(m)
      );

      // Set the value of the macro being adjusted
      updatedTarget[macroKey] = value;

      if (unlockedMacros.length === 1) {
        const unlockedMacroKey =
          unlockedMacros[0] === "protein"
            ? "proteinPercentage"
            : unlockedMacros[0] === "carbs"
            ? "carbsPercentage"
            : "fatsPercentage";

        const lockedSum = Object.keys(lockedValues)
          .filter((key) => key !== macroKey || !isCurrentMacroLocked)
          .reduce((sum, key) => sum + lockedValues[key], 0);

        updatedTarget[unlockedMacroKey as keyof Target] = Math.round(
          Math.max(5, 100 - value - lockedSum)
        );

        if (updatedTarget[unlockedMacroKey as keyof Target] < 5) {
          updatedTarget[unlockedMacroKey as keyof Target] = 5;
          updatedTarget[macroKey] = Math.round(100 - lockedSum - 5);
        } else if (updatedTarget[unlockedMacroKey as keyof Target] > 70) {
          updatedTarget[unlockedMacroKey as keyof Target] = 70;
          updatedTarget[macroKey] = Math.round(100 - lockedSum - 70);
        }
      } else if (unlockedMacros.length === 0) {
        if (!isCurrentMacroLocked) {
          const lockedSum = Object.values(lockedValues).reduce(
            (sum, val) => sum + val,
            0
          );

          if (value + lockedSum !== 100) {
            updatedTarget[macroKey] = Math.round(
              Math.max(5, Math.min(70, 100 - lockedSum))
            );
          }
        } else {
          const otherLockedMacros = lockedMacros.filter((m) => m !== macro);

          if (otherLockedMacros.length > 0) {
            const highestLockedMacro = otherLockedMacros.reduce(
              (highest, current) => {
                const currentKey =
                  current === "protein"
                    ? "proteinPercentage"
                    : current === "carbs"
                    ? "carbsPercentage"
                    : "fatsPercentage";
                const highestKey =
                  highest === "protein"
                    ? "proteinPercentage"
                    : highest === "carbs"
                    ? "carbsPercentage"
                    : "fatsPercentage";

                return updatedTarget[currentKey as keyof Target] >
                  updatedTarget[highestKey as keyof Target]
                  ? current
                  : highest;
              },
              otherLockedMacros[0]
            );

            const highestLockedKey =
              highestLockedMacro === "protein"
                ? "proteinPercentage"
                : highestLockedMacro === "carbs"
                ? "carbsPercentage"
                : "fatsPercentage";

            const otherLockedSum = otherLockedMacros
              .filter((m) => m !== highestLockedMacro)
              .reduce((sum, m) => {
                const key =
                  m === "protein"
                    ? "proteinPercentage"
                    : m === "carbs"
                    ? "carbsPercentage"
                    : "fatsPercentage";
                return sum + updatedTarget[key as keyof Target];
              }, 0);

            const newHighestValue = 100 - value - otherLockedSum;

            if (newHighestValue >= 5 && newHighestValue <= 70) {
              updatedTarget[highestLockedKey as keyof Target] =
                Math.round(newHighestValue);
            } else if (newHighestValue < 5) {
              updatedTarget[highestLockedKey as keyof Target] = 5;
              updatedTarget[macroKey] = Math.round(100 - otherLockedSum - 5);
            } else {
              updatedTarget[highestLockedKey as keyof Target] = 70;
              updatedTarget[macroKey] = Math.round(100 - otherLockedSum - 70);
            }
          }
        }
      } else {
        const unlockedKeys = unlockedMacros.map((m) =>
          m === "protein"
            ? "proteinPercentage"
            : m === "carbs"
            ? "carbsPercentage"
            : "fatsPercentage"
        ) as Array<keyof Target>;

        const lockedSum = Object.keys(lockedValues)
          .filter((key) => key !== macroKey || !isCurrentMacroLocked)
          .reduce((sum, key) => sum + lockedValues[key], 0);

        const remainingForUnlocked = 100 - value - lockedSum;

        const unlockedTotal = unlockedKeys.reduce(
          (sum, key) => sum + updatedTarget[key],
          0
        );

        if (unlockedTotal > 0) {
          unlockedKeys.forEach((key) => {
            const proportion = updatedTarget[key] / unlockedTotal;
            updatedTarget[key] = Math.round(
              Math.max(5, Math.min(70, remainingForUnlocked * proportion))
            );
          });

          const newSum = Object.values(updatedTarget).reduce(
            (sum, val) => sum + val,
            0
          );

          if (newSum !== 100 && unlockedKeys.length > 0) {
            const adjustableKey = unlockedKeys.find(
              (key) => updatedTarget[key] > 5 && updatedTarget[key] < 70
            );

            if (adjustableKey) {
              updatedTarget[adjustableKey] += 100 - newSum;
            }
          }
        } else {
          const perMacro = Math.round(
            remainingForUnlocked / unlockedKeys.length
          );
          unlockedKeys.forEach((key) => {
            updatedTarget[key] = Math.max(5, Math.min(70, perMacro));
          });
        }
      }
    }

    // Restore locked macro values, except for the one being adjusted
    Object.keys(lockedValues).forEach((key) => {
      if (key !== macroKey || !isCurrentMacroLocked) {
        updatedTarget[key as keyof Target] = lockedValues[key];
      }
    });

    // Final check to ensure the total is 100%
    const finalSum =
      updatedTarget.proteinPercentage +
      updatedTarget.carbsPercentage +
      updatedTarget.fatsPercentage;

    if (finalSum !== 100) {
      const adjustableKeys = Object.entries(updatedTarget)
        .filter(([key]) => {
          const macroName =
            key === "proteinPercentage"
              ? "protein"
              : key === "carbsPercentage"
              ? "carbs"
              : "fats";
          return !lockedMacros.includes(macroName) || macroName === macro;
        })
        .filter(([, value]) => value > 5 && value < 70)
        .map(([key]) => key as keyof Target);

      if (adjustableKeys.length > 0) {
        const preferredKey = adjustableKeys.includes(macroKey as keyof Target)
          ? macroKey
          : adjustableKeys[0];
        updatedTarget[preferredKey] += 100 - finalSum;
      }
    }

    setTarget(updatedTarget);
    onTargetChange({
      ...updatedTarget,
      locked_macros: lockedMacros,
    });
    setTimeout(() => setIsAdjusting(null), 100);
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium text-gray-200">Macro Target</h3>
        <div className="flex items-center">
          <button
            onClick={() => setHelpVisible(!helpVisible)}
            className="text-gray-400 hover:text-indigo-300 transition-colors"
            aria-label="Show help"
            title="How to use this tool"
          >
            <InfoIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {helpVisible && (
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
      )}

      <div className="relative h-2 mb-6 rounded-full overflow-hidden bg-gray-700/30">
        <div
          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-green-500 to-green-600"
          style={{ width: `${target.proteinPercentage}%` }}
        ></div>
        <div
          className="absolute top-0 h-2 bg-gradient-to-r from-blue-500 to-blue-600"
          style={{
            width: `${target.carbsPercentage}%`,
            left: `${target.proteinPercentage}%`,
          }}
        ></div>
        <div
          className="absolute top-0 h-2 bg-gradient-to-r from-red-500 to-red-600"
          style={{
            width: `${target.fatsPercentage}%`,
            left: `${target.proteinPercentage + target.carbsPercentage}%`,
          }}
        ></div>
      </div>

      <div className="space-y-6">
        {/* Protein Slider */}
        <MacroSlider
          name="Protein"
          value={target.proteinPercentage}
          onChange={(value) => handleChange("protein", value)}
          color="green"
          isLocked={lockedMacros.includes("protein")}
          onToggleLock={() => toggleLock("protein")}
          disabled={false} // updated: allow simultaneous slider adjustment
        />

        {/* Carbs Slider */}
        <MacroSlider
          name="Carbs"
          value={target.carbsPercentage}
          onChange={(value) => handleChange("carbs", value)}
          color="blue"
          isLocked={lockedMacros.includes("carbs")}
          onToggleLock={() => toggleLock("carbs")}
          disabled={false} // updated
        />

        {/* Fats Slider */}
        <MacroSlider
          name="Fats"
          value={target.fatsPercentage}
          onChange={(value) => handleChange("fats", value)}
          color="red"
          isLocked={lockedMacros.includes("fats")}
          onToggleLock={() => toggleLock("fats")}
          disabled={false} // updated
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-5">
        {/* Protein Badge */}
        <MacroBadge
          name="Protein"
          value={target.proteinPercentage}
          color="green"
          isLocked={lockedMacros.includes("protein")}
        />

        {/* Carbs Badge */}
        <MacroBadge
          name="Carbs"
          value={target.carbsPercentage}
          color="blue"
          isLocked={lockedMacros.includes("carbs")}
        />

        {/* Fats Badge */}
        <MacroBadge
          name="Fats"
          value={target.fatsPercentage}
          color="red"
          isLocked={lockedMacros.includes("fats")}
        />
      </div>
    </div>
  );
}
