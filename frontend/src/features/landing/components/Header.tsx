import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import React from "react";

import LogoButton from "@/components/layout/LogoButton";
import { getButtonClasses } from "@/components/ui/Button";

const Header: React.FC = () => {
  const posthog = usePostHog();
  const location = useLocation();
  const navigate = useNavigate({ from: "/" });
  const isLandingPage = location.pathname === "/";
  const isBlogPage = location.pathname.startsWith("/blog");

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
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className="supports-backdrop-filter:bg-background/75 mx-auto flex min-h-14 max-w-7xl items-center justify-between rounded-2xl border border-border/70 bg-background/85 px-4 shadow-lg shadow-black/5 backdrop-blur-md transition-colors duration-200 sm:px-6">
        {/* Left: Brand */}
        <div className="flex w-1/3 items-center justify-start">
          <LogoButton compact onClick={() => navigate({ to: "/" })} />
        </div>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden w-1/3 items-center justify-center gap-1 sm:flex">
          {isLandingPage ? (
            <>
              <a
                href="#features"
                onClick={handleFeaturesClick}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={handlePricingClick}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                Pricing
              </a>
            </>
          ) : null}
          {!isBlogPage && (
            <Link
              to="/blog"
              search={{ category: undefined, tag: undefined, q: undefined }}
              className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              Blog
            </Link>
          )}
        </nav>

        {/* Right: Auth */}
        <div className="flex w-1/3 items-center justify-end gap-3">
          <Link
            to="/login"
            search={{ returnTo: undefined }}
            className="hidden min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none sm:inline-flex"
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
