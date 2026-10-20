import { useEffect, useRef, useState } from "react";

import {
  CheckIcon,
  EditIcon,
  MinusCircleIcon,
  MoreVerticalIcon,
  PlusCircleIcon,
  ResetIcon,
  TrashIcon,
} from "@/components/ui";
import { TOUCH_TARGET } from "@/components/utils/UiConstants";
import { cn } from "@/lib/classnameUtilities";
import { logger } from "@/lib/logger";
import type { HabitFrequency } from "@/types/habit";

// 36px to the eye, 48px to a thumb.
const HABIT_ACTION = `${TOUCH_TARGET} inline-flex h-9 w-9 items-center justify-center rounded-full`;
const MENU_ITEM =
  "flex min-h-12 w-full items-center px-3 text-left text-foreground hover:bg-surface-2";

interface HabitActionsProps {
  habitId: string;
  current: number;
  isComplete: boolean;
  frequency?: HabitFrequency;
  onIncrement: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onDecrement?: (id: string) => Promise<void>;
  onReset?: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

function HabitActions({
  habitId,
  current,
  isComplete,
  frequency,
  onIncrement,
  onComplete,
  onDecrement,
  onReset,
  onEdit,
  onDelete,
}: HabitActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const menuReference = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuReference.current &&
        !menuReference.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAction = async (
    action: () => Promise<void>,
    actionName: string,
  ) => {
    if (isActionInProgress) return;

    setIsActionInProgress(true);
    try {
      await action();
    } catch (error) {
      logger.error(`Error during ${actionName} action`, error);
      throw error;
    } finally {
      setIsActionInProgress(false);
      setIsMenuOpen(false);
    }
  };

  const handleIncrement = () =>
    handleAction(() => onIncrement(habitId), "increment");

  const handleComplete = () =>
    handleAction(() => onComplete(habitId), "complete");

  const handleDelete = () => handleAction(() => onDelete(habitId), "delete");

  const handleDecrement =
    onDecrement && current > 0
      ? () => handleAction(() => onDecrement(habitId), "decrement")
      : undefined;

  const handleReset =
    onReset && current > 0
      ? () => handleAction(() => onReset(habitId), "reset")
      : undefined;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(habitId);
      setIsMenuOpen(false);
    }
  };

  return (
    <div
      className="relative flex items-center gap-1 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      ref={menuReference}
    >
      {/* One action in reach; the rest wait behind the menu. */}
      {!isComplete && (
        <button
          onClick={handleIncrement}
          disabled={isActionInProgress}
          className={`${HABIT_ACTION} text-foreground hover:bg-primary/10 hover:text-primary`}
          title="Add progress"
          aria-label="Add progress"
        >
          <PlusCircleIcon size="sm" />
        </button>
      )}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`${HABIT_ACTION} text-foreground hover:bg-surface-2 hover:text-foreground`}
        title="More actions"
        aria-label="More actions"
        aria-expanded={isMenuOpen}
      >
        <MoreVerticalIcon size="sm" />
      </button>
      {isMenuOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-48 rounded-control border border-border bg-surface py-1 text-sm">
          {!isComplete && (
            <button onClick={handleComplete} disabled={isActionInProgress} className={MENU_ITEM}>
              <CheckIcon size="sm" className="mr-2 text-success" />
              Mark complete
            </button>
          )}
          {handleDecrement && (
            <button onClick={handleDecrement} disabled={isActionInProgress} className={MENU_ITEM}>
              <MinusCircleIcon size="sm" className="mr-2" />
              Remove progress
            </button>
          )}
          {onEdit && !isComplete && (
            <button onClick={handleEdit} className={MENU_ITEM}>
              <EditIcon size="sm" className="mr-2" />
              Edit
            </button>
          )}
          {handleReset && (
            <button onClick={handleReset} disabled={isActionInProgress} className={MENU_ITEM}>
              <ResetIcon size="sm" className="mr-2" />
              {frequency === "weekly" ? "Reset this week" : "Reset today"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isActionInProgress}
            className={cn(MENU_ITEM, "text-error")}
          >
            <TrashIcon size="sm" className="mr-2" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default HabitActions;
