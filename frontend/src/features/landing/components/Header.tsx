import { Link } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import React from "react";

import LogoButton from "@/components/layout/LogoButton";
import { Button } from "@/components/ui";

const Header: React.FC = () => {
  const posthog = usePostHog();

  const handlePricingClick = () => {
    // Always attempt to smooth-scroll to the pricing section if it exists.
    // We intentionally do NOT navigate to /pricing here to keep the user on
    // the same landing page and preserve their scroll context.
    const element = document.querySelector("#pricing");
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      posthog?.capture?.("clicked_pricing_nav", {
        location: "header",
        source: "landing_header",
      });
    }
  };

  return (
    <header className="relative z-10 border-b border-border/50 bg-surface backdrop-blur-xl supports-[backdrop-filter]:bg-surface">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <LogoButton className="h-0" />
            <Button
              onClick={handlePricingClick}
              text="Pricing"
              variant="ghost"
              buttonSize="md"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="inline-block">
              <Button text="Log In" variant="primary" buttonSize="md" />
            </Link>
            <Link to="/register" className="inline-block">
              <Button text="Sign Up" variant="primary" buttonSize="md" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
