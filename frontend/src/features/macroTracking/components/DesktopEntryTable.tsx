import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  type Row,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";

import {
  ChevronDownIcon,
  CopyIcon,
  IconButton,
  MoreVerticalIcon,
  StarIcon,
  TrashIcon,
} from "@/components/ui";
import Value from "@/components/ui/Value";
import { DURATIONS } from "@/components/utils/UiConstants";
import { cn } from "@/lib/classnameUtilities";
import type { MacroEntry } from "@/types/macro";

import { EntryActionsSheet } from "./EntryActionsSheet";
import { useEntryHistoryController } from "./EntryHistoryContext";
import { DESKTOP_ROW_GRID, type GroupedEntry } from "./EntryHistoryShared";
import { IngredientsList } from "./IngredientsList";
import { MacroSplitBar } from "./MacroSplitBar";
import { PendingSyncMarker } from "./PendingSyncMarker";

interface DesktopEntryTableProps {
  groupedEntries: GroupedEntry[];
}

type TableRowData = GroupedEntry & {
  isGroup: boolean;
  parentDate?: string;
};

const columnHelper = createColumnHelper<TableRowData>();

const cellAlign = (columnId: string) =>
  columnId === "entries" || columnId === "split" ? "min-w-0" : "flex justify-end";

const MACRO_COLUMNS = [
  { key: "protein", label: "Protein", dot: "bg-protein" },
  { key: "carbs", label: "Carbs", dot: "bg-carbs" },
  { key: "fats", label: "Fats", dot: "bg-fats" },
] as const;

const DesktopEntryTable = memo(
  ({ groupedEntries }: DesktopEntryTableProps) => {
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

    const tableContainerReference = useRef<HTMLDivElement>(null);
    const [openEntry, setOpenEntry] = useState<MacroEntry | null>(null);
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
      new Set(),
    );

    const toggleEntryExpand = (id: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setExpandedEntries((previous) => {
        const newSet = new Set(previous);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }

        return newSet;
      });
    };

    // Transform data for TanStack Table
    const tableData = useMemo(() => {
      // Always include all rows (both group headers and individual entries)
      // but mark them for conditional rendering based on collapsed state
      const data: TableRowData[] = groupedEntries.flatMap((group) => [
        { ...group, isGroup: true },
        // Always include individual entries - we'll handle visibility in the render
        ...group.entries.map((entry) => ({
          ...group,
          isGroup: false,
          entries: [entry], // Wrap single entry for consistency
          parentDate: group.date,
        })),
      ]);

      return data;
    }, [groupedEntries]);

    const columns = useMemo(
      () => [
        columnHelper.accessor("entries", {
          header: "Food",
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) {
              return (
                <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-foreground">
                  <motion.span
                    key={`chevron-${data.date}`}
                    initial={false}
                    animate={{ rotate: isDateCollapsed(data.date) ? -90 : 0 }}
                    transition={{ duration: DURATIONS.instant }}
                    className="text-muted"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </motion.span>
                  {formatDate(data.date)}
                </div>
              );
            }

            const entry = data.entries[0];
            const name = entry.foodName ?? entry.mealName;
            const mealType = entry.mealType ? capitalizeFirstLetter(entry.mealType) : "";
            const hasIngredients = Boolean(
              entry.ingredients && entry.ingredients.length > 1,
            );

            return (
              <div className="flex min-w-0 items-center gap-2 pl-6">
                {isSelectionMode && (
                  <input
                    type="checkbox"
                    aria-label={`Select ${name ?? mealType}`}
                    className="h-4 w-4 shrink-0 rounded-control border-border accent-primary"
                    checked={isEntrySelected(entry.clientId)}
                    onClick={(event_) => event_.stopPropagation()}
                    onChange={() => onToggleEntrySelection?.(entry.clientId)}
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{name ?? mealType}</p>
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <span className="tabular-nums">{formatTimeFromEntry(entry)}</span>
                    {name ? <span>{mealType}</span> : null}
                    {isMealSaved(entry.clientId) && (
                      <StarIcon
                        aria-label="Saved meal"
                        className="h-3 w-3 fill-current text-primary"
                      />
                    )}
                    <PendingSyncMarker entry={entry} />
                  </p>
                </div>
                {hasIngredients && (
                  <button
                    type="button"
                    className="ml-auto shrink-0 cursor-pointer rounded-control p-1 text-muted hover:bg-surface-3 hover:text-foreground"
                    onClick={(event_) => toggleEntryExpand(entry.clientId, event_)}
                    aria-expanded={expandedEntries.has(entry.clientId)}
                    aria-label="Show ingredients"
                  >
                    <motion.span
                      className="block"
                      initial={false}
                      animate={{
                        rotate: expandedEntries.has(entry.clientId) ? -180 : 0,
                      }}
                      transition={{ duration: DURATIONS.instant }}
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </motion.span>
                  </button>
                )}
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "split",
          header: () => <span className="sr-only">Calorie split</span>,
          cell: ({ row }) => {
            const { protein, carbs, fats } = row.original.isGroup
              ? row.original.totals
              : row.original.entries[0];

            return <MacroSplitBar protein={protein} carbs={carbs} fats={fats} />;
          },
        }),
        ...MACRO_COLUMNS.map((macro) =>
          columnHelper.accessor(`totals.${macro.key}`, {
            header: () => (
              <span className="flex items-center justify-end gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", macro.dot)} />
                {macro.label}
              </span>
            ),
            cell: ({ row }) => {
              const data = row.original;
              const value = data.isGroup
                ? data.totals[macro.key]
                : data.entries[0][macro.key];

              return <Value value={value} unit="g" />;
            },
          }),
        ),
        columnHelper.accessor("totals.calories", {
          header: () => <span className="block text-right">Calories</span>,
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.calories
              : calculateCalories(
                  data.entries[0].protein,
                  data.entries[0].carbs,
                  data.entries[0].fats,
                );

            return <Value value={value} unit="kcal" />;
          },
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) {
              return (
                <div className="flex items-center justify-end gap-1">
                  {canCopyDate(data.date) && (
                    <IconButton
                      variant="custom"
                      buttonSize="sm"
                      className="text-muted hover:text-foreground"
                      icon={<CopyIcon className="h-4 w-4" />}
                      onClick={(event: React.MouseEvent) =>
                        handleCopyDate(data.date, event)
                      }
                      ariaLabel={`Copy ${formatDate(data.date)} to today`}
                    />
                  )}
                  <IconButton
                    variant="custom"
                    buttonSize="sm"
                    className="text-muted hover:text-error"
                    icon={<TrashIcon className="h-4 w-4" />}
                    onClick={(event: React.MouseEvent) =>
                      handleDeleteDate(data.date, event)
                    }
                    ariaLabel={`Delete all entries for ${formatDate(data.date)}`}
                  />
                </div>
              );
            }

            const entry = data.entries[0];

            return (
              <div className="flex justify-end">
                <IconButton
                  variant="custom"
                  buttonSize="sm"
                  className="text-muted hover:text-foreground"
                  icon={<MoreVerticalIcon className="h-4 w-4" />}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    setOpenEntry(entry);
                  }}
                  ariaLabel={`Actions for ${entry.foodName ?? entry.mealName ?? "entry"}`}
                />
              </div>
            );
          },
        }),
      ],
      [
        expandedEntries,
        formatDate,
        formatTimeFromEntry,
        capitalizeFirstLetter,
        calculateCalories,
        isDateCollapsed,
        handleDeleteDate,
        canCopyDate,
        handleCopyDate,
        isMealSaved,
        isSelectionMode,
        isEntrySelected,
        onToggleEntrySelection,
      ],
    );

    const table = useReactTable({
      data: tableData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getRowId: (row) =>
        row.isGroup ? `group-${row.date}` : `entry-${row.entries[0]?.id}`,
    });

    const visibleTableRows = useMemo(() => {
      return table.getRowModel().rows.filter((row) => {
        const data = row.original;
        if (data.isGroup) {
          return true;
        }

        const parentDate = data.parentDate ?? data.date;

        return !isDateCollapsed(parentDate);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, tableData, isDateCollapsed]);

    const shouldVirtualize = visibleTableRows.length > 50;

    const virtualizer = useVirtualizer({
      count: visibleTableRows.length,
      getScrollElement: () => tableContainerReference.current,
      estimateSize: () => 48,
      getItemKey: useCallback(
        (index: number) => {
          const row = visibleTableRows[index];
          if (!row) return index;
          const data = row.original;
          const parentDate = data.parentDate ?? data.date;

          const entryKey = data.entries[0]?.clientId ?? data.entries[0]?.id;

          return data.isGroup
            ? `group-${data.date}`
            : `entry-${entryKey}-${parentDate}`;
        },
        [visibleTableRows],
      ),
      overscan: 10,
    });

    const renderRow = (
      row: Row<TableRowData>,
      data: TableRowData,
      isVirtualized: boolean,
      virtualRowProps?: {
        index: number;
        start: number;
        measureRef: (el: HTMLDivElement | null) => void;
      },
    ) => {
      const isGroup = data.isGroup;
      const parentDate = data.parentDate ?? data.date;
      const entryKey = data.entries[0]?.clientId ?? data.entries[0]?.id;
      const animationKey = isGroup
        ? `group-${data.date}`
        : `entry-${entryKey}-${parentDate}`;

      // The row is the control, as on a phone: a day opens or closes, an
      // entry opens its actions. One icon stays in reach for the pointer.
      const entry = data.entries[0];
      const commonProps = {
        className: cn(
          "flex w-full cursor-pointer flex-col overflow-hidden border-b border-border transition-colors duration-200 hover:bg-surface-2",
          !isGroup && isDeleting(entry.clientId) && "opacity-50",
        ),
        onClick: isGroup
          ? () => toggleDateCollapse(data.date)
          : () =>
              isSelectionMode
                ? onToggleEntrySelection?.(entry.clientId)
                : setOpenEntry(entry),
      };

      const motionProps = isVirtualized
        ? {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 0.15 },
            style: {
              position: "absolute" as const,
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRowProps?.start}px)`,
            },
            ref: virtualRowProps?.measureRef,
            "data-index": virtualRowProps?.index,
          }
        : {
            initial: { height: 0, opacity: 0 },
            animate: { height: "auto", opacity: 1 },
            exit: { height: 0, opacity: 0 },
            transition: {
              height: { duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.2 },
            },
            layout: true,
          };

      return (
        <motion.div key={animationKey} {...commonProps} {...motionProps}>
          <div className={cn(DESKTOP_ROW_GRID, "min-h-14 py-2")}>
            {row?.getVisibleCells().map((cell) => (
              <div key={cell.id} className={cellAlign(cell.column.id)}>
                {
                  flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  ) as React.ReactNode
                }
              </div>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {!isGroup &&
              (data.entries[0].ingredients?.length ?? 0) > 1 &&
              expandedEntries.has(data.entries[0].clientId) && (
                <IngredientsList
                  ingredients={data.entries[0].ingredients ?? []}
                  calculateCalories={calculateCalories}
                />
              )}
          </AnimatePresence>
        </motion.div>
      );
    };

    const renderVirtualizedBody = () => {
      const virtualItems = virtualizer.getVirtualItems();

      return (
        <div
          style={{
            position: "relative",
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const row = visibleTableRows[virtualRow.index];
            if (!row) {
              return null;
            }

            const data = row.original;

            return renderRow(row, data, true, {
              index: virtualRow.index,
              start: virtualRow.start,
              measureRef: virtualizer.measureElement,
            });
          })}
        </div>
      );
    };

    const renderNonVirtualizedBody = () => (
      <div className="flex w-full flex-col">
        <AnimatePresence initial={false}>
          {visibleTableRows.map((row) => {
            const data = row.original;

            return renderRow(row, data, false);
          })}
        </AnimatePresence>
      </div>
    );

    return (
      <div className="hidden md:block">
        <div
          ref={tableContainerReference}
          className={shouldVirtualize ? "max-h-150 overflow-auto" : undefined}
        >
          <div className="flex w-full flex-col">
            <div
              className={cn(
                "border-b border-border bg-surface",
                shouldVirtualize && "sticky top-0 z-10",
              )}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className={cn(DESKTOP_ROW_GRID, "py-2.5")}>
                  {headerGroup.headers.map((header) => (
                    <div
                      key={header.id}
                      className={cn("text-xs text-muted", cellAlign(header.column.id))}
                    >
                      {header.isPlaceholder
                        ? undefined
                        : (flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          ) as React.ReactNode)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {shouldVirtualize
              ? renderVirtualizedBody()
              : renderNonVirtualizedBody()}
          </div>
        </div>
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
      </div>
    );
  },
);

DesktopEntryTable.displayName = "DesktopEntryTable";

export default DesktopEntryTable;
