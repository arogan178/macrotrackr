import React from "react";
import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import { ChevronRightIcon } from "@/components/ui";
import Accordion from "@/components/ui/Accordion";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { buildCanonicalUrl } from "@/utils/appConstants";

import { buildToolSchema, type FaqItem } from "./buildToolSchema";
import { calculatorCardClass } from "./calculatorStyles";
import RelatedTools from "./RelatedTools";
import { TOOLS_HUB_PATH } from "./toolsCatalog";
import ToolsCtaBanner from "./ToolsCtaBanner";

interface CalculatorLayoutProps {
  title: string;
  subtitle: string;
  canonicalPath: string;
  description: string;
  /** Overrides the browser tab title when the default reads redundantly. */
  metaTitle?: string;
  badge?: string;
  faqs?: FaqItem[];
  /** The figure this calculator produced, carried into the closing CTA. */
  ctaResult?: { label: string; value: string };
  children: React.ReactNode;
}

export default function CalculatorLayout({
  title,
  subtitle,
  canonicalPath,
  description,
  metaTitle,
  badge,
  faqs = [],
  ctaResult,
  children,
}: CalculatorLayoutProps) {
  const canonicalUrl = buildCanonicalUrl(canonicalPath);

  usePageMetadata({
    title: metaTitle ?? `${title} - Free Calculator`,
    description,
    canonical: canonicalUrl,
  });

  const schemaScript = buildToolSchema({
    name: title,
    description,
    url: canonicalUrl,
    faqs,
  });

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      {schemaScript && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaScript }}
        />
      )}

      <AppHeader mode="public" />

      <main className="relative z-10 pt-[var(--header-offset)] pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1 text-xs text-muted">
              <li>
                <Link
                  to={TOOLS_HUB_PATH}
                  className="inline-flex min-h-8 items-center rounded-control px-1 font-medium transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                >
                  Free calculators
                </Link>
              </li>
              <li aria-hidden="true" className="flex items-center">
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="truncate px-1 text-foreground">
                {title}
              </li>
            </ol>
          </nav>

          {/* Hero Header */}
          <div className="mb-8 text-center sm:mb-10">
            {badge ? (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {badge}
              </span>
            ) : null}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {subtitle}
            </p>
          </div>

          {/* Calculator main content */}
          <div className="space-y-8">{children}</div>

          {/* Directly under the result: this is the one moment the reader has a
              number they care about, and it used to sit below the FAQ and the
              related tools, where almost nobody scrolls. */}
          <ToolsCtaBanner
            heading={
              ctaResult
                ? "Now make it a number you actually hit"
                : "Ready to put your target into practice?"
            }
            body="Log meals against this target, see your progress, and adjust as real life changes."
            result={ctaResult}
          />

          {/* FAQ Section if present */}
          {faqs.length > 0 && (
            <div className={`mt-12 ${calculatorCardClass}`}>
              <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                <Accordion
                  items={faqs.map((faq) => ({
                    id: faq.question,
                    question: faq.question,
                    answer: faq.answer,
                  }))}
                />
              </div>
            </div>
          )}

          <RelatedTools currentPath={canonicalPath} />

        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
