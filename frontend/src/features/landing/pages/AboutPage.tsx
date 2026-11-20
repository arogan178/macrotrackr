import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import author from "@/data/author.json";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { getPageMetadata } from "@/lib/pageMetadata";
import {
  APP_URL,
  GITHUB_REPO_URL,
  SCHEMA_ORG_CONTEXT,
} from "@/utils/appConstants";

const linkClasses = "font-semibold text-primary hover:underline";

export default function AboutPage() {
  const canonicalUrl = `${APP_URL}/about`;
  const meta = getPageMetadata("/about");

  usePageMetadata({ ...meta, canonical: canonicalUrl });

  const structuredData = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "AboutPage",
    url: canonicalUrl,
    mainEntity: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.role,
      url: canonicalUrl,
      // The repository owner's profile: https://github.com/<owner>.
      sameAs: [GITHUB_REPO_URL.split("/").slice(0, 4).join("/")],
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
        <article className="mx-auto max-w-3xl px-4">
          <header className="mb-10">
            <p className={`${TYPE_SCALE.micro} text-primary`}>About</p>
            <Heading level="display" className="mt-3">
              {meta.h1}
            </Heading>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              MacroTrackr is built and maintained by one person, {author.name}.
              I write the app, the calculators and the guides on this site.
            </p>
          </header>

          <section className="mb-10" aria-labelledby="who-heading">
            <Heading level="panel" id="who-heading" className="mb-3 text-xl">
              Who writes this
            </Heading>
            <p className="text-sm leading-relaxed text-muted">{author.bio}</p>
          </section>

          <section className="mb-10" aria-labelledby="checked-heading">
            <Heading level="panel" id="checked-heading" className="mb-3 text-xl">
              How the nutrition content is checked
            </Heading>
            <p className="text-sm leading-relaxed text-muted">
              Articles link to the research behind their main nutrition claims,
              usually a position stand, a systematic review or a trial. If you
              find one that does not, tell me.
              Every calculator states its formula under &ldquo;How this is
              calculated&rdquo;, so you can check the working. None of it is
              medical advice. If you are pregnant, managing a health condition or
              working with a clinician, follow their guidance.
            </p>
          </section>

          <section className="mb-10" aria-labelledby="funding-heading">
            <Heading level="panel" id="funding-heading" className="mb-3 text-xl">
              How it is paid for
            </Heading>
            <p className="text-sm leading-relaxed text-muted">
              The hosted service has a free plan and a paid{" "}
              <Link to="/pricing" className={linkClasses}>
                Pro plan
              </Link>
              , and the subscriptions pay for it. There are no ads. The code is
              open source under AGPLv3, so you can also{" "}
              <Link to="/open-source" className={linkClasses}>
                host it yourself
              </Link>{" "}
              for free, with every feature.
            </p>
          </section>

          <section aria-labelledby="corrections-heading">
            <Heading level="panel" id="corrections-heading" className="mb-3 text-xl">
              Corrections
            </Heading>
            <p className="text-sm leading-relaxed text-muted">
              To report a mistake, email through the{" "}
              <Link to="/contact" className={linkClasses}>
                contact page
              </Link>
              , or open an issue on{" "}
              <a
                href={`${GITHUB_REPO_URL}/issues`}
                target="_blank"
                rel="noreferrer"
                className={linkClasses}
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
