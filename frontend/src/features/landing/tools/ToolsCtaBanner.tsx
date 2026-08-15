import { memo } from "react";
import { Link } from "@tanstack/react-router";

import { getButtonClasses } from "@/components/ui/Button";
import { GITHUB_REPO_URL } from "@/utils/appConstants";

interface ToolsCtaBannerProps {
  heading: string;
  body: string;
  /**
   * The figure the reader just worked out. When present the call to action
   * continues their sentence instead of starting a new one.
   */
  result?: { label: string; value: string };
}

/**
 * Shared closing call to action for the tools hub and every calculator page.
 *
 * Two things were leaking here. The heading and button were generic at the one
 * moment the reader has a number they care about — so this now carries that
 * number into the action. And "View the source" sat beside the sign-up at equal
 * weight: at the bottom of a calculator that is not a second conversion path,
 * it is an exit, so it drops to a quiet text link.
 */
function ToolsCtaBanner({ heading, body, result }: ToolsCtaBannerProps) {
  return (
    <section className="mt-12 overflow-hidden rounded-card border border-border bg-surface text-center">
      {result ? (
        <div className="border-b border-border bg-surface-2 px-6 py-4">
          <p className="text-[11px] font-medium tracking-wider text-muted uppercase">
            {result.label}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-primary tabular-nums">
            {result.value}
          </p>
        </div>
      ) : null}

      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {heading}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {body}
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            to="/register"
            search={{ returnTo: undefined }}
            className={getButtonClasses("primary", "lg", false, "px-6")}
          >
            {result ? "Start tracking against it" : "Start tracking free"}
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted">
          Free, no card.{" "}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Read the source
          </a>
          .
        </p>
      </div>
    </section>
  );
}

export default memo(ToolsCtaBanner);
