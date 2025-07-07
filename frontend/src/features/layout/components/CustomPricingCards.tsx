import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "@/store/store";
import FormButton from "@/components/form/FormButton";
import { BUTTON_VARIANTS, BUTTON_SIZES } from "@/components/utils/constants";
import { CheckIcon } from "@/components/Icons";
import { ShieldCheck, CircleHelp, Sparkles } from "lucide-react";

interface CustomPricingCardsProps {
  onUpgrade?: (plan: "monthly" | "yearly") => void;
  showUpgradeButtons?: boolean;
}

const CustomPricingCards: React.FC<CustomPricingCardsProps> = ({
  onUpgrade,
  showUpgradeButtons = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.auth.isAuthenticated);

  const handleGetPro = () => {
    if (isAuthenticated) {
      // If user is logged in, go to pricing page
      navigate("/pricing");
    } else {
      // If user is not logged in, go to register
      navigate("/register");
    }
  };

  const features = {
    free: [
      "Macro Tracking",
      "Meal Types",
      "Weight Logging",
      "Goal Setting",
      "Basic Reporting",
    ],
    pro: [
      "Everything in Free",
      "Unlimited Habit Tracking",
      "Recipe & Meal Saver",
      "Advanced Analytics",
      "Ad-Free Experience",
      "Priority Support",
      "Export Data",
    ],
  };

  const proPrice = selectedPlan === "monthly" ? 6.99 : 59.99;
  const proSuffix = selectedPlan === "monthly" ? "/month" : "/year";
  const proEquivalent = selectedPlan === "yearly" ? "($4.99/month)" : "";

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Plan Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-2">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              selectedPlan === "monthly"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan("yearly")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
              selectedPlan === "yearly"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 30%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 lg:p-10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <div className="text-4xl font-bold text-slate-300 mb-2">
              $0
              <span className="text-lg font-normal text-slate-400">
                /forever
              </span>
            </div>
            <p className="text-slate-400">Perfect for getting started</p>
          </div>

          <ul className="space-y-4 mb-8">
            {features.free.map((feature, index) => (
              <li key={index} className="flex items-center space-x-3">
                <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>

          <Link to="/register">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <FormButton
                text="Get Started Free"
                variant={BUTTON_VARIANTS.GHOST}
                size={BUTTON_SIZES.LG}
                className="w-full bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-500 transition-all duration-300 text-xl px-12 py-4 font-semibold"
              />
            </motion.div>
          </Link>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-600/50 rounded-3xl p-8 lg:p-10 transform hover:scale-105 transition-transform duration-300"
        >
          {/* Popular Badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              Most Popular
            </span>
          </div>

          <div className="text-center mb-8 mt-4">
            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <div className="text-4xl font-bold text-white mb-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedPlan}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  ${proPrice}
                </motion.span>
              </AnimatePresence>
              <span className="text-lg font-normal text-slate-300">
                {proSuffix}
              </span>
            </div>
            {proEquivalent && (
              <p className="text-green-400 text-sm font-medium">
                {proEquivalent}
              </p>
            )}
            <p className="text-slate-400 mt-2">Unlock your full potential</p>
          </div>

          <ul className="space-y-4 mb-8">
            {features.pro.map((feature, index) => (
              <li key={index} className="flex items-center space-x-3">
                <CheckIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span className="text-white font-medium">{feature}</span>
              </li>
            ))}
          </ul>

          {showUpgradeButtons ? (
            <motion.div
              whileHover={{
                scale: 1.02,
                y: -2,
                boxShadow: "0 15px 30px rgba(79, 70, 229, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <FormButton
                text="Upgrade to Pro"
                variant={BUTTON_VARIANTS.PRIMARY}
                size={BUTTON_SIZES.LG}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl transition-all duration-300"
                onClick={() => onUpgrade && onUpgrade(selectedPlan)}
              />
            </motion.div>
          ) : (
            <motion.div
              whileHover={{
                scale: 1.02,
                y: -2,
                boxShadow: "0 15px 30px rgba(79, 70, 229, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <FormButton
                text="Get Pro"
                variant={BUTTON_VARIANTS.PRIMARY}
                size={BUTTON_SIZES.LG}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl transition-all duration-300"
                onClick={handleGetPro}
              />
            </motion.div>
          )}

          <p className="text-center text-slate-400 text-sm mt-4">
            Cancel anytime
          </p>
        </motion.div>
      </div>

      {/* Enhanced Trust Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-16 text-center"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            className="flex flex-col items-center group"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.div
              className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3"
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(34, 197, 94, 0.3)",
              }}
              transition={{ duration: 0.2 }}
            >
              <ShieldCheck className="w-6 h-6 text-green-400" />
            </motion.div>
            <h4 className="font-semibold text-white mb-1 group-hover:text-green-100 transition-colors duration-200">
              Secure & Private
            </h4>
            <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-200">
              Your data is encrypted and protected
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center group"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.div
              className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3"
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(59, 130, 246, 0.3)",
              }}
              transition={{ duration: 0.2 }}
            >
              <CircleHelp className="w-6 h-6 text-blue-400" />
            </motion.div>
            <h4 className="font-semibold text-white mb-1 group-hover:text-blue-100 transition-colors duration-200">
              24/7 Support
            </h4>
            <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-200">
              Get help whenever you need it
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center group"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.div
              className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3"
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(147, 51, 234, 0.3)",
              }}
              transition={{ duration: 0.2 }}
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
            </motion.div>
            <h4 className="font-semibold text-white mb-1 group-hover:text-purple-100 transition-colors duration-200">
              Always Improving
            </h4>
            <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-200">
              Regular updates and new features
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomPricingCards;
