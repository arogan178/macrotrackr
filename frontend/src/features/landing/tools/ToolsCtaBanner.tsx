import { memo } from "react";
import { Link } from "@tanstack/react-router";

import { getButtonClasses } from "@/components/ui/Button";
import { GITHUB_REPO_URL } from "@/utils/appConstants";

interface ToolsCtaBannerProps {
  heading: string;
  body: string;
}

/**
 * Shared closing call to action for the tools hub and every calculator page.
 */
function ToolsCtaBanner({ heading, body }: ToolsCtaBannerProps) {
  return (
    <section className="mt-12 rounded-2xl border border-primary/30 bg-surface p-6 text-center sm:p-8">
      <h2 className="text-xl font-bold text-foreground sm:text-2xl">
        {heading}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
        {body}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/register"
          search={{ returnTo: undefined }}
          className={getButtonClasses("primary", "lg", false, "px-5")}
        >
          Start tracking free
        </Link>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className={getButtonClasses("secondary", "lg", false, "px-5")}
        >
          View the source
        </a>
      </div>
    </section>
  );
}

export default memo(ToolsCtaBanner);
