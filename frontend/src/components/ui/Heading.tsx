import React from "react";

import { cn } from "@/lib/classnameUtilities";

/**
 * The type scale, in six steps. Before this there were 18 distinct `<h2>`
 * class strings across Home, Goals and Analytics, so panel titles changed size,
 * weight and tracking from page to page for no reason.
 *
 * Width, not just weight, carries the hierarchy now. Archivo's `wdth` axis lets
 * the two display steps run condensed while body copy stays at normal width —
 * the arrangement a nutrition panel uses, where the headline figure is narrow
 * and tall and the small print beneath it is not. It also buys back real space:
 * a condensed `2,140 kcal` is about 12% narrower, which is the difference
 * between fitting and truncating in a 390px column.
 *
 * Condensed is reserved for display, page and micro. Anything someone reads a
 * sentence of stays at normal width, because condensed grotesques lose their
 * advantage the moment the line gets long.
 */
export const TYPE_SCALE = {
  /** Marketing h1 only. */
  display: "font-stretch-condensed text-4xl font-bold tracking-tight sm:text-5xl",
  /** Every PageHeader. */
  page: "font-stretch-condensed text-[1.75rem] font-bold tracking-tight",
  /** Every card and section heading. */
  panel: "text-base font-semibold tracking-tight",
  /** Prose and values. */
  body: "text-sm",
  /** Labels, units, meta. */
  small: "text-xs",
  /** Eyebrows, axis labels. */
  micro:
    "font-stretch-condensed text-[11px] font-semibold tracking-wider uppercase",
} as const;

export type TypeStep = keyof typeof TYPE_SCALE;

const DEFAULT_ELEMENT: Record<TypeStep, keyof React.JSX.IntrinsicElements> = {
  display: "h1",
  page: "h1",
  panel: "h2",
  body: "p",
  small: "p",
  micro: "p",
};

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: TypeStep;
  as?: keyof React.JSX.IntrinsicElements;
  children: React.ReactNode;
}

const Heading: React.FC<HeadingProps> = ({
  level,
  as,
  className,
  children,
  ...rest
}) => {
  const Element = (as ?? DEFAULT_ELEMENT[level]) as "h2";

  return (
    <Element
      className={cn(TYPE_SCALE[level], "text-foreground", className)}
      {...rest}
    >
      {children}
    </Element>
  );
};

export default Heading;
