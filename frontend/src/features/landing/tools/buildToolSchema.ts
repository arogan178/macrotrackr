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

  if (!faqs.length) {
    return JSON.stringify(webAppSchema);
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

  return JSON.stringify([webAppSchema, faqSchema]);
}
