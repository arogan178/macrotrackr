import React, { Suspense, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

import PageBackground from "@/components/layout/PageBackground";
import { ErrorBoundary, LoadingSpinner } from "@/components/ui";
import usePageMetadata from "@/hooks/usePageMetadata";
import { APP_ICON_URL, APP_URL, PRICING_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

import BackToTopButton from "../components/BackToTopButton";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";

const FeaturesSection = React.lazy(
  () => import("../components/FeaturesSection"),
);
const PricingSection = React.lazy(() => import("../components/PricingSection"));

const sectionRevealVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

/**
 * Enhanced Suspense fallback:
 * visually matches card surfaces with subtle shimmer.
 */
function ThemedFallback() {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <div className="rounded-xl border border-border bg-surface px-8 py-10">
        <div className="mb-6 h-6 w-56 animate-pulse rounded bg-muted/40" />
        <div className="mb-3 h-4 w-80 animate-pulse rounded bg-muted/30" />
        <div className="mb-8 h-4 w-64 animate-pulse rounded bg-muted/30" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 animate-pulse rounded-lg bg-primary/20" />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-muted/30" />
        </div>
        <div className="mt-6 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    </div>
  );
}

const LandingPage: React.FC = () => {
  usePageMetadata({
    title: "MacroTrackr — Macro Tracking That Fits Real Life",
    description:
      "Track your macros, stay consistent, and hit your nutrition goals with a clean app built for everyday use.",
    canonical: `${APP_URL}/`,
    ogImage: APP_ICON_URL,
  });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const navigatorWithConnection = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const connection = navigatorWithConnection.connection;
    const isDataSaver = connection?.saveData === true;
    const isVerySlow = connection?.effectiveType === "2g";

    if (isDataSaver || isVerySlow) {
      return;
    }
    const doPrefetch = () => {
      void import("../components/FeaturesSection");
      void import("../components/PricingSection");
    };
    const schedulePrefetch = () => {
      if ("requestIdleCallback" in globalThis) {
        (
          globalThis.requestIdleCallback as (
            callback: () => void,
            options?: { timeout: number },
          ) => number
        )(doPrefetch, { timeout: 1500 });
      } else {
        setTimeout(doPrefetch, 500);
      }
    };
    requestAnimationFrame(() => schedulePrefetch());
  }, []);

  const inViewRevealProps = shouldReduceMotion
    ? { initial: false as const }
    : ({
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.2 },
      } as const);

  const schemaScript = `
    {
      "@context": "${SCHEMA_ORG_CONTEXT}",
      "@type": "SoftwareApplication",
      "name": "MacroTrackr",
      "alternateName": "MacroTracker",
      "url": "${APP_URL}",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "url": "${PRICING_URL}"
      }
    }
  `;

  return (
    <div
      className={`relative min-h-screen bg-background text-foreground ${shouldReduceMotion ? "" : "scroll-smooth"}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaScript }}
      />

      <PageBackground />

      <div>
        <Header />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HeroSection />

        <motion.section
          {...inViewRevealProps}
          variants={sectionRevealVariants}
          style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
        >
          <ErrorBoundary>
            <Suspense fallback={<ThemedFallback />}>
              <FeaturesSection />
            </Suspense>
          </ErrorBoundary>
        </motion.section>

        <motion.section
          {...inViewRevealProps}
          variants={sectionRevealVariants}
          style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
          className="pb-24"
        >
          <ErrorBoundary>
            <Suspense fallback={<ThemedFallback />}>
              <PricingSection />
            </Suspense>
          </ErrorBoundary>
        </motion.section>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
};

export default LandingPage;
