import { memo, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";

import { Button, ChevronDownIcon, CopyIcon, IconButton, TrashIcon } from "@/components/ui";
import Value from "@/components/ui/Value";
import { DURATIONS } from "@/components/utils/UiConstants";
import type { MacroEntry } from "@/types/macro";

import { EntryActionsSheet } from "./EntryActionsSheet";
import { EntryCard } from "./EntryCard";
import { useEntryHistoryController } from "./EntryHistoryContext";
import type {
  GroupedEntry,
} from "./EntryHistoryShared";
import { MacroSplitBar } from "./MacroSplitBar";

interface MobileEntryCardsProps {
  groupedEntries: GroupedEntry[];
}

const MobileEntryCards = memo(
  ({ groupedEntries }: MobileEntryCardsProps) => {
    const controller = useEntryHistoryController();
    const {
      formatDate,
      formatTimeFromEntry,
      capitalizeFirstLetter,
      calculateCalories,
      isDateCollapsed,
      toggleDateCollapse,
      handleDeleteDate,
      canCopyDate,
      handleCopyDate,
      onEdit,
      deleteEntry,
      onSaveMeal,
      onUnsaveMeal,
      onLogAgain,
      onCopyOrMove,
      isMealSaved,
      isDeleting,
      isSelectionMode,
      isEntrySelected,
      onToggleEntrySelection,
    } = controller;

    const containerReference = useRef<HTMLDivElement>(null);
    const [openEntry, setOpenEntry] = useState<MacroEntry | null>(null);

    const totalEntries = useMemo(() => {
      return groupedEntries.reduce(
        (sum, group) => sum + group.entries.length,
        0,
      );
    }, [groupedEntries]);

    const shouldVirtualize = totalEntries > 50;

    const virtualItems = useMemo(() => {
      const items: Array<
        | { type: "header"; group: GroupedEntry }
        | { type: "entry"; entry: MacroEntry }
      > = [];

      for (const group of groupedEntries) {
        items.push({ type: "header", group });
        if (!isDateCollapsed(group.date)) {
          for (const entry of group.entries) {
            items.push({ type: "entry", entry });
          }
        }
      }

      return items;
    }, [groupedEntries, isDateCollapsed]);

    const virtualizer = useVirtualizer({
      count: virtualItems.length,
      getScrollElement: () => containerReference.current,
      estimateSize: (index) => {
        const item = virtualItems[index];
        if (item.type === "header") return 60;

        // Time and actions, name and actions, then one line of values.
        return 132;
      },
      overscan: 5,
    });

    // A plain row, not a filled band: the day is a heading for the entries
    // under it, and its split bar says what kind of day it was.
    const renderDateHeader = (group: GroupedEntry) => (
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border pr-1 pl-4">
        <button
          type="button"
          aria-expanded={!isDateCollapsed(group.date)}
          onClick={() => toggleDateCollapse(group.date)}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-2 text-left"
        >
          <motion.span
            animate={{ rotate: isDateCollapsed(group.date) ? -90 : 0 }}
            transition={{ duration: DURATIONS.instant }}
            className="shrink-0 text-muted"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </motion.span>
          <h3 className="truncate text-sm font-medium text-foreground">
            {formatDate(group.date)}
          </h3>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <MacroSplitBar
            protein={group.totals.protein}
            carbs={group.totals.carbs}
            fats={group.totals.fats}
            className="w-12"
          />
          <Value value={group.totals.calories} unit="kcal" />
          <IconButton
            variant="custom"
            className="text-muted hover:text-error"
            icon={<TrashIcon className="h-4 w-4" />}
            onClick={(event) => handleDeleteDate(group.date, event)}
            ariaLabel={`Delete all entries for ${formatDate(group.date)}`}
          />
        </div>
      </div>
    );

    // In the open day rather than its header, which has no room left on a phone.
    const renderCopyDay = (group: GroupedEntry) =>
      canCopyDate(group.date) && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            buttonSize="sm"
            leftIcon={<CopyIcon className="h-4 w-4" />}
            text="Copy to today"
            onClick={(event) => handleCopyDate(group.date, event)}
          />
        </div>
      );

    const renderEntryCard = (entry: MacroEntry, index?: number) => {
      const card = (
        <EntryCard
          entry={entry}
          onOpen={setOpenEntry}
          isDeleting={isDeleting(entry.clientId)}
          formatTimeFromEntry={formatTimeFromEntry}
          capitalizeFirstLetter={capitalizeFirstLetter}
          calculateCalories={calculateCalories}
          isMealSaved={isMealSaved(entry.clientId)}
          isSelectionMode={isSelectionMode}
          isSelected={isEntrySelected(entry.clientId)}
          onToggleSelection={onToggleEntrySelection}
        />
      );

      if (typeof index !== "number") {
        return card;
      }

      return (
        <motion.div
          key={entry.clientId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.05,
            duration: 0.3,
            ease: "easeOut",
          }}
        >
          {card}
        </motion.div>
      );
    };

    const actionsSheet = (
      <EntryActionsSheet
        entry={openEntry}
        isMealSaved={openEntry ? isMealSaved(openEntry.clientId) : false}
        onClose={() => setOpenEntry(null)}
        onEdit={onEdit}
        onDelete={deleteEntry}
        onLogAgain={onLogAgain}
        onCopyOrMove={onCopyOrMove}
        onSaveMeal={onSaveMeal}
        onUnsaveMeal={onUnsaveMeal}
      />
    );

    if (shouldVirtualize) {
      const items = virtualizer.getVirtualItems();

      return (
        <div
          ref={containerReference}
          className="max-h-[70vh] overflow-auto md:hidden"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {items.map((virtualRow) => {
              const item = virtualItems[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item.type === "header" ? (
                    <div className="border-b border-border">
                      {renderDateHeader(item.group)}
                      {!isDateCollapsed(item.group.date) &&
                        canCopyDate(item.group.date) && (
                        <div className="px-4 pt-3">
                          {renderCopyDay(item.group)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-b border-border">
                      {renderEntryCard(item.entry)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {actionsSheet}
        </div>
      );
    }

    return (
      <div className="md:hidden">
        <AnimatePresence>
          {groupedEntries.map((group) => (
            <motion.div
              key={group.date}
              className="border-b border-border last:border-b-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderDateHeader(group)}

              <AnimatePresence>
                {!isDateCollapsed(group.date) && (
                  <motion.div
                    className="overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      transition: {
                        height: { duration: 0.4, ease: "easeInOut" },
                        opacity: { duration: 0.2, delay: 0.1 },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: { duration: 0.3, ease: "easeInOut" },
                        opacity: { duration: 0.1 },
                      },
                    }}
                  >
                    {canCopyDate(group.date) && (
                      <div className="px-4 pt-3">{renderCopyDay(group)}</div>
                    )}
                    <div className="divide-y divide-border">
                      {group.entries.map((entry, index) =>
                        renderEntryCard(entry, index),
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
        {actionsSheet}
      </div>
    );
  },
);

MobileEntryCards.displayName = "MobileEntryCards";

export default MobileEntryCards;
