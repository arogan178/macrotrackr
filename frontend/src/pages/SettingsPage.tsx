import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MacroDistribution from "../components/MacroDistribution";
import { UserDetails, MacroDistributionSettings } from "../types";
import { getActivityLevelOptions } from "../utils/activityLevels";
import FloatingNotification from "../components/FloatingNotification";
import { TextField, NumberField, SelectField, InfoCard, TabButton, CardContainer } from "../components/FormComponents";
import SaveButton from "../components/SaveButton";

const MINIMUM_AGE = 16;

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserDetails>({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    height: undefined,
    weight: undefined,
    gender: undefined,
    activity_level: undefined,
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
  const [activeTab, setActiveTab] = useState<"profile" | "nutrition">("profile");

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
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
      
      setSettings(data);
      setOriginalSettings(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load settings");
    }
  };

  const hasChanges = () => {
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
  };

  const handleMacroDistributionChange = (distribution: MacroDistributionSettings) => {
    setSettings(prev => ({
      ...prev,
      macro_distribution: distribution
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (activeTab === "profile" && !settings.date_of_birth) {
      setError("Date of birth is required");
      setLoading(false);
      return;
    }

    if (activeTab === "profile" && !isOldEnough(settings.date_of_birth || '')) {
      setError(`You must be at least ${MINIMUM_AGE} years old.`);
      setLoading(false);
      return;
    }

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

  const handleClearMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(67,56,202,0.1),transparent_70%)] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 py-8 relative">
          <FloatingNotification 
            error={error} 
            success={success}
            onClear={handleClearMessages} 
          />

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight">
              Settings
            </h1>
            <div className="flex space-x-2">
              <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          
          {/* Settings Tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            <TabButton 
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </TabButton>
            <TabButton
              active={activeTab === "nutrition"}
              onClick={() => setActiveTab("nutrition")}
            >
              Nutrition Goals
            </TabButton>
          </div>

          <CardContainer>
            <form onSubmit={handleSubmit} className="p-6">
              {activeTab === "profile" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <TextField
                      label="First Name"
                      value={settings.first_name}
                      onChange={(value) => setSettings(prev => ({ ...prev, first_name: value }))}
                      required
                    />

                    <TextField
                      label="Last Name"
                      value={settings.last_name}
                      onChange={(value) => setSettings(prev => ({ ...prev, last_name: value }))}
                      required
                    />

                    <TextField
                      label="Email Address"
                      type="email"
                      value={settings.email}
                      onChange={(value) => setSettings(prev => ({ ...prev, email: value }))}
                      required
                    />

                    <TextField
                      label="Date of Birth"
                      type="date"
                      value={settings.date_of_birth || ''}
                      onChange={(value) => setSettings(prev => ({ ...prev, date_of_birth: value }))}
                    />
                  </div>

                  <div className="space-y-6">
                    <NumberField
                      label="Height (cm)"
                      value={settings.height}
                      onChange={(value) => setSettings(prev => ({ ...prev, height: value }))}
                      min={150}
                      step={1}
                      unit="cm"
                    />

                    <NumberField
                      label="Weight (kg)"
                      value={settings.weight}
                      onChange={(value) => setSettings(prev => ({ ...prev, weight: value }))}
                      min={45}
                      step={0.1}
                      unit="kg"
                    />

                    <SelectField
                      label="Gender"
                      value={settings.gender || ''}
                      onChange={(value) => setSettings(prev => ({ 
                        ...prev, 
                        gender: (value as 'male' | 'female' | '') || undefined 
                      }))}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' }
                      ]}
                      placeholder="Select gender"
                    />

                    <SelectField
                      label="Activity Level"
                      value={settings.activity_level || ''}
                      onChange={(value) => setSettings(prev => ({ 
                        ...prev, 
                        activity_level: value ? Number(value) : undefined 
                      }))}
                      options={getActivityLevelOptions().map((level, index) => ({
                        value: index + 1,
                        label: level.label
                      }))}
                      placeholder="Select activity level"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                  {/* Left side - Main content (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col h-full">
                    <CardContainer className="p-6 h-full">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-200">Macro Distribution Settings</h3>
                        <div className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full">
                          <span className="text-sm text-indigo-300">Daily Targets</span>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm mb-6">
                        Adjust the sliders below to set your preferred macronutrient distribution. 
                        These percentages will be used to calculate your daily macro targets based on your calorie needs.
                      </p>
                      
                      {settings.macro_distribution && (
                        <MacroDistribution 
                          initialValues={settings.macro_distribution}
                          onDistributionChange={handleMacroDistributionChange}
                        />
                      )}
                    </CardContainer>
                  </div>

                  {/* Right side - Info panel (2 cols) */}
                  <div className="lg:col-span-2 flex flex-col h-full">
                    <CardContainer className="p-6 h-full">
                      <h3 className="text-lg font-semibold text-gray-300 mb-4">Understanding Macros</h3>
                      <div className="space-y-4 flex-1">
                        {/* Protein Info */}
                        <InfoCard 
                          title="Protein" 
                          description="Essential for muscle repair and growth."
                          color="green"
                        />

                        {/* Carbs Info */}
                        <InfoCard 
                          title="Carbohydrates" 
                          description="Your body's primary energy source."
                          color="blue"
                        />

                        {/* Fats Info */}
                        <InfoCard 
                          title="Fats" 
                          description="Essential for hormone production and nutrient absorption."
                          color="red"
                        />

                        {/* Daily Target Info */}
                        <InfoCard
                          title="Tips"
                          color="indigo"
                          icon={
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          }
                        >
                          <ul className="text-sm text-gray-400 space-y-2 mt-2">
                            <li>• For muscle growth keep protein between 20-35% </li>
                            <li>• Carbs work best at 45-65%</li>
                            <li>• Fats should stay between 20-35%</li>
                          </ul>
                        </InfoCard>
                      </div>
                    </CardContainer>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <SaveButton 
                  loading={loading}
                  disabled={!hasChanges()}
                />
              </div>
            </form>
          </CardContainer>
        </div>
      </div>
    </div>
  );
}
