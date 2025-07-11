import { motion } from "motion/react";
import React from "react";
import { Link } from "react-router-dom";

import ScrollTriggeredDiv from "@/components/animation/ScrollTriggeredDiv";
import FormButton from "@/components/form/FormButton";

const FinalCtaSection: React.FC = () => (
  <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 via-transparent to-transparent"></div>

    <ScrollTriggeredDiv className="max-w-4xl mx-auto text-center relative">
      <motion.div
        className="absolute -top-10 -left-10 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-10 -right-10 w-16 h-16 bg-purple-500/10 rounded-full blur-xl"
        animate={{
          x: [0, -15, 0],
          y: [0, 10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <motion.h2
        className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6 pb-2"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        Ready to Transform Your Nutrition?
      </motion.h2>
      <motion.p
        className="text-xl text-slate-400 mb-12"
        initial={{ opacity: 0.8 }}
        whileHover={{ opacity: 1, scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        Start your journey to better health and nutrition today.
      </motion.p>
      <Link to="/register">
        <motion.div
          className="inline-block"
          whileHover={{
            scale: 1.08,
            y: -6,
            boxShadow:
              "0 12px 36px 0 rgba(79,70,229,0.38), 0 2px 12px 0 rgba(79,70,229,0.12)",
          }}
          whileTap={{ scale: 0.96, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        >
          <FormButton
            text="Get Started For Free"
            variant="primary"
            buttonSize="lg"
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-12 py-4 text-xl font-semibold shadow-xl transition-all duration-300"
          />
        </motion.div>
      </Link>
      <div className="mb-6" />
    </ScrollTriggeredDiv>
  </section>
);

export default FinalCtaSection;
