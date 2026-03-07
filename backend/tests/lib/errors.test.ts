/**
 * Tests for Error Classes and Utilities
 *
 * These tests validate the error classes and utilities in src/lib/errors.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  BadRequestError,
  ConflictError,
  DatabaseError,
  isAppError,
  formatErrorResponse,
} from '../../src/lib/errors'

vi.mock('../../src/lib/logger', () => ({
  loggerHelpers: {
    error: vi.fn(),
  },
}))

describe('AppError', () => {
  it('should create an error with default values', () => {
    const error = new AppError('Test error')
    
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.isOperational).toBe(true)
    expect(error.name).toBe('AppError')
  })

  it('should create an error with custom values', () => {
    const error = new AppError('Custom error', 400, 'CUSTOM_CODE', false)
    
    expect(error.message).toBe('Custom error')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('CUSTOM_CODE')
    expect(error.isOperational).toBe(false)
  })

  it('should capture stack trace', () => {
    const error = new AppError('Test error')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('AppError')
  })

  it('should be instanceof Error', () => {
    const error = new AppError('Test error')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('AuthenticationError', () => {
  it('should create an error with default message', () => {
    const error = new AuthenticationError()
    
    expect(error.message).toBe('Authentication required')
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('AUTHENTICATION_ERROR')
    expect(error.isOperational).toBe(true)
  })

  it('should create an error with custom message', () => {
    const error = new AuthenticationError('Invalid token')
    
    expect(error.message).toBe('Invalid token')
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('AUTHENTICATION_ERROR')
  })

  it('should be instanceof AppError', () => {
    const error = new AuthenticationError()
    expect(error).toBeInstanceOf(AppError)
  })

  it('should capture stack trace', () => {
    const error = new AuthenticationError()
    expect(error.stack).toBeDefined()
  })
})

describe('AuthorizationError', () => {
  it('should create an error with default message', () => {
    const error = new AuthorizationError()
    
    expect(error.message).toBe('Access denied')
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('AUTHORIZATION_ERROR')
    expect(error.isOperational).toBe(true)
  })

  it('should create an error with custom message', () => {
    const error = new AuthorizationError('Admin access required')
    
    expect(error.message).toBe('Admin access required')
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('AUTHORIZATION_ERROR')
  })

  it('should be instanceof AppError', () => {
    const error = new AuthorizationError()
    expect(error).toBeInstanceOf(AppError)
  })
})

describe('NotFoundError', () => {
  it('should create an error with default message', () => {
    const error = new NotFoundError()
    
    expect(error.message).toBe('Resource not found')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.isOperational).toBe(true)
  })

  it('should create an error with custom message', () => {
    const error = new NotFoundError('User not found')
    
    expect(error.message).toBe('User not found')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('should be instanceof AppError', () => {
    const error = new NotFoundError()
    expect(error).toBeInstanceOf(AppError)
  })
})

describe('ValidationError', () => {
  it('should create an error without details', () => {
    const error = new ValidationError('Invalid input')
    
    expect(error.message).toBe('Invalid input')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.isOperational).toBe(true)
    expect(error.details).toBeUndefined()
  })

  it('should create an error with details', () => {
    const details = { field: 'email', reason: 'Invalid format' }
    const error = new ValidationError('Invalid input', details)
    
    expect(error.message).toBe('Invalid input')
    expect(error.details).toEqual(details)
  })

  it('should create an error with array details', () => {
    const details = [
      { field: 'email', message: 'Invalid format' },
      { field: 'password', message: 'Too short' }
    ]
    const error = new ValidationError('Validation failed', details)
    
    expect(error.details).toEqual(details)
  })

  it('should be instanceof AppError', () => {
    const error = new ValidationError('Invalid input')
    expect(error).toBeInstanceOf(AppError)
  })
})

describe('BadRequestError', () => {
  it('should create an error with default message', () => {
    const error = new BadRequestError()
    
    expect(error.message).toBe('Bad request')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('BAD_REQUEST')
    expect(error.isOperational).toBe(true)
  })

  it('should create an error with custom message', () => {
    const error = new BadRequestError('Missing required field')
    
    expect(error.message).toBe('Missing required field')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('BAD_REQUEST')
  })

  it('should be instanceof AppError', () => {
    const error = new BadRequestError()
    expect(error).toBeInstanceOf(AppError)
  })
})

describe('ConflictError', () => {
  it('should create an error with default message', () => {
    const error = new ConflictError()
    
    expect(error.message).toBe('Resource conflict')
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('RESOURCE_CONFLICT')
    expect(error.isOperational).toBe(true)
  })

  it('should create an error with custom message', () => {
    const error = new ConflictError('Email already exists')
    
    expect(error.message).toBe('Email already exists')
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('RESOURCE_CONFLICT')
  })

  it('should be instanceof AppError', () => {
    const error = new ConflictError()
    expect(error).toBeInstanceOf(AppError)
  })
})

describe('DatabaseError', () => {
  it('should create an error with default message', () => {
    const error = new DatabaseError()
    
    expect(error.message).toBe('Database operation failed')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('DATABASE_ERROR')
    expect(error.isOperational).toBe(true)
  })

  it('should create an error with custom message', () => {
    const error = new DatabaseError('Connection refused')
    
    expect(error.message).toBe('Connection refused')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('DATABASE_ERROR')
  })

  it('should be instanceof AppError', () => {
    const error = new DatabaseError()
    expect(error).toBeInstanceOf(AppError)
  })
})

describe('isAppError', () => {
  it('should return true for AppError', () => {
    const error = new AppError('Test')
    expect(isAppError(error)).toBe(true)
  })

  it('should return true for AuthenticationError', () => {
    const error = new AuthenticationError()
    expect(isAppError(error)).toBe(true)
  })

  it('should return true for AuthorizationError', () => {
    const error = new AuthorizationError()
    expect(isAppError(error)).toBe(true)
  })

  it('should return true for NotFoundError', () => {
    const error = new NotFoundError()
    expect(isAppError(error)).toBe(true)
  })

  it('should return true for ValidationError', () => {
    const error = new ValidationError('Test')
    expect(isAppError(error)).toBe(true)
  })

  it('should return true for BadRequestError', () => {
    const error = new BadRequestError()
    expect(isAppError(error)).toBe(true)
  })

  it('should return true for ConflictError', () => {
    const error = new ConflictError()
    expect(isAppError(error)).toBe(true)
  })

  it('should return true for DatabaseError', () => {
    const error = new DatabaseError()
    expect(isAppError(error)).toBe(true)
  })

  it('should return false for plain Error', () => {
    const error = new Error('Test')
    expect(isAppError(error)).toBe(false)
  })

  it('should return false for string', () => {
    expect(isAppError('error message')).toBe(false)
  })

  it('should return false for null', () => {
    expect(isAppError(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isAppError(undefined)).toBe(false)
  })

  it('should return false for object', () => {
    expect(isAppError({ message: 'error' })).toBe(false)
  })

  it('should return false for number', () => {
    expect(isAppError(500)).toBe(false)
  })

  it('should narrow type for TypeScript', () => {
    const unknownError: unknown = new NotFoundError('Not found')
    if (isAppError(unknownError)) {
      expect(unknownError.statusCode).toBe(404)
      expect(unknownError.code).toBe('NOT_FOUND')
    } else {
      throw new Error('Should have been narrowed to AppError')
    }
  })
})

describe('formatErrorResponse', () => {
  it('should format AppError correctly', () => {
    const error = new AppError('Test error', 500, 'TEST_CODE')
    const response = formatErrorResponse(error)
    
    expect(response).toEqual({
      code: 'TEST_CODE',
      message: 'Test error',
      details: undefined,
    })
  })

  it('should format ValidationError with details', () => {
    const details = { field: 'email' }
    const error = new ValidationError('Invalid email', details)
    const response = formatErrorResponse(error)
    
    expect(response).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid email',
      details: details,
    })
  })

  it('should format ValidationError without details', () => {
    const error = new ValidationError('Invalid input')
    const response = formatErrorResponse(error)
    
    expect(response).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: undefined,
    })
  })

  it('should format NotFoundError correctly', () => {
    const error = new NotFoundError('User not found')
    const response = formatErrorResponse(error)
    
    expect(response).toEqual({
      code: 'NOT_FOUND',
      message: 'User not found',
      details: undefined,
    })
  })

  it('should format AuthenticationError correctly', () => {
    const error = new AuthenticationError('Token expired')
    const response = formatErrorResponse(error)
    
    expect(response).toEqual({
      code: 'AUTHENTICATION_ERROR',
      message: 'Token expired',
      details: undefined,
    })
  })

  it('should format AuthorizationError correctly', () => {
    const error = new AuthorizationError('Insufficient permissions')
    const response = formatErrorResponse(error)
    
    expect(response).toEqual({
      code: 'AUTHORIZATION_ERROR',
      message: 'Insufficient permissions',
      details: undefined,
    })
  })

  it('should handle generic Error', () => {
    const error = new Error('Generic error')
    const response = formatErrorResponse(error)
    
    expect(response).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })

  it('should handle validation error message', () => {
    const error = new Error('validation failed: email is required')
    const response = formatErrorResponse(error)
    
    expect(response).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      details: 'validation failed: email is required',
    })
  })

  it('should handle null', () => {
    const response = formatErrorResponse(null)
    
    expect(response).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })

  it('should handle undefined', () => {
    const response = formatErrorResponse(undefined)
    
    expect(response).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })

  it('should handle non-Error object', () => {
    const response = formatErrorResponse({ message: 'some error' })
    
    expect(response).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })

  it('should handle string error', () => {
    const response = formatErrorResponse('string error')
    
    expect(response).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })

  it('should handle number error', () => {
    const response = formatErrorResponse(123)
    
    expect(response).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })
})
