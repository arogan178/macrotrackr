import { motion } from "motion/react";

import {
  BalanceIcon,
  ClipboardIcon,
  LightningIcon,
  NutrientIcon,
  ProteinIcon,
} from "@/components/ui";
import { useUser } from "@/hooks/auth/useAuthQueries";

import type { InsightsData, NutritionAverage } from "../types/insightsTypes";

import ActionCard from "./ActionCard";

interface RecommendationsSectionProps {
  insights: InsightsData;
  averages: NutritionAverage;
}

/** Common evidence-based intake for people training regularly, in g per kg. */
const PROTEIN_G_PER_KG = 1.6;

function getProteinSuggestion(
  proteinAverage: number,
  bodyWeight: number | undefined,
): string | undefined {
  if (!proteinAverage || !bodyWeight) return undefined;

  const target = Math.round(bodyWeight * PROTEIN_G_PER_KG);
  const actual = Math.round(proteinAverage);
  if (actual >= target) return undefined;

  return `Protein averaged ${actual} g/day, ${target - actual} g under the ${target} g that ${PROTEIN_G_PER_KG} g/kg works out to at ${bodyWeight} kg.`;
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

  // Only surface a card when its underlying signal says something. Four fixed
  // cards regardless of the data is filler, not advice.
  const suggestions = [
    macroBalance.currentRatio !== "0/0/0" && {
      title: "Macro Split",
      bgColor: "bg-purple-500/10 text-purple-400",
      message: macroBalance.recommendations,
      icon: <BalanceIcon className="h-5 w-5" />,
    },
    averages.calories > 0 && {
      title: "Protein Share",
      bgColor: "bg-primary/10 text-primary",
      message: macroDensity.message,
      icon: <NutrientIcon className="h-5 w-5" />,
    },
    (() => {
      const message = getProteinSuggestion(averages.protein, user?.weight);

      return (
        message && {
          title: "Protein Intake",
          bgColor: "bg-blue-500/10 text-blue-400",
          message,
          icon: <ProteinIcon className="h-5 w-5" />,
        }
      );
    })(),
    (() => {
      const message = getTrackingSuggestion(
        dataQuality.missedDays,
        dataQuality.totalDaysInPeriod,
      );

      return (
        message && {
          title: "Tracking Gaps",
          bgColor: "bg-emerald-500/10 text-emerald-400",
          message,
          icon: <ClipboardIcon className="h-5 w-5" />,
        }
      );
    })(),
  ].filter(Boolean) as {
    title: string;
    bgColor: string;
    message: string;
    icon: React.ReactNode;
  }[];

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center text-foreground/90">
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <LightningIcon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">Suggestions</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {suggestions.map((suggestion) => (
          <ActionCard
            key={suggestion.title}
            title={suggestion.title}
            bgColor={suggestion.bgColor}
            message={suggestion.message}
            icon={suggestion.icon}
          />
        ))}
      </div>
    </motion.div>
  );
}
