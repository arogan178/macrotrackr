import { APP_NAME, APP_URL, SCHEMA_ORG_CONTEXT } from "@/utils/appConstants";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SchemaToolOptions {
  name: string;
  description: string;
  url: string;
  faqs?: FaqItem[];
}

export function buildToolSchema({
  name,
  description,
  url,
  faqs = [],
}: SchemaToolOptions): string {
  const webAppSchema = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "WebApplication",
    name: `${name} | ${APP_NAME}`,
    url,
    applicationCategory: "HealthAndFitnessApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
    },
    description,
  };

  const breadcrumbSchema = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Free calculators",
        item: `${APP_URL}/tools`,
      },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };

  if (!faqs.length) {
    return JSON.stringify([webAppSchema, breadcrumbSchema]);
  }

  const faqSchema = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return JSON.stringify([webAppSchema, breadcrumbSchema, faqSchema]);
}
