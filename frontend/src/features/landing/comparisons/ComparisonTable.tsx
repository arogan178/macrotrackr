import { memo } from "react";

import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import { PANEL_CLASS, RULE_HAIRLINE, RULE_SECTION } from "@/components/ui/Panel";
import { cn } from "@/lib/classnameUtilities";

export interface ComparisonColumn {
  key: string;
  label: string;
  /** The product's own column, set apart by colour rather than weight. */
  isOwn?: boolean;
}

export interface ComparisonTableProps {
  caption: string;
  description?: string;
  columns: ComparisonColumn[];
  rows: { feature: string; values: Record<string, string> }[];
  /** Below this width the table scrolls rather than crushing its columns. */
  minWidthClass?: string;
}

/**
 * The one comparison table for `/compare` and every `/compare/*` page.
 *
 * There were two hand-built tables with different header weights, different row
 * padding and different rules. Both also decorated cells with icons: every
 * MacroTrackr cell got a green tick unconditionally, and the competitor's got a
 * tick or a cross chosen by sniffing its text for "no", "ads", "paywalled",
 * "dense" or "frequent". That is a claim the data does not make, decided by
 * substring match, so the icons are gone — the cell says what the cell says, and
 * the reader draws the conclusion.
 *
 * Rules follow the panel grade: a 2px rule under the header, hairlines between
 * rows.
 */
function ComparisonTable({
  caption,
  description,
  columns,
  rows,
  minWidthClass = "min-w-[640px]",
}: ComparisonTableProps) {
  // The heading names the table, so it is referenced rather than repeated in a
  // screen-reader-only <caption>.
  const headingId = `comparison-${caption.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <section className="mb-12" aria-labelledby={headingId}>
      <div className="mb-4">
        <Heading level="panel" id={headingId} className="text-xl">
          {caption}
        </Heading>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>

      <div className={cn(PANEL_CLASS, "overflow-x-auto")}>
        <table
          aria-labelledby={headingId}
          className={cn("w-full text-left text-sm", minWidthClass)}
        >
          <thead>
            <tr className={cn("border-b-2 bg-surface-2", RULE_SECTION)}>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    TYPE_SCALE.micro,
                    "px-4 py-3.5",
                    index === 0 && "pl-5",
                    index === columns.length - 1 && "pr-5",
                    column.isOwn ? "text-primary" : "text-muted",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.feature}
                className={cn(
                  "border-b transition-colors last:border-b-0 hover:bg-surface-2",
                  RULE_HAIRLINE,
                )}
              >
                <th
                  scope="row"
                  className="px-4 py-3 pl-5 text-left font-medium text-foreground"
                >
                  {row.feature}
                </th>
                {columns.slice(1).map((column, index) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3",
                      index === columns.length - 2 && "pr-5",
                      column.isOwn
                        ? "font-semibold text-primary"
                        : "text-muted",
                    )}
                  >
                    {row.values[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(ComparisonTable);
