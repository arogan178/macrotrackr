import React from "react";

interface PageBackgroundProps {
  /**
   * Whether to show the subtle grid pattern.
   * Default: true
   */
  withGrid?: boolean;
  /**
   * Whether to show the subtle noise texture.
   * Default: true
   */
  withNoise?: boolean;
}

/**
 * PageBackground renders the static background overlays for pages.
 * Minimal: solid black background with an optional subtle architectural grid.
 */
const PageBackground: React.FC<PageBackgroundProps> = ({
  withGrid = true,
  withNoise = true,
}) => (
  <>
    {/* Base background */}
    <div className="pointer-events-none fixed inset-0 z-[-1] bg-background" />

    {/* Subtle architectural grid (SaaS / Vercel style) */}
    {withGrid && (
      <div
        className="pointer-events-none fixed inset-0 z-[-1] opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
    )}

    {/* Noise texture (Logged-in views / Dashboard) */}
    {withNoise && (
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[url('/noise.webp')] opacity-30 mix-blend-overlay" />
    )}
  </>
);

export default PageBackground;
