import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { ExternalLinkIcon, GithubIcon } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import { PRICING, PRICING_PLANS } from "@/config/pricing";
import { isLocalAuthMode } from "@/config/runtime";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { useStore } from "@/store/store";
import { GITHUB_REPO_URL, SETUP_DOCS_URL } from "@/utils/appConstants";

import PlanToggle from "./PlanToggle";
import PricingCard from "./PricingCard";
import TrustIndicators from "./TrustIndicators";

interface CustomPricingCardsProps {
  onUpgrade?: (plan: "monthly" | "yearly") => void;
  showUpgradeButtons?: boolean;
}

const CustomPricingCards: React.FC<CustomPricingCardsProps> = ({
  onUpgrade,
  showUpgradeButtons = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const navigate = useNavigate();
  const { isSignedIn } = useAppAuthState();
  const isAuthenticated = !!isSignedIn;
  const subscriptionStatus = useStore((s) => s.subscriptionStatus);
  const isProUser =
    isLocalAuthMode ||
    subscriptionStatus === "pro" ||
    subscriptionStatus === "canceled";
  const posthog = usePostHog();

  const trackClick = (source: string) => {
    posthog.capture("clicked_pricing_nav", {
      location: "pricing_cards",
      source,
    });
  };

  const handleGetPro = () => {
    if (isAuthenticated) {
      // If user is logged in, go to pricing page
      trackClick("pricing_card_pro");
      navigate({ to: "/pricing" });
    } else {
      // If user is not logged in, go to register and include a returnTo so
      // after signup/login the user can be redirected back to /pricing.
      trackClick("pricing_card_pro_unauth");
      try {
        navigate({ to: "/register", search: { returnTo: "/pricing" } });
      } catch {
        // Fallback to full navigation
        globalThis.location.href = "/register?returnTo=/pricing";
      }
    }
  };

  // Use centralized config for features and static plan data
  const features = {
    free: PRICING_PLANS.free.features,
    pro: PRICING_PLANS.pro.features,
  };

  const proPrice =
    selectedPlan === "monthly" ? PRICING.monthly : PRICING.yearly;
  const proSuffix = selectedPlan === "monthly" ? "/month" : "/year";
  const proEquivalent =
    selectedPlan === "yearly"
      ? `($${(PRICING.yearly / 12).toFixed(2)}/month)`
      : "";

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Plan Toggle */}
      <div className="mb-12 flex justify-center">
        <PlanToggle selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Free Plan */}
        <PricingCard
          title={PRICING_PLANS.free.name}
          price={PRICING_PLANS.free.price}
          suffix={PRICING_PLANS.free.suffix}
          features={features.free}
          buttonText={
            isProUser ? "Free Plan" : isAuthenticated ? "Current Plan" : "Create Free Account"
          }
          buttonVariant="ghost"
          buttonSize="lg"
          buttonClassName="w-full rounded-full border border-border bg-surface-2 transition-colors duration-200 hover:border-border-2 hover:bg-surface-3 hover:text-foreground"
          featureIconColor="text-primary/70"
          featureTextClass="text-muted"
          cardClassName="border-border bg-surface hover:border-border-2"
          buttonDisabled={isAuthenticated}
          onButtonClick={
            isAuthenticated
              ? undefined
              : () => {
                  trackClick("pricing_card_free");
                  navigate({ to: "/register", search: { returnTo: undefined } });
                }
          }
        >
          <p className="mt-2 text-balance text-muted">
            Everything you need to start tracking and build lasting healthy habits.
          </p>
        </PricingCard>

        {/* Pro Plan */}
        <PricingCard
          title={PRICING_PLANS.pro.name}
          price={
            <AnimatedNumber
              value={proPrice}
              toFixedValue={2}
              prefix="$"
              suffix={proSuffix}
            />
          }
          suffix=""
          equivalent={proEquivalent}
          features={features.pro}
          isPopular
          buttonText={
            isProUser
              ? "Current Plan"
              : showUpgradeButtons
                ? "Upgrade to Pro"
                : "Unlock Pro"
          }
          buttonVariant="primary"
          buttonSize="lg"
          buttonClassName="w-full rounded-full font-semibold transition-colors duration-200 hover:bg-primary/90"
          featureIconColor="text-primary"
          featureTextClass="text-foreground font-medium"
          cardClassName="border-border-2 bg-surface-2 hover:border-primary/50"
          buttonDisabled={isProUser}
          onButtonClick={
            isProUser
              ? undefined
              : showUpgradeButtons
                ? () => onUpgrade?.(selectedPlan)
                : handleGetPro
          }
        >
          <p className="mt-2 text-balance text-muted">
            Unlock advanced analytics, custom insights, and tools to accelerate your results.
          </p>
        </PricingCard>
      </div>

      <section
        id="self-hosted"
        className="mt-10 rounded-3xl border border-border bg-surface/80 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
              Self-Hosted Option
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Run MacroTrackr on your own infrastructure for free
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Deploy with Docker Compose, keep full control of your data, and
              use the open source edition at no cost.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Free self-hosted runtime with local authentication
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Full source code and deployment files on GitHub
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Upgrade to cloud plans when you want managed operations
              </li>
            </ul>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className={getButtonClasses(
                "outline",
                "md",
                true,
                "min-w-[220px] rounded-full border-border bg-surface text-foreground hover:bg-surface-2",
              )}
              onClick={() => trackClick("self_hosted_github")}
            >
              <GithubIcon className="h-4 w-4" aria-hidden="true" />
              <span>View GitHub Repo</span>
            </a>
            <a
              href={SETUP_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className={getButtonClasses(
                "ghost",
                "md",
                true,
                "min-w-[220px] rounded-full border border-border bg-surface-2 text-foreground hover:bg-surface-3",
              )}
              onClick={() => trackClick("self_hosted_docs")}
            >
              <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
              <span>Read Setup Docs</span>
            </a>
          </div>
        </div>
      </section>

      {/* Enhanced Trust Indicators */}
      <TrustIndicators />
    </div>
  );
};

export default CustomPricingCards;
