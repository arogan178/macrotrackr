import { useState } from "react";
import { MacroEntry } from "../types";
import { NumberField } from "./FormComponents";
import { LoadingSpinnerIcon } from "./Icons";

interface EditModalProps {
  entry: MacroEntry;
  onClose: () => void;
  onSave: (updated: MacroEntry) => void;
  isSaving: boolean;
}

function EditModal({ entry, onClose, onSave, isSaving }: EditModalProps) {
  const [protein, setProtein] = useState<number | undefined>(entry.protein);
  const [carbs, setCarbs] = useState<number | undefined>(entry.carbs);
  const [fats, setFats] = useState<number | undefined>(entry.fats);

  const allFieldsAreZero =
    (protein === 0 || protein === undefined) &&
    (carbs === 0 || carbs === undefined) &&
    (fats === 0 || fats === undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs - this should be handled by NumberField now
    if ([protein, carbs, fats].some((v) => v !== undefined && v < 0)) {
      alert("Values cannot be negative");
      return;
    }

    onSave({
      ...entry,
      protein: protein ?? 0,
      carbs: carbs ?? 0,
      fats: fats ?? 0,
    });
  };

  const date = new Date(entry.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
                <label className="text-sm font-medium text-gray-300">
                  Protein (g)
                </label>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <NumberField
                label=""
                value={protein}
                onChange={setProtein}
                min={0}
                unit="g"
                placeholder={0}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Carbs (g)
                </label>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <NumberField
                label=""
                value={carbs}
                onChange={setCarbs}
                min={0}
                unit="g"
                placeholder={0}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Fats (g)
                </label>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <NumberField
                label=""
                value={fats}
                onChange={setFats}
                min={0}
                unit="g"
                placeholder={0}
                step={0.1}
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
                    <LoadingSpinnerIcon className="w-4 h-4 -ml-1 mr-2 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal;
