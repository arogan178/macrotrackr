import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import { ArrowRightIcon } from "@/components/ui";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { APP_NAME, APP_URL } from "@/utils/appConstants";

import { MIGRATION_GUIDES } from "../migrations/migrationGuidesCatalog";
import { calculatorCardClass } from "../tools/calculatorStyles";

export default function MigrationIndexPage() {
  const canonicalUrl = `${APP_URL}/migrate`;

  usePageMetadata({
    title: `Import Your Nutrition History — ${APP_NAME}`,
    description:
      "Move meal history from MyFitnessPal, Cronometer, MacroFactor, or Lose It into MacroTrackr with a preview before anything is saved.",
    canonical: canonicalUrl,
  });

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <AppHeader mode="public" />
      <main className="relative z-10 pt-[var(--header-offset)] pb-16">
        <div className="mx-auto max-w-5xl px-4">
          <header className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              Keep your history
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-5xl">
              Switch trackers without starting over
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Export from your current app, preview the file in {APP_NAME}, and
              import only when the totals look right.
            </p>
          </header>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MIGRATION_GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link
                  to="/migrate/$slug"
                  params={{ slug: guide.slug }}
                  className={`group flex h-full min-h-48 flex-col justify-between ${calculatorCardClass} transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none`}
                >
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                      From {guide.sourceName}
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight">
                      Import your existing logs
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {guide.summary}
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center justify-end gap-1 text-xs font-medium text-muted transition-colors group-hover:text-foreground">
                    View migration guide
                    <ArrowRightIcon
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
