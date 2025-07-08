import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { ChevronDownIcon } from "@/components/Icons";
import { MacroCell } from "@/components/nutrition";
import { ActionButtonGroup, ActionButton } from "@/components/form";
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
  handleDeleteDate: (date: string, e: React.MouseEvent) => void;
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

    // Define columns
    const columns = useMemo(
      () => [
        columnHelper.accessor("date", {
          header: "Time",
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) {
              return (
                <div className="flex items-center gap-2 font-semibold text-indigo-300 text-sm">
                  <motion.div
                    animate={{
                      rotate: collapsedDates.has(data.date) ? -90 : 0,
                    }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </motion.div>
                  {formatDate(data.date)}
                </div>
              );
            } else {
              const entry = data.entries[0];
              return (
                <div className="pl-11 text-sm text-gray-300 whitespace-nowrap">
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
            if (data.isGroup) return null;

            const entry = data.entries[0];
            return (
              <div className="text-sm text-gray-300 text-center">
                <span className="font-medium text-indigo-300">
                  {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
                </span>
                {(entry.foodName || entry.mealName) && (
                  <span className="text-gray-400 block text-xs mt-0.5">
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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Protein
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.protein
              : data.entries[0].protein;
            return (
              <MacroCell value={value} suffix="g" color="text-green-400" />
            );
          },
        }),
        columnHelper.accessor("totals.carbs", {
          header: () => (
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Carbs
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.carbs
              : data.entries[0].carbs;
            return <MacroCell value={value} suffix="g" color="text-blue-400" />;
          },
        }),
        columnHelper.accessor("totals.fats", {
          header: () => (
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Fats
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.fats
              : data.entries[0].fats;
            return <MacroCell value={value} suffix="g" color="text-red-400" />;
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
                  data.entries[0].fats
                );
            return (
              <MacroCell value={value} suffix=" kcal" color="text-white" />
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
                <ActionButton
                  variant="delete"
                  size="sm"
                  onClick={(e: React.MouseEvent) =>
                    handleDeleteDate(data.date, e)
                  }
                  ariaLabel={`Delete all entries for ${formatDate(data.date)}`}
                  className="opacity-0 group-hover:opacity-100"
                />
              );
            } else {
              const entry = data.entries[0];
              return (
                <ActionButtonGroup
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
      ]
    );

    // Initialize table
    const table = useReactTable({
      data: tableData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    return (
      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-lg border border-gray-700/50">
          <table className="w-full table-fixed bg-gray-800/40">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50"
                      style={{ width: "14.285%" }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {table.getRowModel().rows.map((row) => {
                  const data = row.original;
                  const isGroup = data.isGroup;
                  const parentDate = data.parentDate || data.date;

                  // Skip rendering individual entries if their parent date is collapsed
                  const isEntryCollapsed =
                    !isGroup && collapsedDates.has(parentDate);

                  // Better key for animations that includes parent date for individual entries
                  const animationKey = isGroup
                    ? `group-${data.date}`
                    : `entry-${data.entries[0].id}-${parentDate}`;

                  // Don't render collapsed entries
                  if (isEntryCollapsed) {
                    return null;
                  }

                  return (
                    <motion.tr
                      key={animationKey}
                      className={
                        isGroup
                          ? "bg-indigo-600/10 border-t border-b border-indigo-500/20 cursor-pointer hover:bg-indigo-600/20 transition-colors group"
                          : "border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                      }
                      onClick={
                        isGroup
                          ? () => toggleDateCollapse(data.date)
                          : undefined
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

DesktopEntryTable.displayName = "DesktopEntryTable";

export default DesktopEntryTable;
