import { Link } from "@tanstack/react-router";
import React from "react";

import LogoButton from "@/components/layout/LogoButton";
import { BackIcon } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";

const LegalHeader: React.FC = () => {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between rounded-2xl border border-border bg-surface px-4 shadow-sm transition-colors duration-200 sm:px-6">
        <LogoButton compact onClick={() => globalThis.location.assign("/")} />

        <Link
          to="/"
          className={getButtonClasses(
            "ghost",
            "sm",
            false,
            "rounded-full font-medium text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <BackIcon />
          <span>Back to home</span>
        </Link>
      </div>
    </header>
  );
};

export default LegalHeader;
