import { Link, useParams } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import { ArrowRightIcon, BackIcon, CheckCircleIcon } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { getPageMetadata } from "@/lib/pageMetadata";
import { useProductAnalytics } from "@/lib/productAnalytics";
import { APP_NAME, APP_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

import {
  getMigrationGuide,
  MIGRATION_GUIDES,
} from "../migrations/migrationGuidesCatalog";

const IMPORTER_RETURN_TO = "/settings?tab=data&from=migration";

export default function MigrationGuidePage() {
  const { slug } = useParams({ strict: false });
  const guide = slug ? getMigrationGuide(slug) : null;
  const productAnalytics = useProductAnalytics();
  const canonicalUrl = `${APP_URL}/migrate/${guide?.slug ?? ""}`;

  usePageMetadata({
    ...(guide
      ? getPageMetadata(`/migrate/${guide.slug}`)
      : { title: `Migration Guide — ${APP_NAME}`, description: "" }),
    canonical: canonicalUrl,
    noindex: !guide,
  });

  if (!guide) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader mode="public" />
        <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-[var(--header-offset)] text-center">
          <Heading level="page">Migration guide not found</Heading>
          <Link
            to="/migrate"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <BackIcon className="h-4 w-4" />
            View all migration guides
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Was HowTo, whose rich result Google retired in 2023. BreadcrumbList is
  // still live and matches the breadcrumb this page already renders.
  const structuredData = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Migration guides",
        item: `${APP_URL}/migrate`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.sourceName,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AppHeader mode="public" />
      <main className="relative z-10 pt-[var(--header-offset)] pb-16">
        <article className="mx-auto max-w-3xl px-4">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
            <Link to="/migrate" className="transition-colors hover:text-foreground">
              Migration guides
            </Link>{" "}
            / <span className="text-foreground">{guide.sourceName}</span>
          </nav>

          <header>
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              Switch from {guide.sourceName}
            </p>
            <Heading level="display" className="mt-3">
              {guide.title}
            </Heading>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              {guide.summary}
            </p>
          </header>

          <section className="mt-10" aria-labelledby="export-heading">
            <Heading level="panel" id="export-heading" className="text-xl">
              Export from {guide.sourceName}
            </Heading>
            <ol className="mt-5 space-y-4">
              {guide.exportSteps.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-card border border-border bg-surface p-5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-background">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-muted">{step}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-control border border-border bg-surface-2 p-4 text-sm leading-relaxed text-muted">
              <strong className="text-foreground">Before you export:</strong>{" "}
              {guide.caveat}
            </p>
            <a
              href={guide.officialExportUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Read the official {guide.sourceName} export instructions
              <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </section>

          <section className="mt-12 rounded-card border border-border bg-surface p-6 sm:p-8" aria-labelledby="import-heading">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <Heading level="panel" id="import-heading" className="text-xl">
                  Preview, then import
                </Heading>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {guide.fileGuidance} Nothing is written until you confirm the
                  preview.
                </p>
              </div>
            </div>
            <Link
              to="/register"
              search={{ returnTo: IMPORTER_RETURN_TO }}
              onClick={() =>
                productAnalytics.capture({
                  event: "landing_cta_clicked",
                  properties: {
                    destination: "register",
                    source: "migration_banner",
                  },
                })
              }
              className={`${getButtonClasses("primary", "lg", false, "px-6")} mt-6`}
            >
              Create account and open importer
            </Link>
            <p className="mt-3 text-xs text-muted">Free, no card required.</p>
          </section>

          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
              Moving from another app?
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {MIGRATION_GUIDES.filter((item) => item.slug !== guide.slug).map(
                (item) => (
                  <Link
                    key={item.slug}
                    to="/migrate/$slug"
                    params={{ slug: item.slug }}
                    className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50"
                  >
                    {item.sourceName}
                  </Link>
                ),
              )}
            </div>
          </section>
        </article>
      </main>
      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
