import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { billingApi } from "@/api/billing";
import CardContainer from "@/components/form/CardContainer";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import Accordion from "@/components/ui/Accordion";
import CustomPricingCards from "@/features/landing/components/CustomPricingCards";
import { usePageMetadata } from "@/hooks";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";
import { APP_ICON_URL, buildCanonicalUrl } from "@/utils/appConstants";

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
    canonical: buildCanonicalUrl("/pricing"),
    ogImage: APP_ICON_URL,
  });

  const { isLoaded, isSignedIn } = useAppAuthState();
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
            <Accordion
              className="mx-auto max-w-3xl"
              defaultOpenFirst
              items={faqs.map((faq) => ({
                id: faq.question,
                question: faq.question,
                answer: faq.answer,
              }))}
            />
          </CardContainer>
        </div>
      </FeaturePage>
    </DashboardPageContainer>
  );
};

export default PricingPage;
