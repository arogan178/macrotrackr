import React from "react";

/**
 * PageBackground renders the static background overlays for all pages.
 * Minimal: just a soft radial vignette — no grid lines or noise textures.
 */
const PageBackground: React.FC = () => (
  <>
    {/* Base background */}
    <div className="absolute inset-0 bg-background" />

    {/* Soft radial vignette */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-surface)_0%,transparent_60%)] opacity-40" />
  </>
);

export default PageBackground;
