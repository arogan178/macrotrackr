import React from "react";

/**
 * PageBackground renders the static background overlays for all pages.
 * Usage example:
 *   <PageBackground />
 */
const PageBackground: React.FC = () => (
  <>
    {/* Base background */}
    <div className="absolute inset-0 bg-background" />

    {/* Soft radial spotlight */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-surface)_0%,transparent_70%)] opacity-60" />

    {/* Subtle grid lines */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

    {/* Noise texture */}
    <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />
  </>
);

export default PageBackground;
