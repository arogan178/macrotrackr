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

// Types
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

// Combined type for table rows - can be either a date group or individual entry
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
    }, [groupedEntries, showAllDates]); // Remove collapsedDates from dependencies

    // Filter visible rows (exclude collapsed entries)
    const visibleRows = useMemo(() => {
      return tableData.filter((data) => {
        if (data.isGroup) return true;
        const parentDate = data.parentDate || data.date;
        return !collapsedDates.has(parentDate);
      });
    }, [tableData, collapsedDates]);

    // Calculate total entries for virtualization threshold
    const totalEntries = useMemo(() => {
      return groupedEntries.reduce(
        (sum, group) => sum + group.entries.length,
        0,
      );
    }, [groupedEntries]);

    // Only virtualize when we have more than 50 entries
    const shouldVirtualize = totalEntries > 50;

    // Virtualizer for large lists
    const virtualizer = useVirtualizer({
      count: visibleRows.length,
      getScrollElement: () => tableContainerReference.current,
      estimateSize: () => 48, // Approximate row height
      overscan: 10,
    });

    // Define columns
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
              <div className="text-center text-sm text-foreground">
                <span className="font-medium text-muted">
                  {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
                </span>
                {(entry.foodName || entry.mealName) && (
                  <span className="mt-0.5 block text-xs text-foreground">
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

    // Initialize table
    const table = useReactTable({
      data: tableData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    // Virtualized table body for large lists
    const renderVirtualizedBody = () => {
      const virtualItems = virtualizer.getVirtualItems();

      return (
        <tbody
          style={{
            display: "block",
            position: "relative",
            height: `${virtualizer.getTotalSize()}px`,
          }}
        >
          <AnimatePresence initial={false}>
            {virtualItems.map((virtualRow) => {
              const data = visibleRows[virtualRow.index];
              return (
                <motion.tr
                  key={`virtual-${virtualRow.key}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={
                    data.isGroup
                      ? "group cursor-pointer border-t border-b border-primary/20 bg-primary/20 transition-colors hover:bg-primary/20"
                      : "border-b border-border/30 transition-colors hover:bg-surface/20"
                  }
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
                      <td
                        key={cell.id}
                        className="px-4 py-2.5 text-center"
                        style={{ width: "14.285%", display: "inline-block" }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      );
    };

    // Non-virtualized table body for smaller lists
    const renderNonVirtualizedBody = () => (
      <tbody>
        <AnimatePresence initial={false}>
          {table.getRowModel().rows.map((row) => {
            const data = row.original;
            const isGroup = data.isGroup;
            const parentDate = data.parentDate || data.date;

            // Skip rendering individual entries if their parent date is collapsed
            const isEntryCollapsed = !isGroup && collapsedDates.has(parentDate);

            // Better key for animations that includes parent date for individual entries
            const animationKey = isGroup
              ? `group-${data.date}`
              : `entry-${data.entries[0].id}-${parentDate}`;

            // Don't render collapsed entries
            if (isEntryCollapsed) {
              return;
            }

            return (
              <motion.tr
                key={animationKey}
                className={
                  isGroup
                    ? "group cursor-pointer border-t border-b border-primary/20 bg-primary/20 transition-colors hover:bg-primary/20"
                    : "border-b border-border/30 transition-colors hover:bg-surface/20"
                }
                onClick={
                  isGroup ? () => toggleDateCollapse(data.date) : undefined
                }
                initial={{
                  opacity: 0,
                  y: isGroup ? 0 : -8,
                  scaleY: isGroup ? 1 : 0.8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scaleY: 1,
                }}
                exit={{
                  opacity: 0,
                  y: isGroup ? 0 : -8,
                  scaleY: isGroup ? 1 : 0.8,
                }}
                transition={{
                  duration: 0.2,
                  delay: isGroup ? 0 : 0.02,
                  ease: "easeInOut",
                  opacity: { duration: 0.15 },
                  y: { duration: 0.2 },
                  scaleY: { duration: 0.2 },
                }}
                layout
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-2.5 text-center"
                    style={{ width: "14.285%" }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
    );

    return (
      <div className="hidden lg:block">
        <div
          ref={tableContainerReference}
          className={`overflow-hidden rounded-lg border border-border ${shouldVirtualize ? "max-h-[600px] overflow-auto" : ""}`}
        >
          <table className="w-full table-fixed bg-surface">
            <thead
              className={
                shouldVirtualize ? "sticky top-0 z-10 bg-surface/95" : ""
              }
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="border-b border-border px-4 py-3 text-center text-xs font-medium tracking-wider text-foreground uppercase"
                      style={{ width: "14.285%" }}
                    >
                      {header.isPlaceholder
                        ? undefined
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {shouldVirtualize
              ? renderVirtualizedBody()
              : renderNonVirtualizedBody()}
          </table>
        </div>
      </div>
    );
  },
);

DesktopEntryTable.displayName = "DesktopEntryTable";

export default DesktopEntryTable;
