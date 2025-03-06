export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';

export const activityLevelMap = {
  1: { label: 'Sedentary (little or no exercise)', value: 'sedentary' },
  2: { label: 'Light Exercise (1-3 days/week)', value: 'light' },
  3: { label: 'Moderate Exercise (3-5 days/week)', value: 'moderate' },
  4: { label: 'Very Active (6-7 days/week)', value: 'very' },
  5: { label: 'Extra Active (very active & physical job)', value: 'extra' }
} as const;

export const activityLevelToNumber = {
  'sedentary': 1,
  'light': 2,
  'moderate': 3,
  'very': 4,
  'extra': 5
} as const;

export const getActivityLevelLabel = (level: number) => {
  return activityLevelMap[level as keyof typeof activityLevelMap]?.label || 'Unknown';
};

export const getActivityLevelValue = (level: number) => {
  return activityLevelMap[level as keyof typeof activityLevelMap]?.value || 'unknown';
};

export const getActivityLevelOptions = () => {
  return Object.values(activityLevelMap).map(level => ({
    label: level.label,
    value: level.value
  }));
};