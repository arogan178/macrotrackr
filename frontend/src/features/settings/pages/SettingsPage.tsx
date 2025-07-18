import { ReactNode, useCallback, useEffect, useState } from "react";

import { FormButton, TabButton } from "@/components/form";
import { Navbar } from "@/components/layout";
import { AwardIcon, LockIcon, Modal, UserIcon } from "@/components/ui";
import {
  BillingForm,
  ChangePasswordForm,
  ProfileForm,
  SettingsLoadingSkeleton,
} from "@/features/settings/components";
import { useSaveSettings, useSettings } from "@/hooks/queries/useSettings";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { useStore } from "@/store/store";

import FloatingNotification from "../../notifications/components/FloatingNotification";

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
  // Use TanStack Query for settings data and mutations
  const {
    data: settingsData,
    isLoading: isSettingsLoading,
    error: settingsQueryError,
  } = useSettings();
  const saveSettingsMutation = useSaveSettings();

  const {
    settings,
    formErrors,
    hasSettingsChanges,
    validateSettingsForm,
    updateSetting,
    clearSettingsMessages: clearMessages,
    resetSettings,
    setSubscriptionStatus,
    initializeSettings,
  } = useStore();

  // Get loading state from mutation
  const isSaving = saveSettingsMutation.isPending;

  // Hydrate subscriptionStatus from settings data
  useEffect(() => {
    if (
      settingsData &&
      settingsData.subscription &&
      typeof settingsData.subscription.status === "string"
    ) {
      setSubscriptionStatus(settingsData.subscription.status);
    }
  }, [settingsData, setSubscriptionStatus]);

  type TabType = "profile" | "billing" | "security";
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<
    TabType | undefined
  >();

  // Initialize settings from query data on component mount
  useEffect(() => {
    if (settingsData) {
      // Transform the API response to match the expected settings format
      const transformedSettings = {
        id: settingsData.id,
        email: settingsData.email,
        firstName: settingsData.firstName,
        lastName: settingsData.lastName,
        createdAt: settingsData.createdAt,
        dateOfBirth: settingsData.dateOfBirth,
        height: settingsData.height,
        weight: settingsData.weight,
        gender: settingsData.gender as "male" | "female" | undefined,
        activityLevel: settingsData.activityLevel,
        subscription: settingsData.subscription,
      };

      initializeSettings({
        settings: transformedSettings,
      });
    }
  }, [settingsData, initializeSettings]);

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
      setPendingTabChange(undefined);
    }
    setShowConfirmModal(false);
  }, [pendingTabChange, resetSettings]);

  const cancelTabChange = useCallback(() => {
    setPendingTabChange(undefined);
    setShowConfirmModal(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!validateSettingsForm() || !settings) return;

      // Prepare payload for TanStack Query mutation
      const payload = {
        firstName: settings.firstName,
        lastName: settings.lastName,
        email: settings.email,
        dateOfBirth: settings.dateOfBirth,
        height: settings.height,
        weight: settings.weight,
        gender: settings.gender === "" ? undefined : settings.gender,
        activityLevel: settings.activityLevel,
      };

      try {
        await saveSettingsMutation.mutateAsync(payload);
        // Update the store to reflect successful save
        const updatedSettings = structuredClone(settings);
        initializeSettings({ settings: updatedSettings });
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    },
    [validateSettingsForm, settings, saveSettingsMutation, initializeSettings],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <div className="relative min-h-screen ">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          {/* Error handling is now managed by TanStack Query */}
          {saveSettingsMutation.isError && (
            <FloatingNotification
              message={`Failed to save settings: ${saveSettingsMutation.error?.message || "Unknown error"}`}
              type="error"
              onClose={() => saveSettingsMutation.reset()}
              duration={5000}
            />
          )}

          {saveSettingsMutation.isSuccess && (
            <FloatingNotification
              message="Settings saved successfully!"
              type="success"
              onClose={() => saveSettingsMutation.reset()}
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

          {isSettingsLoading ? (
            <SettingsLoadingSkeleton />
          ) : settingsQueryError ? (
            <div className="p-6 text-center">
              <p className="text-red-400">
                Failed to load settings. Please try again.
              </p>
            </div>
          ) : settings ? (
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
          ) : (
            <SettingsLoadingSkeleton />
          )}
        </div>
      </div>
    </div>
  );
}
