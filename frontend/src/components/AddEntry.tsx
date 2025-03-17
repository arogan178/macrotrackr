import { useState, useCallback, useEffect } from "react";
import { MacroEntry } from "../types";
import LoadingSpinner from "./LoadingSpinner";
import CalorieSearch from "./CalorieSearch";

interface MacroInputs {
  protein: string;
  carbs: string;
  fats: string;
}

interface AddEntryProps {
  onSubmit: (inputs: { protein: number; carbs: number; fats: number }) => void;
  isSaving: boolean;
}

function MacroInput({
  id,
  label,
  value,
  onChange,
  color,
  caloriesPerGram
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: string;
  caloriesPerGram: number;
}) {
  const calories = Number(value) * caloriesPerGram;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">
          {label} (g)
        </label>
        {Number(value) > 0 && (
          <span className={`text-xs ${color}`}>
            {Math.round(calories)} kcal
          </span>
        )}
      </div>
      <input
        id={id}
        type="number"
        className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/70 focus:outline-none transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        placeholder="0"
      />
    </div>
  );
}

export default function AddEntry({ onSubmit, isSaving }: AddEntryProps) {
  const [inputs, setInputs] = useState<MacroInputs>({
    protein: "",
    carbs: "",
    fats: "",
  });

  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    // Calculate calories whenever inputs change
    const protein = Number(inputs.protein) || 0;
    const carbs = Number(inputs.carbs) || 0;
    const fats = Number(inputs.fats) || 0;
    
    setTotalCalories(protein * 4 + carbs * 4 + fats * 9);
  }, [inputs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const macros = {
      protein: Number(inputs.protein) || 0,
      carbs: Number(inputs.carbs) || 0,
      fats: Number(inputs.fats) || 0,
    };
    
    // Prevent empty submissions
    if (macros.protein === 0 && macros.carbs === 0 && macros.fats === 0) return;
    
    onSubmit(macros);
    
    // Only reset inputs if submission was successful (assuming isSaving becomes false on success)
    if (!isSaving) {
      setInputs({ protein: "", carbs: "", fats: "" });
    }
  };

  const handleInputChange = useCallback((field: keyof MacroInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const hasValues = Boolean(
    Number(inputs.protein) || Number(inputs.carbs) || Number(inputs.fats)
  );

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl h-full flex flex-col transition-all duration-300 hover:border-gray-600/50">
      <h2 className="text-lg font-medium text-gray-200 mb-4">Add Nutrition Entry</h2>
      <div>
          <CalorieSearch onResult={result => 
            setInputs({
              protein: Math.round(Number(result.protein)).toString(),
              carbs: Math.round(Number(result.carbs)).toString(),
              fats: Math.round(Number(result.fats)).toString(),
            })
          } />
        </div>
      <form className="mt-6 flex-1 flex flex-col justify-end pb-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <MacroInput 
            id="protein"
            label="Protein"
            value={inputs.protein}
            onChange={(value) => handleInputChange('protein', value)}
            color="text-green-400"
            caloriesPerGram={4}
          />
          
          <MacroInput 
            id="carbs"
            label="Carbs"
            value={inputs.carbs}
            onChange={(value) => handleInputChange('carbs', value)}
            color="text-blue-400"
            caloriesPerGram={4}
          />
          
          <MacroInput 
            id="fats"
            label="Fats"
            value={inputs.fats}
            onChange={(value) => handleInputChange('fats', value)}
            color="text-red-400"
            caloriesPerGram={9}
          />
        </div>

        {/* Submit Button */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={isSaving || !hasValues}
            className="w-full px-4 py-3 rounded-xl font-medium text-white 
                     bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]
                     shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2
                     focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" color="text-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span>Save Entry</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}