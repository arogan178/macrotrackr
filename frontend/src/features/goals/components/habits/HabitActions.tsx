import { useEffect, useRef, useState } from "react";

import {
  CheckIcon,
  EditIcon,
  MoreVerticalIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@/components/ui";

interface HabitActionsProps {
  habitId: string;
  isComplete: boolean;
  onIncrement: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

function HabitActions({
  habitId,
  isComplete,
  onIncrement,
  onComplete,
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
      console.error(`Error during ${actionName} action:`, error);
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

  const handleEdit = () => {
    if (onEdit) {
      onEdit(habitId);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="relative flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100" ref={menuReference}>
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
      )}{" "}
      {/* Delete button - outside menu for completed habits */}
      {isComplete && (
        <button
          onClick={handleDelete}
          disabled={isActionInProgress}
          className="rounded-full p-1.5 text-vibrant-accent hover:bg-vibrant-accent/10"
          title="Delete habit"
        >
          <TrashIcon size="sm" />
        </button>
      )}{" "}
      {/* More actions menu button - only show for incomplete habits */}
      {!isComplete && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-full p-1.5 text-foreground hover:bg-surface-2 hover:text-foreground"
          title="More actions"
        >
          <MoreVerticalIcon size="sm" />
        </button>
      )}{" "}
      {/* Dropdown menu - Smaller card and text */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-32 rounded-xl border border-border bg-surface py-0.5 text-xs">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="flex w-full items-center px-3 py-1.5 text-left text-foreground hover:bg-surface-2"
            >
              <EditIcon size="sm" className="mr-1.5" />
              Edit
            </button>
          )}

          {/* Only show delete in dropdown if habit is NOT completed */}
          {!isComplete && (
            <button
              onClick={handleDelete}
              disabled={isActionInProgress}
              className="flex w-full items-center px-3 py-1.5 text-left text-error hover:bg-surface-2"
            >
              <TrashIcon size="sm" className="mr-1.5" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default HabitActions;
