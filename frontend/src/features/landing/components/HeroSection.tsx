import React, { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { m } from "motion/react";

import { getButtonClasses } from "@/components/ui/Button";

const RemotionPlayer = React.lazy(() => import("./remotion/RemotionPlayer").then(module => ({ default: module.RemotionPlayer })));

const HeroSection: React.FC = () => (
  <section className="relative z-10 pt-32 pb-16 sm:pt-40 sm:pb-24">
    <div className="mx-auto max-w-5xl text-center">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <span className="mb-6 flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          MacroTrackr 2.1 is now LIVE!
        </span>
        <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tighter text-balance text-foreground sm:text-6xl lg:text-[5rem] lg:leading-[1.1]">
          Master your macros.
          <span className="text-muted"> Reach your goals.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-balance text-muted sm:text-xl">
          MacroTrackr is a web app for tracking calories and macronutrients.
          Log meals in seconds, visualize your progress instantly, and build
          lasting habits with less friction and more clarity.
        </p>

        <div className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            search={{ returnTo: undefined }}
            className={getButtonClasses(
              "primary",
              "lg",
              false,
              "px-8 py-3.5 text-base font-semibold rounded-full",
            )}
          >
            Start for Free
          </Link>
          <a
            href="#features"
            className={getButtonClasses(
              "outline",
              "lg",
              false,
              "px-8 py-3.5 text-base font-semibold rounded-full bg-surface hover:bg-surface-2 transition-colors",
            )}
          >
            Explore Features
          </a>
        </div>

        <p className="text-sm text-muted">
          Review our{" "}
          <Link
            to="/privacy"
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            to="/terms"
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
          >
            Terms of Service
          </Link>
          .
        </p>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative mx-auto mt-16 max-w-5xl"
      >
        <Suspense fallback={
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-primary/10 shadow-2xl ring-1 ring-white/5">
            <div className="absolute top-0 right-0 left-0 z-10 flex h-10 items-center gap-2 border-b border-border bg-surface-2 px-4">
              <div className="h-3 w-3 rounded-full bg-error" />
              <div className="h-3 w-3 rounded-full bg-warning" />
              <div className="h-3 w-3 rounded-full bg-success" />
            </div>
            <div className="absolute top-10 right-0 bottom-0 left-0 flex items-center justify-center bg-surface-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </div>
        }>
          <RemotionPlayer />
        </Suspense>
      </m.div>
    </div>
  </section>
);

export default HeroSection;
