import React from "react";
import { AnimatePresence, motion } from "motion/react";

export interface MobileNavItem {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  onSelect: () => void;
}

export interface MobileNavAction {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "neutral" | "primary" | "danger";
}

interface MobileNavSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: MobileNavItem[];
  actions?: MobileNavAction[];
  shouldReduceMotion: boolean;
  label?: string;
}

const itemClasses =
  "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3.5 py-2.5 text-left text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const toneClasses: Record<NonNullable<MobileNavAction["tone"]>, string> = {
  neutral:
    "border border-transparent text-muted hover:border-border hover:bg-surface-2 hover:text-foreground",
  primary: "border border-transparent bg-primary text-background",
  danger:
    "border border-transparent text-error hover:border-error hover:bg-surface-2 hover:text-error",
};

/**
 * The one nav sheet for anything below `lg`. Both header modes use it, which is
 * what gives the public pages a mobile route to Tools, Blog and Docs.
 */
const MobileNavSheet: React.FC<MobileNavSheetProps> = ({
  isOpen,
  onClose,
  items,
  actions = [],
  shouldReduceMotion,
  label = "Menu",
}) => (
  <AnimatePresence initial={false}>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
          style={{ touchAction: "none", overscrollBehavior: "contain" }}
        />

        <motion.div
          role="dialog"
          aria-label={label}
          className="fixed inset-x-4 z-70 rounded-card border border-border bg-surface p-2.5 lg:hidden"
          style={{ top: "calc(5rem + var(--sat))" }}
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.15,
            ease: "easeOut",
          }}
        >
          <div className="space-y-1">
            {items.map(
              ({ key, label: itemLabel, icon: Icon, isActive, onSelect }) => (
                <button
                  key={key}
                  type="button"
                  onClick={onSelect}
                  aria-current={isActive ? "page" : undefined}
                  className={`group ${itemClasses} ${
                    isActive
                      ? "border border-border-2 bg-surface-2 font-semibold text-foreground"
                      : "border border-transparent text-muted hover:border-border hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {Icon ? (
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-control transition-colors duration-150 ${
                          isActive
                            ? "bg-surface-3 text-primary"
                            : "bg-surface-2 text-muted group-hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    ) : null}
                    <span className="truncate text-sm">{itemLabel}</span>
                  </span>
                </button>
              ),
            )}

            {actions.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-border pt-2">
                {actions.map(
                  ({
                    key,
                    label: actionLabel,
                    icon: Icon,
                    onSelect,
                    disabled,
                    tone = "neutral",
                  }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={onSelect}
                      disabled={disabled}
                      className={`${itemClasses} ${toneClasses[tone]} ${
                        tone === "primary" ? "justify-center font-semibold" : ""
                      }`}
                    >
                      {Icon ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-surface-2 text-muted">
                          <Icon className="h-4 w-4" />
                        </span>
                      ) : null}
                      <span>{actionLabel}</span>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default MobileNavSheet;
