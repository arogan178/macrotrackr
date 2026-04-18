import { useState } from "react";

import IconButton from "@/components/ui/IconButton";
import { StarIcon } from "@/components/ui/Icons";
import { useCreateSavedMeal } from "@/hooks/queries/useSavedMeals";
import { useStore } from "@/store/store";
import type { MealType } from "@/types/macro";
import { handleApiError } from "@/utils/errorHandling";

interface SavedMealButtonProps {
  mealName: string;
  protein: number;
  carbs: number;
  fats: number;
  mealType?: MealType;
  ariaLabel?: string;
}

export default function SavedMealButton({
  mealName,
  protein,
  carbs,
  fats,
  mealType = "snack",
  ariaLabel = "Save meal for quick re-entry",
}: SavedMealButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const createSavedMeal = useCreateSavedMeal();
  const { showNotification } = useStore();

  const handleSave = async () => {
    try {
      await createSavedMeal.mutateAsync({
        name: mealName || "Saved Meal",
        protein,
        carbs,
        fats,
        mealType,
      });
      setIsSaved(true);
      showNotification("Meal saved for quick re-entry", "success");
    } catch (error) {
      handleApiError(error, "save meal");
    }
  };

  return (
    <IconButton
      variant="custom"
      className={isSaved ? "text-primary" : "text-muted hover:text-foreground"}
      onClick={handleSave}
      disabled={isSaved || createSavedMeal.isPending}
      ariaLabel={ariaLabel}
      icon={<StarIcon className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />}
    />
  );
}
