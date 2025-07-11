import { motion } from "motion/react";
import React from "react";
import { Link } from "react-router-dom";

import FormButton from "@/components/form/FormButton";
import { ShieldCheckIcon } from "@/components/ui";

import { trustElements, trustIndicators } from "../utils/landingPageConstants";

const HeroSection: React.FC = () => (
  <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 32,
            duration: 0.7,
            ease: "easeOut",
          }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8"
        >
          <span className="block bg-gradient-to-r from-white via-blue-100 to-indigo-200 text-transparent bg-clip-text pb-4">
            Track Your Macros
          </span>
          <span className="block bg-gradient-to-r from-indigo-200 via-blue-200 to-white text-transparent bg-clip-text pb-4">
            Achieve Your Goals
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 32,
            duration: 0.7,
            delay: 0.15,
            ease: "easeOut",
          }}
          className="max-w-3xl mx-auto text-xl sm:text-2xl text-slate-300 mb-12 leading-relaxed"
        >
          The most intuitive macro tracking app designed to help you reach your
          fitness and nutrition goals with precision and ease.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 32,
            duration: 0.7,
            delay: 0.3,
            ease: "easeOut",
          }}
          className="flex flex-col items-center mb-12"
        >
          <Link to="/register">
            <motion.div
              whileHover={{
                scale: 1.08,
                y: -6,
                boxShadow:
                  "0 12px 36px 0 rgba(79,70,229,0.38), 0 2px 12px 0 rgba(79,70,229,0.12)",
              }}
              whileTap={{ scale: 0.96, y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="mb-6"
            >
              <FormButton
                text="Start Your Journey Free"
                variant="primary"
                buttonSize="lg"
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-12 py-4 text-xl font-semibold shadow-xl transition-all duration-300"
              />
            </motion.div>
          </Link>

          <motion.p
            className="text-slate-300 text-lg font-medium mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
              duration: 0.5,
              delay: 0.45,
            }}
            whileHover={{ scale: 1.03, color: "#e2e8f0" }}
          >
            Join others taking control of their nutrition
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                className="flex items-center space-x-3"
              >
                <div
                  className={`w-10 h-10 bg-${indicator.color}-500/20 rounded-full flex items-center justify-center`}
                >
                  <indicator.icon
                    className={`w-5 h-5 text-${indicator.color}-400`}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {indicator.title}
                  </h4>
                  <p className="text-slate-400 text-sm">
                    {indicator.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center mt-6 pt-6 border-t border-slate-700/30 space-y-2 sm:space-y-0 sm:space-x-8 text-slate-400 text-sm"
          >
            {trustElements.map((element) => (
              <div key={element.text} className="flex items-center space-x-2">
                <ShieldCheckIcon className="w-4 h-4 text-green-400" />
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
