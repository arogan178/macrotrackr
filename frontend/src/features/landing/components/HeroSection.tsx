import React from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";

import { getButtonClasses } from "@/components/ui/Button";

import { RemotionPlayer } from "./remotion/RemotionPlayer";

const HeroSection: React.FC = () => (
  <section className="relative z-10 pt-32 pb-16 sm:pt-40 sm:pb-24">
    <div className="mx-auto max-w-5xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <span className="mb-6 flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          MacroTrackr 2.0 is now LIVE!
        </span>
        <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tighter text-balance text-foreground sm:text-6xl lg:text-[5rem] lg:leading-[1.1]">
          Master your macros.
          <span className="text-muted"> Reach your goals.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-balance text-muted sm:text-xl">
          Log meals in seconds, visualize your progress instantly, and build
          lasting habits. No complexity, no friction—just clarity and results.
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative mx-auto mt-16 max-w-5xl"
      >
        <RemotionPlayer />
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
