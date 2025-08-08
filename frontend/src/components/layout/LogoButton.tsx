import React from "react";

import logoIcon from "/icon.png";
import { Button } from "@/components/ui";

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
  <Button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`mr-2 flex items-center bg-gradient-to-r from-primary via-primary to-primary bg-clip-text font-extrabold tracking-wide text-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 sm:mr-4 ${className}`}
    variant="ghost"
  >
    <span className="relative flex items-center">
      {/* Icon */}
      <img
        src={logoIcon}
        alt="" // decorative icon
        className="inline-block h-16 w-16 drop-shadow-md"
        aria-hidden="true"
      />
      {/* Gradient Text */}
      <span className="relative z-10 text-2xl leading-none transition-shadow duration-300">
        <span className="bg-clip-text text-primary">MacroTrackr</span>
      </span>
    </span>
  </Button>
);

export default LogoButton;
