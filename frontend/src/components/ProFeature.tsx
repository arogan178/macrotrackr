import React from "react";
import { ProBadge } from "@/components/ProBadge";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

/**
 * ProFeature - Conditionally renders Pro features with gating
 * Usage: <ProFeature><AdvancedComponent /></ProFeature>
 */
export const ProFeature: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { subscriptionStatus } = useSubscriptionStatus();
  const [modalOpen, setModalOpen] = React.useState(false);

  if (subscriptionStatus === "pro") return <>{children}</>;

  return (
    <div className="relative opacity-60 pointer-events-none select-none">
      {children}
      <ProBadge />
      <button
        className="absolute top-2 right-2 bg-yellow-400 text-black font-bold px-3 py-1 rounded shadow pointer-events-auto select-auto"
        onClick={() => setModalOpen(true)}
        tabIndex={0}
        aria-label="Upgrade to Pro"
      >
        Upgrade
      </button>
      <UpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpgrade={() => {
          setModalOpen(false);
          window.location.href = "/pricing";
        }}
      />
    </div>
  );
};

// Usage example:
// <ProFeature><AdvancedReporting /></ProFeature>
