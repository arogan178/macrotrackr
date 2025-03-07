import { useState } from "react";
import { MacroEntry } from "../types";

interface EditModalProps {
  entry: MacroEntry;
  onClose: () => void;
  onSave: (updated: MacroEntry) => void;
  isSaving: boolean;
}

export default function EditModal({
  entry,
  onClose,
  onSave,
  isSaving,
}: EditModalProps) {
  const [values, setValues] = useState({
    protein: entry.protein.toString(),
    carbs: entry.carbs.toString(),
    fats: entry.fats.toString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (
      [values.protein, values.carbs, values.fats].some((v) => Number(v) < 0)
    ) {
      alert("Values cannot be negative");
      return;
    }

    onSave({
      ...entry,
      protein: Number(values.protein),
      carbs: Number(values.carbs),
      fats: Number(values.fats),
    });
  };

  const date = new Date(entry.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 backdrop-blur-md z-50">
      <div 
        className="w-full max-w-md bg-gradient-to-b from-gray-800/95 to-gray-900/95 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-700/50 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
            Edit Entry
          </h2>
          <div className="px-2 py-1 text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-full">
            {date}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Protein (g)</label>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <input
                type="number"
                className="w-full px-4 py-3 bg-gray-700/70 border border-gray-600/70 rounded-lg text-gray-100 
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                         transition-all duration-200 shadow-sm"
                value={values.protein}
                onChange={(e) =>
                  setValues((v) => ({ ...v, protein: e.target.value }))
                }
                min="0"
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Carbs (g)</label>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <input
                type="number"
                className="w-full px-4 py-3 bg-gray-700/70 border border-gray-600/70 rounded-lg text-gray-100 
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                         transition-all duration-200 shadow-sm"
                value={values.carbs}
                onChange={(e) =>
                  setValues((v) => ({ ...v, carbs: e.target.value }))
                }
                min="0"
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Fats (g)</label>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <input
                type="number"
                className="w-full px-4 py-3 bg-gray-700/70 border border-gray-600/70 rounded-lg text-gray-100 
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                         transition-all duration-200 shadow-sm"
                value={values.fats}
                onChange={(e) =>
                  setValues((v) => ({ ...v, fats: e.target.value }))
                }
                min="0"
                placeholder="0"
              />
            </div>

            <div className="pt-4 mt-2 border-t border-gray-700/30 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600/50 rounded-lg hover:bg-gray-700/50 text-gray-300 transition-all hover:shadow-inner"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg font-medium text-white 
                       bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                       disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                       shadow-lg shadow-indigo-500/30"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
