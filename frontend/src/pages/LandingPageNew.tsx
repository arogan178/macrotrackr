import React from "react";
import { Link } from "react-router-dom";
import { PricingTable } from "../components/PricingTable";
import FormButton from "@/components/form/FormButton";
import { BUTTON_VARIANTS, BUTTON_SIZES } from "@/components/utils/constants";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(67,56,202,0.2),transparent_50%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 text-transparent bg-clip-text">
                MacroTrackr
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link to="/login">
                <FormButton
                  text="Login"
                  variant={BUTTON_VARIANTS.GHOST}
                  size={BUTTON_SIZES.MD}
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 border-0"
                />
              </Link>
              <Link to="/register">
                <FormButton
                  text="Sign Up"
                  variant={BUTTON_VARIANTS.PRIMARY}
                  size={BUTTON_SIZES.MD}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
              <span className="block bg-gradient-to-r from-white via-blue-100 to-indigo-200 text-transparent bg-clip-text">
                Track Your Macros
              </span>
              <span className="block bg-gradient-to-r from-indigo-200 via-blue-200 to-white text-transparent bg-clip-text">
                Achieve Your Goals
              </span>
            </h1>

            <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-slate-300 mb-12 leading-relaxed">
              The most intuitive macro tracking app designed to help you reach
              your fitness and nutrition goals with precision and ease.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link to="/register">
                <FormButton
                  text="Start Your Journey"
                  variant={BUTTON_VARIANTS.PRIMARY}
                  size={BUTTON_SIZES.LG}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-8 py-4 text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-200"
                />
              </Link>
              <span className="text-slate-400 text-sm">
                Free • No Credit Card Required
              </span>
            </div>

            <div className="flex items-center justify-center space-x-8 text-slate-400 text-sm">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Easy Setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Real-time Tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Advanced Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Comprehensive tools designed to make macro tracking simple,
              accurate, and effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 hover:transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
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

            {/* Feature 2 */}
            <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 hover:transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
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

            {/* Feature 3 */}
            <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300 hover:transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
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
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-400">
              Start free and upgrade when you're ready for advanced features.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 lg:p-12">
            <PricingTable showProButton={false} />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6">
              Loved by Thousands
            </h2>
            <p className="text-xl text-slate-400">
              See what our users say about their MacroTrackr experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300">
              <div className="flex items-start space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
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
                  <div className="font-semibold text-white">Alex Peterson</div>
                  <div className="text-slate-400">Fitness Enthusiast</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300">
              <div className="flex items-start space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
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
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-6">
            Ready to Transform Your Nutrition?
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Join thousands of users who have already achieved their goals with
            MacroTrackr.
          </p>
          <Link to="/register">
            <FormButton
              text="Get Started Free"
              variant={BUTTON_VARIANTS.PRIMARY}
              size={BUTTON_SIZES.LG}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-12 py-4 text-xl font-semibold shadow-xl transform hover:scale-105 transition-all duration-200"
            />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text">
                MacroTrackr
              </h3>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 text-slate-400">
              <p>
                &copy; {new Date().getFullYear()} MacroTrackr. All rights
                reserved.
              </p>
              <a
                href="mailto:contact@macrotrackr.com"
                className="hover:text-white transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
