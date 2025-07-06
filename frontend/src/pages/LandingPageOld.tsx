import React from "react";
import { Link } from "react-router-dom";
import { PricingTable } from "../components/PricingTable";
import FormButton from "@/components/form/FormButton";
import { BUTTON_VARIANTS, BUTTON_SIZES } from "@/components/utils/constants";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-x-hidden">
      {/* Glassy radial background overlay */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_60%_40%,rgba(67,56,202,0.18),transparent_70%)] pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 bg-transparent py-6">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 text-transparent bg-clip-text">
            MacroTrackr
          </h1>
          <nav className="flex gap-3">
            <Link to="/login">
              <FormButton
                text="Login"
                variant={BUTTON_VARIANTS.GHOST}
                size={BUTTON_SIZES.MD}
                className="rounded-lg !bg-transparent !text-indigo-200 hover:!bg-indigo-700/30 hover:!text-white border-0 px-6 py-2 font-semibold transition-all"
                ariaLabel="Login"
              />
            </Link>
            <Link to="/register">
              <FormButton
                text="Sign Up"
                variant={BUTTON_VARIANTS.PRIMARY}
                size={BUTTON_SIZES.MD}
                className="rounded-lg !bg-indigo-600 hover:!bg-indigo-700 !text-white border-0 px-6 py-2 font-semibold transition-all shadow-none"
                ariaLabel="Sign Up"
              />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
        <div className="max-w-2xl w-full mx-auto text-center bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-indigo-400/10 p-10 mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-200 via-white to-indigo-400 text-transparent bg-clip-text drop-shadow-lg mb-4">
            Track Your Macros, Achieve Your Goals
          </h2>
          <p className="text-lg sm:text-xl text-indigo-100 mb-8">
            MacroTrackr helps you easily monitor your daily intake of proteins,
            carbs, and fats to help you reach your fitness and health goals
            faster.
          </p>
          <Link to="/register">
            <FormButton
              text="Create Free Account"
              variant={BUTTON_VARIANTS.PRIMARY}
              size={BUTTON_SIZES.LG}
              className="px-8 py-4 text-lg font-bold rounded-xl shadow-lg"
              ariaLabel="Create Free Account with MacroTrackr"
            />
          </Link>
          <div className="mt-3 text-sm text-indigo-200">
            No credit card required
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 via-white to-indigo-400 text-transparent bg-clip-text">
              Features
            </h3>
            <p className="text-indigo-100 mt-2">
              Everything you need to stay on track.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card text-center p-8 rounded-2xl border border-indigo-400/10 shadow-lg">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-600/80 text-white mx-auto mb-4 shadow-lg">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="mt-2 text-lg font-semibold text-indigo-100">
                Log Your Meals
              </h4>
              <p className="mt-2 text-indigo-200">
                Quickly add your meals and see your macro breakdown for the day.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="glass-card text-center p-8 rounded-2xl border border-indigo-400/10 shadow-lg">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-500/80 text-white mx-auto mb-4 shadow-lg">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h4 className="mt-2 text-lg font-semibold text-indigo-100">
                Set Your Goals
              </h4>
              <p className="mt-2 text-indigo-200">
                Customize your macro and calorie targets to match your personal
                goals.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="glass-card text-center p-8 rounded-2xl border border-indigo-400/10 shadow-lg">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-400/80 text-white mx-auto mb-4 shadow-lg">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 className="mt-2 text-lg font-semibold text-indigo-100">
                Track Your Progress
              </h4>
              <p className="mt-2 text-indigo-200">
                Visualize your progress over time with beautiful charts and
                reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass-card p-8 rounded-2xl border border-indigo-400/10 shadow-lg">
            <PricingTable showProButton={false} />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-200 via-white to-indigo-400 text-transparent bg-clip-text text-center mb-8">
            What our users say
          </h3>
          <div className="grid gap-8 md:grid-cols-2">
            <blockquote className="glass-card rounded-2xl border border-indigo-400/10 shadow-lg p-6 flex flex-col h-full">
              <p className="text-indigo-100 italic mb-4">
                “MacroTrackr helped me finally stay consistent with my
                nutrition. The charts and reminders are game changers!”
              </p>
              <footer className="mt-auto text-sm text-indigo-300">
                — Alex P.,{" "}
                <span className="font-medium">Fitness Enthusiast</span>
              </footer>
            </blockquote>
            <blockquote className="glass-card rounded-2xl border border-indigo-400/10 shadow-lg p-6 flex flex-col h-full">
              <p className="text-indigo-100 italic mb-4">
                “I love the simple interface and how easy it is to track my
                macros and habits in one place.”
              </p>
              <footer className="mt-auto text-sm text-indigo-300">
                — Jamie L., <span className="font-medium">Nutrition Coach</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-indigo-200">
          <p>
            &copy; {new Date().getFullYear()} MacroTrackr. All rights reserved.
          </p>
          <p className="mt-2">
            <a
              href="mailto:contact@macrotrackr.com"
              className="hover:text-white underline"
            >
              Contact Us
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

// Glassmorphism utility (Tailwind plugin or add to global CSS if not present)
// .glass-card { @apply bg-white/5 backdrop-blur-md; }

export default LandingPage;
