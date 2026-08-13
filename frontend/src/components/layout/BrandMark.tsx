import React from "react";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * The pod with rising peas — the same three bars the macro row draws, which is
 * the interface compressed into 32px. Flat and single-colour: the previous
 * mark was a 583 KB gradient PNG on a diagonal axis, in a system whose own
 * comments ban gradients, and it collapsed into a smear at favicon size.
 *
 * `currentColor` so it inherits the brand token rather than hardcoding a hex,
 * and so it can render black on a green maskable tile.
 */
const BrandMark: React.FC<BrandMarkProps> = ({ className, title }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    role={title ? "img" : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
  >
    <path
      d="M4 22C6 12 18 8 28 10C26 20 14 24 4 22Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M28 10L30.5 6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <rect x="9" y="16.5" width="3.2" height="4.6" rx="1.6" fill="currentColor" />
    <rect
      x="13.8"
      y="14.6"
      width="3.2"
      height="6"
      rx="1.6"
      fill="currentColor"
    />
    <rect
      x="18.6"
      y="12.6"
      width="3.2"
      height="7.4"
      rx="1.6"
      fill="currentColor"
    />
  </svg>
);

export default BrandMark;
