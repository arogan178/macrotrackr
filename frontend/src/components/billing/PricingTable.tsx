import {
  CellContext,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import React, { memo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { Button, CheckIcon, TabButton } from "@/components/ui";
import { PRICING, PRICING_PLANS } from "@/config/pricing";

// Memoize feature arrays outside the component to prevent re-computation on every render
const freeFeatures = PRICING_PLANS.free.features;
const proFeatures = PRICING_PLANS.pro.features;
const allFeatures = [...new Set([...freeFeatures, ...proFeatures])];

interface PricingTableProps {
  onUpgrade?: (plan: "monthly" | "yearly") => void;
  showProButton?: boolean;
  selectedPlan: "monthly" | "yearly";
  setSelectedPlan: React.Dispatch<React.SetStateAction<"monthly" | "yearly">>;
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

const PricingTable: React.FC<PricingTableProps> = ({
  onUpgrade,
  showProButton = true,
  selectedPlan,
  setSelectedPlan,
}) => {
  // Data rows (features) - computed once (static arrays)
  const data: FeatureRow[] = React.useMemo(
    () =>
      allFeatures.map((feature) => ({
        feature,
        free: freeFeatures.includes(feature),
        pro: proFeatures.includes(feature),
      })),
    [],
  );

  const isYearly = selectedPlan === "yearly";
  const currentPrice = isYearly ? PRICING.yearly : PRICING.monthly;
  const priceSuffix = isYearly ? "/year" : "/mo";
  const yearlyEquivalent = isYearly
    ? `($${(PRICING.yearly / 12).toFixed(2)}/mo)`
    : "";

  const columns = React.useMemo<ColumnDef<FeatureRow, unknown>[]>(
    () => [
      {
        accessorKey: "feature",
        header: () => (
          <div className="flex min-h-18 items-center bg-transparent px-5 py-4 text-left text-base font-semibold text-foreground">
            Feature
          </div>
        ),
        cell: (info: CellContext<FeatureRow, unknown>) => (
          <span className="text-left leading-relaxed font-medium text-foreground">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "free",
        header: () => (
          <div className="flex min-h-18 items-center justify-center bg-transparent px-5 py-4 text-base font-semibold text-foreground">
            Free
          </div>
        ),
        cell: (info: CellContext<FeatureRow, unknown>) =>
          info.getValue() ? (
            <span className="inline-block align-middle font-semibold text-foreground">
              <CheckIcon />
            </span>
          ) : (
            <span className="inline-block align-middle font-semibold text-muted">
              —
            </span>
          ),
      },
      {
        accessorKey: "pro",
        header: () => {
          return (
            <div className="flex min-h-18 flex-col items-center justify-center bg-transparent px-5 py-4 text-center text-base font-semibold text-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/30 px-3 py-1 text-xs font-semibold tracking-wide text-foreground">
                PRO
              </span>
              <span
                className="mt-2 block text-center text-lg font-light tracking-tight text-foreground"
                style={{ minWidth: "110px" }}
              >
                <AnimatedNumber
                  value={currentPrice}
                  toFixedValue={2}
                  duration={0.5}
                  prefix="$"
                  className="inline-block"
                />
                <span className="ml-0.5 text-base font-light tracking-tight text-foreground">
                  {priceSuffix}
                </span>
              </span>
              {isYearly && (
                <span
                  className="mt-1 block text-xs font-medium text-muted"
                  aria-hidden={!isYearly}
                >
                  {yearlyEquivalent}
                </span>
              )}
            </div>
          );
        },
        cell: (info: CellContext<FeatureRow, unknown>) =>
          info.getValue() ? (
            <span className="inline-block align-middle font-semibold text-foreground">
              <CheckIcon />
            </span>
          ) : (
            <span className="inline-block align-middle font-semibold text-muted">
              —
            </span>
          ),
      },
    ],
    [currentPrice, isYearly, priceSuffix, yearlyEquivalent],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-5">
      {/* Plan toggle (pill group) */}
      <div className="flex justify-center">
        <div
          className="inline-flex gap-1 overflow-hidden rounded-full border border-border bg-surface p-1 select-none"
          role="tablist"
          aria-label="Plan Toggle"
        >
          <TabButton
            active={selectedPlan === "monthly"}
            onClick={() => setSelectedPlan("monthly")}
            layoutId="pricing-plan-toggle"
            isMotion
            rounded="rounded-full"
            activeBg="bg-primary"
            ariaLabel="Monthly plan"
            className="overflow-hidden rounded-full px-5"
          >
            <span className="text-sm font-semibold">Monthly</span>
          </TabButton>
          <TabButton
            active={selectedPlan === "yearly"}
            onClick={() => setSelectedPlan("yearly")}
            layoutId="pricing-plan-toggle"
            isMotion
            rounded="rounded-full"
            activeBg="bg-primary"
            ariaLabel="Yearly plan"
            className="overflow-hidden rounded-full px-5"
          >
            <span className="text-sm font-semibold">Yearly</span>
          </TabButton>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto rounded-xl border border-border bg-surface-2">
        <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border/60">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={
                      header.index === 0
                        ? "border-b border-border/60 bg-transparent px-5 py-4 text-left text-base font-semibold text-foreground"
                        : header.index === 1
                          ? "border-b border-border/60 bg-transparent px-5 py-4 text-base font-semibold text-foreground"
                          : "relative border-b border-warning/30 bg-warning/10 px-5 py-4 text-base font-semibold text-foreground"
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className="transition-colors duration-150 hover:bg-surface"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    data-label={
                      cell.column.id === "free"
                        ? "Free"
                        : cell.column.id === "pro"
                          ? "Pro"
                          : undefined
                    }
                    className={
                      cell.column.id === "feature"
                        ? `px-5 py-3 text-left font-medium text-foreground${
                            index === data.length - 1
                              ? ""
                              : " border-b border-border/60"
                          }`
                        : cell.column.id === "free"
                          ? `px-5 py-3 text-center${
                              row.index === data.length - 1
                                ? ""
                                : " border-b border-border/60"
                            }`
                          : `bg-warning/5 px-5 py-3 text-center ${
                              row.index === data.length - 1
                                ? ""
                                : " border-b border-warning/20"
                            }`
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

      {showProButton && (
        <div className="mt-5 flex flex-col items-center">
          <Button
            className="mb-2 w-full max-w-xs rounded-xl bg-warning px-10 py-4 text-lg font-semibold text-black hover:bg-warning/90"
            onClick={() => onUpgrade && onUpgrade(selectedPlan)}
            ariaLabel="Upgrade to Pro"
          >
            Get Started with Pro
          </Button>
          <AnimatePresence mode="wait">
            <motion.span
              key={selectedPlan + "-desc"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="text-xs text-muted"
            >
              {isYearly
                ? `$${PRICING.yearly}/year • $${(PRICING.yearly / 12).toFixed(2)}/mo • Cancel anytime`
                : `$${PRICING.monthly}/month • Cancel anytime`}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default memo(PricingTable);
