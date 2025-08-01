import { motion, useReducedMotion } from "motion/react";
import React, { Suspense, useEffect, useState } from "react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import PageBackground from "../components/PageBackground";

const FeaturesSection = React.lazy(
  () => import("../components/FeaturesSection"),
);
const PricingSection = React.lazy(() => import("../components/PricingSection"));
const TestimonialsSection = React.lazy(
  () => import("../components/TestimonialsSection"),
);
const FinalCtaSection = React.lazy(
  () => import("../components/FinalCtaSection"),
);

/**
 * Enhanced Suspense fallback:
 * visually matches card surfaces with subtle shimmer.
 */
function ThemedFallback() {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background px-8 py-10 shadow-lg shadow-black/5">
        <div className="mb-6 h-6 w-56 animate-pulse rounded bg-muted/40" />
        <div className="mb-3 h-4 w-80 animate-pulse rounded bg-muted/30" />
        <div className="mb-8 h-4 w-64 animate-pulse rounded bg-muted/30" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 animate-pulse rounded-md bg-primary/20" />
          <div className="h-10 w-28 animate-pulse rounded-md bg-muted/30" />
        </div>
        <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(transparent,black)]" />
        <div className="to-accent/5 pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent" />
        <div className="mt-6 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    </div>
  );
}

const LandingPage: React.FC = () => {
  // Respect user's reduced motion preferences
  const shouldReduceMotion = useReducedMotion();

  // Header blur-fade-in
  const headerVariants = {
    hidden: { opacity: 0, filter: "blur(8px)", y: -6 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  } as const;

  // Hero subtle scale-in
  const heroVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 140, damping: 18, mass: 0.7 },
    },
  } as const;

  // Section wipe reveal using clipPath
  const wipeVariants = {
    hidden: { opacity: 0, clipPath: "inset(10% 0% 10% 0% round 16px)" },
    visible: {
      opacity: 1,
      clipPath: "inset(0% 0% 0% 0% round 16px)",
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  } as const;

  // Button/CTA micro reveal
  const buttonReveal = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 180, damping: 16 },
    },
  } as const;

  // Suggested item variants for child lists (Features/Testimonials)
  // Exported via named export below for downstream wiring.
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 140, damping: 18 },
    },
  } as const;

  // Helper props depending on reduced motion
  const baseRevealProps = shouldReduceMotion
    ? { initial: false as const, animate: false as const }
    : { initial: "hidden" as const, animate: "visible" as const };

  const inViewRevealProps = shouldReduceMotion
    ? { initial: false as const }
    : ({
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.2 },
      } as const);

  // Back to top visibility
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden scroll-smooth bg-background">
      {/* Background layer with subtle extra accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <PageBackground />
        {/* Extra floating radial accents (very low-contrast) */}
        {!shouldReduceMotion && (
          <motion.div
            aria-hidden
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="absolute top-24 right-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-3xl"
              animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="bg-accent/10 absolute bottom-32 left-[-10%] h-72 w-72 rounded-full blur-3xl"
              animate={{ y: [0, -12, 0], x: [0, 12, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </div>

      {/* Header landmark - enter on mount */}
      <motion.div
        {...baseRevealProps}
        variants={headerVariants}
        aria-hidden={false}
      >
        <Header />
      </motion.div>

      {/* Main content landmark for accessibility */}
      <main className="relative z-10">
        {/* Hero - enter on mount with scale-in */}
        <motion.div {...baseRevealProps} variants={heroVariants}>
          <HeroSection />
        </motion.div>

        {/* Features - wipe reveal, parent enables staggerChildren for inner items */}
        <motion.section
          {...inViewRevealProps}
          variants={wipeVariants}
          className="rounded-2xl"
        >
          <Suspense fallback={<ThemedFallback />}>
            <FeaturesSection />
          </Suspense>
        </motion.section>

        {/* Pricing - subtle elevate reveal */}
        <motion.section
          {...inViewRevealProps}
          variants={wipeVariants}
          className="rounded-2xl"
        >
          <Suspense fallback={<ThemedFallback />}>
            <PricingSection />
          </Suspense>
        </motion.section>

        {/* Testimonials - wipe reveal with stagger potential */}
        <motion.section
          {...inViewRevealProps}
          variants={wipeVariants}
          className="rounded-2xl"
        >
          <Suspense fallback={<ThemedFallback />}>
            <TestimonialsSection />
          </Suspense>
        </motion.section>

        {/* Final CTA - reveal and allow CTA buttons to animate using buttonReveal via data attribute if needed */}
        <motion.section
          {...inViewRevealProps}
          variants={wipeVariants}
          className="rounded-2xl"
          data-cta-reveal
        >
          <Suspense fallback={<ThemedFallback />}>
            <FinalCtaSection />
          </Suspense>
        </motion.section>
      </main>

      <Footer />

      {/* Expose variants via data for downstream usage if needed */}
      <style>
        {`
          [data-cta-reveal] .cta-reveal {
            opacity: 0;
            transform: translateY(8px);
          }
        `}
      </style>
    </div>
  );
};

export const landingItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 140, damping: 18 },
  },
} as const;

export default LandingPage;
