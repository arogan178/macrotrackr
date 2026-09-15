import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import { Accordion } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import openSource from "@/data/open-source.json";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { getPageMetadata } from "@/lib/pageMetadata";
import {
  APP_URL,
  GITHUB_REPO_URL,
  SCHEMA_ORG_CONTEXT,
  SETUP_DOCS_URL,
} from "@/utils/appConstants";

export default function OpenSourcePage() {
  const canonicalUrl = `${APP_URL}/open-source`;
  const meta = getPageMetadata("/open-source");

  usePageMetadata({ ...meta, canonical: canonicalUrl });

  const structuredData = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "FAQPage",
    mainEntity: openSource.faqs.map((faq) => ({
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
        <div className="mx-auto max-w-4xl px-4">
          <header className="mx-auto mb-10 max-w-3xl text-center">
            <p className={`${TYPE_SCALE.micro} text-primary`}>AGPLv3</p>
            <Heading level="display" className="mt-3">
              {meta.h1}
            </Heading>
            <p className="mt-4 text-base leading-relaxed text-muted">
              {openSource.intro}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className={getButtonClasses("primary", "lg", false, "px-6")}
              >
                View the source
              </a>
              <a
                href={SETUP_DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Self-hosting guide
              </a>
            </div>
          </header>

          <section className="mb-12" aria-labelledby="principles-heading">
            <Heading level="panel" id="principles-heading" className="mb-6 text-xl">
              What that actually buys you
            </Heading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {openSource.principles.map((principle) => (
                <Panel key={principle.title} padding="compact">
                  <Heading level="panel" as="h3">
                    {principle.title}
                  </Heading>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {principle.description}
                  </p>
                </Panel>
              ))}
            </div>
          </section>

          <section className="mb-12" aria-labelledby="platforms-heading">
            <Heading level="panel" id="platforms-heading" className="mb-2 text-xl">
              Where it runs
            </Heading>
            <p className="mb-6 text-sm text-muted">
              Ready-made manifests ship in the repository, so most of these are
              an import rather than a setup.
            </p>
            <ul className="divide-y divide-border rounded-card border border-border bg-surface">
              {openSource.platforms.map((platform) => (
                <li key={platform.name} className="px-5 py-4">
                  <p className="text-sm font-semibold text-foreground">
                    {platform.name}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {platform.detail}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12" aria-labelledby="os-faq-heading">
            <Heading level="panel" id="os-faq-heading" className="mb-6 text-xl">
              Questions
            </Heading>
            <Accordion
              items={openSource.faqs.map((faq, index) => ({
                id: `os-faq-${index}`,
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
              Rather not run a server?
            </Heading>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
              The managed service is the same build with cross-device sync.
              Free to start, no card.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                search={{ returnTo: undefined }}
                className={getButtonClasses("primary", "lg", false, "px-6")}
              >
                Start free
              </Link>
              <Link
                to="/pricing"
                className="text-sm font-semibold text-primary hover:underline"
              >
                See pricing
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
