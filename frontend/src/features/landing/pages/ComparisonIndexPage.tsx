import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import { ArrowRightIcon } from "@/components/ui";
import Heading from "@/components/ui/Heading";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { APP_NAME, APP_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

import {
  COMPARISONS,
  MASTER_COMPARISON_MATRIX,
} from "../comparisons/comparisonsCatalog";
import ComparisonTable from "../comparisons/ComparisonTable";
import { calculatorCardClass } from "../tools/calculatorStyles";
import ToolsCtaBanner from "../tools/ToolsCtaBanner";

export default function ComparisonIndexPage() {
  const canonicalUrl = `${APP_URL}/compare`;

  usePageMetadata({
    title: `Macro Tracker Comparisons & Alternatives — ${APP_NAME}`,
    description: `Compare ${APP_NAME} against MyFitnessPal, MacroFactor, Cronometer, and Lose It. See feature tables, pricing models, barcode scanning, and privacy side-by-side.`,
    canonical: canonicalUrl,
  });

  const schemaScript = JSON.stringify({
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "WebPage",
    name: `${APP_NAME} Competitor Comparisons & Alternatives`,
    description: `In-depth comparisons between ${APP_NAME} and popular nutrition trackers.`,
    url: canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
    },
  });

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaScript }}
      />

      <AppHeader mode="public" />

      <main className="relative z-10 pt-[var(--header-offset)] pb-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <Heading level="display">Compare {APP_NAME}</Heading>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted">
              Feature and pricing tables against four trackers people usually
              weigh {APP_NAME} against. Prices are the vendors&rsquo; list
              monthly rates; every row is a statement you can check.
            </p>
          </div>

          <ComparisonTable
            caption="Features and pricing"
            description="Side by side across the major macro trackers."
            columns={[
              { key: "feature", label: "Feature" },
              { key: "macrotrackr", label: APP_NAME, isOwn: true },
              { key: "myfitnesspal", label: "MyFitnessPal" },
              { key: "macrofactor", label: "MacroFactor" },
              { key: "cronometer", label: "Cronometer" },
              { key: "loseIt", label: "Lose It!" },
            ]}
            rows={MASTER_COMPARISON_MATRIX.map((row) => ({
              feature: row.feature,
              values: {
                macrotrackr: row.macrotrackr,
                myfitnesspal: row.myfitnesspal,
                macrofactor: row.macrofactor,
                cronometer: row.cronometer,
                loseIt: row.loseIt,
              },
            }))}
          />

          <div className="mb-4">
            <Heading level="panel" className="text-xl">
              One at a time
            </Heading>
            <p className="mt-1 text-sm text-muted">
              Each tracker in full: feature table, what differs, and the
              questions people ask.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {COMPARISONS.map((comp) => (
              <li key={comp.slug}>
                <Link
                  to="/compare/$slug"
                  params={{ slug: comp.slug }}
                  className={`group relative flex h-full min-h-40 flex-col justify-between overflow-hidden ${calculatorCardClass} transition-colors duration-200 hover:border-border-2 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none`}
                >
                  <div>
                    <Heading
                      level="panel"
                      as="h3"
                      className="text-xl transition-colors group-hover:text-primary"
                    >
                      {comp.shortTitle}
                    </Heading>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {comp.tagline}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-end">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-foreground">
                      View full comparison
                      <ArrowRightIcon
                        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <ToolsCtaBanner
            heading={`Track with ${APP_NAME}`}
            body="Use the hosted app or run the same build on your own server."
          />
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
