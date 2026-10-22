import { Link } from "@tanstack/react-router";

import AppHeader from "@/components/layout/AppHeader";
import Heading from "@/components/ui/Heading";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import {
  LINK_LIST_CLASS,
  LINK_ROW_CLASS,
  LinkRowContent,
} from "@/features/landing/components/LinkList";
import { usePageMetadata } from "@/hooks";
import { getPageMetadata } from "@/lib/pageMetadata";
import { buildCanonicalUrl } from "@/utils/appConstants";

import { buildToolSchema } from "../tools/buildToolSchema";
import { CALCULATOR_TOOLS, TOOLS_EXPLAINER } from "../tools/toolsCatalog";
import ToolsCtaBanner from "../tools/ToolsCtaBanner";

export default function ToolsHubPage() {
  const canonicalUrl = buildCanonicalUrl("/tools");

  usePageMetadata({
    ...getPageMetadata("/tools"),
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
            <Heading level="display">Free nutrition and macro calculators</Heading>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Start with the number that matters, then turn it into a practical
              nutrition plan. Every calculator works without an account.
            </p>
          </div>

          <ul className={LINK_LIST_CLASS}>
            {CALCULATOR_TOOLS.map((tool) => (
              <li key={tool.path}>
                <Link to={tool.path} className={LINK_ROW_CLASS}>
                  <LinkRowContent
                    title={tool.title}
                    description={tool.description}
                    badge={
                      tool.featured ? (
                        <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                          Start here
                        </span>
                      ) : null
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-muted">
            Not sure which number you need?{" "}
            <Link
              to={TOOLS_EXPLAINER.path}
              className="font-medium text-primary hover:underline"
            >
              {TOOLS_EXPLAINER.title}
            </Link>{" "}
            {TOOLS_EXPLAINER.tagline}
          </p>

          <ToolsCtaBanner
            heading="Know your target? Make it a habit."
            body="Log a meal, set a target, and see where the week went."
          />
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
}
