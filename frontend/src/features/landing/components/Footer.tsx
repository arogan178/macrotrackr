import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import LogoButton from "@/components/layout/LogoButton";
import { getButtonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/classnameUtilities";
import { APP_NAME, SUPPORT_EMAIL_MAILTO } from "@/utils/appConstants";

const footerLinkClasses =
  "inline-flex min-h-11 items-center rounded-control py-1 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="relative z-10 border-t border-border bg-background px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* The footer reaches every public page and, until now, offered nothing
            to do on any of them. One row, stated plainly, no second action
            competing with it. */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-6">
          <div>
            <p className="text-base font-semibold text-foreground">
              Start tracking today
            </p>
            <p className="mt-1 text-sm text-muted">
              Free, no card, and you can export or delete everything whenever
              you like.
            </p>
          </div>
          <Link
            to="/register"
            search={{ returnTo: undefined }}
            className={cn(
              getButtonClasses("primary", "lg", false, "px-6"),
              "shrink-0",
            )}
          >
            Create an account
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.7fr))] md:items-start md:gap-6">
          <div>
            <div className="mb-3 -ml-2">
              <LogoButton
                compact
                onClick={() => navigate({ to: "/" })}
                ariaLabel="MacroTrackr home"
              />
            </div>
            <p className="max-w-md text-sm leading-7 text-muted">
              The nutrition tracker built for real results. Log faster, see
              clearer, and stay consistent with tools that work as hard as you
              do.
            </p>
            <p className="mt-3 text-xs text-muted">
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights
              reserved.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
              Product
            </h4>
            <ul className="flex flex-col gap-1 text-sm text-muted">
              <li>
                <a href="/#features" className={footerLinkClasses}>
                  Features
                </a>
              </li>
              <li>
                <a href="/#pricing" className={footerLinkClasses}>
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  to="/blog"
                  search={{ category: undefined, tag: undefined, q: undefined }}
                  className={footerLinkClasses}
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/tools" className={footerLinkClasses}>
                  Free Calculators
                </Link>
              </li>
              <li>
                <Link to="/compare" className={footerLinkClasses}>
                  Alternatives & Comparisons
                </Link>
              </li>
              <li>
                <Link to="/migrate" className={footerLinkClasses}>
                  Import Your History
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
              Legal
            </h4>
            <ul className="flex flex-col gap-1 text-sm text-muted">
              <li>
                <Link to="/terms" className={footerLinkClasses}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={footerLinkClasses}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href={SUPPORT_EMAIL_MAILTO}
                  className={footerLinkClasses}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
