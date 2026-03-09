import { motion, useReducedMotion } from "motion/react";
import React, { useEffect, useState } from "react";

interface FlowStep {
  title: string;
  description: string;
  visual: React.ReactNode;
}

interface AnimatedUserFlowProps {
  steps: FlowStep[];
  autoPlay?: boolean;
  interval?: number;
}

const AnimatedUserFlow: React.FC<AnimatedUserFlowProps> = ({
  steps,
  autoPlay = true,
  interval = 3000,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!autoPlay || steps.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentStep((previous) => (previous + 1) % steps.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, steps.length]);

  return (
    <div className="min-h-[400px]">
      <div className="flex gap-2 pb-4">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`h-2 flex-1 rounded-full transition-[width,background-color] duration-200 ${
              index === currentStep ? "bg-primary" : "bg-border hover:bg-muted"
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-black">
              {currentStep + 1}
            </span>
            <span className="text-xs font-medium tracking-wider text-muted uppercase">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <motion.h4
            key={`title-${currentStep}`}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold tracking-tight"
          >
            {steps[currentStep].title}
          </motion.h4>

          <motion.p
            key={`desc-${currentStep}`}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="leading-relaxed text-muted"
          >
            {steps[currentStep].description}
          </motion.p>

          {/* Step Indicators */}
          <div className="flex gap-2 pt-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 w-2 rounded-full transition-[width,background-color] duration-200 ${
                  index === currentStep
                    ? "w-6 bg-primary"
                    : "bg-border hover:bg-muted"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right: Visual */}
        <motion.div
          key={`visual-${currentStep}`}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center rounded-xl bg-surface-2 p-4"
        >
          {steps[currentStep].visual}
        </motion.div>
      </div>
    </div>
  );
};

// Pre-built flow visualizations for common features

export const MealGroupingFlow: React.FC = () => {
  const steps: FlowStep[] = [
    {
      title: "Select Your Items",
      description:
        "Browse your recent food history and tap to select multiple items that make up a meal you eat regularly.",
      visual: (
        <div className="w-full max-w-60 space-y-2">
          <div className="rounded-lg bg-surface p-3 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="h-5 w-5 rounded border-2 border-primary bg-primary"
              />
              <div className="flex-1">
                <div className="h-2 w-20 rounded bg-foreground/60" />
                <div className="mt-1 h-1.5 w-12 rounded bg-muted" />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-surface p-3 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: 1.05 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                className="h-5 w-5 rounded border-2 border-primary bg-primary"
              />
              <div className="flex-1">
                <div className="h-2 w-24 rounded bg-foreground/60" />
                <div className="mt-1 h-1.5 w-10 rounded bg-muted" />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-surface p-3 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded border-2 border-border" />
              <div className="flex-1">
                <div className="h-2 w-16 rounded bg-foreground/60" />
                <div className="mt-1 h-1.5 w-14 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Name & Save",
      description:
        'Give your meal a name—like "Post-Workout Shake" or "Mom\'s Lasagna." The meal is instantly saved to your personal library.',
      visual: (
        <div className="w-full max-w-60 space-y-3">
          <div className="rounded-lg bg-surface p-4 ring-1 ring-primary/50">
            <div className="mb-3 h-2 w-16 rounded bg-muted" />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-8 overflow-hidden rounded bg-surface-2"
            >
              <div className="flex h-full items-center px-3">
                <div className="h-3 w-32 rounded bg-primary/30" />
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            className="rounded-lg bg-primary p-3 text-center text-sm font-semibold text-black"
          >
            Save Meal
          </motion.div>
        </div>
      ),
    },
    {
      title: "Log with One Tap",
      description:
        "When it's time to track, your saved meals appear at the top of your search. One tap logs the entire meal.",
      visual: (
        <div className="w-full max-w-60 space-y-2">
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg bg-primary/10 p-3 ring-1 ring-primary"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="h-2.5 w-28 rounded bg-foreground" />
                <div className="mt-1.5 h-1.5 w-16 rounded bg-muted" />
              </div>
            </div>
          </motion.div>
          <div className="rounded-lg bg-surface p-3 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface-2" />
              <div className="flex-1">
                <div className="h-2.5 w-24 rounded bg-foreground/60" />
                <div className="mt-1.5 h-1.5 w-12 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Expand for Details",
      description:
        "Need to see what went into that meal? Simply tap to expand. The accordion reveals every ingredient with its macros.",
      visual: (
        <div className="w-full max-w-60 space-y-1 overflow-hidden rounded-lg bg-surface ring-1 ring-border">
          <div className="flex items-center gap-3 bg-surface-2/50 p-3">
            <motion.div
              animate={{ rotate: 90 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <svg
                className="h-4 w-4 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.div>
            <div className="h-2.5 w-24 rounded bg-foreground" />
          </div>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-3 pt-0">
              <div className="flex justify-between rounded bg-surface-2/30 px-2 py-1.5">
                <div className="h-2 w-16 rounded bg-foreground/60" />
                <div className="bg-chart-2 h-2 w-10 rounded" />
              </div>
              <div className="flex justify-between rounded bg-surface-2/30 px-2 py-1.5">
                <div className="h-2 w-14 rounded bg-foreground/60" />
                <div className="bg-chart-4 h-2 w-8 rounded" />
              </div>
              <div className="flex justify-between rounded bg-surface-2/30 px-2 py-1.5">
                <div className="h-2 w-18 rounded bg-foreground/60" />
                <div className="h-2 w-12 rounded bg-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
  ];

  return <AnimatedUserFlow steps={steps} />;
};

export default AnimatedUserFlow;
