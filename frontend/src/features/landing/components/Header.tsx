import { Link, useLocation } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import React from "react";

import LogoButton from "@/components/layout/LogoButton";
import { getButtonClasses } from "@/components/ui/Button";

const Header: React.FC = () => {
  const posthog = usePostHog();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  const handlePricingClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const element = document.querySelector("#pricing");
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      posthog?.capture?.("clicked_pricing_nav", {
        location: "header",
        source: "landing_header",
      });
    }
  };

  const handleFeaturesClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const element = document.querySelector("#features");
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      posthog?.capture?.("clicked_features_nav", {
        location: "header",
        source: "landing_header",
      });
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Left: Brand */}
        <div className="flex w-1/3 items-center justify-start">
          <LogoButton className="!h-auto !p-0" />
        </div>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden w-1/3 items-center justify-center gap-1 sm:flex">
          {isLandingPage ? (
            <>
              <a
                href="#features"
                onClick={handleFeaturesClick}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={handlePricingClick}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                Pricing
              </a>
            </>
          ) : null}
          <Link
            to="/blog"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            Blog
          </Link>
        </nav>

        {/* Right: Auth */}
        <div className="flex w-1/3 items-center justify-end gap-3">
          <Link
            to="/login"
            search={{ returnTo: undefined }}
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground sm:inline-block"
          >
            Log In
          </Link>
          <Link
            to="/register"
            search={{ returnTo: undefined }}
            className={getButtonClasses(
              "primary",
              "sm",
              false,
              "rounded-full font-semibold",
            )}
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
