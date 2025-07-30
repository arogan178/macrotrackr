import React from "react";

import { PricingTable } from "@/components/billing";
import Navbar from "@/components/layout/Navbar";
import { CircleQuestionMarkIcon, StarIcon } from "@/components/ui";
import { createCheckoutSession } from "@/utils/apiBilling";

const testimonials = [
  {
    quote:
      "The advanced reporting is a game-changer. I can finally see my progress and make adjustments.",
    author: "Sarah J.",
  },
  {
    quote:
      "Unlimited habit tracking keeps me accountable. I've never been more consistent!",
    author: "Mike R.",
  },
  {
    quote:
      "Setting specific macro targets helped me break through a plateau. Worth every penny.",
    author: "Emily K.",
  },
];

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time from your billing settings. Your Pro access will continue until the end of the current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards processed securely through Stripe.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "You will retain Pro access until your current subscription period ends. Afterward, your account will revert to the Free plan, and you will no longer be charged.",
  },
];

/**
 * /pricing page - Feature comparison and upgrade flow
 */

const handleUpgrade = async (plan: "monthly" | "yearly") => {
  try {
    const { url } = await createCheckoutSession(
      globalThis.location.origin + "/settings?upgraded=true",
      globalThis.location.origin + "/pricing",
      plan,
    );
    globalThis.location.href = url;
  } catch {
    alert("Failed to start checkout. Please try again.");
  }
};

const PricingPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = React.useState<"monthly" | "yearly">(
    "monthly",
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 text-transparent bg-clip-text tracking-tight">
            Unlock Your Full Potential
          </h1>
          <p className="mt-4 text-lg text-foreground max-w-2xl mx-auto">
            Join Pro to access exclusive features designed to help you achieve
            your fitness goals faster.
          </p>
        </div>

        <div className="mb-12">
          <PricingTable
            onUpgrade={handleUpgrade}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
          />
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Why Users Love Pro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-surface/50 p-6 rounded-lg border border-border/50"
              >
                <div className="flex items-center mb-2">
                  {Array.from({ length: 5 }).map((_, index_) => (
                    <StarIcon key={index_} className="w-5 h-5 text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.quote}"</p>
                <p className="text-foreground font-semibold">
                  - {testimonial.author}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-surface/50 p-4 rounded-lg mb-4 border border-border/50"
              >
                <h3 className="font-semibold text-lg flex items-center">
                  <CircleQuestionMarkIcon className="w-5 h-5 mr-2 text-primary" />
                  {faq.question}
                </h3>
                <p className="text-foreground mt-2 ml-7">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;

// Usage: Add route /pricing -> <PricingPage />
