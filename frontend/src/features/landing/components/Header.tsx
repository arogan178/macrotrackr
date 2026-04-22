import React from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";

import LogoButton from "@/components/layout/LogoButton";
import { ExternalLinkIcon, GithubIcon } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import { DOCS_URL, GITHUB_REPO_URL } from "@/utils/appConstants";

const navLinkClasses =
  "inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const externalLinkClasses =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const Header: React.FC = () => {
  const posthog = usePostHog();
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === "/";
  const isBlogPage = location.pathname.startsWith("/blog");

  const captureNavigation = (source: string) => {
    posthog.capture("clicked_pricing_nav", {
      location: "header",
      source,
    });
  };

  const handlePricingClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const element = document.querySelector("#pricing");
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      captureNavigation("landing_header_pricing");
    }
  };

  const handleFeaturesClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const element = document.querySelector("#features");
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      posthog.capture("clicked_features_nav", {
        location: "header",
        source: "landing_header_features",
      });
    }
  };

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between rounded-2xl border border-border bg-surface px-4 shadow-sm transition-colors duration-200 sm:px-6">
        {/* Left: Brand */}
        <div className="flex w-1/3 items-center justify-start">
          <LogoButton compact onClick={() => navigate({ to: "/" })} />
        </div>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden w-1/3 items-center justify-center gap-1 lg:flex">
          {isLandingPage ? (
            <>
              <a
                href="#features"
                onClick={handleFeaturesClick}
                className={navLinkClasses}
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={handlePricingClick}
                className={navLinkClasses}
              >
                Pricing
              </a>
            </>
          ) : null}
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className={externalLinkClasses}
            onClick={() => captureNavigation("landing_header_docs")}
          >
            Docs
            <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className={externalLinkClasses}
            onClick={() => captureNavigation("landing_header_github")}
            aria-label="View MacroTrackr on GitHub"
          >
            <GithubIcon className="h-3.5 w-3.5" aria-hidden="true" />
            GitHub
          </a>
          {!isBlogPage && (
            <Link
              to="/blog"
              search={{ category: undefined, tag: undefined, q: undefined }}
              className={navLinkClasses}
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
            className="hidden min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none md:inline-flex"
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
