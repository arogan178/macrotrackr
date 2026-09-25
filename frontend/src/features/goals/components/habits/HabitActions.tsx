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
import { logger } from "@/lib/logger";

interface HabitActionsProps {
  habitId: string;
  current: number;
  isComplete: boolean;
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
      {handleDecrement && (
        <button
          onClick={handleDecrement}
          disabled={isActionInProgress}
          className="rounded-full p-1.5 text-foreground hover:bg-primary/10 hover:text-primary"
          title="Remove progress"
          aria-label="Remove progress"
        >
          <MinusCircleIcon size="sm" />
        </button>
      )}
      {/* Progress increment button */}
      {!isComplete && (
        <button
          onClick={handleIncrement}
          disabled={isActionInProgress}
          className="rounded-full p-1.5 text-foreground hover:bg-primary/10 hover:text-primary"
          title="Add progress"
        >
          <PlusCircleIcon size="sm" />
        </button>
      )}
      {/* Mark complete button - moved outside menu */}
      {!isComplete && (
        <button
          onClick={handleComplete}
          disabled={isActionInProgress}
          className="mx-0.5 rounded-full p-1.5 text-foreground hover:bg-success/10 hover:text-success"
          title="Mark complete"
        >
          <CheckIcon size="sm" />
        </button>
      )}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="rounded-full p-1.5 text-foreground hover:bg-surface-2 hover:text-foreground"
        title="More actions"
      >
        <MoreVerticalIcon size="sm" />
      </button>
      {/* Dropdown menu - Smaller card and text */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-32 rounded-control border border-border bg-surface py-0.5 text-xs">
          {onEdit && !isComplete && (
            <button
              onClick={handleEdit}
              className="flex w-full items-center px-3 py-1.5 text-left text-foreground hover:bg-surface-2"
            >
              <EditIcon size="sm" className="mr-1.5" />
              Edit
            </button>
          )}

          {handleReset && (
            <button
              onClick={handleReset}
              disabled={isActionInProgress}
              className="flex w-full items-center px-3 py-1.5 text-left text-foreground hover:bg-surface-2"
            >
              <ResetIcon size="sm" className="mr-1.5" />
              Reset today
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isActionInProgress}
            className="flex w-full items-center px-3 py-1.5 text-left text-error hover:bg-surface-2"
          >
            <TrashIcon size="sm" className="mr-1.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default HabitActions;
