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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-gray-100">Edit Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-gray-300">Protein (g)</label>
              <input
                type="number"
                className="border rounded w-full p-2 bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                value={values.protein}
                onChange={(e) =>
                  setValues((v) => ({ ...v, protein: e.target.value }))
                }
                min="0"
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Carbs (g)</label>
              <input
                type="number"
                className="border rounded w-full p-2 bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                value={values.carbs}
                onChange={(e) =>
                  setValues((v) => ({ ...v, carbs: e.target.value }))
                }
                min="0"
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Fats (g)</label>
              <input
                type="number"
                className="border rounded w-full p-2 bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                value={values.fats}
                onChange={(e) =>
                  setValues((v) => ({ ...v, fats: e.target.value }))
                }
                min="0"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
