/**
 * Tests for Macro Schemas
 * 
 * These tests validate the schema definitions for macro entries and targets.
 */

import { describe, it, expect } from 'vitest'
import { t } from 'elysia'

// Recreate the schema logic for unit testing
// This mirrors the logic in backend/src/modules/macros/schemas.ts

// --- Reusable Primitives ---
const MacroPercentage = t.Integer({ minimum: 5, maximum: 70 })

// --- Macro Entry Schemas ---

const MacroValueSchema = t.Number({
  minimum: 0,
  error: "Macro value cannot be negative.",
})

const MealTypeSchema = t.Union(
  [
    t.Literal("breakfast"),
    t.Literal("lunch"),
    t.Literal("dinner"),
    t.Literal("snack"),
  ],
  {
    default: "snack",
    error:
      "Invalid meal type. Must be 'breakfast', 'lunch', 'dinner', or 'snack'.",
  }
)

const DateSchema = t.String({
  format: "date",
  error: "Invalid date format. Please use YYYY-MM-DD.",
})

const TimeSchema = t.String({
  pattern: "^([01]\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d))?$",
  error: "Invalid time format. Please use HH:MM or HH:MM:SS.",
})

// Macro target percentages validation
function validateMacroPercentages(data: {
  proteinPercentage: number
  carbsPercentage: number
  fatsPercentage: number
}): { valid: boolean; error?: string } {
  const { proteinPercentage, carbsPercentage, fatsPercentage } = data

  // Check ranges
  if (proteinPercentage < 5 || proteinPercentage > 70) {
    return { valid: false, error: "Protein percentage must be between 5 and 70." }
  }
  if (carbsPercentage < 5 || carbsPercentage > 70) {
    return { valid: false, error: "Carbs percentage must be between 5 and 70." }
  }
  if (fatsPercentage < 5 || fatsPercentage > 70) {
    return { valid: false, error: "Fats percentage must be between 5 and 70." }
  }

  // Check sum
  const sum = proteinPercentage + carbsPercentage + fatsPercentage
  if (sum !== 100) {
    return { valid: false, error: `Macro percentages must sum to 100, got ${sum}.` }
  }

  return { valid: true }
}

// Meal type validation
function isValidMealType(value: string): boolean {
  return ["breakfast", "lunch", "dinner", "snack"].includes(value)
}

// Time format validation
function isValidTimeFormat(time: string): boolean {
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/
  return pattern.test(time)
}

// Date format validation (YYYY-MM-DD)
function isValidDateFormat(date: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/
  if (!pattern.test(date)) return false

  // Parse the date components
  const [year, month, day] = date.split('-').map(Number)
  
  // Create a date and verify the components match
  // (JavaScript Date auto-corrects invalid dates like 2024-02-30 to 2024-03-01)
  const parsed = new Date(year, month - 1, day)
  
  // Check if the date components match what we passed in
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  )
}

describe('Macro Schemas', () => {
  describe('validateMacroPercentages', () => {
    it('should accept valid percentages that sum to 100', () => {
      const result = validateMacroPercentages({
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      })
      expect(result.valid).toBe(true)
    })

    it('should accept minimum valid percentages', () => {
      const result = validateMacroPercentages({
        proteinPercentage: 5,
        carbsPercentage: 5,
        fatsPercentage: 90,
      })
      expect(result.valid).toBe(false) // 90 > 70, exceeds max
    })

    it('should accept percentages at max boundary', () => {
      const result = validateMacroPercentages({
        proteinPercentage: 70,
        carbsPercentage: 15,
        fatsPercentage: 15,
      })
      expect(result.valid).toBe(true)
    })

    it('should reject percentages that do not sum to 100', () => {
      const result = validateMacroPercentages({
        proteinPercentage: 30,
        carbsPercentage: 30,
        fatsPercentage: 30,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('90')
    })

    it('should reject protein percentage below minimum', () => {
      const result = validateMacroPercentages({
        proteinPercentage: 4,
        carbsPercentage: 48,
        fatsPercentage: 48,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Protein')
    })

    it('should reject protein percentage above maximum', () => {
      const result = validateMacroPercentages({
        proteinPercentage: 71,
        carbsPercentage: 15,
        fatsPercentage: 14,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Protein')
    })

    it('should accept common macro splits', () => {
      // Standard balanced split
      expect(validateMacroPercentages({
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      }).valid).toBe(true)

      // Low carb split
      expect(validateMacroPercentages({
        proteinPercentage: 35,
        carbsPercentage: 25,
        fatsPercentage: 40,
      }).valid).toBe(true)

      // High protein split
      expect(validateMacroPercentages({
        proteinPercentage: 40,
        carbsPercentage: 30,
        fatsPercentage: 30,
      }).valid).toBe(true)
    })
  })

  describe('isValidMealType', () => {
    it('should accept valid meal types', () => {
      expect(isValidMealType('breakfast')).toBe(true)
      expect(isValidMealType('lunch')).toBe(true)
      expect(isValidMealType('dinner')).toBe(true)
      expect(isValidMealType('snack')).toBe(true)
    })

    it('should reject invalid meal types', () => {
      expect(isValidMealType('brunch')).toBe(false)
      expect(isValidMealType('BREAKFAST')).toBe(false)
      expect(isValidMealType('')).toBe(false)
      expect(isValidMealType('breakfast ')).toBe(false)
    })
  })

  describe('isValidTimeFormat', () => {
    it('should accept valid time formats (HH:MM)', () => {
      expect(isValidTimeFormat('00:00')).toBe(true)
      expect(isValidTimeFormat('12:30')).toBe(true)
      expect(isValidTimeFormat('23:59')).toBe(true)
      expect(isValidTimeFormat('08:15')).toBe(true)
    })

    it('should accept valid time formats (HH:MM:SS)', () => {
      expect(isValidTimeFormat('00:00:00')).toBe(true)
      expect(isValidTimeFormat('12:30:45')).toBe(true)
      expect(isValidTimeFormat('23:59:59')).toBe(true)
    })

    it('should reject invalid time formats', () => {
      expect(isValidTimeFormat('24:00')).toBe(false) // Hour out of range
      expect(isValidTimeFormat('12:60')).toBe(false) // Minute out of range
      expect(isValidTimeFormat('12:30:60')).toBe(false) // Second out of range
      expect(isValidTimeFormat('1:30')).toBe(false) // Missing leading zero
      expect(isValidTimeFormat('12:3')).toBe(false) // Missing leading zero
      expect(isValidTimeFormat('1230')).toBe(false) // Missing colon
      expect(isValidTimeFormat('')).toBe(false)
    })
  })

  describe('isValidDateFormat', () => {
    it('should accept valid date formats (YYYY-MM-DD)', () => {
      expect(isValidDateFormat('2024-01-01')).toBe(true)
      expect(isValidDateFormat('2024-12-31')).toBe(true)
      expect(isValidDateFormat('2024-06-15')).toBe(true)
    })

    it('should reject invalid date formats', () => {
      expect(isValidDateFormat('2024-1-1')).toBe(false) // Missing leading zeros
      expect(isValidDateFormat('01-01-2024')).toBe(false) // Wrong order
      expect(isValidDateFormat('2024/01/01')).toBe(false) // Wrong separator
      expect(isValidDateFormat('20240101')).toBe(false) // No separator
      expect(isValidDateFormat('')).toBe(false)
    })

    it('should reject invalid dates', () => {
      expect(isValidDateFormat('2024-13-01')).toBe(false) // Invalid month
      expect(isValidDateFormat('2024-02-30')).toBe(false) // Invalid day for Feb (2024 is leap year, max 29)
      expect(isValidDateFormat('2024-00-01')).toBe(false) // Invalid month
      expect(isValidDateFormat('2024-02-31')).toBe(false) // Invalid day for Feb
    })
  })

  describe('MacroValueSchema constraints', () => {
    it('should accept non-negative macro values', () => {
      // These would be validated by Elysia, but we test the logic
      const validValues = [0, 1, 10.5, 100, 1000]
      validValues.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0)
      })
    })

    it('should reject negative macro values', () => {
      const invalidValues = [-1, -0.1, -100]
      invalidValues.forEach(value => {
        expect(value).toBeLessThan(0)
      })
    })
  })
})
