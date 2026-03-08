import { describe, expect,it } from 'vitest'

import { isOldEnough } from '../validation'

describe('Validation Utilities', () => {
  describe('isOldEnough', () => {
    it('should return true for users 18 or older', () => {
      const today = new Date()
      const birthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
      expect(isOldEnough(birthDate.toISOString().split('T')[0]!)).toBe(true)
    })

    it('should return true for users well above minimum age', () => {
      expect(isOldEnough('1990-01-01')).toBe(true)
    })

    it('should return false for users under 18', () => {
      const today = new Date()
      const birthDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate())
      expect(isOldEnough(birthDate.toISOString().split('T')[0]!)).toBe(false)
    })

    it('should return false for users exactly 17', () => {
      const today = new Date()
      const birthDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate() + 1)
      expect(isOldEnough(birthDate.toISOString().split('T')[0]!)).toBe(false)
    })

    it('should handle leap years correctly', () => {
      const today = new Date()
      const leapYearBirthday = new Date(
        today.getFullYear() - 18,
        1,
        29,
      )
      const expected = leapYearBirthday <= today

      expect(
        isOldEnough(leapYearBirthday.toISOString().split('T')[0]!),
      ).toBe(expected)
    })

    it('should handle birthday today edge case', () => {
      const today = new Date()
      const birthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
      expect(isOldEnough(birthDate.toISOString().split('T')[0]!)).toBe(true)
    })
  })
})
