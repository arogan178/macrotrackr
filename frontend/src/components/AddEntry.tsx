import { useState } from "react";
import { MacroInputs } from "../types";
import CalorieSearch from "./CalorieSearch";

interface AddEntryProps {
  onSubmit: (inputs: { protein: number; carbs: number; fats: number }) => Promise<void>;
  isSaving: boolean;
}

export default function AddEntry({ onSubmit, isSaving }: AddEntryProps) {
  const [inputs, setInputs] = useState<MacroInputs>({
    protein: "",
    carbs: "",
    fats: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      protein: Number(inputs.protein),
      carbs: Number(inputs.carbs),
      fats: Number(inputs.fats),
    });
    setInputs({ protein: "", carbs: "", fats: "" });
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden h-full">
      <div className="p-6 flex flex-col h-full">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Add Entry</h2>
        {/* Remove the focus ring from the container div and adjust margins */}
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
          <div className="grid grid-cols-4 gap-6">
            {/* Protein Input */}
            <div className="space-y-2 group">
              <label className="block text-sm font-medium text-gray-300 group-focus-within:text-indigo-400 transition-colors">
                Protein (g)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-700/70 border-2 border-gray-600/50 rounded-xl text-gray-100 
                           focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
                           transition-all duration-200 shadow-sm group-hover:border-gray-500/50"
                  value={inputs.protein}
                  onChange={(e) => setInputs(v => ({ ...v, protein: e.target.value }))}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Carbs Input */}
            <div className="space-y-2 group">
              <label className="block text-sm font-medium text-gray-300 group-focus-within:text-indigo-400 transition-colors">
                Carbs (g)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-700/70 border-2 border-gray-600/50 rounded-xl text-gray-100 
                           focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
                           transition-all duration-200 shadow-sm group-hover:border-gray-500/50"
                  value={inputs.carbs}
                  onChange={(e) => setInputs(v => ({ ...v, carbs: e.target.value }))}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Fats Input */}
            <div className="space-y-2 group">
              <label className="block text-sm font-medium text-gray-300 group-focus-within:text-indigo-400 transition-colors">
                Fats (g)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-700/70 border-2 border-gray-600/50 rounded-xl text-gray-100 
                           focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
                           transition-all duration-200 shadow-sm group-hover:border-gray-500/50"
                  value={inputs.fats}
                  onChange={(e) => setInputs(v => ({ ...v, fats: e.target.value }))}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-transparent select-none">&nbsp;</label>
              <button
                type="submit"
                disabled={isSaving || (!Number(inputs.protein) && !Number(inputs.carbs) && !Number(inputs.fats))}
                className="w-full px-4 py-3 rounded-xl font-medium text-white 
                         bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]
                         shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2
                         focus:ring-2 focus:ring-indigo-500/50 focus:outline-none relative
                         before:absolute before:inset-0 before:bg-black/10 before:rounded-xl"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Add Entry</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}