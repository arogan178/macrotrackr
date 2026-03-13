import React, { memo } from "react";
import PropTypes from "prop-types";

interface ProBadgeProps {
  className?: string;
}

const ProBadge: React.FC<ProBadgeProps> = memo(function ProBadge({
  className = "",
}) {
  return (
    <span
      className={`inline-block bg-vibrant-accent text-xs text-foreground font-semibold tracking-wide px-2 py-0.5 rounded uppercase align-middle ml-1 ${className}`.trim()}
      aria-label="Pro feature"
    >
      PRO
    </span>
  );
});
ProBadge.displayName = "ProBadge";
ProBadge.propTypes = {
  className: PropTypes.string,
};

export default ProBadge;
