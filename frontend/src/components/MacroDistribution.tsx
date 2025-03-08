import { useState, useEffect } from "react";

interface MacroDistributionProps {
  initialValues?: {
    proteinPercentage: number;
    carbsPercentage: number;
    fatsPercentage: number;
  };
  onDistributionChange: (distribution: {
    proteinPercentage: number;
    carbsPercentage: number;
    fatsPercentage: number;
  }) => void;
}

export default function MacroDistribution({
  initialValues = { proteinPercentage: 30, carbsPercentage: 40, fatsPercentage: 30 },
  onDistributionChange,
}: MacroDistributionProps) {
  const [distribution, setDistribution] = useState(initialValues);
  const [isAdjusting, setIsAdjusting] = useState<"protein" | "carbs" | "fats" | null>(null);

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
      onDistributionChange(adjusted);
    }
  }, [distribution, isAdjusting, onDistributionChange]);

  const handleChange = (macro: "protein" | "carbs" | "fats", value: number) => {
    setIsAdjusting(macro);
    
    // Ensure value is between 5 and 70
    value = Math.max(5, Math.min(70, value));
    
    // Calculate remaining percentage
    const remaining = 100 - value;
    
    const updatedDistribution = { ...distribution };
    
    if (macro === "protein") {
      updatedDistribution.proteinPercentage = value;
      
      // Adjust other macros proportionally
      const othersSum = distribution.carbsPercentage + distribution.fatsPercentage;
      if (othersSum > 0) {
        updatedDistribution.carbsPercentage = Math.round((distribution.carbsPercentage / othersSum) * remaining);
        updatedDistribution.fatsPercentage = 100 - value - updatedDistribution.carbsPercentage;
      } else {
        // Default equal split if others are 0
        updatedDistribution.carbsPercentage = Math.round(remaining / 2);
        updatedDistribution.fatsPercentage = remaining - updatedDistribution.carbsPercentage;
      }
    } else if (macro === "carbs") {
      updatedDistribution.carbsPercentage = value;
      
      // Adjust other macros proportionally
      const othersSum = distribution.proteinPercentage + distribution.fatsPercentage;
      if (othersSum > 0) {
        updatedDistribution.proteinPercentage = Math.round((distribution.proteinPercentage / othersSum) * remaining);
        updatedDistribution.fatsPercentage = 100 - value - updatedDistribution.proteinPercentage;
      } else {
        // Default equal split if others are 0
        updatedDistribution.proteinPercentage = Math.round(remaining / 2);
        updatedDistribution.fatsPercentage = remaining - updatedDistribution.proteinPercentage;
      }
    } else {
      updatedDistribution.fatsPercentage = value;
      
      // Adjust other macros proportionally
      const othersSum = distribution.proteinPercentage + distribution.carbsPercentage;
      if (othersSum > 0) {
        updatedDistribution.proteinPercentage = Math.round((distribution.proteinPercentage / othersSum) * remaining);
        updatedDistribution.carbsPercentage = 100 - value - updatedDistribution.proteinPercentage;
      } else {
        // Default equal split if others are 0
        updatedDistribution.proteinPercentage = Math.round(remaining / 2);
        updatedDistribution.carbsPercentage = remaining - updatedDistribution.proteinPercentage;
      }
    }
    
    // Ensure minimum 5% for each macro
    if (updatedDistribution.proteinPercentage < 5) {
      updatedDistribution.proteinPercentage = 5;
      updatedDistribution.carbsPercentage = Math.min(95 - updatedDistribution.fatsPercentage, updatedDistribution.carbsPercentage);
      updatedDistribution.fatsPercentage = 100 - updatedDistribution.proteinPercentage - updatedDistribution.carbsPercentage;
    }
    if (updatedDistribution.carbsPercentage < 5) {
      updatedDistribution.carbsPercentage = 5;
      updatedDistribution.proteinPercentage = Math.min(95 - updatedDistribution.fatsPercentage, updatedDistribution.proteinPercentage);
      updatedDistribution.fatsPercentage = 100 - updatedDistribution.proteinPercentage - updatedDistribution.carbsPercentage;
    }
    if (updatedDistribution.fatsPercentage < 5) {
      updatedDistribution.fatsPercentage = 5;
      updatedDistribution.proteinPercentage = Math.min(95 - updatedDistribution.carbsPercentage, updatedDistribution.proteinPercentage);
      updatedDistribution.carbsPercentage = 100 - updatedDistribution.proteinPercentage - updatedDistribution.fatsPercentage;
    }
    
    setDistribution(updatedDistribution);
    onDistributionChange(updatedDistribution);
    
    // Reset adjusting state after a short delay
    setTimeout(() => setIsAdjusting(null), 100);
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-medium text-gray-200 pt-2.5">Macro Distribution</h3>
      </div>
      
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
            <span className="text-sm text-gray-400">{distribution.proteinPercentage}%</span>
          </div>
          <div className="relative">
            <input 
              type="range" 
              min="5" 
              max="70" 
              value={distribution.proteinPercentage}
              onChange={(e) => handleChange("protein", parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-green-500/50
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>5%</span>
            <span>70%</span>
          </div>
        </div>
        
        {/* Carbs */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-300">Carbs</span>
            </div>
            <span className="text-sm text-gray-400">{distribution.carbsPercentage}%</span>
          </div>
          <div className="relative">
            <input 
              type="range" 
              min="5" 
              max="70" 
              value={distribution.carbsPercentage}
              onChange={(e) => handleChange("carbs", parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>5%</span>
            <span>70%</span>
          </div>
        </div>
        
        {/* Fats */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-300">Fats</span>
            </div>
            <span className="text-sm text-gray-400">{distribution.fatsPercentage}%</span>
          </div>
          <div className="relative">
            <input 
              type="range" 
              min="5" 
              max="70" 
              value={distribution.fatsPercentage}
              onChange={(e) => handleChange("fats", parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-red-500/50
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>5%</span>
            <span>70%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-5">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-green-500/20">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-400">Protein</span>
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-200">{distribution.proteinPercentage}%</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-blue-500/20">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-400">Carbs</span>
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-200">{distribution.carbsPercentage}%</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-red-500/20">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-400">Fats</span>
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-200">{distribution.fatsPercentage}%</div>
        </div>
      </div>
    </div>
  );
}