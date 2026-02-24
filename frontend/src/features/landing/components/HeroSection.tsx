import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import { getButtonClasses } from "@/components/ui/Button";

const HeroSection: React.FC = () => (
  <section className="relative z-10 pt-20 pb-16 sm:pt-28 sm:pb-24">
    <div className="mx-auto max-w-5xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <span className="mb-4 inline-block rounded-full bg-surface-2 px-3 py-1 text-sm font-medium text-primary ring-1 ring-border">
          MacroTrackr 2.0 is here
        </span>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance text-foreground sm:text-6xl lg:text-8xl">
          Fuel your body.
          <br />
          <span className="text-primary">Hit your goals.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-balance text-muted sm:text-2xl">
          The sleekest, fastest way to track your macros. No bloated features, just precision nutrition designed for modern lifestyles.
        </p>

        <div className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            search={{ returnTo: undefined }}
            className={getButtonClasses("primary", "lg", false, "px-10 py-4 text-lg font-semibold rounded-full")}
          >
            Start Tracking Free
          </Link>
          <a
            href="#features"
            className={getButtonClasses("outline", "lg", false, "px-10 py-4 text-lg font-semibold rounded-full bg-surface hover:bg-surface-2")}
          >
            See How It Works
          </a>
        </div>
      </motion.div>

      {/* Modern inline product preview shot to replace the long scrolling carousel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative mx-auto mt-16 max-w-5xl"
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          {/* Faux browser/app top bar */}
          <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-error" />
            <div className="h-3 w-3 rounded-full bg-warning" />
            <div className="h-3 w-3 rounded-full bg-success" />
          </div>
          <img
            src="/screens/dashboard.png"
            alt="MacroTrackr Dashboard Preview"
            className="w-full object-cover"
            loading="eager"
            decoding="async"
            width={1200}
            height={800}
          />
        </div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
