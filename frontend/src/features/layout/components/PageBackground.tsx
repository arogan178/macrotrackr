import React from "react";

import BackgroundAnimation from "@/components/animation/BackgroundAnimation";

/**
 * PageBackground renders the animated and gradient overlays for the landing page background.
 * Usage example:
 *   <PageBackground />
 */
const PageBackground: React.FC = () => (
  <>
    <BackgroundAnimation />
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/30"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(67,56,202,0.2),transparent_50%)]"></div>
    </div>
  </>
);

export default PageBackground;
