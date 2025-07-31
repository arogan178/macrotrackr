import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";
import { Button } from "@/components/ui";

const FinalCTASection: React.FC = () => (
  <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent"></div>

    <ScrollTriggeredDiv className="max-w-4xl mx-auto text-center relative">
      <motion.h2
        className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        Ready to Transform Your Nutrition?
      </motion.h2>
      <motion.p
        className="text-xl text-foreground/90 mb-12"
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
            className="px-12 py-4 text-xl font-semibold"
          />
        </motion.div>
      </Link>
      <div className="mb-6" />
    </ScrollTriggeredDiv>
  </section>
);

export default FinalCTASection;
