import React, { memo } from "react";

interface ProBadgeProps {
  className?: string;
}

const ProBadge: React.FC<ProBadgeProps> = memo(function ProBadge({
  className = "",
}) {
  return (
    <span
      className={`inline-block bg-primary text-xs text-foreground font-semibold tracking-wide px-2 py-0.5 rounded-control uppercase align-middle ml-1 ${className}`.trim()}
      aria-label="Pro feature"
    >
      PRO
    </span>
  );
});
ProBadge.displayName = "ProBadge";

export default ProBadge;
