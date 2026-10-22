import AppHeader from "@/components/layout/AppHeader";
import Heading from "@/components/ui/Heading";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { getPageMetadata } from "@/lib/pageMetadata";
import { APP_NAME, APP_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

import ComparisonList from "../comparisons/ComparisonList";
import {
  COMPARISONS,
  MASTER_COMPARISON_MATRIX,
} from "../comparisons/comparisonsCatalog";
import ComparisonTable from "../comparisons/ComparisonTable";
import ToolsCtaBanner from "../tools/ToolsCtaBanner";

export default function ComparisonIndexPage() {
  const canonicalUrl = `${APP_URL}/compare`;

  usePageMetadata({
    ...getPageMetadata("/compare"),
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
            description="Side by side across the major macro trackers. Competitor prices checked September 2026 and quoted at list rate; check theirs before switching."
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

          <ComparisonList comparisons={COMPARISONS} className="mb-12" />

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
