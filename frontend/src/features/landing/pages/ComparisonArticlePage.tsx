import { Link, useParams } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import { Accordion, BackIcon } from "@/components/ui";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { APP_NAME, APP_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

import {
  COMPARISONS,
  getComparisonBySlug,
} from "../comparisons/comparisonsCatalog";
import ComparisonTable from "../comparisons/ComparisonTable";
import ToolsCtaBanner from "../tools/ToolsCtaBanner";

export default function ComparisonArticlePage() {
  const { slug } = useParams({ strict: false });
  const comparison = slug ? getComparisonBySlug(slug) : undefined;

  const canonicalUrl = `${APP_URL}/compare/${comparison?.slug ?? ""}`;

  usePageMetadata({
    title: comparison
      ? `${comparison.title} — ${APP_NAME}`
      : `Comparison Not Found — ${APP_NAME}`,
    description: comparison?.metaDescription ?? "MacroTrackr comparison article",
    canonical: canonicalUrl,
  });

  if (!comparison) {
    return (
      <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
        <AppHeader mode="public" />
        <main className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-4 pt-[var(--header-offset)] text-center">
          <Heading level="page">Comparison not found</Heading>
          <p className="mt-2 text-sm text-muted">
            The requested comparison does not exist or has moved.
          </p>
          <Link
            to="/compare"
            className="mt-6 inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            <BackIcon className="h-4 w-4" />
            All comparisons
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const otherComparisons = COMPARISONS.filter((c) => c.slug !== comparison.slug);

  const breadcrumbsSchema = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: APP_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Comparisons",
        item: `${APP_URL}/compare`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: comparison.shortTitle,
        item: canonicalUrl,
      },
    ],
  };

  const faqSchema = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "FAQPage",
    mainEntity: comparison.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const softwareComparisonSchema = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "WebPage",
    name: comparison.title,
    description: comparison.metaDescription,
    url: canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
    },
    about: [
      {
        "@type": "SoftwareApplication",
        name: APP_NAME,
        applicationCategory: "HealthApplication",
        operatingSystem: "Web, iOS, Android, Self-Hosted",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: comparison.competitorName,
        applicationCategory: "HealthApplication",
        operatingSystem: "iOS, Android, Web",
      },
    ],
  };

  const faqAccordionItems = comparison.faqs.map((faq, index) => ({
    id: `faq-${index}`,
    question: <span className="font-medium">{faq.question}</span>,
    answer: <p className="text-sm leading-relaxed text-muted">{faq.answer}</p>,
  }));

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareComparisonSchema),
        }}
      />

      <AppHeader mode="public" />

      <main className="relative z-10 pt-[var(--header-offset)] pb-16">
        <div className="mx-auto max-w-4xl px-4">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs text-muted">
              <li>
                <Link
                  to="/"
                  className="transition-colors hover:text-foreground"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  to="/compare"
                  className="transition-colors hover:text-foreground"
                >
                  Comparisons
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-foreground" aria-current="page">
                {comparison.competitorName}
              </li>
            </ol>
          </nav>

          {/* Hero Header */}
          <div className="mb-8">
            <Heading level="display">{comparison.title}</Heading>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              {comparison.tagline}
            </p>
          </div>

          {/* Subtitle / Overview */}
          <Panel raised className="mb-10" title="Overview">
            <p className="text-sm leading-relaxed text-muted">
              {comparison.subtitle}
            </p>
          </Panel>

          <ComparisonTable
            caption="Feature comparison"
            description={`${APP_NAME} against ${comparison.competitorName}, row by row.`}
            minWidthClass="min-w-[520px]"
            columns={[
              { key: "feature", label: "Feature" },
              { key: "macrotrackr", label: APP_NAME, isOwn: true },
              { key: "competitor", label: comparison.competitorName },
            ]}
            rows={comparison.matrix.map((row) => ({
              feature: row.feature,
              values: {
                macrotrackr: row.macrotrackr,
                competitor: row.competitor,
              },
            }))}
          />

          {/* Key Differentiators */}
          <section className="mb-12" aria-labelledby="differentiators-heading">
            <Heading
              level="panel"
              id="differentiators-heading"
              className="mb-6 text-xl"
            >
              Where {APP_NAME} differs
            </Heading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {comparison.keyDifferentiators.map((diff) => (
                <Panel key={diff.title} padding="compact">
                  <Heading level="panel" as="h3">
                    {diff.title}
                  </Heading>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {diff.description}
                  </p>
                </Panel>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-12" aria-labelledby="faq-heading">
            <Heading level="panel" id="faq-heading" className="mb-6 text-xl">
              Questions
            </Heading>
            <Accordion items={faqAccordionItems} defaultOpenFirst />
          </section>

          {/* CTA Banner */}
          <ToolsCtaBanner
            heading={`Try ${APP_NAME}`}
            body="The free tier has no ads and no feature locks. Self-hosting runs the same build."
          />

          {/* Other Comparisons Navigation */}
          {otherComparisons.length > 0 && (
            <div className="mt-12 border-t border-border pt-8">
              <p className={`${TYPE_SCALE.micro} text-muted`}>
                Other comparisons
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {otherComparisons.map((other) => (
                  <Link
                    key={other.slug}
                    to="/compare/$slug"
                    params={{ slug: other.slug }}
                    className="group rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-2 hover:bg-surface-2"
                  >
                    <div className="text-xs font-semibold text-primary">
                      {other.shortTitle}
                    </div>
                    <div className="mt-1 text-xs text-muted group-hover:text-foreground">
                      {other.tagline}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
