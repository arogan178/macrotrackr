import { useState, useEffect, useCallback, ReactNode } from "react";

import FloatingNotification from "../../notifications/components/FloatingNotification";

import { Navbar } from "@/components/layout";
import { TabButton, FormButton } from "@/components/form";
import { Modal, UserIcon, AwardIcon, LockIcon } from "@/components/ui";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import {
  ProfileForm,
  SettingsLoadingSkeleton,
  BillingForm,
  ChangePasswordForm,
} from "@/features/settings/components";

import { useStore } from "@/store/store";

// --- Modified PageHeader Component ---
// Now accepts tabs as children to render them on the right
const PageHeader = ({
  hasChanges,
  children, // Accept children (the tabs)
}: {
  hasChanges: boolean;
  children: ReactNode; // Define children prop
}) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
    {/* Left Side: Title */}
    <h1 className="text-3xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight mb-2">
      Settings
    </h1>
    {/* Right Side: Badges and Tabs */}
    <div className="flex items-center gap-3">
      {/* Badges */}
      <div className="flex space-x-2">
        {hasChanges && (
          <span className="px-3 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded-full text-yellow-300 text-sm font-medium">
            Unsaved Changes
          </span>
        )}
      </div>
      {/* Render Tabs passed as children */}
      {children}
    </div>
  </div>
);

export default function SettingsPage() {
  const {
    settings,
    isLoading,
    settingsError: error,
    settingsSuccess: successMessage,
    formErrors,
    hasSettingsChanges,
    isSaving,
    validateSettingsForm,
    updateSetting,
    saveSettings,
    clearSettingsMessages: clearMessages,
    resetSettings,
    fetchSettings,
  } = useStore();

  type TabType = "profile" | "billing" | "security";
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<TabType | null>(
    null,
  );

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Warn user before leaving page with unsaved changes
  useBeforeUnload(
    hasSettingsChanges,
    "You have unsaved changes. Are you sure you want to leave?",
  );

  const handleTabChange = useCallback(
    (tab: TabType) => {
      if (hasSettingsChanges) {
        setPendingTabChange(tab);
        setShowConfirmModal(true);
      } else {
        setActiveTab(tab);
      }
    },
    [hasSettingsChanges],
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
      // No need to show a local notification here since the store will handle it
    },
    [validateSettingsForm, saveSettings],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <div className="relative min-h-screen ">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          {/* Only render notification if it comes from the store */}
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
            isOpen={showConfirmModal}
            onClose={cancelTabChange}
            title="Unsaved Changes"
            variant="confirmation"
            message="You have unsaved changes that will be lost. Do you want to continue?"
            confirmLabel="Discard Changes"
            cancelLabel="Keep Editing"
            onConfirm={confirmTabChange}
            isDanger={true}
          />

          {/* Pass Tabs into the updated PageHeader */}
          <PageHeader hasChanges={hasSettingsChanges}>
            {/* Tab Navigation Container - Moved inside header */}
            <div
              className="relative flex space-x-1 p-1 bg-gray-800/60 rounded-lg"
              role="tablist"
              aria-label="Settings Tabs"
            >
              <TabButton
                active={activeTab === "profile"}
                onClick={() => handleTabChange("profile")}
                layoutId="settingsTabHighlight"
                isMotion={true}
              >
                <span className="flex items-center relative z-10">
                  <UserIcon size="sm" className="mr-1.5" />
                  Profile
                </span>
              </TabButton>
              <TabButton
                active={activeTab === "billing"}
                onClick={() => handleTabChange("billing")}
                layoutId="settingsTabHighlight"
                isMotion={true}
              >
                <span className="flex items-center relative z-10">
                  <AwardIcon size="sm" className="mr-1.5" />
                  Billing
                </span>
              </TabButton>
              <TabButton
                active={activeTab === "security"}
                onClick={() => handleTabChange("security")}
                layoutId="settingsTabHighlight"
                isMotion={true}
              >
                <span className="flex items-center relative z-10">
                  <LockIcon size="sm" className="mr-1.5" />
                  Security
                </span>
              </TabButton>
            </div>
          </PageHeader>

          {isLoading || !settings ? (
            <SettingsLoadingSkeleton />
          ) : (
            <>
              {activeTab === "profile" && (
                <form onSubmit={handleSubmit} className="p-6">
                  <ProfileForm
                    settings={settings}
                    updateSetting={updateSetting}
                    formErrors={formErrors}
                  />
                  <div className="mt-8 flex justify-end">
                    <FormButton
                      type="submit"
                      isLoading={isSaving}
                      disabled={
                        !hasSettingsChanges ||
                        Object.keys(formErrors).length > 0
                      }
                      text="Save Changes"
                      buttonSize="lg"
                      variant="primary"
                      className="px-8 py-3 text-lg"
                    />
                  </div>
                </form>
              )}
              {activeTab === "billing" && <BillingForm />}
              {activeTab === "security" && <ChangePasswordForm />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
