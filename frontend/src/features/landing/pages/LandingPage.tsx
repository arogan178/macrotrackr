import { motion, useReducedMotion } from "motion/react";
import React, { Suspense, useEffect } from "react";

import { ErrorBoundary, LoadingSpinner } from "@/components/ui";
import usePageMetadata from "@/hooks/usePageMetadata";

import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import PageBackground from "../components/PageBackground";

const FeaturesSection = React.lazy(
  () => import("../components/FeaturesSection"),
);
const PricingSection = React.lazy(() => import("../components/PricingSection"));
const ProductPreviewSection = React.lazy(
  () => import("../components/ProductPreviewSection"),
);
// const TestimonialsSection = React.lazy(
//   () => import("../components/TestimonialsSection"),
// );
const FinalCtaSection = React.lazy(
  () => import("../components/FinalCtaSection"),
);

// (Animations for header/hero were removed to improve FCP/LCP)

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

function SectionDivider({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox="0 0 1440 80"
        className="fill-surface"
        style={inverted ? { transform: "scaleX(-1)" } : undefined}
      >
        <path d="M0,0 C480,80 960,0 1440,80 L1440,0 L0,0 Z"></path>
      </svg>
    </div>
  );
}
const LandingPage: React.FC = () => {
  usePageMetadata({
    title: "MacroTrackr — Nutrition & Macro Tracking",
    description:
      "MacroTrackr helps you track macronutrients, set targets, and reach your health goals with a simple, powerful interface.",
    canonical: "https://macrotrackr.com/",
    ogImage: "https://macrotrackr.com/icon.png",
  });
  // Respect user's reduced motion preferences
  const shouldReduceMotion = useReducedMotion();

  // Idle and saver-aware prefetch for lazy sections to improve perceived performance
  useEffect(() => {
    // Network Information API type (not in standard Navigator type)
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
      void import("../components/ProductPreviewSection");
      void import("../components/FinalCtaSection");
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
    // Prefer scheduling after first paint
    requestAnimationFrame(() => schedulePrefetch());
  }, []);

  const inViewRevealProps = shouldReduceMotion
    ? { initial: false as const }
    : ({
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.2 },
      } as const);

  return (
    <div
      className={`relative min-h-screen overflow-hidden text-foreground ${shouldReduceMotion ? "" : "scroll-smooth"}`}
    >
      {/* Shared background */}
      <PageBackground />

      {/* Structured data: SoftwareApplication + WebSite (helps search engines understand the product) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "MacroTrackr",
            alternateName: "MacroTracker",
            url: "https://macrotrackr.com",
            applicationCategory: "HealthApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              url: "https://macrotrackr.com/#pricing",
            },
          }),
        }}
      />

      {/* Header landmark - render immediately without entrance animation */}
      <div aria-hidden={false}>
        <Header />
      </div>

      {/* Main content landmark for accessibility */}
      <main className="relative z-10 bg-background">
        {/* Shared background */}
        <PageBackground />

        {/* Hero - render immediately without entrance animation */}
        <div>
          <HeroSection />
        </div>
        <SectionDivider />
        {/* Features */}
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
        <SectionDivider inverted />
        {/* Pricing */}
        <motion.section
          {...inViewRevealProps}
          variants={sectionRevealVariants}
          style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
        >
          <ErrorBoundary>
            <Suspense fallback={<ThemedFallback />}>
              <PricingSection />
            </Suspense>
          </ErrorBoundary>
        </motion.section>
        <SectionDivider />
        {/* Product Preview */}
        <motion.section
          {...inViewRevealProps}
          variants={sectionRevealVariants}
          style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
        >
          <ErrorBoundary>
            <Suspense fallback={<ThemedFallback />}>
              <ProductPreviewSection
                images={[
                  {
                    src: "/screens/dashboard.png",
                    caption: "Track your daily macros at a glance",
                  },
                  {
                    src: "/screens/food-entry.png",
                    caption: "Quickly log your meals in seconds",
                  },
                  {
                    src: "/screens/progress.png",
                    caption: "Visualize your progress over time",
                  },
                  {
                    src: "/screens/settings.png",
                    caption: "Customizable goals and preferences",
                  },
                ]}
              />
            </Suspense>
          </ErrorBoundary>
        </motion.section>
        <SectionDivider inverted />
        {/* Final CTA */}
        <motion.section
          {...inViewRevealProps}
          variants={sectionRevealVariants}
          style={{ contentVisibility: "auto", containIntrinsicSize: "400px" }}
        >
          <ErrorBoundary>
            <Suspense fallback={<ThemedFallback />}>
              <FinalCtaSection />
            </Suspense>
          </ErrorBoundary>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
