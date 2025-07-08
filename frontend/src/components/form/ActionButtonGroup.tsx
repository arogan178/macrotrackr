import { memo } from "react";
import { EditIcon, TrashIcon, LoadingSpinnerIcon } from "@/components/Icons";
import FormButton from "./FormButton";
import { ActionButtonGroupProps } from "@/components/utils/types";

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
        <FormButton
          onClick={onEdit}
          variant="ghost"
          size={size}
          ariaLabel={editLabel}
          className={`${buttonSize} text-blue-400 hover:bg-blue-500/30 focus:ring-blue-500`}
          icon={<EditIcon className={iconSize} />}
          iconPosition="left"
        />
        <FormButton
          onClick={onDelete}
          variant="ghost"
          size={size}
          ariaLabel={deleteLabel}
          className={`${buttonSize} text-red-400 hover:bg-red-500/30 focus:ring-red-500`}
          icon={
            isDeleting ? (
              <LoadingSpinnerIcon className={`${iconSize} animate-spin`} />
            ) : (
              <TrashIcon className={iconSize} />
            )
          }
          iconPosition="left"
          disabled={isDeleting}
        />
      </div>
    );
  }
);

ActionButtonGroup.displayName = "ActionButtonGroup";

export default ActionButtonGroup;
