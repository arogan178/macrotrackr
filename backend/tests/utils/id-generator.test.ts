import { describe, expect, it } from 'vitest'

import { generateId, generateNumericId, generateUUID } from '../../src/utils/id-generator'

describe('id-generator', () => {
  describe('generateId', () => {
    it('generates id with default prefix', () => {
      const id = generateId()
      expect(id).toMatch(/^id_\d+_[a-z0-9]+$/)
    })

    it('generates id with custom prefix', () => {
      const id = generateId('user')
      expect(id).toMatch(/^user_\d+_[a-z0-9]+$/)
    })

    it('generates unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('generateUUID', () => {
    it('generates valid UUID format', () => {
      const uuid = generateUUID()
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    })

    it('generates unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('generateNumericId', () => {
    it('generates numeric id', () => {
      const id = generateNumericId()
      expect(typeof id).toBe('number')
    })

    it('generates unique ids', () => {
      const id1 = generateNumericId()
      const id2 = generateNumericId()
      expect(id1).not.toBe(id2)
    })
  })
})
