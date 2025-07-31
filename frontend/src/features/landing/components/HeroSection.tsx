import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import { Button, ShieldCheckIcon } from "@/components/ui";

import { trustElements, trustIndicators } from "../utils/landingPageConstants";

const HeroSection: React.FC = () => (
  <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
            duration: 0.6,
            ease: "easeOut",
          }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-foreground"
        >
          <span className="block">Track Your Macros</span>
          <span className="block">Achieve Your Goals</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
            duration: 0.6,
            delay: 0.15,
            ease: "easeOut",
          }}
          className="max-w-3xl mx-auto text-xl sm:text-2xl text-foreground mb-12 leading-relaxed"
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
          className="flex flex-col items-center mb-12"
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
            className="text-foreground text-lg font-medium mb-6"
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
          className="max-w-4xl mx-auto p-8 mb-8 bg-surface backdrop-blur-sm border border-border/50 rounded-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.08 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-border/50">
                  <indicator.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {indicator.title}
                  </h4>
                  <p className="text-foreground text-sm">
                    {indicator.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="flex flex-col sm:flex-row items-center justify-center mt-6 pt-6 border-t border-border/50 space-y-2 sm:space-y-0 sm:space-x-8 text-foreground text-sm"
          >
            {trustElements.map((element) => (
              <div key={element.text} className="flex items-center space-x-2">
                <ShieldCheckIcon className="w-4 h-4 text-success" />
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
