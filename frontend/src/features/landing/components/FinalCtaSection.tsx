import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";
import { Button } from "@/components/ui";

const FinalCTASection: React.FC = () => (
  <section className="relative z-10 overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />

    <ScrollTriggeredDiv className="relative mx-auto max-w-4xl text-center">
      <motion.h2
        className="mb-4 text-4xl font-bold text-foreground sm:text-5xl"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        Ready to Transform Your Nutrition?
      </motion.h2>
      <motion.p
        className="mb-10 text-lg text-muted"
        initial={{ opacity: 0.95 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        Start your journey to better health and nutrition today.
      </motion.p>
      <Link to="/register">
        <motion.div
          className="inline-block"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
        >
          <Button
            text="Get Started For Free"
            variant="primary"
            buttonSize="lg"
            className="px-10 py-3 text-lg font-semibold"
          />
        </motion.div>
      </Link>
    </ScrollTriggeredDiv>
  </section>
);

export default FinalCTASection;
