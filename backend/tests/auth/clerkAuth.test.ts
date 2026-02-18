/**
 * Tests for Clerk authentication middleware
 * 
 * These tests focus on the path exemption logic which is critical
 * for ensuring public endpoints remain accessible.
 */

import { describe, it, expect } from 'vitest'

// Recreate the isExemptPath logic for unit testing
// This mirrors the logic in backend/src/middleware/clerkAuth.ts

const AUTH_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/validate-email",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/webhooks/clerk",
  "/api/webhooks/stripe",
  "/api/docs",
  "/api/docs/json",
  "/",
  "/health",
  "/health/ready",
])

function isExemptPath(path: string): boolean {
  // Check exact matches
  if (AUTH_EXEMPT_PATHS.has(path)) {
    return true
  }
  
  // Check for webhook paths (they handle their own auth)
  if (path.startsWith("/api/webhooks/")) {
    return true
  }
  
  // Check for Swagger/OpenAPI paths
  if (path.startsWith("/api/docs") || path.startsWith("/api/api/docs")) {
    return true
  }
  
  return false
}

describe('isExemptPath', () => {
  describe('exact matches', () => {
    it('should exempt login path', () => {
      expect(isExemptPath('/api/auth/login')).toBe(true)
    })

    it('should exempt register path', () => {
      expect(isExemptPath('/api/auth/register')).toBe(true)
    })

    it('should exempt validate-email path', () => {
      expect(isExemptPath('/api/auth/validate-email')).toBe(true)
    })

    it('should exempt forgot-password path', () => {
      expect(isExemptPath('/api/auth/forgot-password')).toBe(true)
    })

    it('should exempt reset-password path', () => {
      expect(isExemptPath('/api/auth/reset-password')).toBe(true)
    })

    it('should exempt root path', () => {
      expect(isExemptPath('/')).toBe(true)
    })

    it('should exempt health check paths', () => {
      expect(isExemptPath('/health')).toBe(true)
      expect(isExemptPath('/health/ready')).toBe(true)
    })

    it('should exempt docs paths', () => {
      expect(isExemptPath('/api/docs')).toBe(true)
      expect(isExemptPath('/api/docs/json')).toBe(true)
    })
  })

  describe('webhook paths', () => {
    it('should exempt clerk webhook path', () => {
      expect(isExemptPath('/api/webhooks/clerk')).toBe(true)
    })

    it('should exempt stripe webhook path', () => {
      expect(isExemptPath('/api/webhooks/stripe')).toBe(true)
    })

    it('should exempt any webhook path prefix', () => {
      expect(isExemptPath('/api/webhooks/custom')).toBe(true)
    })
  })

  describe('docs paths', () => {
    it('should exempt api/docs prefix', () => {
      expect(isExemptPath('/api/docs/swagger')).toBe(true)
    })

    it('should exempt api/api/docs prefix', () => {
      expect(isExemptPath('/api/api/docs/swagger')).toBe(true)
    })
  })

  describe('protected paths', () => {
    it('should NOT exempt clerk-sync path (requires auth)', () => {
      // This is important: clerk-sync needs auth to know which user to sync
      expect(isExemptPath('/api/auth/clerk-sync')).toBe(false)
    })

    it('should NOT exempt user endpoints', () => {
      expect(isExemptPath('/api/user/me')).toBe(false)
      expect(isExemptPath('/api/user/profile')).toBe(false)
    })

    it('should NOT exempt macro endpoints', () => {
      expect(isExemptPath('/api/macros')).toBe(false)
      expect(isExemptPath('/api/macros/entry')).toBe(false)
    })

    it('should NOT exempt goals endpoints', () => {
      expect(isExemptPath('/api/goals')).toBe(false)
      expect(isExemptPath('/api/goals/weight')).toBe(false)
    })

    it('should NOT exempt billing endpoints', () => {
      expect(isExemptPath('/api/billing/status')).toBe(false)
      expect(isExemptPath('/api/billing/checkout')).toBe(false)
    })

    it('should NOT exempt habits endpoints', () => {
      expect(isExemptPath('/api/habits')).toBe(false)
    })

    it('should NOT exempt reporting endpoints', () => {
      expect(isExemptPath('/api/reporting/summary')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle paths with query parameters', () => {
      // Query params don't affect exemption
      expect(isExemptPath('/api/auth/login?redirect=/dashboard')).toBe(false)
    })

    it('should be case-sensitive', () => {
      expect(isExemptPath('/API/AUTH/LOGIN')).toBe(false)
    })

    it('should handle empty path', () => {
      expect(isExemptPath('')).toBe(false)
    })

    it('should handle paths without leading slash', () => {
      expect(isExemptPath('api/auth/login')).toBe(false)
    })
  })
})

describe('AUTH_EXEMPT_PATHS set', () => {
  it('should contain all expected exempt paths', () => {
    const expectedPaths = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/validate-email",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/webhooks/clerk",
      "/api/webhooks/stripe",
      "/api/docs",
      "/api/docs/json",
      "/",
      "/health",
      "/health/ready",
    ]

    expectedPaths.forEach(path => {
      expect(AUTH_EXEMPT_PATHS.has(path)).toBe(true)
    })
  })

  it('should have correct size', () => {
    expect(AUTH_EXEMPT_PATHS.size).toBe(12)
  })
})
