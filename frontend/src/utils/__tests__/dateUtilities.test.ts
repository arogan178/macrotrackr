import { describe, expect,it } from 'vitest'

import {
  addDaysISO,
  eachDayISO,
  formatDateFull,
  formatDateShort,
  getDatesBetween,
  getDaysInRange,
  getDisplayDate,
  getTodayISO,
  isValidDateString,
  isWithinDateRange,
  todayISO,
} from '../dateUtilities'

describe('Date Utilities', () => {
  describe('todayISO', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const result = todayISO()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should return a valid date', () => {
      const result = todayISO()
      const date = new Date(result)
      expect(date.getTime()).not.toBeNaN()
    })
  })

  describe('getTodayISO', () => {
    it('should return today in ISO format', () => {
      const result = getTodayISO()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getDisplayDate', () => {
    it('should return formatted date string', () => {
      const result = getDisplayDate(new Date('2024-06-15'))
      expect(result).toContain('2024')
    })

    it('should use default current date', () => {
      const result = getDisplayDate()
      expect(result).toBeTruthy()
    })
  })

  describe('formatDateShort', () => {
    it('should format date as MMM d', () => {
      const result = formatDateShort('2024-06-15')
      expect(result).toMatch(/^[A-Z][a-z]{2} \d+$/)
    })

    it('should return Invalid Date for invalid input', () => {
      expect(formatDateShort('invalid')).toBe('Invalid Date')
      expect(formatDateShort('')).toBe('Invalid Date')
    })
  })

  describe('formatDateFull', () => {
    it('should format date as MMMM d, yyyy', () => {
      const result = formatDateFull('2024-06-15')
      expect(result).toMatch(/^[A-Z][a-z]+ \d+, \d{4}$/)
    })

    it('should return Invalid Date for invalid input', () => {
      expect(formatDateFull('invalid')).toBe('Invalid Date')
    })
  })

  describe('getDaysInRange', () => {
    it('should calculate days between dates inclusively', () => {
      expect(getDaysInRange('2024-01-01', '2024-01-10')).toBe(10)
    })

    it('should return 1 for same date', () => {
      expect(getDaysInRange('2024-06-15', '2024-06-15')).toBe(1)
    })

    it('should return 0 for invalid dates', () => {
      expect(getDaysInRange('invalid', '2024-01-10')).toBe(0)
      expect(getDaysInRange('2024-01-01', 'invalid')).toBe(0)
    })
  })

  describe('getDatesBetween', () => {
    it('should return array of dates', () => {
      const result = getDatesBetween('2024-01-01', '2024-01-03')
      expect(result).toEqual(['2024-01-01', '2024-01-02', '2024-01-03'])
    })

    it('should return single date for same date', () => {
      const result = getDatesBetween('2024-06-15', '2024-06-15')
      expect(result).toEqual(['2024-06-15'])
    })

    it('should return empty array for invalid dates', () => {
      expect(getDatesBetween('invalid', '2024-01-10')).toEqual([])
      expect(getDatesBetween('2024-01-01', 'invalid')).toEqual([])
    })
  })

  describe('isValidDateString', () => {
    it('should return true for valid date strings', () => {
      expect(isValidDateString('2024-01-01')).toBe(true)
      expect(isValidDateString('2024-12-31')).toBe(true)
    })

    it('should return false for invalid formats', () => {
      expect(isValidDateString('2024-1-1')).toBe(false)
      expect(isValidDateString('01-01-2024')).toBe(false)
      expect(isValidDateString('2024/01/01')).toBe(false)
      expect(isValidDateString('')).toBe(false)
    })

    it('should return false for invalid dates', () => {
      expect(isValidDateString('2024-13-01')).toBe(false)
      expect(isValidDateString('2024-02-30')).toBe(false)
    })
  })

  describe('isWithinDateRange', () => {
    it('should return true when date is within range', () => {
      expect(isWithinDateRange('2024-01-05', '2024-01-01', '2024-01-10')).toBe(true)
    })

    it('should return true for boundaries', () => {
      expect(isWithinDateRange('2024-01-01', '2024-01-01', '2024-01-10')).toBe(true)
      expect(isWithinDateRange('2024-01-10', '2024-01-01', '2024-01-10')).toBe(true)
    })

    it('should return false when date is outside range', () => {
      expect(isWithinDateRange('2024-01-15', '2024-01-01', '2024-01-10')).toBe(false)
    })

    it('should return false for invalid dates', () => {
      expect(isWithinDateRange('invalid', '2024-01-01', '2024-01-10')).toBe(false)
      expect(isWithinDateRange('2024-01-05', 'invalid', '2024-01-10')).toBe(false)
    })
  })

  describe('addDaysISO', () => {
    it('should add days to date', () => {
      expect(addDaysISO('2024-01-01', 5)).toBe('2024-01-06')
    })

    it('should handle negative days', () => {
      expect(addDaysISO('2024-01-10', -5)).toBe('2024-01-05')
    })

    it('should handle month boundaries', () => {
      expect(addDaysISO('2024-01-30', 5)).toBe('2024-02-04')
    })

    it('should return original for invalid date', () => {
      expect(addDaysISO('invalid', 5)).toBe('invalid')
    })
  })

  describe('eachDayISO', () => {
    it('should generate array of dates', () => {
      const result = eachDayISO('2024-01-01', 3)
      expect(result).toEqual(['2024-01-01', '2024-01-02', '2024-01-03'])
    })

    it('should return empty array for invalid inputs', () => {
      expect(eachDayISO('invalid', 3)).toEqual([])
      expect(eachDayISO('2024-01-01', 0)).toEqual([])
      expect(eachDayISO('2024-01-01', -1)).toEqual([])
    })

    it('should handle year boundaries', () => {
      const result = eachDayISO('2024-12-30', 5)
      expect(result).toEqual(['2024-12-30', '2024-12-31', '2025-01-01', '2025-01-02', '2025-01-03'])
    })
  })
})
