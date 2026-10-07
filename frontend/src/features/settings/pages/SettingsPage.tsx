import { useCallback, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";

import PageTransition from "@/components/animation/PageTransition";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import {
  AwardIcon,
  Button,
  LinkIcon,
  LockIcon,
  LogoutIcon,
  Modal,
  TabBar,
  UploadIcon,
  UserIcon,
} from "@/components/ui";
import { isClerkAuthMode, isManagedBillingMode } from "@/config/runtime";
import {
  BillingForm,
  ChangePasswordForm,
  ConnectedAccountsForm,
  DataExporter,
  DataImporter,
  ProfileForm,
  SettingsLoadingSkeleton,
} from "@/features/settings/components";
import DeleteAccountForm from "@/features/settings/components/DeleteAccountForm";
import { useBeforeUnload } from "@/hooks";
import { useLogout } from "@/hooks/auth/useAuthQueries";
import { useSettings } from "@/hooks/queries/useSettings";
import { usePageDataSync } from "@/hooks/usePageDataSync";

type TabType = "profile" | "data" | "billing" | "accounts" | "security";

const BILLING_TAB_ENABLED = isManagedBillingMode;
const ACCOUNTS_TAB_ENABLED = isClerkAuthMode;

// Valid tab values for validation
const VALID_TABS = new Set<TabType>([
  "profile",
  "data",
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
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

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
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<
    TabType | undefined
  >();

  // Update tab when URL changes. Only on a change, so a tab picked after
  // landing on ?tab= is not switched back.
  const [urlTab, setUrlTab] = useState(search.tab);
  if (search.tab !== urlTab) {
    setUrlTab(search.tab);
    if (
      search.tab &&
      VALID_TABS.has(search.tab as TabType) &&
      !hasSettingsChanges
    ) {
      setActiveTab(search.tab as TabType);
    }
  }

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
      // Leaving the tab unmounts the form, which drops its edits.
      setHasSettingsChanges(false);
      setActiveTab(pendingTabChange);
      setPendingTabChange(undefined);
    }
    setShowConfirmModal(false);
  }, [pendingTabChange]);

  const cancelTabChange = useCallback(() => {
    setPendingTabChange(undefined);
    setShowConfirmModal(false);
  }, []);

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
              {
                key: "data",
                label: (
                  <>
                    <UploadIcon className="h-4 w-4" />
                    Data
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
        ) : settingsData ? (
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <PageTransition key="profile">
                <ProfileForm
                  settings={settingsData}
                  onHasChangesChange={setHasSettingsChanges}
                />
              </PageTransition>
            )}
            {activeTab === "data" && (
              <PageTransition key="data">
                <div className="space-y-6">
                  <DataExporter />
                  <DataImporter />
                </div>
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
                <div className="space-y-6">
                  <ChangePasswordForm />
                  <DeleteAccountForm />
                </div>
              </PageTransition>
            )}
          </AnimatePresence>
        ) : (
          <SettingsLoadingSkeleton />
        )}

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:mt-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Account Session
            </h3>
            <p className="text-xs text-muted">
              Sign out of your account on this device
            </p>
          </div>
          <Button
            variant="danger"
            buttonSize="sm"
            onClick={handleLogout}
            isLoading={logoutMutation.isPending}
            leftIcon={<LogoutIcon className="h-4 w-4" />}
            text="Log out"
          />
        </div>

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
