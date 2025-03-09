import { useState, useEffect } from "react";

interface MacroDistributionProps {
  initialValues?: {
    proteinPercentage: number;
    carbsPercentage: number;
    fatsPercentage: number;
    locked_macros?: string[];
  };
  onDistributionChange: (distribution: {
    proteinPercentage: number;
    carbsPercentage: number;
    fatsPercentage: number;
    locked_macros?: ("protein" | "carbs" | "fats")[];
  }) => void;
}

export default function MacroDistribution({
  initialValues = { proteinPercentage: 30, carbsPercentage: 40, fatsPercentage: 30, locked_macros: [] },
  onDistributionChange,
}: MacroDistributionProps) {
  const [distribution, setDistribution] = useState(initialValues);
  const [isAdjusting, setIsAdjusting] = useState<"protein" | "carbs" | "fats" | null>(null);
  const [lockedMacros, setLockedMacros] = useState<("protein" | "carbs" | "fats")[]>(
    (initialValues.locked_macros || []).filter((m): m is "protein" | "carbs" | "fats" => 
      m === "protein" || m === "carbs" || m === "fats"
    )
  );
  const [helpVisible, setHelpVisible] = useState(false);

  // Sync with initial values when they change
  useEffect(() => {
    if (initialValues && !isAdjusting) {
      setDistribution(initialValues);
      setLockedMacros(
        (initialValues.locked_macros || []).filter((m): m is "protein" | "carbs" | "fats" => 
          m === "protein" || m === "carbs" || m === "fats"
        )
      );
    }
  }, [initialValues, isAdjusting]);

  // Make sure percentages always sum to 100
  useEffect(() => {
    const sum = distribution.proteinPercentage + distribution.carbsPercentage + distribution.fatsPercentage;
    if (sum !== 100 && !isAdjusting) {
      // Adjust to make sum 100%
      const adjusted = { ...distribution };
      if (sum > 100) {
        // Reduce the largest percentage to make sum 100
        const largest = Object.entries(distribution).reduce((a, b) => 
          a[1] > b[1] ? a : b
        )[0] as "proteinPercentage" | "carbsPercentage" | "fatsPercentage";
        adjusted[largest] -= sum - 100;
      } else {
        // Increase the smallest percentage to make sum 100
        const smallest = Object.entries(distribution).reduce((a, b) => 
          a[1] < b[1] ? a : b
        )[0] as "proteinPercentage" | "carbsPercentage" | "fatsPercentage";
        adjusted[smallest] += 100 - sum;
      }
      setDistribution(adjusted);
      onDistributionChange({ ...adjusted, locked_macros: lockedMacros });
    }
  }, [distribution, isAdjusting, onDistributionChange, lockedMacros]);

  // Toggle lock status for a macro
  const toggleLock = (macro: "protein" | "carbs" | "fats") => {
    let newLockedMacros: ("protein" | "carbs" | "fats")[];
    if (lockedMacros.includes(macro)) {
      newLockedMacros = lockedMacros.filter(m => m !== macro);
    } else {
      // Don't allow locking all three macros
      if (lockedMacros.length < 2) {
        newLockedMacros = [...lockedMacros, macro];
      } else {
        return;
      }
    }
    setLockedMacros(newLockedMacros);
    onDistributionChange({ ...distribution, locked_macros: newLockedMacros });
  };

  const handleChange = (macro: "protein" | "carbs" | "fats", value: number) => {
    setIsAdjusting(macro);
    
    // Ensure value is between 5 and 70, and also ensure it doesn't exceed 90 (which would force others below 5%)
    value = Math.max(5, Math.min(70, value));
    // If this value would force the sum of the other two macros below 10% (2 × 5%), cap it at 90%
    value = Math.min(value, 90);
    
    const updatedDistribution = { ...distribution };
    const macroKey = macro === "protein" ? "proteinPercentage" : 
                     macro === "carbs" ? "carbsPercentage" : "fatsPercentage";
    
    // If all macros are unlocked, use simple scaling
    if (lockedMacros.length === 0) {
      const oldValue = updatedDistribution[macroKey];
      const change = value - oldValue;
      
      // Get other macros
      const otherMacros = (["protein", "carbs", "fats"] as const).filter(m => m !== macro);
      const otherKeys = otherMacros.map(m => 
        m === "protein" ? "proteinPercentage" :
        m === "carbs" ? "carbsPercentage" : "fatsPercentage"
      );
      
      // Set the clicked macro's value
      updatedDistribution[macroKey] = value;
      
      // Scale other values down proportionally
      const otherTotal = updatedDistribution[otherKeys[0]] + updatedDistribution[otherKeys[1]];
      const remainingTotal = 100 - value;
      
      if (otherTotal > 0) {
        const ratio = remainingTotal / otherTotal;
        otherKeys.forEach(key => {
          updatedDistribution[key] = Math.max(5, Math.round(updatedDistribution[key] * ratio));
        });
        
        // After ensuring minimums, adjust the current macro if needed
        const newOtherTotal = updatedDistribution[otherKeys[0]] + updatedDistribution[otherKeys[1]];
        if (newOtherTotal + value !== 100) {
          updatedDistribution[macroKey] = 100 - newOtherTotal;
        }
      } else {
        // If other values are 0, distribute evenly
        otherKeys.forEach(key => {
          updatedDistribution[key] = Math.round(remainingTotal / 2);
        });
      }
      
      // Final check to ensure minimums and maximum
      Object.keys(updatedDistribution).forEach(key => {
        const typedKey = key as keyof typeof updatedDistribution;
        updatedDistribution[typedKey] = Math.max(5, Math.min(70, updatedDistribution[typedKey]));
      });
      
      // If after enforcing limits we're not at 100%, adjust proportionally
      const sum = updatedDistribution.proteinPercentage + 
                 updatedDistribution.carbsPercentage + 
                 updatedDistribution.fatsPercentage;
      
      if (sum !== 100) {
        const diff = 100 - sum;
        // Distribute the difference proportionally among all macros
        const total = Object.values(updatedDistribution).reduce((a, b) => a + b, 0);
        Object.keys(updatedDistribution).forEach(key => {
          const typedKey = key as keyof typeof updatedDistribution;
          const currentValue = updatedDistribution[typedKey];
          const proportion = currentValue / total;
          updatedDistribution[typedKey] = Math.max(5, Math.min(70, 
            Math.round(currentValue + (diff * proportion))
          ));
        });
      }
    } else {
      // Use existing logic for locked macros with additional maximum constraint
      // Get the unlocked macros (excluding the one being adjusted)
      const unlockedMacros = (["protein", "carbs", "fats"] as const)
        .filter(m => m !== macro && !lockedMacros.includes(m));
      
      // Get locked macros excluding the one being adjusted (if it's locked)
      const lockedMacrosExcludingCurrent = lockedMacros.filter(m => m !== macro);
      
      if (unlockedMacros.length === 0) {
        // If we're adjusting the only unlocked macro, or if we're adjusting a locked macro and everything else is locked
        // In this case, adjust the macro with the highest value
        const otherMacros = (["protein", "carbs", "fats"] as const).filter(m => m !== macro);
        const macroToAdjust = distribution[otherMacros[0] === "protein" ? "proteinPercentage" :
                                           otherMacros[0] === "carbs" ? "carbsPercentage" : "fatsPercentage"] >
                              distribution[otherMacros[1] === "protein" ? "proteinPercentage" : 
                                           otherMacros[1] === "carbs" ? "carbsPercentage" : "fatsPercentage"]
                              ? otherMacros[0] : otherMacros[1];
                              
        const otherMacro = otherMacros.find(m => m !== macroToAdjust)!;
        
        const macroToAdjustKey = macroToAdjust === "protein" ? "proteinPercentage" :
                                macroToAdjust === "carbs" ? "carbsPercentage" : "fatsPercentage";
        
        const otherMacroKey = otherMacro === "protein" ? "proteinPercentage" :
                             otherMacro === "carbs" ? "carbsPercentage" : "fatsPercentage";
        
        // Calculate the remaining percentage after the current macro
        const remaining = 100 - value;
        
        // Calculate the new values ensuring the minimum 5% constraint
        const currentAdjustTotal = updatedDistribution[macroToAdjustKey] + updatedDistribution[otherMacroKey];
        if (remaining < currentAdjustTotal) {
          // Need to reduce values
          const excess = currentAdjustTotal - remaining;
          
          if (updatedDistribution[macroToAdjustKey] - excess >= 5) {
            // Can reduce from the macroToAdjust alone
            updatedDistribution[macroToAdjustKey] -= excess;
          } else {
            // Need to adjust both
            updatedDistribution[macroToAdjustKey] = 5;
            updatedDistribution[otherMacroKey] = remaining - 5;
          }
        } else {
          // Need to increase values
          const deficit = remaining - currentAdjustTotal;
          updatedDistribution[macroToAdjustKey] += deficit;
        }
      } else if (unlockedMacros.length === 1) {
        // If only one other macro is unlocked, it gets all the remaining percentage
        const unlockedMacroKey = unlockedMacros[0] === "protein" ? "proteinPercentage" :
                                unlockedMacros[0] === "carbs" ? "carbsPercentage" : "fatsPercentage";
        
        // Calculate the sum of all locked macros (excluding the one being adjusted)
        const lockedSum = lockedMacrosExcludingCurrent.reduce((sum, m) => {
          const key = m === "protein" ? "proteinPercentage" :
                      m === "carbs" ? "carbsPercentage" : "fatsPercentage";
          return sum + updatedDistribution[key];
        }, 0);
        
        updatedDistribution[unlockedMacroKey] = Math.max(5, 100 - value - lockedSum);
        
        // If we're under 100%, adjust the current macro to make up the difference
        const newSum = updatedDistribution.proteinPercentage + 
                      updatedDistribution.carbsPercentage + 
                      updatedDistribution.fatsPercentage;
                      
        if (newSum < 100) {
          updatedDistribution[macroKey] += (100 - newSum);
        }
      } else {
        // Two macros are unlocked (the current one and one other)
        // Distribute the remaining percentage proportionally between the unlocked macros
        const otherUnlockedMacro = unlockedMacros.find(m => m !== macro)!;
        const otherUnlockedKey = otherUnlockedMacro === "protein" ? "proteinPercentage" :
                                otherUnlockedMacro === "carbs" ? "carbsPercentage" : "fatsPercentage";
        
        // Calculate the sum of all locked macros
        const lockedSum = lockedMacrosExcludingCurrent.reduce((sum, m) => {
          const key = m === "protein" ? "proteinPercentage" :
                      m === "carbs" ? "carbsPercentage" : "fatsPercentage";
          return sum + distribution[key];
        }, 0);
        
        // The other unlocked macro gets what's left after accounting for locked macros and the current macro
        updatedDistribution[otherUnlockedKey] = Math.max(5, 100 - lockedSum - value);
      }
      
      // Final check to ensure we're at exactly 100%
      const newSum = updatedDistribution.proteinPercentage + 
                    updatedDistribution.carbsPercentage + 
                    updatedDistribution.fatsPercentage;
      
      if (newSum !== 100) {
        // Adjust the current macro to make it exactly 100%
        updatedDistribution[macroKey] += (100 - newSum);
      }
      
      // Ensure no macro is below 5%
      if (updatedDistribution.proteinPercentage < 5) updatedDistribution.proteinPercentage = 5;
      if (updatedDistribution.carbsPercentage < 5) updatedDistribution.carbsPercentage = 5;
      if (updatedDistribution.fatsPercentage < 5) updatedDistribution.fatsPercentage = 5;
      
      // If we're still not at 100%, make a final adjustment
      const finalSum = updatedDistribution.proteinPercentage + 
                      updatedDistribution.carbsPercentage + 
                      updatedDistribution.fatsPercentage;
                      
      if (finalSum !== 100) {
        // Find the macro with the highest value that isn't locked (or is the one being adjusted)
        const adjustableMacros = (["protein", "carbs", "fats"] as const)
          .filter(m => !lockedMacros.includes(m) || m === macro);
        const highestMacro = adjustableMacros.reduce((highest, current) => {
          const currentKey = current === "protein" ? "proteinPercentage" :
                            current === "carbs" ? "carbsPercentage" : "fatsPercentage";
          const highestKey = highest === "protein" ? "proteinPercentage" :
                            highest === "carbs" ? "carbsPercentage" : "fatsPercentage";
          
          return updatedDistribution[currentKey] > updatedDistribution[highestKey] ? current : highest;
        }, adjustableMacros[0]);
        
        const highestKey = highestMacro === "protein" ? "proteinPercentage" :
                          highestMacro === "carbs" ? "carbsPercentage" : "fatsPercentage";
        
        updatedDistribution[highestKey] += (100 - finalSum);
      }
    }
    
    setDistribution(updatedDistribution);
    onDistributionChange({ ...updatedDistribution, locked_macros: lockedMacros });
    setTimeout(() => setIsAdjusting(null), 100);
  };

  const isLocked = (macro: "protein" | "carbs" | "fats") => lockedMacros.includes(macro);
  
  const getRecommendation = (macro: "protein" | "carbs" | "fats", value: number): string => {
    if (macro === "protein") {
      if (value < 15) return "Consider increasing for muscle maintenance";
      if (value > 35) return "High protein intake";
      return "Ideal range for most people";
    } else if (macro === "carbs") {
      if (value < 40) return "Low carb approach";
      if (value > 65) return "High carb approach";
      return "Balanced carb intake";
    } else {
      if (value < 20) return "Consider increasing for hormone health";
      if (value > 40) return "Higher fat approach";
      return "Healthy fat intake";
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium text-gray-200">Macro Distribution</h3>
        <div className="flex items-center">
          <button
            onClick={() => setHelpVisible(!helpVisible)}
            className="text-gray-400 hover:text-indigo-300 transition-colors"
            aria-label="Show help"
            title="How to use this tool"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {helpVisible && (
        <div className="bg-gray-800/70 border border-indigo-600/30 rounded-lg p-4 text-sm text-gray-300 mb-4 animate-fadeIn">
          <h4 className="font-medium text-indigo-300 mb-2">Tips for adjusting your macros:</h4>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Drag the sliders to adjust percentages</li>
            <li>Click the lock icon to keep a macro fixed while adjusting others</li>
            <li>Total will always equal 100%</li>
            <li>Each macro requires at least 5%</li>
          </ul>
        </div>
      )}
      
      <div className="relative h-2 mb-6 rounded-full overflow-hidden bg-gray-700/30">
        <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-green-500 to-green-600"
             style={{ width: `${distribution.proteinPercentage}%` }}></div>
        <div className="absolute top-0 h-2 bg-gradient-to-r from-blue-500 to-blue-600"
             style={{ width: `${distribution.carbsPercentage}%`, left: `${distribution.proteinPercentage}%` }}></div>
        <div className="absolute top-0 h-2 bg-gradient-to-r from-red-500 to-red-600"
             style={{ width: `${distribution.fatsPercentage}%`, left: `${distribution.proteinPercentage + distribution.carbsPercentage}%` }}></div>
      </div>
      
      <div className="space-y-6">
        {/* Protein */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-300">Protein</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleLock("protein")} 
                className={`p-1.5 rounded-full ${isLocked("protein") 
                  ? 'text-green-400 bg-green-900/30' 
                  : 'text-gray-500 hover:text-gray-300'}`}
                aria-label={isLocked("protein") ? "Unlock protein" : "Lock protein"}
                title={isLocked("protein") ? "Unlock protein" : "Lock protein"}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isLocked("protein") ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  )}
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-200">{distribution.proteinPercentage}%</span>
            </div>
          </div>
          <div className="relative">
            <input 
              type="range" 
              min="5" 
              max="70" 
              step="1"
              value={distribution.proteinPercentage}
              onChange={(e) => handleChange("protein", parseInt(e.target.value))}
              disabled={isLocked("protein") && isAdjusting !== "protein"}
              className={`w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-green-500/50
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 
                       [&::-webkit-slider-thumb]:bg-green-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                       ${isLocked("protein") && isAdjusting !== "protein" ? 'opacity-50' : ''}`}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">5%</span>
            <span className="text-xs text-gray-400 max-w-[180px] text-center">
              {getRecommendation("protein", distribution.proteinPercentage)}
            </span>
            <span className="text-xs text-gray-400">70%</span>
          </div>
        </div>
        
        {/* Carbs */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-300">Carbs</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleLock("carbs")} 
                className={`p-1.5 rounded-full ${isLocked("carbs") 
                  ? 'text-blue-400 bg-blue-900/30' 
                  : 'text-gray-500 hover:text-gray-300'}`}
                aria-label={isLocked("carbs") ? "Unlock carbs" : "Lock carbs"}
                title={isLocked("carbs") ? "Unlock carbs" : "Lock carbs"}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isLocked("carbs") ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  )}
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-200">{distribution.carbsPercentage}%</span>
            </div>
          </div>
          <div className="relative">
            <input 
              type="range" 
              min="5" 
              max="70" 
              step="1"
              value={distribution.carbsPercentage}
              onChange={(e) => handleChange("carbs", parseInt(e.target.value))}
              disabled={isLocked("carbs") && isAdjusting !== "carbs"}
              className={`w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                       ${isLocked("carbs") && isAdjusting !== "carbs" ? 'opacity-50' : ''}`}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">5%</span>
            <span className="text-xs text-gray-400 max-w-[180px] text-center">
              {getRecommendation("carbs", distribution.carbsPercentage)}
            </span>
            <span className="text-xs text-gray-400">70%</span>
          </div>
        </div>
        
        {/* Fats */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-300">Fats</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleLock("fats")} 
                className={`p-1.5 rounded-full ${isLocked("fats") 
                  ? 'text-red-400 bg-red-900/30' 
                  : 'text-gray-500 hover:text-gray-300'}`}
                aria-label={isLocked("fats") ? "Unlock fats" : "Lock fats"}
                title={isLocked("fats") ? "Unlock fats" : "Lock fats"}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isLocked("fats") ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  )}
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-200">{distribution.fatsPercentage}%</span>
            </div>
          </div>
          <div className="relative">
            <input 
              type="range" 
              min="5" 
              max="70" 
              step="1"
              value={distribution.fatsPercentage}
              onChange={(e) => handleChange("fats", parseInt(e.target.value))}
              disabled={isLocked("fats") && isAdjusting !== "fats"}
              className={`w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-red-500/50
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                       ${isLocked("fats") && isAdjusting !== "fats" ? 'opacity-50' : ''}`}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">5%</span>
            <span className="text-xs text-gray-400 max-w-[180px] text-center">
              {getRecommendation("fats", distribution.fatsPercentage)}
            </span>
            <span className="text-xs text-gray-400">70%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-5">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-green-500/20">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-400">Protein</span>
            {isLocked("protein") && (
              <svg className="w-3 h-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-200">{distribution.proteinPercentage}%</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-blue-500/20">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-400">Carbs</span>
            {isLocked("carbs") && (
              <svg className="w-3 h-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-200">{distribution.carbsPercentage}%</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-red-500/20">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-400">Fats</span>
            {isLocked("fats") && (
              <svg className="w-3 h-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-200">{distribution.fatsPercentage}%</div>
        </div>
      </div>
    </div>
  );
}