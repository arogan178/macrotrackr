import React from "react";

/**
 * PageBackground renders the static background overlays for all pages.
 * Minimal: solid black background with a subtle primary color glow at the top.
 */
const PageBackground: React.FC = () => (
  <>
    {/* Base background */}
    <div className="absolute inset-0 bg-background pointer-events-none" />

    {/* Soft subtle green top glow */}
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(30,215,96,0.06)_0%,transparent_60%)]" />
  </>
);

export default PageBackground;
