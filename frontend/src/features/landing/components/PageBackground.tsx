import React from "react";

/**
 * PageBackground renders the static background overlays for all pages.
 * Minimal: solid black background with a very subtle architectural grid.
 */
const PageBackground: React.FC = () => (
  <>
    {/* Base background */}
    <div className="pointer-events-none fixed inset-0 bg-background" />

    {/* Subtle architectural grid (SaaS / Vercel style) */}
    <div 
      className="pointer-events-none fixed inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
        backgroundSize: '32px 32px'
      }}
    />

    {/* Vignette to fade grid out at edges smoothly */}
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-background)_100%)] opacity-80" />
  </>
);

export default PageBackground;
