import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { UserDetails } from "../types";
import { getActivityLevelOptions } from "../utils/activityLevels";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserDetails>({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    height: undefined,
    weight: undefined,
    activity_level: undefined,
  });
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
    } catch (err) {
      setError("Failed to load settings");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        first_name: settings.first_name,
        last_name: settings.last_name,
        email: settings.email,
        date_of_birth: settings.date_of_birth || null,
        height: settings.height,
        weight: settings.weight,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-100">User Settings</h1>
        {error && <div className="mb-4 text-red-400 bg-red-900/50 p-3 rounded">{error}</div>}
        {success && <div className="mb-4 text-green-400 bg-green-900/50 p-3 rounded">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-gray-300">First Name</label>
                <input
                  type="text"
                  value={settings.first_name}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-300">Last Name</label>
                <input
                  type="text"
                  value={settings.last_name}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-300">Date of Birth</label>
                <input
                  type="date"
                  value={settings.date_of_birth || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      date_of_birth: e.target.value,
                    }))
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-300">Height (cm)</label>
                <input
                  type="number"
                  value={settings.height || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      height: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-300">Weight (kg)</label>
                <input
                  type="number"
                  value={settings.weight || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      weight: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-300">Activity Level</label>
                <select
                  value={settings.activity_level || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      activity_level: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
