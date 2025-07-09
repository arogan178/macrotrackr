import React from "react";
import { ProBadge } from "@/components/ProBadge";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useSubscriptionStatus } from "@/features/pricing/hooks/useSubscriptionStatus";

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
    <div
      className="relative pointer-events-auto select-none cursor-pointer"
      onClick={() => setModalOpen(true)}
    >
      {/* ProBadge in top right, overlapping */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 pointer-events-none z-20">
        <ProBadge className="rounded-full p-1 shadow-lg" />
      </div>
      <div className="pointer-events-none opacity-20">{children}</div>
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
