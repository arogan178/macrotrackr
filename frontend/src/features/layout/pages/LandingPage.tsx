// This file has been moved to src/features/layout/LandingPage.tsx

// Original content has been removed to avoid duplicate route issues.
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import CustomPricingCards from "../components/CustomPricingCards";
import FormButton from "@/components/form/FormButton";
import { BUTTON_VARIANTS, BUTTON_SIZES } from "@/components/utils/constants";
import { CheckIcon } from "@/components/Icons";
import { PlusCircle, BarChart, TrendingUp, Star, ShieldCheck } from "lucide-react";

// Enhanced scroll-triggered animation component
const ScrollTriggeredDiv: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 32,
        duration: 0.65,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
  // Add smooth scroll behavior to the entire page
  React.useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden scroll-smooth">
      {/* Static Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(67,56,202,0.2),transparent_50%)]"></div>
      </div>

      {/* Enhanced Header with Glassmorphism */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/80 supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 text-transparent bg-clip-text pb-1">
                MacroTrackr
              </h1>
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="inline-block">
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <FormButton
                    text="Log In"
                    variant={BUTTON_VARIANTS.PRIMARY}
                    size={BUTTON_SIZES.MD}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all duration-300"
                  />
                </motion.div>
              </Link>
              <Link to="/register" className="inline-block">
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <FormButton
                    text="Sign Up"
                    variant={BUTTON_VARIANTS.PRIMARY}
                    size={BUTTON_SIZES.MD}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all duration-300"
                  />
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
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
              The most intuitive macro tracking app designed to help you reach
              your fitness and nutrition goals with precision and ease.
            </motion.p>

            {/* Clean CTA Section */}
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
                    variant={BUTTON_VARIANTS.PRIMARY}
                    size={BUTTON_SIZES.LG}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-12 py-4 text-xl font-semibold shadow-xl transition-all duration-300"
                  />
                </motion.div>
              </Link>

              {/* Simple encouragement with enhanced animation */}
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

            {/* Trust Indicators Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="max-w-4xl mx-auto bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-8 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Easy Setup</h4>
                    <p className="text-slate-400 text-sm">
                      Get started in under 2 minutes
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      Real-time Tracking
                    </h4>
                    <p className="text-slate-400 text-sm">
                      Instant macro calculations
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      Advanced Analytics
                    </h4>
                    <p className="text-slate-400 text-sm">
                      Deep insights & trends
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Additional Trust Elements */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="flex flex-col sm:flex-row items-center justify-center mt-6 pt-6 border-t border-slate-700/30 space-y-2 sm:space-y-0 sm:space-x-8 text-slate-400 text-sm"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>Always Free Version</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>Cancel Anytime</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section with Scroll Animations */}
      <section className="relative z-10 py-24 px-6 sm:px-8 lg:px-16 overflow-visible">
        <div className="mx-auto">
          <ScrollTriggeredDiv className="text-center mb-20 overflow-visible">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6 pb-2">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Comprehensive tools designed to make macro tracking simple,
              accurate, and effective.
            </p>
          </ScrollTriggeredDiv>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <ScrollTriggeredDiv delay={0.1}>
              <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <PlusCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Smart Meal Logging
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Quickly log meals with our intelligent food database and
                    barcode scanner. Get accurate macro breakdowns instantly.
                  </p>
                </div>
              </div>
            </ScrollTriggeredDiv>

            {/* Feature 2 */}
            <ScrollTriggeredDiv delay={0.2}>
              <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 hover:transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BarChart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Personal Goal Setting
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Set personalized macro targets based on your goals, activity
                    level, and preferences. Track progress in real-time.
                  </p>
                </div>
              </div>
            </ScrollTriggeredDiv>

            {/* Feature 3 */}
            <ScrollTriggeredDiv delay={0.3}>
              <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 hover:transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Advanced Analytics
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Visualize your progress with detailed charts, trends, and
                    insights that help you optimize your nutrition strategy.
                  </p>
                </div>
              </div>
            </ScrollTriggeredDiv>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6 pb-2">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Start free and unlock powerful features when you're ready. No
              hidden fees, cancel anytime.
            </p>
          </div>

          <CustomPricingCards showUpgradeButtons={false} />
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ScrollTriggeredDiv className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6 pb-2">
              What Users Say
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Real feedback from MacroTrackr users on their nutrition journey.
            </p>
          </ScrollTriggeredDiv>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <ScrollTriggeredDiv delay={0.1}>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10">
                <div className="flex items-start space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <blockquote className="text-slate-300 text-lg leading-relaxed mb-6">
                  "MacroTrackr completely transformed my approach to nutrition.
                  The interface is intuitive, and the analytics help me stay
                  consistent with my goals."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">AP</span>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-white">
                      Alex Peterson
                    </div>
                    <div className="text-slate-400">Fitness Enthusiast</div>
                  </div>
                </div>
              </div>
            </ScrollTriggeredDiv>

            {/* Testimonial 2 */}
            <ScrollTriggeredDiv delay={0.2}>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10">
                <div className="flex items-start space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <blockquote className="text-slate-300 text-lg leading-relaxed mb-6">
                  "As a nutrition coach, I recommend MacroTrackr to all my
                  clients. It's the perfect balance of simplicity and powerful
                  features."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">JL</span>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-white">Jamie Lewis</div>
                    <div className="text-slate-400">
                      Certified Nutrition Coach
                    </div>
                  </div>
                </div>
              </div>
            </ScrollTriggeredDiv>

            {/* Testimonial 3 */}
            <ScrollTriggeredDiv delay={0.3}>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-green-500/10">
                <div className="flex items-start space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <blockquote className="text-slate-300 text-lg leading-relaxed mb-6">
                  "I've tried many tracking apps, but MacroTrackr is by far the
                  most user-friendly. Lost 20 pounds and gained so much energy!"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">MR</span>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-white">
                      Maria Rodriguez
                    </div>
                    <div className="text-slate-400">Busy Professional</div>
                  </div>
                </div>
              </div>
            </ScrollTriggeredDiv>
          </div>
        </div>
      </section>

      {/* Enhanced Final CTA Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 via-transparent to-transparent"></div>

        <ScrollTriggeredDiv className="max-w-4xl mx-auto text-center relative">
          {/* Floating Elements */}
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
                variant={BUTTON_VARIANTS.PRIMARY}
                size={BUTTON_SIZES.LG}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-12 py-4 text-xl font-semibold shadow-xl transition-all duration-300"
              />
            </motion.div>
          </Link>
          {/* Add margin below the button for spacing if needed */}
          <div className="mb-6" />
        </ScrollTriggeredDiv>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Brand */}
            <div className="">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-4 pb-2">
                MacroTrackr
              </h3>
              <p className="text-slate-400 text-lg max-w-md">
                The most intuitive macro tracking app for achieving your fitness
                and nutrition goals.
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/50">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 text-slate-400">
              <p>
                &copy; {new Date().getFullYear()} MacroTrackr. All rights
                reserved.
              </p>
              <div className="flex items-center space-x-4">
                <Link
                  to="/terms"
                  className="hover:text-white transition-colors text-sm"
                >
                  Terms
                </Link>
                <Link
                  to="/privacy"
                  className="hover:text-white transition-colors text-sm"
                >
                  Privacy
                </Link>
                <a
                  href="mailto:contact@macrotrackr.com"
                  className="hover:text-white transition-colors text-sm"
                >
                  Contact
                </a>
                <a
                  href="mailto:support@macrotrackr.com"
                  className="hover:text-white transition-colors text-sm"
                >
                  Support
                </a>
              </div>
            </div>

            {/* Simple tagline */}
            <div className="mt-4 md:mt-0">
              <p className="text-slate-400 text-sm">
                Track better. Live healthier.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
