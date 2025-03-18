import { useState, useCallback, memo } from "react";
import { NumberField, CardContainer } from "./FormComponents";
import CalorieSearch from "./CalorieSearch";

interface AddEntryProps {
  onSubmit: (entry: { protein: number; carbs: number; fats: number }) => Promise<void>;
  isSaving: boolean;
}

function AddEntry({ onSubmit, isSaving }: AddEntryProps) {
  const [protein, setProtein] = useState<number | undefined>(undefined);
  const [carbs, setCarbs] = useState<number | undefined>(undefined);
  const [fats, setFats] = useState<number | undefined>(undefined);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  
  // Calculate calories dynamically and round to whole numbers
  const calories = Math.round((protein || 0) * 4 + (carbs || 0) * 4 + (fats || 0) * 9);
  
  // Check if all fields are 0 (invalid submission)
  const allFieldsAreZero = protein === 0 && carbs === 0 && fats === 0;
  
  // Check if any field is undefined (incomplete form)
  const anyFieldIsUndefined = protein === undefined || carbs === undefined || fats === undefined;
  
  // Form is valid if no field is undefined and not all fields are 0
  const isFormValid = !anyFieldIsUndefined && !allFieldsAreZero;
  
  // Handle result from CalorieSearch
  const handleSearchResult = useCallback(({ protein: p, carbs: c, fats: f }) => {
    setProtein(parseFloat(p));
    setCarbs(parseFloat(c));
    setFats(parseFloat(f));
    // setSearchResult(`Found: ${p}g protein, ${c}g carbs, ${f}g fat`);
  }, []);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: check for undefined values or all zeros
    if (anyFieldIsUndefined || allFieldsAreZero) {
      return; // Invalid submission
    }
    
    // At this point we know all fields have valid numbers (including potentially some zeros)
    await onSubmit({ 
      protein: protein as number, 
      carbs: carbs as number, 
      fats: fats as number 
    });
    
    // Reset form after submission
    setProtein(undefined);
    setCarbs(undefined);
    setFats(undefined);
    // setSearchResult(null);
  }, [protein, carbs, fats, onSubmit, anyFieldIsUndefined, allFieldsAreZero]);
  
  return (
    <CardContainer>
      <div className="p-5">
        <h2 className="text-lg font-medium text-gray-200 mb-4">Add Today's Macros</h2>
        
        {/* Food Search Feature */}
        <div className="mb-6">
          <CalorieSearch onResult={handleSearchResult} />
          
          {searchResult && (
            <div className="mt-3 text-sm text-green-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {searchResult}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
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
              Total Calories: <span className="text-indigo-400 font-medium">{calories}</span>
            </div>
            
            {allFieldsAreZero && (
              <div className="text-sm text-red-400 mr-4">
                At least one macro value must be greater than 0
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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