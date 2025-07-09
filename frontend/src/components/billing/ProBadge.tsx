import React, { memo } from "react";

interface ProBadgeProps {
  className?: string;
}

/**
 * ProBadge - Small badge for Pro features
 * Usage: <ProBadge />
 */
const ProBadge: React.FC<ProBadgeProps> = memo(({ className = "" }) => (
  <span
    className={`inline-block bg-yellow-400 text-xs text-black font-bold px-2 py-0.5 rounded uppercase align-middle ml-1 ${className}`.trim()}
    aria-label="Pro feature"
  >
    PRO
  </span>
));

// Usage example:
// <span>Advanced Reporting<ProBadge /></span>
export default ProBadge;
