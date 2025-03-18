import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import FloatingNotification from "../components/FloatingNotification";
import { TabButton, CardContainer } from "../components/FormComponents";
import SaveButton from "../components/SaveButton";
import ConfirmationModal from "../components/ConfirmationModal";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import ProfileForm from "../components/settings/ProfileForm";
import NutritionGoalsForm from "../components/settings/NutritionGoalsForm";
import { useAppState } from "../store/app-state";

export default function SettingsPage() {
  const { 
    settings, 
    isLoading, 
    error,
    successMessage,
    formErrors,
    hasSettingsChanges,
    isSaving,
    validateSettingsForm,
    updateSetting,
    saveSettings,
    clearMessages,
    resetSettings,
    fetchSettings
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"profile" | "nutrition">("profile");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<"profile" | "nutrition" | null>(null);
  
  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]); // Added fetchSettings to dependency array
  
  // Warn user before leaving page with unsaved changes
  useBeforeUnload(hasSettingsChanges, "You have unsaved changes. Are you sure you want to leave?");

  const handleTabChange = useCallback((tab: "profile" | "nutrition") => {
    if (hasSettingsChanges) {
      setPendingTabChange(tab);
      setShowConfirmModal(true);
    } else {
      setActiveTab(tab);
    }
  }, [hasSettingsChanges]);

  const confirmTabChange = useCallback(() => {
    if (pendingTabChange) {
      // Reset settings to original values when discarding changes
      resetSettings();
      setActiveTab(pendingTabChange);
      setPendingTabChange(null);
    }
    setShowConfirmModal(false);
  }, [pendingTabChange, resetSettings]);

  const cancelTabChange = useCallback(() => {
    setPendingTabChange(null);
    setShowConfirmModal(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSettingsForm()) return;
    await saveSettings();
  }, [validateSettingsForm, saveSettings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(67,56,202,0.1),transparent_70%)] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 py-8 relative">
          {successMessage && (
            <FloatingNotification 
              message={successMessage} 
              type="success" 
              onClose={clearMessages} 
              duration={3000} 
            />
          )}
          
          {error && (
            <FloatingNotification 
              message={error} 
              type="error" 
              onClose={clearMessages} 
              duration={3000} 
            />
          )}
          
          <ConfirmationModal 
            isOpen={showConfirmModal}
            title="Unsaved Changes"
            message="You have unsaved changes that will be lost. Do you want to continue?"
            confirmLabel="Discard Changes"
            cancelLabel="Keep Editing"
            onConfirm={confirmTabChange}
            onCancel={cancelTabChange}
          />

          <PageHeader hasChanges={hasSettingsChanges} />
          
          <div className="flex border-b border-gray-700 mb-6">
            <TabButton 
              active={activeTab === "profile"}
              onClick={() => handleTabChange("profile")}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </TabButton>
            <TabButton
              active={activeTab === "nutrition"}
              onClick={() => handleTabChange("nutrition")}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
              Nutrition Goals
            </TabButton>
          </div>

          {/* Fix: Check if settings is null or if we're still loading */}
          {isLoading || !settings ? (
            <LoadingSpinner />
          ) : (
            <CardContainer>
              <form onSubmit={handleSubmit} className="p-6">
                {activeTab === "profile" ? (
                  <ProfileForm 
                    settings={settings}
                    updateSetting={updateSetting}
                    formErrors={formErrors}
                  />
                ) : (
                  <NutritionGoalsForm
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                <div className="mt-8 flex justify-end">
                  <SaveButton 
                    loading={isSaving}
                    disabled={!hasSettingsChanges || Object.keys(formErrors).length > 0}
                  />
                </div>
              </form>
            </CardContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// Extracted components
const PageHeader = ({ hasChanges }: { hasChanges: boolean }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
    <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight mb-4 sm:mb-0">
      Settings
    </h1>
    <div className="flex space-x-2">
      {hasChanges && (
        <span className="px-3 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded-full text-yellow-300 text-sm font-medium">
          Unsaved Changes
        </span>
      )}
      <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium">
        {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);
