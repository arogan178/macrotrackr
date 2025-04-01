import { useState, useCallback, memo } from "react";
import {
  NumberField,
  CardContainer,
  TimeField,
  Dropdown,
  DateField,
  TextField,
} from "@/components/form";
import CalorieSearch from "@/features/macroTracking/components/CalorieSearchForm";
import { CheckMarkIcon, LoadingSpinnerIcon } from "@/components/Icons";
import { MealType, MEAL_TYPE_OPTIONS } from "../types";

// Helper function to capitalize first letter of a string
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

interface AddEntryProps {
  onSubmit: (entry: {
    protein: number;
    carbs: number;
    fats: number;
    meal_Type: MealType;
    meal_Name: string;
    entry_date: string;
    entry_time: string;
  }) => Promise<void>;
  isSaving: boolean;
}

function AddEntry({ onSubmit, isSaving }: AddEntryProps) {
  const [protein, setProtein] = useState<number | undefined>(undefined);
  const [carbs, setCarbs] = useState<number | undefined>(undefined);
  const [fats, setFats] = useState<number | undefined>(undefined);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [meal_type, setMealType] = useState<MealType>("breakfast");
  const [meal_name, setMealName] = useState<string>("");

  // Default date is today
  const [entry_date, setEntryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Default time is current time
  const [entry_time, setEntryTime] = useState<string>(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  // Calculate calories dynamically and round to whole numbers
  const calories = Math.round(
    (protein || 0) * 4 + (carbs || 0) * 4 + (fats || 0) * 9
  );

  // Check if all fields are 0 (invalid submission)
  const allFieldsAreZero = protein === 0 && carbs === 0 && fats === 0;

  // Check if any field is undefined (incomplete form)
  const anyFieldIsUndefined =
    protein === undefined || carbs === undefined || fats === undefined;

  // Form is valid if no field is undefined, not all fields are 0, and meal name is provided
  const isFormValid =
    !anyFieldIsUndefined && !allFieldsAreZero && meal_name.trim() !== "";

  // Handle result from CalorieSearch
  const handleSearchResult = useCallback(
    ({
      protein: p,
      carbs: c,
      fats: f,
      name,
    }: {
      protein: string;
      carbs: string;
      fats: string;
      name: string;
    }) => {
      setProtein(parseFloat(p));
      setCarbs(parseFloat(c));
      setFats(parseFloat(f));
      setMealName(name);
      setSearchResult(`Found: ${name} - ${p}g protein, ${c}g carbs, ${f}g fat`);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (anyFieldIsUndefined || allFieldsAreZero || !meal_name.trim()) {
        return;
      }

      await onSubmit({
        protein: protein as number,
        carbs: carbs as number,
        fats: fats as number,
        meal_type,
        meal_name,
        entry_date,
        entry_time,
      });

      setProtein(undefined);
      setCarbs(undefined);
      setFats(undefined);
      setMealName("");
      setSearchResult(null);
    },
    [
      protein,
      carbs,
      fats,
      meal_type,
      meal_name,
      entry_date,
      entry_time,
      onSubmit,
      anyFieldIsUndefined,
      allFieldsAreZero,
    ]
  );

  return (
    <CardContainer>
      <div className="p-5">
        <h2 className="text-lg font-medium text-gray-200 mb-4">
          Add Today's Macros
        </h2>

        {/* Food Search Feature */}
        <div className="mb-6">
          <CalorieSearch onResult={handleSearchResult} />

          {searchResult && (
            <div className="mt-3 text-sm text-green-400 flex items-center">
              <CheckMarkIcon className="w-4 h-4 mr-1" />
              {searchResult}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Meal name field */}
          <div className="mb-4">
            <TextField
              label="Meal Name"
              value={meal_name}
              onChange={(value) => setMealName(value)}
              placeholder="e.g. Chicken Salad"
              required
            />
          </div>
          {/* Date and meal type row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <DateField
                label="Date"
                value={entry_date}
                onChange={setEntryDate}
                required
              />
            </div>
            <div>
              <TimeField
                label="Time"
                value={entry_time}
                onChange={setEntryTime}
                required
              />
            </div>
            <div>
              <Dropdown
                label="Meal Type"
                // Map over the new options array
                options={MEAL_TYPE_OPTIONS.map((option) => ({
                  value: option.value, // The value associated with the option (e.g., "breakfast")
                  label: option.display, // The text displayed in the dropdown (e.g., "Breakfast 🍳")
                  // If you still need capitalization, apply it to option.display here:
                  // label: capitalizeFirstLetter(option.display)
                }))}
                // The value prop should be bound to your state variable holding the clean meal_type
                value={meal_type} // e.g., "breakfast"
                // The onChange handler receives the clean value directly from the dropdown option's value
                onChange={(value) => setMealType(value as MealType)} // value will be "breakfast", "lunch", etc.
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NumberField
              label="Protein"
              value={protein}
              onChange={setProtein}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />

            <NumberField
              label="Carbs"
              value={carbs}
              onChange={setCarbs}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />

            <NumberField
              label="Fats"
              value={fats}
              onChange={setFats}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
          </div>

          <div className="mt-5 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Total Calories:{" "}
              <span className="text-indigo-400 font-medium">{calories}</span>
            </div>

            {allFieldsAreZero && (
              <div className="text-sm text-red-400 mr-4">
                At least one macro value must be greater than 0
              </div>
            )}

            {!meal_name.trim() && protein !== undefined && (
              <div className="text-sm text-red-400 mr-4">
                Please provide a meal name
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || !isFormValid}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 
                        disabled:text-gray-400 rounded-lg shadow-md transition-colors
                        text-white font-medium flex items-center"
            >
              {isSaving ? (
                <>
                  <LoadingSpinnerIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Saving...
                </>
              ) : (
                <>Add Entry</>
              )}
            </button>
          </div>
        </form>
      </div>
    </CardContainer>
  );
}

export default memo(AddEntry);
