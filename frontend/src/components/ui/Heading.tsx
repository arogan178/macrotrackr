import React from "react";

import { cn } from "@/lib/classnameUtilities";

/**
 * The type scale, in six steps. Before this there were 18 distinct `<h2>`
 * class strings across Home, Goals and Analytics, so panel titles changed size,
 * weight and tracking from page to page for no reason.
 */
export const TYPE_SCALE = {
  /** Marketing h1 only. */
  display: "text-3xl font-bold tracking-tight sm:text-4xl",
  /** Every PageHeader. */
  page: "text-2xl font-bold tracking-tight",
  /** Every card and section heading. */
  panel: "text-base font-semibold tracking-tight",
  /** Prose and values. */
  body: "text-sm",
  /** Labels, units, meta. */
  small: "text-xs",
  /** Eyebrows, axis labels. */
  micro: "text-[11px] font-semibold tracking-wider uppercase",
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
