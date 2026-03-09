// Change `space-x-2` to `space-x-1` to reduce the gap between the buttons
import { memo } from "react";

import { ICON_BUTTON_SIZES, ICON_SIZES } from "@/components/utils/Constants";

import IconButton from "./IconButton";
import { LoadingSpinnerIcon, StarIcon, TrashIcon } from "./Icons";

type ButtonSize = keyof typeof ICON_BUTTON_SIZES;
type IconSize = keyof typeof ICON_SIZES;

export type IconButtonGroupProps = {
  onEdit: () => void;
  onDelete: (event?: React.MouseEvent) => void;
  onSaveMeal?: () => void;
  onUnsaveMeal?: () => void;
  isDeleting?: boolean;
  isMealSaved?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  saveMealLabel?: string;
  unsaveMealLabel?: string;
  buttonSize?: ButtonSize;
  iconSize?: IconSize;
};

/**
 * Reusable edit/delete/save icon button group
 */
const IconButtonGroup = memo(
  ({
    onEdit,
    onDelete,
    onSaveMeal,
    onUnsaveMeal,
    isDeleting,
    isMealSaved,
    editLabel = "Edit entry",
    deleteLabel = "Delete entry",
    saveMealLabel = "Save meal for quick re-entry",
    unsaveMealLabel = "Remove from saved meals",
    buttonSize = "md",
    iconSize,
  }: IconButtonGroupProps) => {
    return (
      <div className="flex justify-center space-x-1">
        {onSaveMeal && (
          <IconButton
            variant="custom"
            buttonSize={buttonSize}
            iconSize={iconSize}
            onClick={isMealSaved && onUnsaveMeal ? onUnsaveMeal : onSaveMeal}
            ariaLabel={isMealSaved ? unsaveMealLabel : saveMealLabel}
            className={isMealSaved ? "text-primary hover:text-primary/80" : "text-muted hover:text-foreground"}
            icon={
              <StarIcon className={isMealSaved ? "fill-current" : ""} />
            }
          />
        )}
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
