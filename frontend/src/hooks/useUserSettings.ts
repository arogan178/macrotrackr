import { useState, useEffect, useMemo, useCallback } from "react";
import { UserDetails, MacroDistributionSettings } from "../types";

const MINIMUM_AGE = 18;

const isOldEnough = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= MINIMUM_AGE;
};

export default function useUserSettings() {
  const [settings, setSettings] = useState<UserDetails>({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    height: undefined,
    weight: undefined,
    gender: "male", // Default value
    activity_level: 1, // Default value
    macro_distribution: {
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatsPercentage: 30
    }
  });
  const [originalSettings, setOriginalSettings] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Memoize the hasChanges calculation to improve performance
  const hasChanges = useMemo(() => {
    if (!originalSettings) return false;
    
    // Check for basic profile changes
    const profileChanged = 
      settings.first_name !== originalSettings.first_name ||
      settings.last_name !== originalSettings.last_name ||
      settings.email !== originalSettings.email ||
      settings.date_of_birth !== originalSettings.date_of_birth ||
      settings.height !== originalSettings.height ||
      settings.weight !== originalSettings.weight ||
      settings.gender !== originalSettings.gender ||
      settings.activity_level !== originalSettings.activity_level;
      
    // Check for macro distribution changes
    const macroDistributionChanged = 
      !originalSettings.macro_distribution ||
      settings.macro_distribution?.proteinPercentage !== originalSettings.macro_distribution?.proteinPercentage ||
      settings.macro_distribution?.carbsPercentage !== originalSettings.macro_distribution?.carbsPercentage ||
      settings.macro_distribution?.fatsPercentage !== originalSettings.macro_distribution?.fatsPercentage;
      
    return profileChanged || macroDistributionChanged;
  }, [settings, originalSettings]);
  
  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/user/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      
      // If no macro distribution is set, provide default values
      if (!data.macro_distribution) {
        data.macro_distribution = {
          proteinPercentage: 30,
          carbsPercentage: 40,
          fatsPercentage: 30
        };
      }
      
      // Ensure gender and activity_level have values
      if (!data.gender) data.gender = "male";
      if (!data.activity_level) data.activity_level = 1;
      
      setSettings(data);
      setOriginalSettings(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.email && !emailRegex.test(settings.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    // Name validation
    if (settings.first_name && settings.first_name.length < 2) {
      errors.first_name = "First name must be at least 2 characters";
    }
    
    if (settings.last_name && settings.last_name.length < 2) {
      errors.last_name = "Last name must be at least 2 characters";
    }
    
    // Date of birth validation
    if (settings.date_of_birth) {
      if (!isOldEnough(settings.date_of_birth)) {
        errors.date_of_birth = `You must be at least ${MINIMUM_AGE} years old`;
      }
    }
    
    // Height validation
    if (settings.height && (settings.height < 120 || settings.height > 250)) {
      errors.height = "Please enter a valid height (120-250 cm)";
    }
    
    // Weight validation
    if (settings.weight && (settings.weight < 30 || settings.weight > 300)) {
      errors.weight = "Please enter a valid weight (30-300 kg)";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateSetting = <K extends keyof UserDetails>(
    key: K, 
    value: UserDetails[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const updateMacroDistribution = (distribution: MacroDistributionSettings) => {
    setSettings(prev => ({
      ...prev,
      macro_distribution: distribution
    }));
  };

  // Add the resetSettings function that was missing
  const resetSettings = useCallback(() => {
    if (originalSettings) {
      setSettings({ ...originalSettings });
      setFormErrors({});
    }
  }, [originalSettings]);

  const saveSettings = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        first_name: settings.first_name,
        last_name: settings.last_name,
        email: settings.email,
        date_of_birth: settings.date_of_birth,
        height: settings.height,
        weight: settings.weight,
        gender: settings.gender,
        activity_level: settings.activity_level,
        macro_distribution: settings.macro_distribution
      };

      const response = await fetch("http://localhost:3000/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setSuccess("Settings updated successfully!");
      setOriginalSettings(settings);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  return {
    settings,
    originalSettings,
    loading,
    error,
    success,
    formErrors,
    hasChanges,
    validateForm,
    updateSetting,
    updateMacroDistribution,
    saveSettings,
    clearMessages,
    resetSettings // Now properly exporting the resetSettings function
  };
}
