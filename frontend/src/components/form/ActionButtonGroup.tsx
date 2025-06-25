import { memo } from "react";
import { EditIcon, TrashIcon, LoadingSpinnerIcon } from "@/components/Icons";

interface ActionButtonGroupProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  editLabel?: string;
  deleteLabel?: string;
  size?: "sm" | "md";
}

/**
 * Reusable edit/delete action button group
 */
const ActionButtonGroup = memo(
  ({
    onEdit,
    onDelete,
    isDeleting,
    editLabel = "Edit entry",
    deleteLabel = "Delete entry",
    size = "sm",
  }: ActionButtonGroupProps) => {
    const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    const buttonSize = size === "sm" ? "p-1.5" : "p-2";

    return (
      <div className="flex justify-center space-x-2">
        <button
          onClick={onEdit}
          className={`${buttonSize} rounded-md bg-blue-600/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-400 transition-colors`}
          aria-label={editLabel}
        >
          <EditIcon className={iconSize} />
        </button>
        <button
          onClick={onDelete}
          className={`${buttonSize} rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors`}
          disabled={isDeleting}
          aria-label={deleteLabel}
        >
          {isDeleting ? (
            <LoadingSpinnerIcon className={`${iconSize} animate-spin`} />
          ) : (
            <TrashIcon className={iconSize} />
          )}
        </button>
      </div>
    );
  }
);

ActionButtonGroup.displayName = "ActionButtonGroup";

export default ActionButtonGroup;
