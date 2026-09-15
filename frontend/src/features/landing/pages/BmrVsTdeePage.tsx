import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import { Accordion, ChevronRightIcon } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import content from "@/data/bmr-vs-tdee.json";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { getPageMetadata } from "@/lib/pageMetadata";
import { APP_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

import { TOOLS_HUB_PATH } from "../tools/toolsCatalog";

export default function BmrVsTdeePage() {
  const canonicalUrl = `${APP_URL}/tools/bmr-vs-tdee`;
  const meta = getPageMetadata("/tools/bmr-vs-tdee");

  usePageMetadata({ ...meta, canonical: canonicalUrl });

  const structuredData = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="relative min-h-dvh bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AppHeader mode="public" />

      <main className="relative z-10 pt-[var(--header-offset)] pb-16">
        <div className="mx-auto max-w-3xl px-4">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1 text-xs text-muted">
              <li>
                <Link to={TOOLS_HUB_PATH} className="hover:text-foreground">
                  Free calculators
                </Link>
              </li>
              <li aria-hidden="true" className="flex items-center">
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="text-foreground">
                BMR vs TDEE
              </li>
            </ol>
          </nav>

          <header className="mb-10">
            <p className={`${TYPE_SCALE.micro} text-primary`}>
              Which number to use
            </p>
            <Heading level="display" className="mt-3">
              {meta.h1}
            </Heading>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              {content.intro}
            </p>
          </header>

          <section className="mb-12" aria-labelledby="definitions-heading">
            <Heading level="panel" id="definitions-heading" className="mb-6 text-xl">
              The difference in one line each
            </Heading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {content.definitions.map((item) => (
                <Panel key={item.term} padding="compact">
                  <Heading level="panel" as="h3">
                    {item.term}
                  </Heading>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </Panel>
              ))}
            </div>
          </section>

          <section className="mb-12" aria-labelledby="components-heading">
            <Heading level="panel" id="components-heading" className="mb-2 text-xl">
              What TDEE is made of
            </Heading>
            <p className="mb-6 text-sm text-muted">
              Four parts, only one of which is your training.
            </p>
            <ul className="divide-y divide-border rounded-card border border-border bg-surface">
              {content.components.map((item) => (
                <li key={item.name} className="px-5 py-4">
                  <p className="text-sm font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {item.note}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12" aria-labelledby="multipliers-heading">
            <Heading level="panel" id="multipliers-heading" className="mb-2 text-xl">
              Turning BMR into TDEE
            </Heading>
            <p className="mb-6 text-sm text-muted">
              TDEE is BMR multiplied by an activity factor. These are the same
              factors the calculators use.
            </p>
            <dl className="divide-y divide-border rounded-card border border-border bg-surface">
              {content.multipliers.map((item) => (
                <div
                  key={item.factor}
                  className="flex items-baseline justify-between gap-4 px-5 py-3"
                >
                  <dt className="text-sm text-muted">{item.level}</dt>
                  <dd className="text-sm font-semibold text-foreground tabular-nums">
                    &times;{item.factor}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mb-12" aria-labelledby="bmr-tdee-faq-heading">
            <Heading level="panel" id="bmr-tdee-faq-heading" className="mb-6 text-xl">
              Questions
            </Heading>
            <Accordion
              items={content.faqs.map((faq, index) => ({
                id: `bmr-tdee-faq-${index}`,
                question: <span className="font-medium">{faq.question}</span>,
                answer: (
                  <p className="text-sm leading-relaxed text-muted">
                    {faq.answer}
                  </p>
                ),
              }))}
              defaultOpenFirst
            />
          </section>

          <section className="rounded-card border border-border bg-surface p-6 text-center sm:p-8">
            <Heading level="panel" as="h2">
              Work out your own numbers
            </Heading>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Both calculators are free and need no account.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/tools/tdee-calculator"
                className={getButtonClasses("primary", "lg", false, "px-6")}
              >
                TDEE calculator
              </Link>
              <Link
                to="/tools/bmr-calculator"
                className="text-sm font-semibold text-primary hover:underline"
              >
                BMR calculator
              </Link>
            </div>
          </section>

          <p className="mt-10 text-xs leading-relaxed text-muted">
            These figures are population-level estimates for general fitness
            planning, not medical advice.
          </p>
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
