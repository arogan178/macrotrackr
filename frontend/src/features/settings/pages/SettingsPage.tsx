import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import Navbar from "@/components/layout/Navbar";
import {
  AwardIcon,
  LockIcon,
  Modal,
  TabButton,
  UserIcon,
} from "@/components/ui";
import {
  BillingForm,
  ChangePasswordForm,
  ProfileForm,
  SettingsLoadingSkeleton,
} from "@/features/settings/components";
import { useBeforeUnload, useMutationErrorHandler } from "@/hooks";
import { useSaveSettings, useSettings } from "@/hooks/queries/useSettings";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";

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
    resetSettings,

    initializeSettings,
    showNotification,
  } = useStore();

  // Get loading state from mutation
  const isSaving = saveSettingsMutation.isPending;

  // Use new loading state hooks
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) =>
        console.error("Settings operation failed:", message),
      onSuccess: (message) =>
        console.log("Settings operation succeeded:", message),
    });

  // Centralize subscription status hydration
  usePageDataSync();

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
        showNotification("Settings saved successfully!", "success");
        handleMutationSuccess("Settings saved successfully!");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        showNotification(`Failed to save settings: ${errorMessage}`, "error");
        handleMutationError(error, "saving settings");
      }
    },
    [
      validateSettingsForm,
      settings,
      saveSettingsMutation,
      initializeSettings,
      showNotification,
      handleMutationSuccess,
      handleMutationError,
    ],
  );

  return (
    <DashboardPageContainer>
      <Navbar />
      <FeaturePage
        title="Settings"
        subtitle={undefined}
        headerChildren={
          <div
            className="relative flex space-x-1 rounded-lg bg-surface/60 p-1"
            role="tablist"
            aria-label="Settings Tabs"
          >
            <TabButton
              active={activeTab === "profile"}
              onClick={() => handleTabChange("profile")}
              layoutId="settingsTabHighlight"
              isMotion={true}
            >
              <span className="relative z-10 flex items-center">
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
              <span className="relative z-10 flex items-center">
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
              <span className="relative z-10 flex items-center">
                <LockIcon size="sm" className="mr-1.5" />
                Security
              </span>
            </TabButton>
          </div>
        }
      >
      {isSettingsLoading ? (
        <SettingsLoadingSkeleton />
      ) : settingsQueryError ? (
        <div className="p-6 text-center">
          <p className="text-vibrant-accent">
            Failed to load settings. Please try again.
          </p>
        </div>
      ) : settings ? (
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ProfileForm
                settings={settings}
                updateSetting={updateSetting}
                formErrors={formErrors}
                onSubmit={handleSubmit}
                isSaving={isSaving}
                hasChanges={hasSettingsChanges}
              />
            </motion.div>
          )}
          {activeTab === "billing" && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <BillingForm />
            </motion.div>
          )}
          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChangePasswordForm />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <SettingsLoadingSkeleton />
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
      </FeaturePage>
    </DashboardPageContainer>
  );
}
