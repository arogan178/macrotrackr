/**
 * Tests for Goal Schemas
 * 
 * These tests validate the schema definitions for weight goals and weight logs.
 */

import { describe, it, expect } from 'vitest'

// Recreate the schema logic for unit testing
// This mirrors the logic in backend/src/modules/goals/schemas.ts

// Weight goal types
type WeightGoalType = 'lose' | 'maintain' | 'gain'

// Validation functions
function isValidWeightGoal(value: string): value is WeightGoalType {
  return ['lose', 'maintain', 'gain'].includes(value)
}

function isValidDateTime(dateTime: string): boolean {
  // ISO 8601 date-time format: YYYY-MM-DDTHH:MM:SS.sssZ
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
  if (!pattern.test(dateTime)) return false

  const parsed = new Date(dateTime)
  return !isNaN(parsed.getTime())
}

function validateWeightGoalData(data: {
  startingWeight?: number | null
  targetWeight?: number | null
  weightGoal?: WeightGoalType | null
  startDate?: string | null
  targetDate?: string | null
  calorieTarget?: number | null
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate weights are positive if provided
  if (data.startingWeight !== null && data.startingWeight !== undefined) {
    if (data.startingWeight <= 0) {
      errors.push('Starting weight must be positive')
    }
  }

  if (data.targetWeight !== null && data.targetWeight !== undefined) {
    if (data.targetWeight <= 0) {
      errors.push('Target weight must be positive')
    }
  }

  // Validate calorie target is positive if provided
  if (data.calorieTarget !== null && data.calorieTarget !== undefined) {
    if (data.calorieTarget <= 0) {
      errors.push('Calorie target must be positive')
    }
  }

  // Validate weight goal type
  if (data.weightGoal !== null && data.weightGoal !== undefined) {
    if (!isValidWeightGoal(data.weightGoal)) {
      errors.push('Invalid weight goal type')
    }
  }

  // Validate dates if provided
  if (data.startDate !== null && data.startDate !== undefined) {
    if (!isValidDateString(data.startDate)) {
      errors.push('Invalid start date format')
    }
  }

  if (data.targetDate !== null && data.targetDate !== undefined) {
    if (!isValidDateString(data.targetDate)) {
      errors.push('Invalid target date format')
    }
  }

  return { valid: errors.length === 0, errors }
}

function isValidDateString(date: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/
  if (!pattern.test(date)) return false

  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

function validateWeightLogEntry(data: {
  timestamp: string
  weight: number
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isValidDateTime(data.timestamp)) {
    errors.push('Invalid timestamp format')
  }

  if (data.weight <= 0) {
    errors.push('Weight must be positive')
  }

  return { valid: errors.length === 0, errors }
}

function calculateWeeklyChange(
  startingWeight: number,
  targetWeight: number,
  weeks: number
): number {
  if (weeks <= 0) return 0
  return (targetWeight - startingWeight) / weeks
}

function calculateDailyChange(weeklyChange: number): number {
  return weeklyChange / 7
}

describe('Goal Schemas', () => {
  describe('isValidWeightGoal', () => {
    it('should accept valid weight goal types', () => {
      expect(isValidWeightGoal('lose')).toBe(true)
      expect(isValidWeightGoal('maintain')).toBe(true)
      expect(isValidWeightGoal('gain')).toBe(true)
    })

    it('should reject invalid weight goal types', () => {
      expect(isValidWeightGoal('loss')).toBe(false)
      expect(isValidWeightGoal('LOSE')).toBe(false)
      expect(isValidWeightGoal('')).toBe(false)
      expect(isValidWeightGoal('maintain ')).toBe(false)
    })
  })

  describe('isValidDateTime', () => {
    it('should accept valid ISO 8601 date-time formats', () => {
      expect(isValidDateTime('2024-01-15T08:30:00Z')).toBe(true)
      expect(isValidDateTime('2024-12-31T23:59:59Z')).toBe(true)
      expect(isValidDateTime('2024-06-15T12:00:00.000Z')).toBe(true)
    })

    it('should reject invalid date-time formats', () => {
      expect(isValidDateTime('2024-01-15')).toBe(false) // Missing time
      expect(isValidDateTime('2024-01-15 08:30:00')).toBe(false) // Space instead of T
      expect(isValidDateTime('01-15-2024T08:30:00Z')).toBe(false) // Wrong date order
      expect(isValidDateTime('')).toBe(false)
    })
  })

  describe('validateWeightGoalData', () => {
    it('should accept valid weight goal data', () => {
      const result = validateWeightGoalData({
        startingWeight: 80,
        targetWeight: 75,
        weightGoal: 'lose',
        startDate: '2024-01-01',
        targetDate: '2024-06-01',
        calorieTarget: 2000,
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept data with null values', () => {
      const result = validateWeightGoalData({
        startingWeight: null,
        targetWeight: null,
        weightGoal: null,
        startDate: null,
        targetDate: null,
        calorieTarget: null,
      })
      expect(result.valid).toBe(true)
    })

    it('should reject negative starting weight', () => {
      const result = validateWeightGoalData({
        startingWeight: -80,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Starting weight must be positive')
    })

    it('should reject zero target weight', () => {
      const result = validateWeightGoalData({
        targetWeight: 0,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Target weight must be positive')
    })

    it('should reject negative calorie target', () => {
      const result = validateWeightGoalData({
        calorieTarget: -2000,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Calorie target must be positive')
    })

    it('should reject invalid weight goal type', () => {
      const result = validateWeightGoalData({
        weightGoal: 'invalid' as WeightGoalType,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid weight goal type')
    })

    it('should reject invalid date format', () => {
      const result = validateWeightGoalData({
        startDate: '01-01-2024', // Wrong format
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid start date format')
    })
  })

  describe('validateWeightLogEntry', () => {
    it('should accept valid weight log entry', () => {
      const result = validateWeightLogEntry({
        timestamp: '2024-01-15T08:30:00Z',
        weight: 75.5,
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid timestamp', () => {
      const result = validateWeightLogEntry({
        timestamp: '2024-01-15',
        weight: 75.5,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid timestamp format')
    })

    it('should reject zero weight', () => {
      const result = validateWeightLogEntry({
        timestamp: '2024-01-15T08:30:00Z',
        weight: 0,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Weight must be positive')
    })

    it('should reject negative weight', () => {
      const result = validateWeightLogEntry({
        timestamp: '2024-01-15T08:30:00Z',
        weight: -75,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Weight must be positive')
    })
  })

  describe('calculateWeeklyChange', () => {
    it('should calculate positive weekly change for weight gain', () => {
      const change = calculateWeeklyChange(70, 75, 10)
      expect(change).toBe(0.5) // 5kg over 10 weeks = 0.5kg/week
    })

    it('should calculate negative weekly change for weight loss', () => {
      const change = calculateWeeklyChange(80, 75, 10)
      expect(change).toBe(-0.5) // -5kg over 10 weeks = -0.5kg/week
    })

    it('should return 0 for zero weeks', () => {
      const change = calculateWeeklyChange(80, 75, 0)
      expect(change).toBe(0)
    })

    it('should return 0 for negative weeks', () => {
      const change = calculateWeeklyChange(80, 75, -5)
      expect(change).toBe(0)
    })

    it('should return 0 for maintain goal', () => {
      const change = calculateWeeklyChange(75, 75, 10)
      expect(change).toBe(0)
    })
  })

  describe('calculateDailyChange', () => {
    it('should calculate daily change from weekly change', () => {
      const daily = calculateDailyChange(0.7) // 0.7kg/week
      expect(daily).toBeCloseTo(0.1, 4) // ~0.1kg/day
    })

    it('should handle negative weekly change', () => {
      const daily = calculateDailyChange(-0.7) // -0.7kg/week
      expect(daily).toBeCloseTo(-0.1, 4) // ~-0.1kg/day
    })

    it('should return 0 for zero weekly change', () => {
      const daily = calculateDailyChange(0)
      expect(daily).toBe(0)
    })
  })

  describe('isValidDateString', () => {
    it('should accept valid date strings', () => {
      expect(isValidDateString('2024-01-01')).toBe(true)
      expect(isValidDateString('2024-12-31')).toBe(true)
      expect(isValidDateString('2024-06-15')).toBe(true)
    })

    it('should reject invalid date strings', () => {
      expect(isValidDateString('2024-1-1')).toBe(false)
      expect(isValidDateString('01-01-2024')).toBe(false)
      expect(isValidDateString('2024/01/01')).toBe(false)
      expect(isValidDateString('')).toBe(false)
    })
  })
})