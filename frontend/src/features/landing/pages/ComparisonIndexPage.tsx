import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import { ArrowRightIcon, CheckCircleIcon } from "@/components/ui";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { APP_NAME, APP_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

import {
  COMPARISONS,
  MASTER_COMPARISON_MATRIX,
} from "../comparisons/comparisonsCatalog";
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
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Transparent & Objective Comparisons
            </span>
            <h1 className="text-3xl font-bold tracking-tight lg:text-5xl">
              Compare {APP_NAME}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted">
              Explore how {APP_NAME} stacks up against popular nutrition and macro
              tracking applications. No artificial paywalls, no clutter, and 100%
              data privacy.
            </p>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-semibold text-foreground">
                  Free Barcode Scanning
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Scan items instantly using OpenFoodFacts without paying a monthly
                subscription fee.
              </p>
            </div>
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-semibold text-foreground">
                  Ad-Free & Fast
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Zero banner ads, video popups, or marketing spam. Designed to log
                meals in seconds.
              </p>
            </div>
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-semibold text-foreground">
                  Self-Hostable Freedom
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                AGPLv3 open-source codebase with 1-command Docker deployment for total
                data ownership.
              </p>
            </div>
          </div>

          {/* Master Unified Comparison Matrix */}
          <div className="mb-12">
            <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Feature & Pricing Matrix
                </h2>
                <p className="text-sm text-muted">
                  Side-by-side feature comparison across major macro tracking apps.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-card border border-border bg-surface">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="py-3.5 pr-4 pl-5 font-semibold text-foreground">
                      Feature
                    </th>
                    <th className="px-4 py-3.5 font-bold text-primary">
                      {APP_NAME}
                    </th>
                    <th className="px-4 py-3.5 font-medium text-muted">
                      MyFitnessPal
                    </th>
                    <th className="px-4 py-3.5 font-medium text-muted">
                      MacroFactor
                    </th>
                    <th className="px-4 py-3.5 font-medium text-muted">
                      Cronometer
                    </th>
                    <th className="py-3.5 pr-5 pl-4 font-medium text-muted">
                      Lose It!
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MASTER_COMPARISON_MATRIX.map((row, index) => (
                    <tr
                      key={index}
                      className={
                        row.highlight
                          ? "bg-primary/5 transition-colors hover:bg-primary/10"
                          : "transition-colors hover:bg-surface-2"
                      }
                    >
                      <td className="py-3 pr-4 pl-5 font-medium text-foreground">
                        {row.feature}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {row.macrotrackr}
                      </td>
                      <td className="px-4 py-3 text-muted">{row.myfitnesspal}</td>
                      <td className="px-4 py-3 text-muted">{row.macrofactor}</td>
                      <td className="px-4 py-3 text-muted">{row.cronometer}</td>
                      <td className="py-3 pr-5 pl-4 text-muted">{row.loseIt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Deep-Dive Comparisons
            </h2>
            <p className="text-sm text-muted">
              Select a tracker for a detailed breakdown, feature differences, and FAQs.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {COMPARISONS.map((comp) => (
              <li key={comp.slug}>
                <Link
                  to="/compare/$slug"
                  params={{ slug: comp.slug }}
                  className={`group relative flex h-full min-h-48 flex-col justify-between overflow-hidden ${calculatorCardClass} transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none`}
                >
                  <div>
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
                      {comp.badge}
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {comp.shortTitle}
                    </h3>
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
            heading="Ready for clean, ad-free nutrition tracking?"
            body="Start tracking with MacroTrackr today or self-host your own instance."
          />
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
