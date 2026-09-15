import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import contact from "@/data/contact.json";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { getPageMetadata } from "@/lib/pageMetadata";
import {
  APP_URL,
  GITHUB_REPO_URL,
  SCHEMA_ORG_CONTEXT,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_MAILTO,
} from "@/utils/appConstants";

const linkClasses = "font-semibold text-primary hover:underline";

export default function ContactPage() {
  const canonicalUrl = `${APP_URL}/contact`;
  const meta = getPageMetadata("/contact");

  usePageMetadata({ ...meta, canonical: canonicalUrl });

  const structuredData = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "ContactPage",
    url: canonicalUrl,
    mainEntity: {
      "@type": "Organization",
      name: "MacroTrackr",
      url: APP_URL,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        availableLanguage: "English",
      },
    },
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
          <header className="mb-10">
            <p className={`${TYPE_SCALE.micro} text-primary`}>Contact</p>
            <Heading level="display" className="mt-3">
              {meta.h1}
            </Heading>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              {contact.intro}
            </p>
            <a href={SUPPORT_EMAIL_MAILTO} className={`mt-4 inline-block ${linkClasses}`}>
              {SUPPORT_EMAIL}
            </a>
          </header>

          <section className="mb-12" aria-labelledby="channels-heading">
            <Heading level="panel" id="channels-heading" className="mb-6 text-xl">
              What to send where
            </Heading>
            <div className="grid grid-cols-1 gap-4">
              {contact.channels.map((channel) => (
                <Panel key={channel.title} padding="compact">
                  <Heading level="panel" as="h3">
                    {channel.title}
                  </Heading>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {channel.body}
                  </p>
                  {channel.action === "email" && (
                    <a
                      href={SUPPORT_EMAIL_MAILTO}
                      className={`mt-3 inline-block text-sm ${linkClasses}`}
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  )}
                  {channel.action === "github" && (
                    <a
                      href={`${GITHUB_REPO_URL}/issues`}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-3 inline-block text-sm ${linkClasses}`}
                    >
                      Open an issue on GitHub
                    </a>
                  )}
                  {channel.action === "delete" && (
                    <Link
                      to="/delete-account"
                      className={`mt-3 inline-block text-sm ${linkClasses}`}
                    >
                      How account deletion works
                    </Link>
                  )}
                </Panel>
              ))}
            </div>
          </section>

          <section aria-labelledby="self-hosted-heading">
            <Heading level="panel" id="self-hosted-heading" className="mb-3 text-xl">
              Self-hosting
            </Heading>
            <p className="text-sm leading-relaxed text-muted">
              {contact.selfHostedNote}
            </p>
            <Link to="/open-source" className={`mt-3 inline-block text-sm ${linkClasses}`}>
              Open source and self-hosting
            </Link>
          </section>
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
