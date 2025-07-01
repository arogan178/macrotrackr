import React from "react";
import { ProBadge } from "@/components/ProBadge";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface PricingTableProps {
  onUpgrade?: () => void;
}

interface FeatureRow {
  feature: string;
  free: boolean;
  pro: boolean;
}

/**
 * PricingTable - Shows Free vs. Pro features
 * Usage: <PricingTable onUpgrade={...} />
 */
export const PricingTable: React.FC<PricingTableProps> = ({ onUpgrade }) => {
  // Animation for icon pulse
  const data: FeatureRow[] = [
    { feature: "Macro Tracking", free: true, pro: true },
    { feature: "Meal Types", free: true, pro: true },
    { feature: "Weight Logging", free: true, pro: true },
    { feature: "Goal Setting", free: true, pro: true },
    { feature: "Advanced Reporting & Analytics", free: true, pro: true },
    { feature: "Unlimited Habit Tracking", free: false, pro: true },
    { feature: "Recipe & Meal Saver", free: false, pro: true },
    { feature: "Ad-Free Experience", free: false, pro: true },
    { feature: "Priority Support", free: false, pro: true },
  ];

  const columns: ColumnDef<FeatureRow>[] = [
    {
      accessorKey: "feature",
      header: () => (
        <span className="text-left px-5 py-4 text-base font-semibold text-gray-200 bg-transparent">
          Feature
        </span>
      ),
      cell: (info) => (
        <span
          className="text-left text-gray-200 font-medium"
          style={{ lineHeight: "1.5" }}
        >
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "free",
      header: () => (
        <span className="px-5 py-4 text-base font-semibold text-gray-300 bg-transparent">
          Free
        </span>
      ),
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-block align-middle text-green-400 font-bold">
            ✔️
          </span>
        ) : (
          <span className="inline-block align-middle text-gray-500 font-bold">
            —
          </span>
        ),
    },
    {
      accessorKey: "pro",
      header: () => (
        <div className="px-5 py-4 text-base font-extrabold text-yellow-200 bg-gradient-to-br relative">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 font-bold text-base shadow-glow border border-yellow-400/30">
            PRO <ProBadge />
          </span>
          <span className="block text-yellow-300 text-lg font-extrabold mt-2 drop-shadow-glow">
            $5
            <span className="text-base font-semibold text-yellow-200">/mo</span>
          </span>
        </div>
      ),
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-block align-middle text-yellow-300 font-bold">
            ✔️
          </span>
        ) : (
          <span className="inline-block align-middle text-gray-500 font-bold">
            —
          </span>
        ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <style>{`
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.12); }
        }
      `}</style>
      <div className="w-full max-w-full bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-xl p-0 border border-gray-700/60 scrollbar-hide overflow-x-hidden">
        <table className="w-full max-w-full border-separate border-spacing-0 text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={
                      header.index === 0
                        ? "text-left px-5 py-4 text-base font-semibold text-gray-200 bg-transparent"
                        : header.index === 1
                        ? "px-5 py-4 text-base font-semibold text-gray-300 bg-transparent"
                        : "px-5 py-4 text-base font-extrabold text-yellow-200 bg-gradient-to-br from-yellow-500/20 to-orange-400/20 shadow-[0_0_8px_2px_rgba(255,200,0,0.12)] relative"
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className="transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={
                      cell.column.id === "feature"
                        ? `px-3 py-2 text-left text-gray-200 font-medium${
                            idx !== data.length - 1
                              ? " border-b border-gray-700/60"
                              : ""
                          }`
                        : cell.column.id === "free"
                        ? `px-3 py-2 text-center${
                            row.index !== data.length - 1
                              ? " border-b border-gray-700/60"
                              : ""
                          }`
                        : `px-3 py-2 text-center bg-gradient-to-br from-yellow-900/10 to-orange-900/10${
                            row.index !== data.length - 1
                              ? " border-b border-yellow-700/30"
                              : ""
                          }`
                    }
                    style={
                      cell.column.id === "feature" ? { lineHeight: "1.5" } : {}
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-col items-center">
        <button
          className="w-full max-w-xs bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-extrabold py-4 px-12 rounded-2xl text-xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-yellow-300 border-0 mb-2 transition-all duration-150 tracking-wide drop-shadow-lg active:scale-95"
          style={{ transition: "transform 0.1s" }}
          onClick={onUpgrade}
          aria-label="Upgrade to Pro"
        >
          Get Started with Pro
        </button>
        <span
          className="text-xs text-yellow-700 font-medium dark:text-yellow-200"
          style={{ marginTop: "8px" }}
        >
          $5/month • Cancel anytime
        </span>
      </div>
    </>
  );
};
