import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect } from "react";

import { PricingTable } from "@/components/billing";
import { PageBackground } from "@/components/layout";
import Navbar from "@/components/layout/Navbar";
import { CircleQuestionMarkIcon } from "@/components/ui";
import IconButton from "@/components/ui/IconButton";
import { useUser } from "@/hooks/auth/useAuthQueries";
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
  const { data: user, isLoading } = useUser();
  const navigate = useNavigate();

  // If user is not authenticated, redirect to login and include returnTo
  // so the login page can redirect back after successful authentication.
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // Use router navigation and include returnTo param
      try {
        navigate({ to: "/login", search: { returnTo: "/pricing" } });
      } catch {
        // Fallback to full navigation if router navigation fails
        globalThis.location.href = "/login?returnTo=/pricing";
      }
    }
  }, [user, isLoading, navigate]);

  const toggleFaq = (index: number) => {
    setOpenFaq((previous) => (previous === index ? undefined : index));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-foreground">
      {/* Background placed first so later siblings naturally paint above (no z-index hacks needed) */}
      <div className="pointer-events-none absolute inset-0">
        <PageBackground />
      </div>
      <Navbar />
      <main className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative mb-14 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-40 -translate-y-1/2 bg-[radial-gradient(circle_at_center,theme(colors.primary/25),transparent_70%)] blur-2xl" />

          <h1 className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            Unlock Your Full Potential
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground">
            Upgrade to Pro and take control with advanced tracking, deeper
            insights & unlimited growth tools.
          </p>
        </div>

        {/* Pricing Table Card */}
        <PricingTable
          onUpgrade={handleUpgrade}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
        />

        {/* FAQ Section */}
        <div className="relative ">
          <h2 className="m-10 text-center text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div
                  key={index}
                  className={`group rounded-xl border border-border/60 bg-surface/40 px-5 py-4 backdrop-blur-md transition-colors ${open ? "border-primary/60" : "hover:border-primary/40"}`}
                >
                  <div
                    className="flex w-full cursor-pointer items-start justify-between gap-4 text-left"
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => toggleFaq(index)}
                    onKeyDown={(event_) =>
                      (event_.key === "Enter" || event_.key === " ") &&
                      toggleFaq(index)
                    }
                  >
                    <span className="flex items-start text-base leading-tight font-semibold text-foreground">
                      <CircleQuestionMarkIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-primary" />
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
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-bold transition-transform ${open ? "rotate-45 bg-primary/10 text-primary" : "group-hover:bg-primary/10 group-hover:text-primary"}`}
                          aria-hidden="true"
                        >
                          +
                        </span>
                      }
                      className="mt-0.5"
                    />
                  </div>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
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
        </div>
      </main>
    </div>
  );
};

export default PricingPage;

// Usage: Add route /pricing -> <PricingPage />
