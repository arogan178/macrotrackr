import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";
import React, { memo, useMemo, useRef, useState } from "react";

import { MacroCell } from "@/components/macros";
import { ChevronDownIcon, IconButton, IconButtonGroup } from "@/components/ui";
import { MacroEntry } from "@/types/macro";

interface GroupedEntry {
  date: string;
  entries: MacroEntry[];
  totals: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
}

interface DesktopEntryTableProps {
  groupedEntries: GroupedEntry[];
  collapsedDates: Set<string>;
  formatDate: (dateString: string) => string;
  formatTimeFromEntry: (entry: MacroEntry) => string;
  capitalizeFirstLetter: (string: string) => string;
  calculateCalories: (protein: number, carbs: number, fats: number) => number;
  toggleDateCollapse: (date: string) => void;
  handleDeleteDate: (date: string, event: React.MouseEvent) => void;
  onEdit: (entry: MacroEntry) => void;
  deleteEntry: (id: number) => void;
  isDeleting: boolean;
  showAllDates?: boolean;
  onSaveMeal?: (entry: MacroEntry) => void;
  onUnsaveMeal?: (entry: MacroEntry) => void;
  savedMealIds?: Set<number>;
  isSelectionMode?: boolean;
  selectedEntryIds?: Set<number>;
  onToggleEntrySelection?: (id: number) => void;
}

type TableRowData = GroupedEntry & {
  isGroup: boolean;
  parentDate?: string;
};

const columnHelper = createColumnHelper<TableRowData>();

const DesktopEntryTable = memo(
  ({
    groupedEntries,
    collapsedDates,
    formatDate,
    formatTimeFromEntry,
    capitalizeFirstLetter,
    calculateCalories,
    toggleDateCollapse,
    handleDeleteDate,
    onEdit,
    deleteEntry,
    isDeleting,
    showAllDates = true,
    onSaveMeal,
    onUnsaveMeal,
    savedMealIds = new Set(),
    isSelectionMode = false,
    selectedEntryIds = new Set(),
    onToggleEntrySelection,
  }: DesktopEntryTableProps) => {
    const tableContainerReference = useRef<HTMLDivElement>(null);
    const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
      new Set(),
    );

    const toggleEntryExpand = (id: number, event: React.MouseEvent) => {
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
      // If showAllDates is true, use all entries, otherwise limit to first 5
      const entriesToProcess = showAllDates
        ? groupedEntries
        : groupedEntries.slice(0, 5);

      // Always include all rows (both group headers and individual entries)
      // but mark them for conditional rendering based on collapsed state
      const data: TableRowData[] = entriesToProcess.flatMap((group) => [
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
    }, [groupedEntries, showAllDates]);

    const visibleRows = useMemo(() => {
      return tableData.filter((data) => {
        if (data.isGroup) return true;
        const parentDate = data.parentDate || data.date;
        return !collapsedDates.has(parentDate);
      });
    }, [tableData, collapsedDates]);

    const totalEntries = useMemo(() => {
      return groupedEntries.reduce(
        (sum, group) => sum + group.entries.length,
        0,
      );
    }, [groupedEntries]);

    const shouldVirtualize = totalEntries > 50;

    const virtualizer = useVirtualizer({
      count: visibleRows.length,
      getScrollElement: () => tableContainerReference.current,
      estimateSize: () => 48,
      overscan: 10,
    });

    const columns = useMemo(
      () => [
        columnHelper.accessor("date", {
          header: "Time",
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) {
              return (
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <motion.div
                    key={`chevron-${data.date}`}
                    initial={false}
                    animate={{
                      rotate: collapsedDates.has(data.date) ? -90 : 0,
                    }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <ChevronDownIcon className="h-4 w-4 " />
                  </motion.div>
                  {formatDate(data.date)}
                </div>
              );
            } else {
              const entry = data.entries[0];
              const hasIngredients =
                entry.ingredients && entry.ingredients.length > 0;
              return (
                <div className="flex items-center gap-2 pl-6 text-sm whitespace-nowrap text-foreground">
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
                      checked={selectedEntryIds.has(entry.id)}
                      onChange={(event_) => {
                        event_.stopPropagation();
                        onToggleEntrySelection?.(entry.id);
                      }}
                    />
                  )}
                  {hasIngredients && (
                    <button
                      type="button"
                      className="cursor-pointer rounded-md p-1 hover:bg-surface-3"
                      onClick={(event_) => toggleEntryExpand(entry.id, event_)}
                      aria-label="Toggle ingredients"
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          rotate: expandedEntries.has(entry.id) ? -180 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </motion.div>
                    </button>
                  )}
                  {formatTimeFromEntry(entry)}
                </div>
              );
            }
          },
        }),
        columnHelper.accessor("entries", {
          header: "Meal",
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) return;

            const entry = data.entries[0];
            return (
              <div className="flex flex-col items-center text-center text-sm text-foreground">
                <span className="rounded-full border border-border/50 bg-surface-2 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted uppercase">
                  {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
                </span>
                {(entry.foodName || entry.mealName) && (
                  <span className="mt-1 block text-xs font-medium text-foreground">
                    {entry.foodName || entry.mealName}
                  </span>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("totals.protein", {
          header: () => (
            <div className="flex items-center justify-center gap-1">
              <div className="h-2 w-2 rounded-full bg-protein"></div>
              Protein
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.protein
              : data.entries[0].protein;
            return <MacroCell value={value} suffix="g" color="text-protein" />;
          },
        }),
        columnHelper.accessor("totals.carbs", {
          header: () => (
            <div className="flex items-center justify-center gap-1">
              <div className="h-2 w-2 rounded-full bg-carbs"></div>
              Carbs
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.carbs
              : data.entries[0].carbs;
            return <MacroCell value={value} suffix="g" color="text-carbs" />;
          },
        }),
        columnHelper.accessor("totals.fats", {
          header: () => (
            <div className="flex items-center justify-center gap-1">
              <div className="h-2 w-2 rounded-full bg-fats"></div>
              Fats
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.fats
              : data.entries[0].fats;
            return <MacroCell value={value} suffix="g" color="text-fats" />;
          },
        }),
        columnHelper.accessor("totals.calories", {
          header: "Calories",
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.calories
              : calculateCalories(
                  data.entries[0].protein,
                  data.entries[0].carbs,
                  data.entries[0].fats,
                );
            return (
              <MacroCell value={value} suffix=" kcal" color="text-foreground" />
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: "Actions",
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) {
              return (
                <div className="flex w-full items-center justify-center">
                  <IconButton
                    variant="delete"
                    buttonSize="sm"
                    onClick={(event: React.MouseEvent) =>
                      handleDeleteDate(data.date, event)
                    }
                    ariaLabel={`Delete all entries for ${formatDate(data.date)}`}
                  />
                </div>
              );
            } else {
              const entry = data.entries[0];
              return (
                <IconButtonGroup
                  onEdit={() => onEdit(entry)}
                  onDelete={() => deleteEntry(entry.id)}
                  isDeleting={isDeleting}
                  onSaveMeal={onSaveMeal ? () => onSaveMeal(entry) : undefined}
                  onUnsaveMeal={
                    onUnsaveMeal ? () => onUnsaveMeal(entry) : undefined
                  }
                  isMealSaved={savedMealIds.has(entry.id)}
                />
              );
            }
          },
        }),
      ],
      [
        collapsedDates,
        expandedEntries,
        formatDate,
        formatTimeFromEntry,
        capitalizeFirstLetter,
        calculateCalories,
        handleDeleteDate,
        onEdit,
        deleteEntry,
        isDeleting,
        onSaveMeal,
        onUnsaveMeal,
        savedMealIds,
        isSelectionMode,
        selectedEntryIds,
        onToggleEntrySelection,
      ],
    );

    const table = useReactTable({
      data: tableData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    const renderIngredients = (entry: MacroEntry) => {
      if (!entry.ingredients || entry.ingredients.length === 0) return null;
      return (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            height: { duration: 0.3, ease: "easeInOut" },
            opacity: { duration: 0.2 },
          }}
          className="w-full overflow-hidden border-t border-border/40 bg-surface-2/40"
        >
          <div className="flex flex-col gap-2 px-[10%] py-3">
            {entry.ingredients.map((ing, index) => (
              <div key={index} className="flex items-center text-xs text-muted">
                <div className="flex-1 font-medium text-foreground">
                  {ing.name}{" "}
                  {ing.quantity ? `(${ing.quantity}${ing.unit || ""})` : ""}
                </div>
                <div className="w-[14%] text-center">
                  <MacroCell
                    value={ing.protein}
                    suffix="g"
                    color="text-protein"
                  />
                </div>
                <div className="w-[14%] text-center">
                  <MacroCell value={ing.carbs} suffix="g" color="text-carbs" />
                </div>
                <div className="w-[14%] text-center">
                  <MacroCell value={ing.fats} suffix="g" color="text-fats" />
                </div>
                <div className="w-[14%] text-center">
                  <MacroCell
                    value={calculateCalories(ing.protein, ing.carbs, ing.fats)}
                    suffix=" kcal"
                    color="text-foreground"
                  />
                </div>
                <div className="w-[14%]"></div>
              </div>
            ))}
          </div>
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
          <AnimatePresence initial={false}>
            {virtualItems.map((virtualRow) => {
              const data = visibleRows[virtualRow.index];
              return (
                <motion.div
                  key={`virtual-${virtualRow.key}`}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`flex flex-col overflow-hidden ${
                    data.isGroup
                      ? "group cursor-pointer border-y border-border/60 bg-surface-2/30 transition-colors hover:bg-surface-2"
                      : "relative border-b border-border/40 transition-colors after:absolute after:inset-y-0 after:left-0 after:w-0.5 after:bg-transparent after:transition-colors hover:bg-surface-2/60 hover:after:bg-primary/50"
                  }`}
                  onClick={
                    data.isGroup
                      ? () => toggleDateCollapse(data.date)
                      : undefined
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex w-full items-center">
                    {table
                      .getRowModel()
                      .rows.find((row) => {
                        const rowData = row.original;
                        if (rowData.isGroup) return rowData.date === data.date;
                        return rowData.entries[0].id === data.entries[0].id;
                      })
                      ?.getVisibleCells()
                      .map((cell) => (
                        <div
                          key={cell.id}
                          className="flex min-h-12 items-center justify-center px-4 py-2.5 text-center"
                          style={{ width: "14.285%" }}
                        >
                          <div className="w-full">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  <AnimatePresence initial={false}>
                    {!data.isGroup &&
                      expandedEntries.has(data.entries[0].id) &&
                      renderIngredients(data.entries[0])}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      );
    };

    const renderNonVirtualizedBody = () => (
      <div className="flex w-full flex-col">
        <AnimatePresence initial={false}>
          {table.getRowModel().rows.map((row) => {
            const data = row.original;
            const isGroup = data.isGroup;
            const parentDate = data.parentDate || data.date;

            const isEntryCollapsed = !isGroup && collapsedDates.has(parentDate);

            const animationKey = isGroup
              ? `group-${data.date}`
              : `entry-${data.entries[0].id}-${parentDate}`;

            if (isEntryCollapsed) {
              return null;
            }

            return (
              <motion.div
                key={animationKey}
                className={`flex w-full flex-col overflow-hidden ${
                  isGroup
                    ? "group cursor-pointer border-y border-border/60 bg-surface-2/30 transition-colors hover:bg-surface-2"
                    : "relative border-b border-border/40 transition-colors after:absolute after:inset-y-0 after:left-0 after:w-0.5 after:bg-transparent after:transition-colors hover:bg-surface-2/60 hover:after:bg-primary/50"
                }`}
                onClick={
                  isGroup ? () => toggleDateCollapse(data.date) : undefined
                }
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: "auto",
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  height: { duration: 0.3, ease: "easeInOut" },
                  opacity: { duration: 0.2 },
                }}
                layout
              >
                <div className="flex w-full items-center">
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="flex h-full items-center justify-center px-4 py-2.5 text-center"
                      style={{ width: "14.285%" }}
                    >
                      <div className="w-full">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <AnimatePresence initial={false}>
                  {!isGroup &&
                    expandedEntries.has(data.entries[0].id) &&
                    renderIngredients(data.entries[0])}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );

    return (
      <div className="hidden lg:block">
        <div
          ref={tableContainerReference}
          className={`overflow-hidden rounded-xl border border-border/60 bg-surface shadow-xs ${shouldVirtualize ? "max-h-150 overflow-auto" : ""}`}
        >
          <div className="flex w-full flex-col">
            <div
              className={`flex w-full border-b border-border/60 bg-surface-2/80 ${
                shouldVirtualize ? "sticky top-0 z-10" : ""
              }`}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className="flex w-full">
                  {headerGroup.headers.map((header) => (
                    <div
                      key={header.id}
                      className="flex items-center justify-center px-4 py-3 text-center text-[10px] font-medium tracking-wider text-muted uppercase"
                      style={{ width: "14.285%" }}
                    >
                      {header.isPlaceholder
                        ? undefined
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
      </div>
    );
  },
);

DesktopEntryTable.displayName = "DesktopEntryTable";

export default DesktopEntryTable;
