import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";

import LogoButton from "@/components/layout/LogoButton";
import { ChevronDownIcon, ExternalLinkIcon, GithubIcon } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import {
  CALCULATOR_TOOLS,
  TOOLS_HUB_PATH,
} from "@/features/landing/tools/toolsCatalog";
import { DOCS_URL, GITHUB_REPO_URL } from "@/utils/appConstants";

const navLinkClasses =
  "inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const externalLinkClasses =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const toolsPopoverItems = [
  {
    to: TOOLS_HUB_PATH,
    label: "All free calculators",
    description: "Browse the complete suite of nutrition tools",
  },
  ...CALCULATOR_TOOLS.map((tool) => ({
    to: tool.path,
    label: tool.navLabel ?? tool.title,
    description: tool.tagline,
  })),
];

interface ToolsDropdownProps {
  isActive: boolean;
  currentPath: string;
}

const ToolsDropdown: React.FC<ToolsDropdownProps> = ({
  isActive,
  currentPath,
}) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when the route changes, including on browser back/forward.
  // jsdom has no popover API, hence the optional call.
  const closePopover = () => popoverRef.current?.hidePopover?.();
  useEffect(closePopover, [currentPath]);

  return (
    <>
      {/* Light dismiss, Escape, and focus restoration come from the popover API. */}
      <button
        type="button"
        popoverTarget="tools-popover"
        className={`${navLinkClasses} gap-1.5 [anchor-name:--tools-trigger] ${isActive ? "bg-surface-2 text-foreground" : ""}`}
      >
        Tools
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        ref={popoverRef}
        id="tools-popover"
        popover="auto"
        onToggle={(event) => setOpen(event.newState === "open")}
        className="w-80 rounded-2xl border border-border bg-surface p-2 shadow-modal [margin:0.5rem_0_0_0] [position-anchor:--tools-trigger] [position-area:bottom_span-right]"
      >
        <p
          id="tools-popover-heading"
          className="px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Free calculators
        </p>
        <ul aria-labelledby="tools-popover-heading">
          {toolsPopoverItems.map((tool) => {
            const isCurrent = tool.to === currentPath;

            return (
              <li key={tool.to}>
                <Link
                  to={tool.to}
                  onClick={closePopover}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`block rounded-xl px-3 py-2.5 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                    isCurrent ? "bg-surface-2" : "hover:bg-surface-2"
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}
                  >
                    {tool.label}
                  </span>
                  <span className="block text-xs text-muted">
                    {tool.description}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

const Header: React.FC = () => {
  const posthog = usePostHog();
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === "/";
  const isBlogPage = location.pathname.startsWith("/blog");
  const isToolsPage = location.pathname.startsWith("/tools");

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
    <header
      className="fixed inset-x-0 z-50 px-4 sm:px-6 lg:px-8"
      style={{ top: "calc(1rem + var(--sat))" }}
    >
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between rounded-2xl border border-border bg-surface px-4 shadow-sm transition-colors duration-200 sm:px-6">
        {/* Left: Brand */}
        <div className="flex shrink-0 items-center justify-start">
          <LogoButton compact onClick={() => navigate({ to: "/" })} />
        </div>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden items-center justify-center gap-1 lg:flex lg:flex-1">
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
          <ToolsDropdown
            isActive={isToolsPage}
            currentPath={location.pathname}
          />
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
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-3">
          <Link
            to="/login"
            search={{ returnTo: undefined }}
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none sm:px-4 sm:text-sm"
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
              "rounded-full px-3 text-xs font-semibold whitespace-nowrap sm:px-4 sm:text-sm",
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
