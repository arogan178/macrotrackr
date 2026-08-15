import { memo, type ReactNode, useCallback, useState } from "react";

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
 *
 * The open/close is animated with `grid-template-rows: 0fr -> 1fr`, which works
 * in every browser. A first attempt used `::details-content` plus
 * `interpolate-size`, which is far tidier CSS and is Chromium-only — so in
 * Firefox and Safari the panel simply snapped, which is not "progressive
 * enhancement", it is the feature missing for most of the web.
 *
 * `<details>` hides its own content when closed, so the element stays open for
 * as long as the collapse is running and closes properly once it finishes.
 */
function AccordionRow({
  item,
  defaultOpen,
}: {
  item: AccordionItem;
  defaultOpen: boolean;
}) {
  // `expanded` is what the reader sees; `rendered` is the element's own open
  // state, which has to outlast the collapse or there is nothing to animate.
  const [expanded, setExpanded] = useState(defaultOpen);
  const [rendered, setRendered] = useState(defaultOpen);

  const toggle = useCallback((event: React.MouseEvent) => {
    // The element's native toggle would jump straight to the end state.
    event.preventDefault();
    setExpanded((open) => {
      if (open) return false;
      setRendered(true);

      return true;
    });
  }, []);

  return (
    <details
      open={rendered}
      onToggle={(event) => {
        // Keyboard activation and find-in-page can open it without the click
        // handler; keep both flags in step when they do.
        if (event.currentTarget.open && !expanded) setExpanded(true);
      }}
      className="group rounded-control border border-border bg-surface-2 transition-colors hover:border-border-2"
    >
      <summary
        onClick={toggle}
        className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-foreground select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span>{item.question}</span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </summary>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        onTransitionEnd={() => {
          if (!expanded) setRendered(false);
        }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-4 pt-3 pb-4 text-sm leading-relaxed text-muted">
            {item.answer}
          </div>
        </div>
      </div>
    </details>
  );
}

function Accordion({
  items,
  defaultOpenFirst = false,
  className,
}: AccordionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <AccordionRow
          key={item.id}
          item={item}
          defaultOpen={defaultOpenFirst && index === 0}
        />
      ))}
    </div>
  );
}

export default memo(Accordion);
