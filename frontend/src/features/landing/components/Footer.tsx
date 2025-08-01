import { Link } from "@tanstack/react-router";
import React from "react";

const Footer: React.FC = () => (
  <footer className="relative z-10 border-t border-border/50 px-4 py-12 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="">
          <h3 className="mb-4 bg-gradient-to-r from-white to-surface bg-clip-text pb-2 text-3xl font-bold text-transparent">
            MacroTrackr
          </h3>
          <p className="max-w-md text-lg text-foreground">
            The most intuitive macro tracking app for achieving your fitness and
            nutrition goals.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between border-t border-border/50 pt-8 md:flex-row">
        <div className="flex flex-col items-center space-y-2 text-foreground md:flex-row md:space-y-0 md:space-x-8">
          <p>
            &copy; {new Date().getFullYear()} MacroTrackr. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
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
          </div>
        </div>

        <div className="mt-4 md:mt-0">
          <p className="text-sm text-foreground">
            Track better. Live healthier.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
