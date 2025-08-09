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
            <span className="inline-block align-middle font-bold text-foreground">
              <CheckIcon />
            </span>
          ) : (
            <span className="inline-block align-middle font-bold text-muted">
              —
            </span>
          ),
      },
      {
        accessorKey: "pro",
        header: () => {
          return (
            <div className="flex min-h-18 flex-col items-center justify-center bg-transparent px-5 py-4 text-center text-base font-semibold text-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/30 px-3 py-1 text-xs font-bold tracking-wide text-foreground">
                PRO
              </span>
              <span
                className="mt-2 block text-center text-lg font-extrabold text-foreground"
                style={{ minWidth: "110px" }}
              >
                <AnimatedNumber
                  value={currentPrice}
                  toFixedValue={2}
                  duration={0.5}
                  prefix="$"
                  className="inline-block"
                />
                <span className="ml-0.5 text-base font-semibold text-foreground">
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
            <span className="inline-block align-middle font-bold text-foreground">
              <CheckIcon />
            </span>
          ) : (
            <span className="inline-block align-middle font-bold text-muted">
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
    <div>
      <style>{`
        @media (max-width: 767px) {
          .responsive-pricing-table thead { display: none; }
          .responsive-pricing-table tr { display:block; margin-bottom:0.75rem; border:1px solid rgb(55 65 81 / 0.6); border-radius:0.5rem; overflow:hidden; }
          .responsive-pricing-table td { display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.9rem; border-bottom:1px solid rgb(55 65 81 / 0.6); }
          .responsive-pricing-table tr td:last-child { border-bottom:0; }
          .responsive-pricing-table td[data-label]::before { content: attr(data-label); font-weight:600; color:#d1d5db; }
          .responsive-pricing-table .feature-cell { background:rgb(55 65 81 / 0.2); font-weight:600; }
          .responsive-pricing-table .feature-cell::before { display:none; }
        }
      `}</style>

      {/* Plan toggle (pill group) */}
      <div className="mb-4 flex justify-center">
        <div
          className="pricing-pill-group inline-flex gap-0 overflow-hidden rounded-full border border-border bg-surface p-1 select-none"
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
            className="overflow-hidden rounded-full"
          >
            <span className={"text-sm font-semibold "}>Monthly</span>
          </TabButton>
          <TabButton
            active={selectedPlan === "yearly"}
            onClick={() => setSelectedPlan("yearly")}
            layoutId="pricing-plan-toggle"
            isMotion
            rounded="rounded-full"
            activeBg="bg-primary"
            ariaLabel="Yearly plan"
            className="overflow-hidden rounded-full"
          >
            <span className={"text-sm font-semibold "}>Yearly</span>
          </TabButton>
        </div>
        <style>{`
          .pricing-pill-group [role=tab] { min-width:90px; height:40px; padding:0 18px; border-radius:9999px; position:relative; }
          .pricing-pill-group [role=tab]:first-child { border-top-right-radius:0; border-bottom-right-radius:0; }
          .pricing-pill-group [role=tab]:last-child { border-top-left-radius:0; border-bottom-left-radius:0; }
          .pricing-pill-group { background:rgba(255,255,255,0.04); }
          .pricing-pill-group [role=tab] > div.motion-div, .pricing-pill-group [role=tab] > span { border-radius:inherit; }
        `}</style>
      </div>

      <div className="w-full overflow-x-hidden rounded-2xl border border-border/60 bg-surface/40 p-4 shadow-surface backdrop-blur">
        <table className="responsive-pricing-table w-full max-w-full border-separate border-spacing-0 text-sm">
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
                          : "relative border-b border-border/60 bg-gradient-to-br from-primary to-secondary/20 px-5 py-4 text-base font-extrabold text-foreground shadow-surface"
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
                className="md:transition-transform md:duration-200 md:hover:-translate-y-1 md:hover:shadow-surface"
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
                        ? `feature-cell px-3 py-2 text-left font-medium text-foreground${
                            index === data.length - 1
                              ? ""
                              : " md:border-b md:border-border/60"
                          }`
                        : cell.column.id === "free"
                          ? `px-3 py-2 text-center${
                              row.index === data.length - 1
                                ? ""
                                : " md:border-b md:border-border/60"
                            }`
                          : `bg-gradient-to-br from-primary/10 to-secondary/10 px-3 py-2 text-center${
                              row.index === data.length - 1
                                ? ""
                                : " md:border-b md:border-border/50"
                            }`
                    }
                    style={
                      cell.column.id === "feature"
                        ? { lineHeight: "1.5" }
                        : undefined
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
            className="mb-2 w-full max-w-xs rounded-xl bg-primary px-10 py-4 font-semibold  text-foreground shadow hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
