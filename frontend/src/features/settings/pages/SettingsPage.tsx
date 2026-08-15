import { useCallback, useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";

import PageTransition from "@/components/animation/PageTransition";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import {
  AwardIcon,
  LinkIcon,
  LockIcon,
  Modal,
  TabBar,
  UserIcon,
} from "@/components/ui";
import { isClerkAuthMode, isManagedBillingMode } from "@/config/runtime";
import {
  BillingForm,
  ChangePasswordForm,
  ConnectedAccountsForm,
  ProfileForm,
  SettingsLoadingSkeleton,
} from "@/features/settings/components";
import { useBeforeUnload, useMutationErrorHandler } from "@/hooks";
import { useSaveSettings, useSettings } from "@/hooks/queries/useSettings";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";

type TabType = "profile" | "billing" | "accounts" | "security";

const BILLING_TAB_ENABLED = isManagedBillingMode;
const ACCOUNTS_TAB_ENABLED = isClerkAuthMode;

// Valid tab values for validation
const VALID_TABS = new Set<TabType>([
  "profile",
  ...(BILLING_TAB_ENABLED ? (["billing"] as TabType[]) : []),
  ...(ACCOUNTS_TAB_ENABLED ? (["accounts"] as TabType[]) : []),
  "security",
]);

export default function SettingsPage() {
  // Read tab from URL search params
  const search = (useSearch({ strict: false }) ?? {}) as { tab?: string };

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
      logError: false,
      showSuccess: false,
    });

  // Centralize subscription status hydration
  usePageDataSync();

  // Initialize active tab from URL param or default to "profile"
  const getInitialTab = (): TabType => {
    const tabParameter = search.tab;
    if (tabParameter && VALID_TABS.has(tabParameter as TabType)) {
      return tabParameter as TabType;
    }

    return "profile";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<
    TabType | undefined
  >();

  // Update tab when URL changes
  useEffect(() => {
    const tabParameter = search.tab;
    if (tabParameter && VALID_TABS.has(tabParameter as TabType)) {
      const newTab = tabParameter as TabType;
      if (newTab !== activeTab && !hasSettingsChanges) {
        setActiveTab(newTab);
      }
    }
  }, [search.tab, hasSettingsChanges, activeTab]);

  useEffect(() => {
    if (!VALID_TABS.has(activeTab)) {
      setActiveTab("profile");
    }
  }, [activeTab]);

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
  // Browsers show their own wording here; a custom message is ignored.
  useBeforeUnload(hasSettingsChanges);

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
        showNotification("Settings saved", "success");
        handleMutationSuccess("Settings saved");
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
      <FeaturePage
        title="Settings"
        subtitle="Manage your account preferences and profile details"
        headerChildren={
          <TabBar
            items={[
              {
                key: "profile",
                label: (
                  <>
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </>
                ),
              },
              ...(BILLING_TAB_ENABLED
                ? [
                    {
                      key: "billing",
                      label: (
                        <>
                          <AwardIcon className="h-4 w-4" />
                          Billing
                        </>
                      ),
                    },
                  ]
                : []),
              ...(ACCOUNTS_TAB_ENABLED
                ? [
                    {
                      key: "accounts",
                      label: (
                        <>
                          <LinkIcon className="h-4 w-4" />
                          Accounts
                        </>
                      ),
                    },
                  ]
                : []),
              {
                key: "security",
                label: (
                  <>
                    <LockIcon className="h-4 w-4" />
                    Security
                  </>
                ),
              },
            ]}
            activeKey={activeTab}
            onChange={(key) => handleTabChange(key as typeof activeTab)}
            layoutId="settingsTabHighlight"
            ariaLabel="Settings Tabs"
            size="sm"
            fullWidth
          />
        }
      >
        {isSettingsLoading ? (
          <SettingsLoadingSkeleton />
        ) : settingsQueryError ? (
          <div className="p-6 text-center">
            <p className="text-error">
              Failed to load settings. Please try again.
            </p>
          </div>
        ) : settings ? (
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <PageTransition key="profile">
                <ProfileForm
                  settings={settings}
                  updateSetting={updateSetting}
                  formErrors={formErrors}
                  onSubmit={handleSubmit}
                  isSaving={isSaving}
                  hasChanges={hasSettingsChanges}
                />
              </PageTransition>
            )}
            {BILLING_TAB_ENABLED && activeTab === "billing" && (
              <PageTransition key="billing">
                <BillingForm />
              </PageTransition>
            )}
            {ACCOUNTS_TAB_ENABLED && activeTab === "accounts" && (
              <PageTransition key="accounts">
                <ConnectedAccountsForm />
              </PageTransition>
            )}
            {activeTab === "security" && (
              <PageTransition key="security">
                <ChangePasswordForm />
              </PageTransition>
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
          isDanger
        />
      </FeaturePage>
    </DashboardPageContainer>
  );
}
