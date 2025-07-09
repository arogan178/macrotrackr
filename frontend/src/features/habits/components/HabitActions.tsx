import { useState, useRef, useEffect } from "react";
import {
  MoreVerticalIcon,
  PlusCircleIcon,
  CheckIcon,
  TrashIcon,
  EditIcon,
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    <div className="relative flex items-center" ref={menuRef}>
      {/* Progress increment button */}
      {!isComplete && (
        <button
          onClick={handleIncrement}
          disabled={isActionInProgress}
          className="p-1.5 rounded-full text-gray-300 hover:text-indigo-400 hover:bg-indigo-400/10"
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
          className="p-1.5 rounded-full text-gray-300 hover:text-green-400 hover:bg-green-400/10 mx-0.5"
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
          className="p-1.5 rounded-full text-red-400 hover:bg-red-400/10"
          title="Delete habit"
        >
          <TrashIcon size="sm" />
        </button>
      )}{" "}
      {/* More actions menu button - only show for incomplete habits */}
      {!isComplete && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 rounded-full text-gray-300 hover:text-gray-100 hover:bg-gray-600/50"
          title="More actions"
        >
          <MoreVerticalIcon size="sm" />
        </button>
      )}{" "}
      {/* Dropdown menu - Smaller card and text */}
      {isMenuOpen && (
        <div className="absolute z-50 right-0 top-full mt-1 py-0.5 w-32 rounded-md shadow-lg bg-gray-800/90 backdrop-blur-sm border border-gray-700/40 text-xs">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="w-full text-left px-3 py-1.5 flex items-center hover:bg-gray-700/50 text-gray-200"
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
              className="w-full text-left px-3 py-1.5 flex items-center hover:bg-gray-700/50 text-red-400"
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
