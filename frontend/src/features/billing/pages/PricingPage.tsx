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
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Unlock Your Full Potential
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground">
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
          <h2 className="mb-8 text-center text-3xl font-bold">
            Why Users Love Pro
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/50 bg-surface/50 p-6"
              >
                <div className="mb-2 flex items-center">
                  {Array.from({ length: 5 }).map((_, index_) => (
                    <StarIcon key={index_} className="h-5 w-5 text-warning" />
                  ))}
                </div>
                <p className="mb-4 text-foreground">"{testimonial.quote}"</p>
                <p className="font-semibold text-foreground">
                  - {testimonial.author}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-8 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="mb-4 rounded-lg border border-border/50 bg-surface/50 p-4"
              >
                <h3 className="flex items-center text-lg font-semibold">
                  <CircleQuestionMarkIcon className="mr-2 h-5 w-5 text-primary" />
                  {faq.question}
                </h3>
                <p className="mt-2 ml-7 text-foreground">{faq.answer}</p>
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
