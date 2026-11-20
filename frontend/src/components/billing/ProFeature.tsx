import React, { memo } from "react";
import { useRouter } from "@tanstack/react-router";

import { useEntitlements } from "@/hooks/useEntitlements";

import ProBadge from "./ProBadge";
import UpgradeModal from "./UpgradeModal";

export const ProFeature: React.FC<{
  children: React.ReactNode;
  label?: string;
}> = ({ children, label }) => {
  const { hasProAccess } = useEntitlements();
  const router = useRouter({ warn: false });
  const [modalOpen, setModalOpen] = React.useState(false);

  if (hasProAccess) return children;

  return (
    <>
      <div
        className="pointer-events-auto relative cursor-pointer select-none"
        role="button"
        tabIndex={0}
        aria-label={label ?? "Upgrade to Pro to unlock this feature"}
        onClick={() => setModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setModalOpen(true);
          }
        }}
      >
        {/* ProBadge in top right, overlapping */}
        <div className="pointer-events-none absolute top-0 right-0 z-20 translate-x-1/4 -translate-y-1/4">
          <ProBadge className="rounded-full p-1" />
        </div>
        <div
          className="pointer-events-none opacity-20"
          aria-hidden="true"
          inert
        >
          {children}
        </div>
      </div>
      <UpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpgrade={() => {
          setModalOpen(false);
          if (router) {
            void router.navigate({ to: "/pricing" });
          } else {
            globalThis.location.href = "/pricing";
          }
        }}
      />
    </>
  );
};

export default memo(ProFeature);
