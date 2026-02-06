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
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <LogoButton className="h-0" />
            <Button
              onClick={handlePricingClick}
              text="Pricing"
              variant="ghost"
              buttonSize="sm"
              className="text-muted hover:text-foreground"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="inline-block">
              <Button
                text="Log In"
                variant="ghost"
                buttonSize="sm"
                className="text-muted hover:text-foreground"
              />
            </Link>
            <Link to="/register" className="inline-block">
              <Button text="Sign Up" variant="primary" buttonSize="sm" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
