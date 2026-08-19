import React, { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { m } from "motion/react";

import { getButtonClasses } from "@/components/ui/Button";
import { TOOLS_HUB_PATH } from "@/features/landing/tools/toolsCatalog";
import { useProductAnalytics } from "@/lib/productAnalytics";

const ProductPreview = React.lazy(() => import("./ProductPreview"));

const HeroSection: React.FC = () => {
  const productAnalytics = useProductAnalytics();

  return (
    <section className="relative z-10 pt-[var(--header-offset)] pb-16 sm:pb-24">
      <div className="mx-auto max-w-5xl text-center">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <span className="mb-6 flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Free · no card · open source
          </span>

          <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tighter text-balance sm:text-6xl lg:text-[5rem] lg:leading-[1.1]">
            Know what you ate.
            <span className="text-muted"> Without the admin.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-balance text-muted">
            Log meals in seconds, set a macro split, and see where the week
            actually went.
          </p>

          {/* One primary action, and one genuinely secondary path — the
            calculators are the strongest no-signup entry point we have. */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              search={{ returnTo: undefined }}
              onClick={() =>
                productAnalytics.capture({
                  event: "landing_cta_clicked",
                  properties: {
                    destination: "register",
                    source: "hero",
                  },
                })
              }
              className={getButtonClasses(
                "primary",
                "lg",
                false,
                "rounded-full px-8 font-semibold",
              )}
            >
              Start free
            </Link>
            <Link
              to={TOOLS_HUB_PATH}
              className={getButtonClasses(
                "secondary",
                "lg",
                false,
                "rounded-full px-8 font-semibold",
              )}
            >
              Try a calculator
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted">
            No card. Export or delete your data any time.
          </p>
        </m.div>

        {/* The product demonstrating itself, rather than a player whose fallback
          was a spinner in fake browser chrome. Lazy, with a fallback shaped like
          the thing it replaces, so the fold never reflows. */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="relative mx-auto mt-14 w-full text-left"
        >
          <Suspense
            fallback={
              <div
                aria-hidden="true"
                className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-[1.1fr_0.9fr]"
              >
                <div className="h-64 rounded-card border border-border bg-surface" />
                <div className="h-64 rounded-card border border-border bg-surface" />
              </div>
            }
          >
            <ProductPreview />
          </Suspense>
        </m.div>
      </div>
    </section>
  );
};

export default HeroSection;
