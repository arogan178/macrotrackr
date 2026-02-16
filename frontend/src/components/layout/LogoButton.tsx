import React from "react";

import logoIcon from "/icon.png";

interface LogoButtonProps {
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

const LogoButton: React.FC<LogoButtonProps> = ({
  onClick,
  className = "",
  ariaLabel = "Go to home page",
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={`hover:bg-surface-hover mr-2 flex h-full cursor-pointer items-center rounded px-2 font-light tracking-wide text-primary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:mr-4 ${className}`}
  >
    <span className="relative flex items-center">
      {/* Icon */}
      <img
        src={logoIcon}
        alt="" // decorative icon
        className="inline-block h-8 w-8 drop-shadow-md sm:h-10 sm:w-10"
        aria-hidden="true"
        width={40}
        height={40}
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
      {/* Logo Text - solid color per Memoria Design System (no gradients) */}
      <span className="relative z-10 ml-1 text-xl leading-none transition-shadow duration-300 sm:text-2xl">
        <span className="text-primary">MacroTrackr</span>
      </span>
    </span>
  </button>
);

export default LogoButton;
