import { Link, useParams } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import {
  Accordion,
  BackIcon,
  CalorieIcon,
  CheckCircleIcon,
  CheckIcon,
  CloseIcon,
} from "@/components/ui";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { APP_NAME, APP_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

import {
  COMPARISONS,
  getComparisonBySlug,
} from "../comparisons/comparisonsCatalog";
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
          <h1 className="text-2xl font-bold">Comparison Not Found</h1>
          <p className="mt-2 text-sm text-muted">
            The requested comparison does not exist or has moved.
          </p>
          <Link
            to="/compare"
            className="mt-6 inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            <BackIcon className="h-4 w-4" />
            Back to All Comparisons
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
    question: <span className="font-semibold">{faq.question}</span>,
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
            <h1 className="text-3xl font-bold tracking-tight">
              {comparison.title}
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              {comparison.tagline}
            </p>
          </div>

          {/* Subtitle / Overview */}
          <div className="mb-10 rounded-card border border-border bg-surface-2 p-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary/20 text-primary">
                <CalorieIcon className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Overview
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {comparison.subtitle}
            </p>
          </div>

          {/* Feature Comparison Matrix */}
          <section className="mb-12" aria-labelledby="matrix-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="matrix-heading"
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                Feature Comparison
              </h2>
            </div>
            <div className="overflow-x-auto rounded-card border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-xs font-semibold tracking-wider text-muted uppercase">
                    <th scope="col" className="px-4 py-3.5">
                      Feature
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 font-bold text-primary"
                    >
                      {APP_NAME}
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-muted">
                      {comparison.competitorName}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparison.matrix.map((row) => (
                    <tr
                      key={row.feature}
                      className={
                        row.highlight
                          ? "bg-surface-2 font-medium"
                          : "transition-colors hover:bg-surface-2"
                      }
                    >
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {row.feature}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-primary">
                        <div className="flex items-center gap-1.5">
                          <CheckIcon className="h-4 w-4 shrink-0 text-primary" />
                          <span>{row.macrotrackr}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        <div className="flex items-center gap-1.5">
                          {row.competitor.toLowerCase().includes("no") ||
                          row.competitor.toLowerCase().includes("paywalled") ? (
                            <CloseIcon className="h-4 w-4 shrink-0 text-muted" />
                          ) : (
                            <CheckIcon className="h-4 w-4 shrink-0 text-muted" />
                          )}
                          <span>{row.competitor}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Key Differentiators */}
          <section className="mb-12" aria-labelledby="differentiators-heading">
            <h2
              id="differentiators-heading"
              className="mb-6 text-2xl font-bold tracking-tight text-foreground"
            >
              Why Users Choose {APP_NAME}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {comparison.keyDifferentiators.map((diff) => (
                <div
                  key={diff.title}
                  className="rounded-card border border-border bg-surface p-5"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircleIcon className="h-5 w-5 shrink-0" />
                    <h3 className="font-bold text-foreground">{diff.title}</h3>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {diff.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-12" aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="mb-6 text-2xl font-bold tracking-tight text-foreground"
            >
              Frequently Asked Questions
            </h2>
            <Accordion items={faqAccordionItems} defaultOpenFirst />
          </section>

          {/* CTA Banner */}
          <ToolsCtaBanner
            heading={`Switch to ${APP_NAME} today`}
            body="Experience fast, transparent macro tracking without subscriptions, ads, or locked features."
          />

          {/* Other Comparisons Navigation */}
          {otherComparisons.length > 0 && (
            <div className="mt-12 border-t border-border pt-8">
              <h3 className="text-sm font-semibold tracking-wider text-muted uppercase">
                Explore Other Comparisons
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {otherComparisons.map((other) => (
                  <Link
                    key={other.slug}
                    to="/compare/$slug"
                    params={{ slug: other.slug }}
                    className="group rounded-card border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
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
