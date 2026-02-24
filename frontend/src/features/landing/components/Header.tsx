import { Link } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import React from "react";

import LogoButton from "@/components/layout/LogoButton";
import { getButtonClasses } from "@/components/ui/Button";

const Header: React.FC = () => {
  const posthog = usePostHog();

  const handlePricingClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
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
            <a
              href="#pricing"
              onClick={handlePricingClick}
              className={getButtonClasses("ghost", "sm", false, "text-muted hover:text-foreground")}
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              search={{ returnTo: undefined }}
              className={getButtonClasses("ghost", "sm", false, "text-muted hover:text-foreground inline-block")}
            >
              Log In
            </Link>
            <Link
              to="/register"
              search={{ returnTo: undefined }}
              className={getButtonClasses("primary", "sm", false, "inline-block")}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
