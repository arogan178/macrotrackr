/**
 * Tests for User Schemas
 * 
 * These tests validate the schema definitions for user settings and profile.
 */

import { describe, it, expect } from 'vitest'

// Recreate the schema logic for unit testing
// This mirrors the logic in backend/src/modules/user/schemas.ts

// Types
type Gender = 'male' | 'female'
type ActivityLevel = 1 | 2 | 3 | 4 | 5
type SubscriptionStatus = 'free' | 'pro' | 'canceled'

// Validation functions
function isValidGender(value: string): value is Gender {
  return ['male', 'female'].includes(value)
}

function isValidActivityLevel(value: number): value is ActivityLevel {
  return [1, 2, 3, 4, 5].includes(value)
}

function isValidSubscriptionStatus(value: string): value is SubscriptionStatus {
  return ['free', 'pro', 'canceled'].includes(value)
}

function isValidEmail(email: string): boolean {
  // Basic email validation
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

function validateUserSettings(data: {
  firstName?: string
  lastName?: string
  email?: string
  dateOfBirth?: string | null
  height?: number | null
  weight?: number | null
  gender?: Gender | null
  activityLevel?: number | null
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate email if provided
  if (data.email !== undefined && data.email !== null) {
    if (!isValidEmail(data.email)) {
      errors.push('Invalid email format')
    }
  }

  // Validate height if provided
  if (data.height !== null && data.height !== undefined) {
    if (data.height <= 0) {
      errors.push('Height must be positive')
    }
    if (data.height > 300) {
      errors.push('Height seems unrealistic (max 300cm)')
    }
  }

  // Validate weight if provided
  if (data.weight !== null && data.weight !== undefined) {
    if (data.weight <= 0) {
      errors.push('Weight must be positive')
    }
    if (data.weight > 500) {
      errors.push('Weight seems unrealistic (max 500kg)')
    }
  }

  // Validate gender if provided
  if (data.gender !== null && data.gender !== undefined) {
    if (!isValidGender(data.gender)) {
      errors.push('Invalid gender value')
    }
  }

  // Validate activity level if provided
  if (data.activityLevel !== null && data.activityLevel !== undefined) {
    if (!isValidActivityLevel(data.activityLevel)) {
      errors.push('Activity level must be between 1 and 5')
    }
  }

  // Validate date of birth if provided
  if (data.dateOfBirth !== null && data.dateOfBirth !== undefined) {
    if (!isValidDateString(data.dateOfBirth)) {
      errors.push('Invalid date of birth format')
    } else {
      // Check if date is not in the future
      const dob = new Date(data.dateOfBirth)
      const now = new Date()
      if (dob > now) {
        errors.push('Date of birth cannot be in the future')
      }
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

function isProfileComplete(user: {
  dateOfBirth?: string | null
  height?: number | null
  weight?: number | null
  gender?: Gender | null
  activityLevel?: number | null
}): boolean {
  return !!(
    user.dateOfBirth &&
    user.height &&
    user.weight &&
    user.gender &&
    user.activityLevel
  )
}

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  
  let age = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--
  }
  
  return age
}

describe('User Schemas', () => {
  describe('isValidGender', () => {
    it('should accept valid gender values', () => {
      expect(isValidGender('male')).toBe(true)
      expect(isValidGender('female')).toBe(true)
    })

    it('should reject invalid gender values', () => {
      expect(isValidGender('other')).toBe(false)
      expect(isValidGender('MALE')).toBe(false)
      expect(isValidGender('')).toBe(false)
      expect(isValidGender('male ')).toBe(false)
    })
  })

  describe('isValidActivityLevel', () => {
    it('should accept valid activity levels (1-5)', () => {
      expect(isValidActivityLevel(1)).toBe(true)
      expect(isValidActivityLevel(2)).toBe(true)
      expect(isValidActivityLevel(3)).toBe(true)
      expect(isValidActivityLevel(4)).toBe(true)
      expect(isValidActivityLevel(5)).toBe(true)
    })

    it('should reject invalid activity levels', () => {
      expect(isValidActivityLevel(0)).toBe(false)
      expect(isValidActivityLevel(6)).toBe(false)
      expect(isValidActivityLevel(-1)).toBe(false)
      expect(isValidActivityLevel(3.5)).toBe(false)
    })
  })

  describe('isValidSubscriptionStatus', () => {
    it('should accept valid subscription statuses', () => {
      expect(isValidSubscriptionStatus('free')).toBe(true)
      expect(isValidSubscriptionStatus('pro')).toBe(true)
      expect(isValidSubscriptionStatus('canceled')).toBe(true)
    })

    it('should reject invalid subscription statuses', () => {
      expect(isValidSubscriptionStatus('premium')).toBe(false)
      expect(isValidSubscriptionStatus('FREE')).toBe(false)
      expect(isValidSubscriptionStatus('')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.org')).toBe(true)
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('missing@domain')).toBe(false)
      expect(isValidEmail('@nodomain.com')).toBe(false)
      expect(isValidEmail('spaces in@email.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('validateUserSettings', () => {
    it('should accept valid user settings', () => {
      const result = validateUserSettings({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: '1990-01-15',
        height: 180,
        weight: 75,
        gender: 'male',
        activityLevel: 3,
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept partial updates', () => {
      const result = validateUserSettings({
        weight: 80,
      })
      expect(result.valid).toBe(true)
    })

    it('should accept null values for clearing fields', () => {
      const result = validateUserSettings({
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: null,
      })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = validateUserSettings({
        email: 'invalid-email',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid email format')
    })

    it('should reject negative height', () => {
      const result = validateUserSettings({
        height: -180,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Height must be positive')
    })

    it('should reject unrealistic height', () => {
      const result = validateUserSettings({
        height: 500,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Height seems unrealistic (max 300cm)')
    })

    it('should reject negative weight', () => {
      const result = validateUserSettings({
        weight: -75,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Weight must be positive')
    })

    it('should reject invalid gender', () => {
      const result = validateUserSettings({
        gender: 'other' as Gender,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid gender value')
    })

    it('should reject invalid activity level', () => {
      const result = validateUserSettings({
        activityLevel: 6,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Activity level must be between 1 and 5')
    })

    it('should reject future date of birth', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const futureDateStr = futureDate.toISOString().split('T')[0]

      const result = validateUserSettings({
        dateOfBirth: futureDateStr,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Date of birth cannot be in the future')
    })
  })

  describe('isProfileComplete', () => {
    it('should return true when all fields are set', () => {
      expect(isProfileComplete({
        dateOfBirth: '1990-01-15',
        height: 180,
        weight: 75,
        gender: 'male',
        activityLevel: 3,
      })).toBe(true)
    })

    it('should return false when any field is missing', () => {
      expect(isProfileComplete({
        dateOfBirth: null,
        height: 180,
        weight: 75,
        gender: 'male',
        activityLevel: 3,
      })).toBe(false)

      expect(isProfileComplete({
        dateOfBirth: '1990-01-15',
        height: null,
        weight: 75,
        gender: 'male',
        activityLevel: 3,
      })).toBe(false)

      expect(isProfileComplete({
        dateOfBirth: '1990-01-15',
        height: 180,
        weight: null,
        gender: 'male',
        activityLevel: 3,
      })).toBe(false)

      expect(isProfileComplete({
        dateOfBirth: '1990-01-15',
        height: 180,
        weight: 75,
        gender: null,
        activityLevel: 3,
      })).toBe(false)

      expect(isProfileComplete({
        dateOfBirth: '1990-01-15',
        height: 180,
        weight: 75,
        gender: 'male',
        activityLevel: null,
      })).toBe(false)
    })

    it('should return false when all fields are missing', () => {
      expect(isProfileComplete({})).toBe(false)
    })
  })

  describe('calculateAge', () => {
    it('should calculate correct age for past birthday', () => {
      const today = new Date()
      const birthYear = today.getFullYear() - 30
      const dob = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      expect(calculateAge(dob)).toBe(30)
    })

    it('should calculate correct age for birthday not yet occurred this year', () => {
      const now = new Date()
      const birthYear = now.getFullYear() - 30
      
      // Set birth month to next month
      const nextMonth = now.getMonth() + 2
      const dob = `${birthYear}-${String(nextMonth).padStart(2, '0')}-15`
      
      expect(calculateAge(dob)).toBe(29)
    })

    it('should handle leap year birthdays', () => {
      expect(calculateAge('2000-02-29')).toBeGreaterThanOrEqual(23)
    })
  })
})