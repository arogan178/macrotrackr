import React from "react";

import {
  BRAND_MARK_PATH,
  BRAND_MARK_VIEW_BOX,
} from "./BrandMarkPath";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * The MacroTrackr pea pod — the actual artwork, not a redraw of it.
 *
 * Two earlier passes over this file each changed the drawing while trying to
 * fix the format, and the drawing was never the problem: a 583 KB gradient PNG
 * was. This is the source path, with three things done to it and nothing else.
 *
 * 1. `currentColor` instead of the baked #3c9058, so the mark takes the brand
 *    token and can render black on a green maskable tile.
 * 2. The viewBox cropped to the artwork's own bounds, so the mark fills the
 *    space it is given instead of sitting in 35% empty canvas.
 *
 * 3. The hairline stroke dropped — at 28px it only thickened the fill.
 *
 * The path itself lives in `BrandMarkPath.ts` because the share PNG's canvas
 * needs the same outline, and a second copy of it drifted once already.
 */
const BrandMark: React.FC<BrandMarkProps> = ({ className, title }) => (
  <svg
    viewBox={`${BRAND_MARK_VIEW_BOX.x} ${BRAND_MARK_VIEW_BOX.y} ${BRAND_MARK_VIEW_BOX.width} ${BRAND_MARK_VIEW_BOX.height}`}
    className={className}
    role={title ? "img" : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
  >
    <path d={BRAND_MARK_PATH} fill="currentColor" fillRule="evenodd" />
  </svg>
);

export default BrandMark;
