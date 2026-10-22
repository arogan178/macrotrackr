import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { ExternalLinkIcon, GithubIcon, Heading, Panel } from "@/components/ui";
import Button, { getButtonClasses } from "@/components/ui/Button";
import { PRICING, PRICING_PLANS } from "@/config/pricing";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useProductAnalytics } from "@/lib/productAnalytics";
import { GITHUB_REPO_URL, SETUP_DOCS_URL } from "@/utils/appConstants";

import PlanToggle from "./PlanToggle";
import PricingCard from "./PricingCard";

interface CustomPricingCardsProps {
  onUpgrade?: (plan: "monthly" | "yearly") => void;
  showUpgradeButtons?: boolean;
  /**
   * False when Pro cannot be bought from this build, which draws the Pro card
   * with no call to action. Distinct from showUpgradeButtons: that one picks
   * between upgrading here and sending the reader to the pricing page, and
   * both of those assume a purchase is possible somewhere.
   */
  canPurchase?: boolean;
}

const CustomPricingCards: React.FC<CustomPricingCardsProps> = ({
  onUpgrade,
  showUpgradeButtons = false,
  canPurchase = true,
}) => {
  const productAnalytics = useProductAnalytics();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const navigate = useNavigate();
  const { isSignedIn } = useAppAuthState();
  const isAuthenticated = !!isSignedIn;
  const { hasPaidPlan: isProUser } = useEntitlements();

  const handleGetPro = () => {
    if (isAuthenticated) {
      // If user is logged in, go to pricing page
      navigate({ to: "/pricing" });
    } else {
      // If user is not logged in, go to register and include a returnTo so
      // after signup/login the user can be redirected back to /pricing.
      productAnalytics.capture({
        event: "landing_cta_clicked",
        properties: {
          destination: "register",
          source: "pricing_pro",
        },
      });
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
  const proSuffix = selectedPlan === "monthly" ? "a month" : "a year";
  const proEquivalent =
    selectedPlan === "yearly"
      ? `$${(PRICING.yearly / 12).toFixed(2)} a month`
      : "";

  const freeAction = (
    <Button
      text={isProUser ? "Free plan" : isAuthenticated ? "Current plan" : "Create a free account"}
      variant="secondary"
      buttonSize="lg"
      fullWidth
      disabled={isAuthenticated}
      onClick={
        isAuthenticated
          ? undefined
          : () => {
              productAnalytics.capture({
                event: "landing_cta_clicked",
                properties: { destination: "register", source: "pricing_free" },
              });
              navigate({ to: "/register", search: { returnTo: undefined } });
            }
      }
    />
  );

  const proAction =
    !isProUser && !canPurchase ? undefined : (
      <Button
        text={isProUser ? "Current plan" : showUpgradeButtons ? "Upgrade to Pro" : "Unlock Pro"}
        variant="primary"
        buttonSize="lg"
        fullWidth
        disabled={isProUser}
        onClick={
          isProUser
            ? undefined
            : showUpgradeButtons
              ? () => onUpgrade?.(selectedPlan)
              : handleGetPro
        }
      />
    );

  return (
    <div className="w-full">
      <div className="mb-8 flex justify-center">
        <PlanToggle selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PricingCard
          title={PRICING_PLANS.free.name}
          price={PRICING_PLANS.free.price}
          suffix="for good"
          description="Log meals, set targets and see your last seven days. No card needed."
          features={features.free}
          action={freeAction}
        />
        <PricingCard
          title={PRICING_PLANS.pro.name}
          price={
            <AnimatedNumber value={proPrice} toFixedValue={2} prefix="$" />
          }
          suffix={proSuffix}
          equivalent={proEquivalent}
          description="Your full history, 30 and 90 day trends, and no limits on saved meals or habits."
          features={features.pro}
          raised
          action={proAction}
        />
      </div>

      {/* Self-hosting is the third way to pay nothing, so it sits under the
          plans as its own panel rather than as a third card. */}
      <Panel id="self-hosted" className="mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Heading level="panel" as="h3">
              Run it on your own server, free
            </Heading>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Deploy the open source edition with Docker Compose. Your data
              stays on your machine, sign-in is local, and you can move to the
              hosted plans later.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className={getButtonClasses("secondary", "md", false, "gap-2")}
              onClick={() =>
                productAnalytics.capture({
                  event: "landing_cta_clicked",
                  properties: { destination: "github", source: "self_hosted_github" },
                })
              }
            >
              <GithubIcon className="h-4 w-4" aria-hidden="true" />
              View on GitHub
            </a>
            <a
              href={SETUP_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className={getButtonClasses("ghost", "md", false, "gap-2")}
              onClick={() =>
                productAnalytics.capture({
                  event: "landing_cta_clicked",
                  properties: { destination: "docs", source: "self_hosted_docs" },
                })
              }
            >
              <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
              Read the setup guide
            </a>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default CustomPricingCards;
