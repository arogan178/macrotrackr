// Change `space-x-2` to `space-x-1` to reduce the gap between the buttons
import { memo } from "react";
import { TrashIcon, LoadingSpinnerIcon } from "@/components/Icons";
import ActionButton from "./ActionButton";
import type { ActionButtonGroupProps } from "@/components/utils/types";

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
    buttonSize = "md",
    iconSize,
  }: ActionButtonGroupProps) => {
    return (
      <div className="flex justify-center space-x-1">
        <ActionButton
          variant="edit"
          buttonSize={buttonSize}
          iconSize={iconSize}
          onClick={onEdit}
          ariaLabel={editLabel}
          className="text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 focus:ring-blue-500"
        />
        <ActionButton
          variant="delete"
          buttonSize={buttonSize}
          iconSize={iconSize}
          onClick={onDelete}
          ariaLabel={deleteLabel}
          disabled={isDeleting}
          icon={
            isDeleting ? (
              <LoadingSpinnerIcon className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <TrashIcon />
            )
          }
        />
      </div>
    );
  }
);

ActionButtonGroup.displayName = "ActionButtonGroup";

export default ActionButtonGroup;
