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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Protein (g)</label>
              <input
                type="number"
                className="border rounded w-full p-2"
                value={values.protein}
                onChange={(e) =>
                  setValues((v) => ({ ...v, protein: e.target.value }))
                }
                min="0"
              />
            </div>
            {/* Added Carbs Input */}
            <div>
              <label className="block mb-1">Carbs (g)</label>
              <input
                type="number"
                className="border rounded w-full p-2"
                value={values.carbs}
                onChange={(e) =>
                  setValues((v) => ({ ...v, carbs: e.target.value }))
                }
                min="0"
              />
            </div>
            {/* Added Fats Input */}
            <div>
              <label className="block mb-1">Fats (g)</label>
              <input
                type="number"
                className="border rounded w-full p-2"
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
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
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
