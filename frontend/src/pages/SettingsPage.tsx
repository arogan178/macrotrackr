import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { UserDetails } from "../types";
import { getActivityLevelOptions } from "../utils/activityLevels";

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
  });
  const [originalSettings, setOriginalSettings] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setSettings(data);
      setOriginalSettings(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load settings");
    }
  };

  const hasChanges = () => {
    if (!originalSettings) return false;
    return (
      settings.first_name !== originalSettings.first_name ||
      settings.last_name !== originalSettings.last_name ||
      settings.email !== originalSettings.email ||
      settings.date_of_birth !== originalSettings.date_of_birth ||
      settings.height !== originalSettings.height ||
      settings.weight !== originalSettings.weight ||
      settings.gender !== originalSettings.gender ||
      settings.activity_level !== originalSettings.activity_level
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!settings.date_of_birth) {
      setError("Date of birth is required");
      setLoading(false);
      return;
    }

    if (!isOldEnough(settings.date_of_birth)) {
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
        activity_level: settings.activity_level
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

      // Update token if a new one was returned (email/name changes)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(67,56,202,0.1),transparent_70%)] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight">
              Profile Settings
            </h1>
            <div className="flex space-x-2">
              <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-800/50 shadow-lg animate-appear">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 text-green-400 bg-green-900/50 p-4 rounded-lg border border-green-800/50 shadow-lg animate-appear">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {success}
              </div>
            </div>
          )}

          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">First Name</label>
                    <input
                      type="text"
                      value={settings.first_name}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, first_name: e.target.value }))
                      }
                      className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                             transition-all duration-200 shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Last Name</label>
                    <input
                      type="text"
                      value={settings.last_name}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, last_name: e.target.value }))
                      }
                      className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                             transition-all duration-200 shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Email Address</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                             transition-all duration-200 shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
                    <input
                      type="date"
                      value={settings.date_of_birth || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          date_of_birth: e.target.value,
                        }))
                      }
                      className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                             transition-all duration-200 shadow-sm pl-4 pr-4
                             "
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Height (cm)</label>
                    <input
                      type="number"
                      value={settings.height || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setSettings((prev) => ({
                            ...prev,
                            height: value ? Number(value) : undefined,
                          }));
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                             transition-all duration-200 shadow-sm pl-4 pr-4
                             [&::-webkit-inner-spin-button]:appearance-none
                             [&::-webkit-outer-spin-button]:appearance-none
                             [-moz-appearance:textfield]"
                      min="150"
                      step="1"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Weight (kg)</label>
                    <input
                      type="number"
                      value={settings.weight || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setSettings((prev) => ({
                            ...prev,
                            weight: value ? Number(value) : undefined,
                          }));
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                             transition-all duration-200 shadow-sm pl-4 pr-4
                             [&::-webkit-inner-spin-button]:appearance-none
                             [&::-webkit-outer-spin-button]:appearance-none
                             [-moz-appearance:textfield]"
                      min="45"
                      step="0.1"
                      inputMode="numeric"
                      pattern="[0-9]*\.?[0-9]*"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Gender</label>
                    <select
                      value={settings.gender || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          gender: (e.target.value as 'male' | 'female' | '') || undefined,
                        }))
                      }
                      className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                             transition-all duration-200 shadow-sm appearance-none
                             bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                             bg-[length:2rem] bg-[right_0.75rem_center] bg-no-repeat"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Activity Level</label>
                    <select
                      value={settings.activity_level || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          activity_level: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                             transition-all duration-200 shadow-sm appearance-none
                             bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                             bg-[length:2rem] bg-[right_0.75rem_center] bg-no-repeat"
                    >
                      <option value="">Select activity level</option>
                      {getActivityLevelOptions().map((level, index) => (
                        <option key={level.value} value={index + 1}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !hasChanges()}
                  className="px-8 py-3 rounded-lg font-semibold text-white text-lg
                         bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 
                         hover:from-indigo-400 hover:via-blue-400 hover:to-indigo-500
                         disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                         shadow-lg shadow-indigo-500/30 relative overflow-hidden
                         before:absolute before:inset-0 before:bg-gradient-to-r 
                         before:from-transparent before:via-white/10 before:to-transparent
                         before:translate-x-[-200%] hover:before:translate-x-[200%]
                         before:transition-transform before:duration-1000"
                >
                  {loading ? (
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
