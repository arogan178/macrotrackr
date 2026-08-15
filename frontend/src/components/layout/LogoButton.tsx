import React from "react";

import { APP_NAME } from "@/utils/appConstants";

import BrandMark from "./BrandMark";

interface LogoButtonProps {
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  compact?: boolean;
}

/**
 * The mark carries the colour; the word is foreground text at the panel weight.
 * The wordmark used to be entirely green at font-light with a drop shadow — a
 * fifth green thing on a page whose primary button is also green, in a system
 * whose shadow tokens are all `none`. Keeping the colour in the mark also means
 * the lockup still works when a self-hoster replaces the name via
 * VITE_PUBLIC_APP_NAME.
 */
const LogoButton: React.FC<LogoButtonProps> = ({
  onClick,
  className = "",
  ariaLabel = "Go to home page",
  compact = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
      compact ? "px-0" : "px-2"
    } ${className}`}
  >
    {/* The mark is 1.59:1, so it is sized by height and left to find its own
        width. Forcing it into a square box letterboxed it and made it read
        smaller than the word beside it. */}
    <BrandMark className="h-6 w-auto shrink-0 text-primary sm:h-7" />
    <span className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
      {APP_NAME}
    </span>
  </button>
);

export default LogoButton;
