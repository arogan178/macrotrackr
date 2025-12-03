// Change `space-x-2` to `space-x-1` to reduce the gap between the buttons
import { memo } from "react";

import IconButton from "./IconButton";
import { LoadingSpinnerIcon, TrashIcon } from "./Icons";
import { ICON_BUTTON_SIZES, ICON_SIZES } from "@/components/utils/Constants";

type ButtonSize = keyof typeof ICON_BUTTON_SIZES;
type IconSize = keyof typeof ICON_SIZES;

export type IconButtonGroupProps = {
  onEdit: () => void;
  onDelete: (event?: React.MouseEvent) => void;
  isDeleting?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  buttonSize?: ButtonSize;
  iconSize?: IconSize;
};

/**
 * Reusable edit/delete icon button group
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
