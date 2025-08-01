// Change `space-x-2` to `space-x-1` to reduce the gap between the buttons
import { memo } from "react";

import { IconButton, LoadingSpinnerIcon, TrashIcon } from "@/components/ui";
import type { IconButtonGroupProps } from "@/components/utils";

/**
 * Reusable edit/delete action button group
 */
const IconButtonGroup = memo(
  ({
    onEdit,
    onDelete,
    isDeleting,
    editLabel = "Edit entry",
    deleteLabel = "Delete entry",
    buttonSize = "md",
    iconSize,
  }: IconButtonGroupProps) => {
    return (
      <div className="flex justify-center space-x-1">
        <IconButton
          variant="edit"
          buttonSize={buttonSize}
          iconSize={iconSize}
          onClick={onEdit}
          ariaLabel={editLabel}
        />
        <IconButton
          variant="delete"
          buttonSize={buttonSize}
          iconSize={iconSize}
          onClick={onDelete}
          ariaLabel={deleteLabel}
          disabled={isDeleting}
          icon={
            isDeleting ? (
              <LoadingSpinnerIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <TrashIcon />
            )
          }
        />
      </div>
    );
  },
);

IconButtonGroup.displayName = "IconButtonGroup";

export default IconButtonGroup;
