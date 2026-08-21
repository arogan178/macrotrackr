import React from "react";
import { useNavigate } from "@tanstack/react-router";

import { billingApi } from "@/api/billing";
import CardContainer from "@/components/form/CardContainer";
import AppHeader from "@/components/layout/AppHeader";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import Accordion from "@/components/ui/Accordion";
import { playProductIdFor } from "@/config/runtime";
import { useCanPurchaseHere } from "@/features/billing/hooks/useCanPurchaseHere";
import CustomPricingCards from "@/features/landing/components/CustomPricingCards";
import { usePageMetadata } from "@/hooks";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { purchasePro } from "@/services/native/playBilling";
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
  // The single answer to "may this build sell Pro, and through what". Replaces
  // a hardcoded flag that always drew the button and let the purchase fail.
  const { canPurchase, provider } = useCanPurchaseHere();
  const navigate = useNavigate();
  const { showNotification } = useStore();

  // Sync subscription status from user data
  useUser();
  usePageDataSync();

  // Android sells Pro through Play Billing, which Play policy requires for
  // digital goods bought in the app. Everywhere else goes to Stripe checkout.
  const upgradeThroughPlay = async (plan: "monthly" | "yearly") => {
    const productId = playProductIdFor(plan);
    if (!productId) {
      showNotification(
        "In-app purchases are not available in this build.",
        "error",
      );

      return;
    }

    // Fetch the account token before opening the sheet. If this fails the
    // purchase still goes ahead: the verify call right after is the normal way
    // the purchase gets attached, and the token only matters when that fails.
    let obfuscatedAccountId: string | undefined;
    try {
      const { accountToken } = await billingApi.getPlayAccountToken();
      obfuscatedAccountId = accountToken;
    } catch {
      obfuscatedAccountId = undefined;
    }

    const outcome = await purchasePro(productId, { obfuscatedAccountId });

    if (outcome.kind === "cancelled") {
      // Backing out of the Play sheet is a normal choice, not a failure.
      return;
    }

    if (outcome.kind === "unavailable") {
      showNotification(
        "Google Play billing is not available on this device.",
        "error",
      );

      return;
    }

    if (outcome.kind === "failed") {
      showNotification(
        "We couldn't complete that purchase. Please try again in a moment.",
        "error",
      );

      return;
    }

    // Paid, but not entitled until the server has checked the token with
    // Google. A failure here means money taken and no Pro, so it has to say
    // something more useful than "try again".
    try {
      const verification = await billingApi.verifyPlayPurchase(
        outcome.purchaseToken,
      );

      if (verification.entitled) {
        showNotification("You're on Pro. Enjoy.", "success");
        navigate({ to: "/settings", search: { tab: "billing" } });

        return;
      }

      showNotification(
        "Google Play has your purchase but it is not active yet. It should unlock shortly.",
        "info",
      );
    } catch {
      showNotification(
        "Your payment went through but we couldn't activate Pro. Reopen the app shortly, or contact support if it persists.",
        "error",
      );
    }
  };

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    // Signed out, the upgrade path is sign-up: checkout needs an account.
    if (isLoaded && !isSignedIn) {
      navigate({ to: "/register", search: { returnTo: "/pricing" } });

      return;
    }

    // Nothing should reach here with canPurchase false, since the button is
    // not drawn. Kept as the interlock: this is the last point before money
    // moves, and a stale render must not be able to open Play's sheet.
    if (!canPurchase) {
      showNotification(
        "Pro isn't available to buy in this app right now.",
        "info",
      );

      return;
    }

    if (provider === "play") {
      await upgradeThroughPlay(plan);

      return;
    }

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

  const isSignedOut = isLoaded && !isSignedIn;

  return (
    <>
      {/* Signed in, MainLayout already renders the app header. */}
      {isSignedOut ? <AppHeader mode="public" /> : null}
      <DashboardPageContainer>
        <FeaturePage
          title="Pricing"
          subtitle="Upgrade to Pro for advanced insights, unlimited tracking, and premium tools."
        >
          <div className="space-y-12">
            {/* Card-based pricing — matches landing page */}
            <CustomPricingCards
              onUpgrade={handleUpgrade}
              showUpgradeButtons
              canPurchase={canPurchase}
            />

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
    </>
  );
};

export default PricingPage;
