import type { ReactNode } from "react";

import {
  CopyIcon,
  EditIcon,
  RepeatIcon,
  StarIcon,
  TrashIcon,
} from "@/components/ui";
import Modal from "@/components/ui/Modal";
import Value from "@/components/ui/Value";
import { cn } from "@/lib/classnameUtilities";
import type { MacroEntry } from "@/types/macro";

import { calculateCaloriesFromMacros } from "../calculations";

import { MacroSplitBar } from "./MacroSplitBar";

interface EntryActionsSheetProps {
  entry: MacroEntry | null;
  isMealSaved: boolean;
  onClose: () => void;
  onEdit: (entry: MacroEntry) => void;
  onDelete: (id: string) => void;
  onLogAgain?: (entry: MacroEntry) => void;
  onCopyOrMove?: (entry: MacroEntry) => void;
  onSaveMeal?: (entry: MacroEntry) => void;
  onUnsaveMeal?: (entry: MacroEntry) => void;
}

interface ActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  isDanger?: boolean;
}

function Action({ icon, label, onClick, isDanger = false }: ActionProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-h-12 w-full items-center gap-3 rounded-control px-2 text-left text-sm transition-colors duration-200 hover:bg-surface-2",
          isDanger ? "text-error" : "text-foreground",
        )}
      >
        <span className={cn("h-5 w-5 shrink-0", !isDanger && "text-muted")}>{icon}</span>
        {label}
      </button>
    </li>
  );
}

/**
 * Everything an entry can do, one tap from its row. On a phone this is a
 * bottom sheet, so the actions sit under the thumb rather than in a row of
 * 44px icons squeezed beside the food's name.
 */
export function EntryActionsSheet({
  entry,
  isMealSaved,
  onClose,
  onEdit,
  onDelete,
  onLogAgain,
  onCopyOrMove,
  onSaveMeal,
  onUnsaveMeal,
}: EntryActionsSheetProps) {
  const run = (action: (entry: MacroEntry) => void) => () => {
    if (!entry) return;
    onClose();
    action(entry);
  };

  return (
    <Modal
      isOpen={entry !== null}
      onClose={onClose}
      title={entry?.foodName ?? entry?.mealName ?? "Entry"}
      variant="form"
      size="sm"
    >
      {entry && (
        <>
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Value
                value={calculateCaloriesFromMacros(entry.protein, entry.carbs, entry.fats)}
                unit="kcal"
                size="stat"
              />
              <Value value={entry.protein} unit="g" suffix="protein" className="text-protein" />
              <Value value={entry.carbs} unit="g" suffix="carbs" className="text-carbs" />
              <Value value={entry.fats} unit="g" suffix="fat" className="text-fats" />
            </div>
            <MacroSplitBar protein={entry.protein} carbs={entry.carbs} fats={entry.fats} />
          </div>

          <ul className="-mx-2 space-y-1">
            <Action icon={<EditIcon />} label="Edit" onClick={run(onEdit)} />
            {onLogAgain && (
              <Action icon={<RepeatIcon />} label="Log again" onClick={run(onLogAgain)} />
            )}
            {onCopyOrMove && (
              <Action
                icon={<CopyIcon />}
                label="Copy or move"
                onClick={run(onCopyOrMove)}
              />
            )}
            {isMealSaved && onUnsaveMeal ? (
              <Action
                icon={<StarIcon className="fill-current" />}
                label="Remove from saved meals"
                onClick={run(onUnsaveMeal)}
              />
            ) : onSaveMeal ? (
              <Action icon={<StarIcon />} label="Save as meal" onClick={run(onSaveMeal)} />
            ) : null}
            <Action
              icon={<TrashIcon />}
              label="Delete"
              isDanger
              onClick={run((target) => onDelete(target.clientId))}
            />
          </ul>
        </>
      )}
    </Modal>
  );
}
