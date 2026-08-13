import { memo, type ReactNode } from "react";

import { cn } from "@/lib/classnameUtilities";

import { ChevronDownIcon } from "./Icons";

export interface AccordionItem {
  id: string;
  question: ReactNode;
  answer: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Open the first item on mount, as the pricing FAQ did. */
  defaultOpenFirst?: boolean;
  className?: string;
}

/**
 * One disclosure pattern. The FAQ on /pricing was a controlled single-open
 * accordion with a height animation; the calculators used native `<details>`
 * with a different chevron, radius and hover. Native wins: it is keyboard and
 * screen-reader correct for free, it survives no-JS, and Ctrl+F finds text
 * inside a closed section in browsers that support content hiding.
 */
function Accordion({
  items,
  defaultOpenFirst = false,
  className,
}: AccordionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <details
          key={item.id}
          open={defaultOpenFirst && index === 0}
          className="group rounded-control border border-border bg-surface-2 transition-colors hover:border-border-2"
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-foreground select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
            <span>{item.question}</span>
            <ChevronDownIcon
              className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-border px-4 pt-3 pb-4 text-sm leading-relaxed text-muted">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

export default memo(Accordion);
