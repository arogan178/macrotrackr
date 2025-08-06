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
    return "Ready to optimize your protein intake? Start tracking to get personalized muscle recovery recommendations!";
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
      className="rounded-lg border border-green-500/20 bg-success/10 p-4"
    >
      <div className="mb-3 flex items-center">
        <LightningIcon className="mr-2 h-5 w-5 text-success" />
        <h3 className="text-md font-medium text-success">
          Personalized Action Plan
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActionCard
          title="Macro Balance"
          bgColor="bg-purple-900/50"
          message={macroBalance.recommendations}
          icon={<BalanceIcon className="h-4 w-4 text-purple-400" />}
        />

        <ActionCard
          title="Food Quality"
          bgColor="bg-emerald-900/50"
          message={macroDensity.message}
          icon={<NutrientIcon className="h-4 w-4 text-primary" />}
        />

        {averages.protein < 100 && (
          <ActionCard
            title="Protein Goals"
            bgColor="bg-emerald-900/50"
            message={getProteinRecommendation(averages.protein)}
            icon={<ProteinIcon className="h-4 w-4 text-primary" />}
          />
        )}

        <ActionCard
          title="Next Steps"
          bgColor="bg-emerald-900/50"
          message={getNextStepsRecommendation(dataQuality.completionRate)}
          icon={<ClipboardIcon className="h-4 w-4 text-primary" />}
        />
      </div>
    </motion.div>
  );
}
