import { describe, expect,it } from 'vitest'

import type { MacroEntry } from '@/types/macro'

import {
  calculateBMR,
  calculateCaloriePercentages,
  calculateCalorieTarget,
  calculateCarbsCalories,
  calculateDailyTotals,
  calculateFatsCalories,
  calculateMacroTarget,
  calculateProteinCalories,
  calculateRecommendedDeficit,
  calculateTDEE,
  calculateTDEEByActivityLevel,
  calculateTimeToGoal,
  calculateWeeklyChange,
  calculateWeeksToGoal,
  caloriesFromEntryRaw,
  caloriesFromMacrosRaw,
  caloriesFromMacrosRounded,
  generateWeightGoalCalculations,
} from '../nutritionCalculations'

describe('Nutrition Calculations', () => {
  describe('caloriesFromMacrosRaw', () => {
    it('should calculate calories correctly', () => {
      expect(caloriesFromMacrosRaw(10, 10, 10)).toBe(10 * 4 + 10 * 4 + 10 * 9)
    })

    it('should return 0 for all zeros', () => {
      expect(caloriesFromMacrosRaw(0, 0, 0)).toBe(0)
    })

    it('should handle decimals', () => {
      expect(caloriesFromMacrosRaw(10.5, 20.5, 5.5)).toBeCloseTo(10.5 * 4 + 20.5 * 4 + 5.5 * 9)
    })
  })

  describe('caloriesFromMacrosRounded', () => {
    it('should round the result', () => {
      expect(caloriesFromMacrosRounded(10, 10, 10)).toBe(Math.round(10 * 4 + 10 * 4 + 10 * 9))
    })
  })

  describe('calculateProteinCalories', () => {
    it('should calculate protein calories correctly', () => {
      expect(calculateProteinCalories(25)).toBe(100)
    })

    it('should round the result', () => {
      expect(calculateProteinCalories(25.5)).toBe(102)
    })
  })

  describe('calculateCarbsCalories', () => {
    it('should calculate carbs calories correctly', () => {
      expect(calculateCarbsCalories(25)).toBe(100)
    })
  })

  describe('calculateFatsCalories', () => {
    it('should calculate fats calories correctly', () => {
      expect(calculateFatsCalories(10)).toBe(90)
    })
  })

  describe('caloriesFromEntryRaw', () => {
    it('should calculate calories from entry', () => {
      const entry: MacroEntry = { protein: 10, carbs: 10, fats: 10, mealType: 'breakfast', entryDate: '2024-01-01', entryTime: '08:00' }
      expect(caloriesFromEntryRaw(entry)).toBe(10 * 4 + 10 * 4 + 10 * 9)
    })

    it('should handle missing values', () => {
      const entry: MacroEntry = { protein: 0, carbs: 0, fats: 0, mealType: 'breakfast', entryDate: '2024-01-01', entryTime: '08:00' }
      expect(caloriesFromEntryRaw(entry)).toBe(0)
    })
  })

  describe('calculateCaloriePercentages', () => {
    it('should calculate percentages correctly', () => {
      const result = calculateCaloriePercentages(25, 25, 25)
      expect(result.proteinPercent).toBeGreaterThan(0)
      expect(result.carbsPercent).toBeGreaterThan(0)
      expect(result.fatsPercent).toBeGreaterThan(0)
    })

    it('should return zeros for zero macros', () => {
      const result = calculateCaloriePercentages(0, 0, 0)
      expect(result.proteinPercent).toBe(0)
      expect(result.carbsPercent).toBe(0)
      expect(result.fatsPercent).toBe(0)
    })

    it('should return 0 for 0 values', () => {
      const result = calculateCaloriePercentages(0, 0, 0)
      expect(result.proteinPercent).toBe(0)
    })
  })

  describe('calculateMacroTarget', () => {
    it('should calculate macro targets correctly', () => {
      const result = calculateMacroTarget(2000, 30, 40, 30)
      expect(result.proteinTarget).toBeGreaterThan(0)
      expect(result.carbsTarget).toBeGreaterThan(0)
      expect(result.fatsTarget).toBeGreaterThan(0)
    })
  })

  describe('calculateDailyTotals', () => {
    it('should return default totals for empty array', () => {
      const result = calculateDailyTotals([])
      expect(result.protein).toBe(0)
      expect(result.carbs).toBe(0)
      expect(result.fats).toBe(0)
      expect(result.calories).toBe(0)
    })

    it('should calculate totals from entries', () => {
      const entries: MacroEntry[] = [
        { protein: 10, carbs: 10, fats: 10, mealType: 'breakfast', entryDate: '2024-01-01', entryTime: '08:00' },
        { protein: 20, carbs: 20, fats: 20, mealType: 'lunch', entryDate: '2024-01-01', entryTime: '12:00' },
      ]
      const result = calculateDailyTotals(entries)
      expect(result.protein).toBe(30)
      expect(result.carbs).toBe(30)
      expect(result.fats).toBe(30)
    })

    it('should handle null/undefined values', () => {
      const entries: MacroEntry[] = [
        { protein: 10, carbs: undefined, fats: 10, mealType: 'breakfast', entryDate: '2024-01-01', entryTime: '08:00' },
      ]
      const result = calculateDailyTotals(entries)
      expect(result.carbs).toBe(0)
    })
  })

  describe('calculateBMR', () => {
    it('should calculate BMR for male', () => {
      const result = calculateBMR(70, 175, 30, 'male')
      expect(result).toBeGreaterThan(0)
    })

    it('should calculate BMR for female', () => {
      const result = calculateBMR(60, 165, 30, 'female')
      expect(result).toBeGreaterThan(0)
    })

    it('should return 0 for invalid inputs', () => {
      expect(calculateBMR(0, 175, 30, 'male')).toBe(0)
      expect(calculateBMR(70, 0, 30, 'male')).toBe(0)
      expect(calculateBMR(70, 175, 0, 'male')).toBe(0)
    })

    it('should clamp extreme values', () => {
      const result = calculateBMR(500, 300, 200, 'male')
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('calculateTDEE', () => {
    it('should calculate TDEE correctly', () => {
      const bmr = 1500
      const result = calculateTDEE(bmr, 1.5)
      expect(result).toBe(2250)
    })

    it('should return 0 for 0 bmr', () => {
      expect(calculateTDEE(0, 1.5)).toBe(0)
    })
  })

  describe('calculateTDEEByActivityLevel', () => {
    it('should calculate TDEE by activity level', () => {
      const activityLevelsMap = {
        1: { value: 'sedentary' as const, multiplier: 1.2 },
        2: { value: 'light' as const, multiplier: 1.375 },
        3: { value: 'moderate' as const, multiplier: 1.55 },
        4: { value: 'active' as const, multiplier: 1.725 },
        5: { value: 'very_active' as const, multiplier: 1.9 },
      }
      const result = calculateTDEEByActivityLevel(1500, 'moderate', activityLevelsMap)
      expect(result).toBe(2325)
    })
  })

  describe('calculateTimeToGoal', () => {
    it('should calculate time to goal for weight loss', () => {
      const result = calculateTimeToGoal(100, 90, -500)
      expect(result.weeksToGoal).toBeGreaterThan(0)
      expect(result.dailyCalorieDeficit).toBe(-500)
    })

    it('should return infinity for no calorie change', () => {
      const result = calculateTimeToGoal(100, 90, 0)
      expect(result.weeksToGoal).toBe(Infinity)
    })
  })

  describe('calculateRecommendedDeficit', () => {
    it('should calculate recommended deficit', () => {
      const result = calculateRecommendedDeficit(100, 90, 10)
      expect(result).toBeGreaterThan(0)
    })

    it('should return 0 for invalid inputs', () => {
      expect(calculateRecommendedDeficit(0, 90, 10)).toBe(0)
      expect(calculateRecommendedDeficit(100, 0, 10)).toBe(0)
      expect(calculateRecommendedDeficit(100, 90, 0)).toBe(0)
    })
  })

  describe('calculateWeeklyChange', () => {
    it('should calculate weekly change', () => {
      const result = calculateWeeklyChange(100, 90)
      expect(result).not.toBe(0)
    })
  })

  describe('calculateCalorieTarget', () => {
    it('should return TDEE for maintenance', () => {
      expect(calculateCalorieTarget(2000, 100, 100)).toBe(2000)
    })

    it('should subtract for weight loss', () => {
      expect(calculateCalorieTarget(2000, 100, 90)).toBe(1500)
    })

    it('should add for weight gain', () => {
      expect(calculateCalorieTarget(2000, 100, 110)).toBe(2300)
    })
  })

  describe('calculateWeeksToGoal', () => {
    it('should calculate weeks to goal', () => {
      const result = calculateWeeksToGoal(100, 90)
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('generateWeightGoalCalculations', () => {
    it('should generate calculations for weight loss', () => {
      const result = generateWeightGoalCalculations(2000, 100, 90)
      expect(result.weightGoal).toBe('lose')
      expect(result.calorieTarget).toBeLessThan(2000)
    })

    it('should generate calculations for weight gain', () => {
      const result = generateWeightGoalCalculations(2000, 100, 110)
      expect(result.weightGoal).toBe('gain')
    })

    it('should generate calculations for maintenance', () => {
      const result = generateWeightGoalCalculations(2000, 100, 100)
      expect(result.weightGoal).toBe('maintain')
      expect(result.calorieTarget).toBe(2000)
    })

    it('should use custom calorie intake when provided', () => {
      const result = generateWeightGoalCalculations(2000, 100, 90, 1800)
      expect(result.calorieTarget).toBe(1800)
    })
  })
})
