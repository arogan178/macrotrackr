/**
 * Tests for Date Utility Functions
 *
 * These tests validate the date manipulation functions in src/lib/dates.ts
 */

import { describe, it, expect } from 'vitest'
import {
  getLocalDate,
  getCurrentTimestamp,
  isValidDate,
  isValidTime,
  formatDate,
  formatTime,
  parseDate,
  daysDifference,
  weeksDifference,
} from '../../src/lib/dates'

describe('getLocalDate', () => {
  it('should return a date string in YYYY-MM-DD format', () => {
    const result = getLocalDate()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should return a valid date', () => {
    const result = getLocalDate()
    const date = new Date(result)
    expect(date.getTime()).not.toBe(NaN)
  })

  it('should be consistent with current date', () => {
    const today = new Date()
    const result = getLocalDate()
    const expected = formatDate(today)
    expect(result).toBe(expected)
  })
})

describe('getCurrentTimestamp', () => {
  it('should return an ISO timestamp', () => {
    const result = getCurrentTimestamp()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  })

  it('should be a valid ISO date string', () => {
    const result = getCurrentTimestamp()
    const date = new Date(result)
    expect(date.getTime()).not.toBe(NaN)
  })
})

describe('isValidDate', () => {
  it('should accept valid dates', () => {
    expect(isValidDate('2024-01-01')).toBe(true)
    expect(isValidDate('2024-12-31')).toBe(true)
    expect(isValidDate('2000-06-15')).toBe(true)
  })

  it('should accept dates with valid single-digit months and days', () => {
    expect(isValidDate('2024-01-01')).toBe(true)
    expect(isValidDate('2024-01-09')).toBe(true)
    expect(isValidDate('2024-09-01')).toBe(true)
  })

  it('should reject invalid date formats', () => {
    expect(isValidDate('2024-1-01')).toBe(false)
    expect(isValidDate('2024-01-1')).toBe(false)
    expect(isValidDate('01-01-2024')).toBe(false)
    expect(isValidDate('2024/01/01')).toBe(false)
    expect(isValidDate('20240101')).toBe(false)
    expect(isValidDate('')).toBe(false)
  })

  it('should reject invalid months', () => {
    expect(isValidDate('2024-00-01')).toBe(false)
    expect(isValidDate('2024-13-01')).toBe(false)
  })

  it('should reject invalid days', () => {
    expect(isValidDate('2024-00-01')).toBe(false)
    expect(isValidDate('2024-01-00')).toBe(false)
    expect(isValidDate('2024-01-32')).toBe(false)
  })

  it('should handle leap years correctly', () => {
    expect(isValidDate('2024-02-29')).toBe(true)
    expect(isValidDate('2000-02-29')).toBe(true)
    expect(isValidDate('1900-02-28')).toBe(true)
  })

  it('should reject non-date strings', () => {
    expect(isValidDate('not-a-date')).toBe(false)
    expect(isValidDate('hello world')).toBe(false)
  })
})

describe('isValidTime', () => {
  it('should accept valid times in HH:MM format', () => {
    expect(isValidTime('00:00')).toBe(true)
    expect(isValidTime('12:30')).toBe(true)
    expect(isValidTime('23:59')).toBe(true)
    expect(isValidTime('08:15')).toBe(true)
  })

  it('should accept valid times in HH:MM:SS format', () => {
    expect(isValidTime('00:00:00')).toBe(true)
    expect(isValidTime('12:30:45')).toBe(true)
    expect(isValidTime('23:59:59')).toBe(true)
    expect(isValidTime('08:15:30')).toBe(true)
  })

  it('should reject invalid hour values', () => {
    expect(isValidTime('24:00')).toBe(false)
    expect(isValidTime('-1:00')).toBe(false)
    expect(isValidTime('100:00')).toBe(false)
    expect(isValidTime('abc')).toBe(false)
  })

  it('should reject invalid minute values', () => {
    expect(isValidTime('12:60')).toBe(false)
    expect(isValidTime('12:-1')).toBe(false)
    expect(isValidTime('12:99')).toBe(false)
  })

  it('should reject invalid second values', () => {
    expect(isValidTime('12:30:60')).toBe(false)
    expect(isValidTime('12:30:-1')).toBe(false)
    expect(isValidTime('12:30:99')).toBe(false)
  })

  it('should reject malformed times', () => {
    expect(isValidTime('1:30')).toBe(false)
    expect(isValidTime('12:3')).toBe(false)
    expect(isValidTime('1230')).toBe(false)
    expect(isValidTime('12:30:')).toBe(false)
    expect(isValidTime('')).toBe(false)
    expect(isValidTime(' ')).toBe(false)
  })
})

describe('formatDate', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date('2024-06-15T12:00:00Z')
    expect(formatDate(date)).toBe('2024-06-15')
  })

  it('should handle date with time component', () => {
    const date = new Date('2024-12-31T23:59:59.999Z')
    expect(formatDate(date)).toBe('2024-12-31')
  })

  it('should handle dates before 1970', () => {
    const date = new Date('1969-01-01T00:00:00Z')
    expect(formatDate(date)).toBe('1969-01-01')
  })
})

describe('formatTime', () => {
  it('should format time to HH:MM:SS', () => {
    const date = new Date('2024-06-15T14:30:45.000Z')
    const result = formatTime(date)
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('should handle midnight UTC', () => {
    const date = new Date('2024-06-15T00:00:00.000Z')
    const result = formatTime(date)
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('should handle end of day UTC', () => {
    const date = new Date('2024-06-15T23:59:59.000Z')
    const result = formatTime(date)
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })
})

describe('parseDate', () => {
  it('should parse valid date string to Date object', () => {
    const result = parseDate('2024-06-15')
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(5)
    expect(result.getDate()).toBe(15)
  })

  it('should handle various valid dates', () => {
    expect(parseDate('2024-01-01').getDate()).toBe(1)
    expect(parseDate('2024-12-31').getDate()).toBe(31)
    expect(parseDate('2000-06-15').getFullYear()).toBe(2000)
  })

  it('should throw error for invalid date strings', () => {
    expect(() => parseDate('invalid')).toThrow()
    expect(() => parseDate('')).toThrow()
    expect(() => parseDate('not-a-date')).toThrow()
  })

  it('should throw error with correct message', () => {
    expect(() => parseDate('invalid')).toThrow('Invalid date format: invalid')
  })
})

describe('daysDifference', () => {
  it('should calculate correct days between two dates', () => {
    expect(daysDifference('2024-01-01', '2024-01-02')).toBe(1)
    expect(daysDifference('2024-01-01', '2024-01-10')).toBe(9)
    expect(daysDifference('2024-01-01', '2024-12-31')).toBe(365)
  })

  it('should return 0 for same date', () => {
    expect(daysDifference('2024-06-15', '2024-06-15')).toBe(0)
  })

  it('should work regardless of order', () => {
    expect(daysDifference('2024-01-10', '2024-01-01')).toBe(9)
    expect(daysDifference('2024-01-01', '2024-01-10')).toBe(9)
  })

  it('should handle leap year correctly', () => {
    expect(daysDifference('2024-02-28', '2024-03-01')).toBe(2)
  })

  it('should handle non-leap year correctly', () => {
    expect(daysDifference('2023-02-28', '2023-03-01')).toBe(1)
  })

  it('should handle year boundaries', () => {
    expect(daysDifference('2023-12-31', '2024-01-01')).toBe(1)
  })

  it('should handle multi-year differences', () => {
    expect(daysDifference('2020-01-01', '2024-01-01')).toBe(1461)
  })
})

describe('weeksDifference', () => {
  it('should calculate correct weeks between two dates', () => {
    expect(weeksDifference('2024-01-01', '2024-01-08')).toBe(1)
    expect(weeksDifference('2024-01-01', '2024-01-14')).toBe(2)
    expect(weeksDifference('2024-01-01', '2024-01-15')).toBe(2)
  })

  it('should return 0 for same date', () => {
    expect(weeksDifference('2024-06-15', '2024-06-15')).toBe(0)
  })

  it('should work regardless of order', () => {
    expect(weeksDifference('2024-01-14', '2024-01-01')).toBe(2)
  })

  it('should handle partial weeks', () => {
    expect(weeksDifference('2024-01-01', '2024-01-04')).toBe(1)
    expect(weeksDifference('2024-01-01', '2024-01-03')).toBe(1)
    expect(weeksDifference('2024-01-01', '2024-01-02')).toBe(1)
  })

  it('should round up partial weeks', () => {
    expect(weeksDifference('2024-01-01', '2024-01-08')).toBe(1)
    expect(weeksDifference('2024-01-01', '2024-01-09')).toBe(2)
  })

  it('should handle month boundaries', () => {
    expect(weeksDifference('2024-01-28', '2024-02-04')).toBe(1)
  })
})
