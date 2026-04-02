import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { billingApi } from "@/api/billing";
import CardContainer from "@/components/form/CardContainer";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import { CircleQuestionMarkIcon } from "@/components/ui";
import CustomPricingCards from "@/features/landing/components/CustomPricingCards";
import { usePageMetadata } from "@/hooks";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";

// --- Static data hoisted outside component (vercel: rendering-hoist-jsx) ---

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
 * /pricing page – Cards + FAQ.
 *
 * Simpler layout avoiding duplicate information between cards and table.
 * Cards provide the full feature list comparison.
 */
const PricingPage: React.FC = () => {
  usePageMetadata({
    title: "Pricing — MacroTrackr",
    description:
      "Compare plans and unlock Pro features on MacroTrackr — advanced insights, priority support, and unlimited tracking.",
    canonical: "https://macrotrackr.com/pricing",
    ogImage: "https://macrotrackr.com/icon.png",
  });

  const [openFaq, setOpenFaq] = useState<number | undefined>(0);
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useStore();

  // Sync subscription status from user data
  useUser();
  usePageDataSync();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      try {
        navigate({ to: "/login", search: { returnTo: "/pricing" } });
      } catch {
        globalThis.location.href = "/login?returnTo=/pricing";
      }
    }
  }, [isLoaded, isSignedIn, navigate]);

  const toggleFaq = (index: number) => {
    setOpenFaq((previous) => (previous === index ? undefined : index));
  };

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    try {
      const { url } = await billingApi.createCheckoutSession({
        successUrl: globalThis.location.origin + "/settings?upgraded=true",
        cancelUrl: globalThis.location.origin + "/pricing",
        plan,
      });
      globalThis.location.href = url;
    } catch {
      showNotification(
        "We couldn't start checkout right now. Please try again in a moment.",
        "error",
      );
    }
  };

  return (
    <DashboardPageContainer>
      <FeaturePage
        title="Pricing"
        subtitle="Upgrade to Pro for advanced insights, unlimited tracking, and premium tools."
      >
        <div className="space-y-12">
          {/* Card-based pricing — matches landing page */}
          <CustomPricingCards onUpgrade={handleUpgrade} showUpgradeButtons />

          {/* FAQ Section */}
          <CardContainer className="p-6 sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
                Everything you need to know about our plans
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={index}
                    className={`group rounded-xl border bg-surface-2 px-5 py-4 transition-colors ${
                      isOpen
                        ? "border-primary/60"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-start justify-between gap-4 rounded-xl text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
                      aria-expanded={isOpen}
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="flex items-start text-base leading-tight font-semibold text-foreground">
                        <CircleQuestionMarkIcon className="mt-0.5 mr-2 h-5 w-5 shrink-0 text-primary" />
                        {faq.question}
                      </span>
                      <span
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold transition-[background-color,color,transform] duration-200 ${
                          isOpen
                            ? "rotate-45 bg-primary/10 text-primary"
                            : "group-hover:bg-primary/10 group-hover:text-primary"
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="pt-3 pr-2 pl-7 text-sm leading-relaxed text-muted">
                            {faq.answer}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </CardContainer>
        </div>
      </FeaturePage>
    </DashboardPageContainer>
  );
};

export default PricingPage;
