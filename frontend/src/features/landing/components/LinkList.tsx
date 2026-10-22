import type { ReactNode } from "react";

import { ChevronRightIcon } from "@/components/ui";
import Heading from "@/components/ui/Heading";

/** A ruled list of destinations, one row each, the row itself the link. */
export const LINK_LIST_CLASS =
  "divide-y divide-border overflow-hidden rounded-card border border-border bg-surface";

export const LINK_ROW_CLASS =
  "group flex items-center justify-between gap-6 px-5 py-4 transition-colors duration-200 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset";

/**
 * What goes inside a row's link. The hubs for comparisons and calculators were
 * card grids that lifted and turned green on hover, which read as ads; as rows
 * they read like the app's own lists.
 */
export function LinkRowContent({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: ReactNode;
}) {
  return (
    <>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Heading level="panel" as="h3">
            {title}
          </Heading>
          {badge}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
      <ChevronRightIcon
        className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-foreground"
        aria-hidden="true"
      />
    </>
  );
}
