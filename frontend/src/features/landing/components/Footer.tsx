import { Link } from "@tanstack/react-router";
import React from "react";

const Footer: React.FC = () => (
    <footer className="relative z-10 border-t border-border bg-background px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
              MacroTrackr
            </h3>
            <p className="max-w-md text-sm text-balance text-muted">
              The nutrition tracker built for real results. Log faster, see
              clearer, and stay consistent with tools that work as hard as you do.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between border-t border-border-2 pt-8 md:flex-row">
          <div className="flex flex-col items-center gap-4 text-muted md:flex-row md:gap-8">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} MacroTrackr. All rights reserved.
            </p>
            <nav className="flex items-center gap-4">
              <Link
                to="/terms"
                className="text-sm transition-colors hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-sm transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
              <a
                href="mailto:contact@macrotrackr.com"
                className="text-sm transition-colors hover:text-foreground"
              >
                Contact
              </a>
              <a
                href="mailto:support@macrotrackr.com"
                className="text-sm transition-colors hover:text-foreground"
              >
                Support
              </a>
            </nav>
          </div>

          <div className="mt-6 md:mt-0">
            <p className="text-sm tracking-tight text-muted">Your goals, tracked daily.</p>
          </div>
        </div>
      </div>
    </footer>
);

export default Footer;
