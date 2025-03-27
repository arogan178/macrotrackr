import { useState, useEffect, useCallback } from "react";
import { Navbar } from "../features/layout/components";
import FloatingNotification from "../features/notifications/components/FloatingNotification";
import { TabButton, CardContainer } from "../components/form/index";
import SaveButton from "../components/SaveButton";
import Modal from "../components/Modal";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import { ProfileForm, MacroTargetsForm } from "../features/settings/components";
import { useStore } from "../store/store";
import { UserIcon, MenuIcon, LoadingSpinnerIcon } from "../components/Icons";

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
    fetchSettings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"profile" | "nutrition">(
    "profile"
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<
    "profile" | "nutrition" | null
  >(null);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Warn user before leaving page with unsaved changes
  useBeforeUnload(
    hasSettingsChanges,
    "You have unsaved changes. Are you sure you want to leave?"
  );

  const handleTabChange = useCallback(
    (tab: "profile" | "nutrition") => {
      if (hasSettingsChanges) {
        setPendingTabChange(tab);
        setShowConfirmModal(true);
      } else {
        setActiveTab(tab);
      }
    },
    [hasSettingsChanges]
  );

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateSettingsForm()) return;
      await saveSettings();
    },
    [validateSettingsForm, saveSettings]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"></div>

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

          <Modal
            variant="confirmation"
            isOpen={showConfirmModal}
            onClose={cancelTabChange}
            title="Unsaved Changes"
            message="You have unsaved changes that will be lost. Do you want to continue?"
            confirmLabel="Discard Changes"
            cancelLabel="Keep Editing"
            onConfirm={confirmTabChange}
          />

          <PageHeader hasChanges={hasSettingsChanges} />

          <div className="flex border-b border-gray-700 mb-6">
            <TabButton
              active={activeTab === "profile"}
              onClick={() => handleTabChange("profile")}
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </TabButton>
            <TabButton
              active={activeTab === "nutrition"}
              onClick={() => handleTabChange("nutrition")}
            >
              <MenuIcon className="w-4 h-4 mr-2" />
              Macro Targets
            </TabButton>
          </div>

          {isLoading || !settings ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinnerIcon className="h-12 w-12 animate-spin text-indigo-500" />
            </div>
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
                  <MacroTargetsForm
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}

                <div className="mt-8 flex justify-end">
                  <SaveButton
                    loading={isSaving}
                    disabled={
                      !hasSettingsChanges || Object.keys(formErrors).length > 0
                    }
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
        {new Date().toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
    </div>
  </div>
);
