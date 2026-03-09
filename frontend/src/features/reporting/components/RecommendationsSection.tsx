import { motion } from "motion/react";

import {
  BalanceIcon,
  ClipboardIcon,
  LightningIcon,
  NutrientIcon,
  ProteinIcon,
} from "@/components/ui";

import type { InsightsData, NutritionAverage } from "../types/insightsTypes";
import ActionCard from "./ActionCard";

interface RecommendationsSectionProps {
  insights: InsightsData;
  averages: NutritionAverage;
}

function getProteinRecommendation(proteinAverage: number): string {
  if (proteinAverage === 0) {
    return "Ready to optimise your protein intake? Start tracking to get personalised muscle recovery recommendations!";
  }
  if (proteinAverage >= 120) {
    return "Excellent protein intake! You're supporting optimal muscle recovery and growth.";
  }
  return "Great start! Consider boosting your protein to about 1.6g per kg of body weight for optimal muscle support.";
}

function getNextStepsRecommendation(completionRate: number): string {
  if (completionRate < 70) {
    return "Keep building that tracking habit! More consistent logging will unlock deeper insights into your nutrition patterns.";
  }
  return "You're doing great with consistency! Continue tracking and fine-tune your macro balance for optimal results.";
}

export default function RecommendationsSection({
  insights,
  averages,
}: RecommendationsSectionProps) {
  const { macroBalance, macroDensity, dataQuality } = insights;

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
        <h3 className="text-xl font-bold tracking-tight">
          Personalised Action Plan
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          title="Macro Balance"
          bgColor="bg-purple-500/10 text-purple-400"
          message={macroBalance.recommendations}
          icon={<BalanceIcon className="h-5 w-5" />}
        />

        <ActionCard
          title="Food Quality"
          bgColor="bg-primary/10 text-primary"
          message={macroDensity.message}
          icon={<NutrientIcon className="h-5 w-5" />}
        />

        {averages.protein < 100 && (
          <ActionCard
            title="Protein Goals"
            bgColor="bg-blue-500/10 text-blue-400"
            message={getProteinRecommendation(averages.protein)}
            icon={<ProteinIcon className="h-5 w-5" />}
          />
        )}

        <ActionCard
          title="Next Steps"
          bgColor="bg-emerald-500/10 text-emerald-400"
          message={getNextStepsRecommendation(dataQuality.completionRate)}
          icon={<ClipboardIcon className="h-5 w-5" />}
        />
      </div>
    </motion.div>
  );
}
