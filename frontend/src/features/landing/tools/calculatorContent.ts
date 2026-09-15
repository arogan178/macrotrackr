import calculatorContent from "@/data/calculator-content.json";

/**
 * FAQ and method copy for the calculators, in JSON so `scripts/prerender.mjs`
 * can emit the same words. It runs in Node and cannot import these modules, and
 * without a shared file the crawler copy was a one-line stub while the rendered
 * page carried five hundred words.
 */
export interface CalculatorContent {
  method: string;
  faqs: { question: string; answer: string }[];
}

const calculators: Record<string, CalculatorContent> =
  calculatorContent.calculators;

export const CALCULATOR_DISCLAIMER = calculatorContent.disclaimer;

export function getCalculatorContent(canonicalPath: string): CalculatorContent {
  const slug = canonicalPath.replace("/tools/", "");
  const content = calculators[slug];
  if (!content) {
    throw new Error(
      `No content for "${canonicalPath}". Add it to src/data/calculator-content.json.`,
    );
  }

  return content;
}
