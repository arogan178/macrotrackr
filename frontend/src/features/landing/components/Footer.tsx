import { Link, useNavigate } from "@tanstack/react-router";
import React from "react";

import LogoButton from "@/components/layout/LogoButton";

const footerLinkClasses =
  "inline-flex min-h-11 items-center rounded-lg py-1 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="relative z-10 border-t border-border/70 bg-background/90 px-6 py-8 backdrop-blur-sm lg:px-8">
      <div className="mx-auto max-w-7xl">
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
              &copy; {new Date().getFullYear()} MacroTrackr. All rights
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
                  href="mailto:contact@macrotrackr.com"
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
