import { useState, useEffect } from "react";
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
  
  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState({
    protein: false,
    carbs: false,
    fats: false,
  });

  // Calculate calories
  const calories = 
    (Number(values.protein) * 4) + 
    (Number(values.carbs) * 4) + 
    (Number(values.fats) * 9);
    
  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const validateField = (name: string, value: string) => {
    const numValue = Number(value);
    return !(numValue < 0 || isNaN(numValue));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Only allow numbers and decimal points
    if (!(/^[0-9]*[.]?[0-9]*$/.test(value) || value === '')) {
      return;
    }
    
    const isValid = validateField(name, value);
    
    setErrors(prev => ({
      ...prev,
      [name]: !isValid
    }));
    
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all inputs
    const newErrors = {
      protein: !validateField('protein', values.protein),
      carbs: !validateField('carbs', values.carbs),
      fats: !validateField('fats', values.fats),
    };
    
    setErrors(newErrors);
    
    // Check if any errors
    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    onSave({
      ...entry,
      protein: Number(values.protein),
      carbs: Number(values.carbs),
      fats: Number(values.fats),
    });
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const renderInputField = (label: string, name: keyof typeof values, color: string) => {
    return (
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-300">{label} (g)</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*[.]?[0-9]*"
            name={name}
            className={`border rounded-lg w-full p-3 pl-3 bg-gray-900 text-gray-100 transition-all
              ${errors[name] 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-700 focus:ring-blue-500 focus:border-blue-500'
              }
            `}
            value={values[name]}
            onChange={handleChange}
            placeholder="0"
          />
          <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${color}`}>
            <span className="text-sm font-medium">g</span>
          </div>
          {errors[name] && (
            <p className="mt-1 text-xs text-red-400">Please enter a valid number</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm z-50"
      onClick={handleClose}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 300ms ease-in-out'
      }}
    >
      <div 
        className={`bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl transform transition-all duration-300 ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-100 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Entry
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 rounded-full p-1 hover:bg-gray-700/50 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Editing entry from {new Date(entry.created_at).toLocaleString()}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {renderInputField("Protein", "protein", "text-red-400")}
            {renderInputField("Carbs", "carbs", "text-yellow-400")}
            {renderInputField("Fats", "fats", "text-blue-400")}
            
            <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Calories:</span>
                <span className="text-xl font-semibold text-gray-100">{calories} kcal</span>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-md flex items-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
