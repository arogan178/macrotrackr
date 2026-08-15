/**
 * The Popover API is baseline in browsers but not in `@types/react@18`, which
 * is what this project is pinned to. The header's Tools menu uses it directly
 * for light dismiss, Escape handling and focus restoration, none of which we
 * want to hand-roll.
 *
 * Augmenting rather than casting at the call site: these are real, standard
 * attributes, and a cast would hide the next one that gets typo'd.
 */
import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    popover?: "auto" | "manual" | "";
    popoverTarget?: string;
    popoverTargetAction?: "toggle" | "show" | "hide";
  }
}
