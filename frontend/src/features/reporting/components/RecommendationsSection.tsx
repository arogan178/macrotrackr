import { motion } from "motion/react";

import { Heading, Panel } from "@/components/ui";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { formatWeight, type UnitSystem } from "@/utils/unitConversion";

import type { InsightsData, NutritionAverage } from "../types/insightsTypes";

interface RecommendationsSectionProps {
  insights: InsightsData;
  averages: NutritionAverage;
}

/** Common evidence-based intake for people training regularly, in g per kg. */
const PROTEIN_G_PER_KG = 1.6;

function getProteinSuggestion(
  proteinAverage: number,
  bodyWeight: number | undefined,
  unitSystem: UnitSystem,
): string | undefined {
  if (!proteinAverage || !bodyWeight) return undefined;

  const target = Math.round(bodyWeight * PROTEIN_G_PER_KG);
  const actual = Math.round(proteinAverage);
  if (actual >= target) return undefined;

  return `Protein averaged ${actual} g/day, ${target - actual} g under the ${target} g that ${PROTEIN_G_PER_KG} g/kg works out to at ${formatWeight(bodyWeight, unitSystem)}.`;
}

function getTrackingSuggestion(
  missedDays: number,
  totalDays: number,
): string | undefined {
  if (missedDays === 0) return undefined;

  return `${missedDays} of ${totalDays} days have no entries. Gaps skew the averages above.`;
}

export default function RecommendationsSection({
  insights,
  averages,
}: RecommendationsSectionProps) {
  const { macroBalance, macroDensity, dataQuality } = insights;
  const { data: user } = useUser();

  const protein = getProteinSuggestion(
    averages.protein,
    user?.weight,
    user?.unitSystem ?? "metric",
  );
  const tracking = getTrackingSuggestion(
    dataQuality.missedDays,
    dataQuality.totalDaysInPeriod,
  );

  // Only surface a card when its underlying signal says something. Four fixed
  // cards regardless of the data is filler, not advice.
  const suggestions = [
    macroBalance.currentRatio !== "0/0/0" && {
      title: "Macro split",
      message: macroBalance.recommendations,
    },
    averages.calories > 0 && {
      title: "Protein share",
      message: macroDensity.message,
    },
    protein && {
      title: "Protein intake",
      message: protein,
    },
    tracking && {
      title: "Tracking gaps",
      message: tracking,
    },
  ].filter(Boolean) as { title: string; message: string }[];

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="flex flex-col gap-6"
    >
      <Heading level="panel" as="h3">
        Suggestions
      </Heading>

      {/* One list of short notes: a title and the sentence that backs it. */}
      <Panel flatOnPhone>
        <ul className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.title}>
              <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{suggestion.message}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </motion.div>
  );
}
