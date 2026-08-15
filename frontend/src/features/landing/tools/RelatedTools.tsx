import { memo } from "react";
import { Link } from "@tanstack/react-router";

import { ArrowRightIcon } from "@/components/ui";

import { CALCULATOR_TOOLS, TOOLS_HUB_PATH } from "./toolsCatalog";

interface RelatedToolsProps {
  currentPath: string;
}

/**
 * Lets someone jump straight to the next number they need instead of
 * backtracking to the hub.
 */
function RelatedTools({ currentPath }: RelatedToolsProps) {
  const related = CALCULATOR_TOOLS.filter((tool) => tool.path !== currentPath);

  if (related.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Other free calculators
        </h2>
        <Link
          to={TOOLS_HUB_PATH}
          className="inline-flex items-center gap-1 rounded-control text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          View all
          <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {related.map((tool) => (
          <li key={tool.path}>
            <Link
              to={tool.path}
              className="group flex h-full min-h-16 items-center justify-between gap-3 rounded-control border border-border bg-surface px-4 py-3 transition-[border-color,background-color] duration-200 hover:border-primary/40 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {tool.navLabel ?? tool.title}
                </span>
                <span className="block text-xs leading-relaxed text-muted">
                  {tool.tagline}
                </span>
              </span>
              <ArrowRightIcon
                className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default memo(RelatedTools);
