import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import { Button, ShieldCheckIcon } from "@/components/ui";

import { trustElements, trustIndicators } from "../utils/landingPageConstants";

const HeroSection: React.FC = () => (
  <section className="relative z-10 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="text-center">
        <h1 className="mb-8 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          <span className="block">Track Your Macros</span>
          <span className="block">Achieve Your Goals</span>
        </h1>

        <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-muted sm:text-2xl">
          The most intuitive macro tracking app designed to help you reach your
          fitness and nutrition goals with precision and ease.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
          className="mb-12 flex flex-col items-center"
        >
          <Link to="/register" className="mb-6">
            <Button
              text="Start Your Journey Free"
              variant="primary"
              buttonSize="lg"
              className="px-12 py-4 text-xl font-semibold"
            />
          </Link>

          <p className="text-lg font-medium text-muted">
            Join others taking control of their nutrition
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          className="mx-auto mb-8 max-w-4xl rounded-xl border border-border bg-surface p-8"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {trustIndicators.map((indicator) => (
              <div
                key={indicator.title}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
                  <indicator.icon className="text-primary" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">
                    {indicator.title}
                  </h4>
                  <p className="text-sm text-muted">{indicator.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:gap-8">
            {trustElements.map((element) => (
              <div key={element.text} className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-success" />
                <span>{element.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
