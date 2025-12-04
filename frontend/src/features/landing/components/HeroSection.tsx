import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import { Button, ShieldCheckIcon } from "@/components/ui";

import { trustElements, trustIndicators } from "../utils/landingPageConstants";

const HeroSection: React.FC = () => (
  <section className="relative z-10 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0 }}
          className="mb-8 text-5xl font-bold text-foreground will-change-auto sm:text-6xl lg:text-7xl"
        >
          <span className="block">Track Your Macros</span>
          <span className="block">Achieve Your Goals</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0 }}
          className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-foreground will-change-auto sm:text-2xl"
        >
          The most intuitive macro tracking app designed to help you reach your
          fitness and nutrition goals with precision and ease.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
            duration: 0.6,
            delay: 0.3,
            ease: "easeOut",
          }}
          className="mb-12 flex flex-col items-center"
        >
          <Link to="/register">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className="mb-6"
            >
              <Button
                text="Start Your Journey Free"
                variant="primary"
                buttonSize="lg"
                className="px-12 py-4 text-xl font-semibold"
              />
            </motion.div>
          </Link>

          <motion.p
            className="mb-6 text-lg font-medium text-foreground"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 28,
              duration: 0.4,
              delay: 0.45,
            }}
          >
            Join others taking control of their nutrition
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="mx-auto mb-8 max-w-4xl rounded-2xl border border-border/50 bg-surface p-8 backdrop-blur-sm"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {trustIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.08 }}
                className="flex items-center space-x-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-surface-2">
                  <indicator.icon className=" text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {indicator.title}
                  </h4>
                  <p className="text-sm text-muted">{indicator.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="mt-6 flex flex-col items-center justify-center space-y-2 border-t border-border/50 pt-6 text-sm text-muted sm:flex-row sm:space-y-0 sm:space-x-8"
          >
            {trustElements.map((element) => (
              <div key={element.text} className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-4 w-4 text-success" />
                <span>{element.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
