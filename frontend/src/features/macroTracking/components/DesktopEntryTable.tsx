import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";
import { memo, useMemo, useRef } from "react";

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
  }: DesktopEntryTableProps) => {
    const tableContainerReference = useRef<HTMLDivElement>(null);

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
              return (
                <div className="pl-11 text-sm whitespace-nowrap text-foreground">
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
                <IconButton
                  variant="delete"
                  buttonSize="sm"
                  onClick={(event: React.MouseEvent) =>
                    handleDeleteDate(data.date, event)
                  }
                  ariaLabel={`Delete all entries for ${formatDate(data.date)}`}
                  className="opacity-0 group-hover:opacity-100"
                />
              );
            } else {
              const entry = data.entries[0];
              return (
                <IconButtonGroup
                  onEdit={() => onEdit(entry)}
                  onDelete={() => deleteEntry(entry.id)}
                  isDeleting={isDeleting}
                />
              );
            }
          },
        }),
      ],
      [
        collapsedDates,
        formatDate,
        formatTimeFromEntry,
        capitalizeFirstLetter,
        calculateCalories,
        handleDeleteDate,
        onEdit,
        deleteEntry,
        isDeleting,
      ],
    );

    const table = useReactTable({
      data: tableData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

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
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`flex items-center overflow-hidden ${
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
                className={`flex w-full items-center overflow-hidden ${
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
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="flex h-full items-center justify-center px-4 py-2.5 text-center"
                    style={{ width: "14.285%" }}
                  >
                    <div className="w-full">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                ))}
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
          className={`overflow-hidden rounded-xl border border-border/60 bg-surface shadow-xs ${shouldVirtualize ? "max-h-[600px] overflow-auto" : ""}`}
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
