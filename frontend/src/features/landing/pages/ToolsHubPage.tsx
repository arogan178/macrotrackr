import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import PageBackground from "@/components/layout/PageBackground";
import { ArrowRightIcon } from "@/components/ui";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { buildCanonicalUrl } from "@/utils/appConstants";

import { buildToolSchema } from "../tools/buildToolSchema";
import { calculatorCardClass } from "../tools/calculatorStyles";
import { CALCULATOR_TOOLS } from "../tools/toolsCatalog";
import ToolsCtaBanner from "../tools/ToolsCtaBanner";

export default function ToolsHubPage() {
  const canonicalUrl = buildCanonicalUrl("/tools");

  usePageMetadata({
    title: "Free Nutrition & Macro Calculators",
    description:
      "Free nutrition, TDEE, BMR, macro, weight loss, and protein calculators. Accurate fitness tools with privacy-first design.",
    canonical: canonicalUrl,
  });

  const schemaScript = buildToolSchema({
    name: "Free Nutrition Tools & Calculators",
    description:
      "Collection of free nutrition, TDEE, BMR, macro, weight loss, and protein calculators.",
    url: canonicalUrl,
  });

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <PageBackground />
      {schemaScript && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaScript }}
        />
      )}

      <AppHeader mode="public" />

      <main className="relative z-10 pt-[var(--header-offset)] pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center sm:mb-12">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-vibrant-accent" />
              100% Free & No Sign-up Required
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Free Nutrition & Macro Calculators
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Start with the number that matters, then turn it into a practical
              nutrition plan. Every calculator works without an account.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CALCULATOR_TOOLS.map((tool) => (
              <li
                key={tool.path}
                className={tool.featured ? "md:col-span-2" : ""}
              >
                <Link
                  to={tool.path}
                  className={`group relative flex h-full min-h-44 flex-col justify-between overflow-hidden ${calculatorCardClass} transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
                    tool.featured ? "md:min-h-0 md:flex-row md:items-center" : ""
                  }`}
                >
                  <div className={tool.featured ? "md:max-w-xl md:flex-1" : ""}>
                    {tool.featured ? (
                      <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
                        Start here
                      </span>
                    ) : null}
                    <h2 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
                      {tool.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {tool.description}
                    </p>
                  </div>

                  <div
                    className={`mt-6 flex items-center justify-end ${
                      tool.featured ? "md:mt-0 md:ml-8 md:shrink-0" : ""
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-foreground">
                      Open
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
            heading="Know your target? Make it a habit."
            body="MacroTrackr brings food logging, custom goals, and privacy-first tracking into one calm daily routine."
          />
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
