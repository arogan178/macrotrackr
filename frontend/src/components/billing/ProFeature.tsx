import React, { memo } from "react";

import { isLocalAuthMode } from "@/config/runtime";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

import ProBadge from "./ProBadge";
import UpgradeModal from "./UpgradeModal";

export const ProFeature: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { subscriptionStatus } = useSubscriptionStatus();
  const [modalOpen, setModalOpen] = React.useState(false);
  const hasProAccess = isLocalAuthMode || subscriptionStatus === "pro";

  if (hasProAccess) return children;

  return (
    <div
      className="pointer-events-auto relative cursor-pointer select-none"
      role="button"
      tabIndex={0}
      onClick={() => setModalOpen(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          setModalOpen(true);
        }
      }}
    >
      {/* ProBadge in top right, overlapping */}
      <div className="pointer-events-none absolute top-0 right-0 z-20 translate-x-1/4 -translate-y-1/4">
        <ProBadge className="rounded-full p-1 shadow-primary" />
      </div>
      <div className="pointer-events-none opacity-20">{children}</div>
      <UpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpgrade={() => {
          setModalOpen(false);
          globalThis.location.href = "/pricing";
        }}
      />
    </div>
  );
};

export default memo(ProFeature);
