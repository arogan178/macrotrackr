import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect } from "react";

import { PricingTable } from "@/components/billing";
import { CardContainer } from "@/components/form";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import { CircleQuestionMarkIcon, IconButton } from "@/components/ui";
import usePageMetadata from "@/hooks/usePageMetadata";
import { createCheckoutSession } from "@/utils/apiBilling";

// Testimonials array removed (not used)

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
  usePageMetadata({
    title: "Pricing — MacroTrackr",
    description:
      "Compare plans and unlock Pro features on MacroTrackr — advanced insights, priority support, and unlimited tracking.",
    canonical: "https://macrotrackr.com/pricing",
    ogImage: "https://macrotrackr.com/icon.png",
  });
  const [selectedPlan, setSelectedPlan] = React.useState<"monthly" | "yearly">(
    "monthly",
  );
  const [openFaq, setOpenFaq] = React.useState<number | undefined>(0);
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // If user is not authenticated, redirect to login and include returnTo
  // so the login page can redirect back after successful authentication.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      // Use router navigation and include returnTo param
      try {
        navigate({ to: "/login", search: { returnTo: "/pricing" } });
      } catch {
        // Fallback to full navigation if router navigation fails
        globalThis.location.href = "/login?returnTo=/pricing";
      }
    }
  }, [isLoaded, isSignedIn, navigate]);

  const toggleFaq = (index: number) => {
    setOpenFaq((previous) => (previous === index ? undefined : index));
  };

  return (
    <DashboardPageContainer>
      <FeaturePage
        title="Pricing"
        subtitle="Upgrade to Pro for advanced insights, unlimited tracking, and premium tools."
      >
        <div className="space-y-8">
          <CardContainer className="p-6 sm:p-8">
            <PricingTable
              onUpgrade={handleUpgrade}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
            />
          </CardContainer>

          {/* FAQ Section */}
          <CardContainer className="p-6 sm:p-8">
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-3xl space-y-4">
              {faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div
                    key={index}
                    className={`group rounded-xl border bg-surface-2 px-5 py-4 transition-colors ${
                      open ? "border-primary/60" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 text-left"
                      aria-expanded={open}
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="flex items-start text-base leading-tight font-semibold text-foreground">
                        <CircleQuestionMarkIcon className="mt-0.5 mr-2 h-5 w-5 shrink-0 text-primary" />
                        {faq.question}
                      </span>
                      <IconButton
                        variant="custom"
                        ariaLabel={open ? "Collapse FAQ" : "Expand FAQ"}
                        onClick={(event_) => {
                          event_.stopPropagation();
                          toggleFaq(index);
                        }}
                        icon={
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-bold transition-all ${
                              open
                                ? "rotate-45 bg-primary/10 text-primary"
                                : "group-hover:bg-primary/10 group-hover:text-primary"
                            }`}
                            aria-hidden="true"
                          >
                            +
                          </span>
                        }
                        className="mt-0.5"
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
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
                      )}
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

// Usage: Add route /pricing -> <PricingPage />
