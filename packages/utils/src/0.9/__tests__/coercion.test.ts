/**
 * T084: Type coercion tests
 *
 * Tests coerceToBoolean, coerceToString, coerceToNumber
 * with all input types from the spec coercion table.
 */

import { describe, it, expect } from 'vitest'
import { coerceToBoolean, coerceToString, coerceToNumber } from '../coercion.js'

describe('coerceToBoolean', () => {
  // Boolean -> Boolean (identity)
  it('should return true for boolean true', () => {
    expect(coerceToBoolean(true)).toBe(true)
  })

  it('should return false for boolean false', () => {
    expect(coerceToBoolean(false)).toBe(false)
  })

  // String -> Boolean
  it('should return true for string "true"', () => {
    expect(coerceToBoolean('true')).toBe(true)
  })

  it('should return true for string "TRUE" (case-insensitive)', () => {
    expect(coerceToBoolean('TRUE')).toBe(true)
  })

  it('should return true for string "True" (case-insensitive)', () => {
    expect(coerceToBoolean('True')).toBe(true)
  })

  it('should return false for string "false"', () => {
    expect(coerceToBoolean('false')).toBe(false)
  })

  it('should return false for string "FALSE" (case-insensitive)', () => {
    expect(coerceToBoolean('FALSE')).toBe(false)
  })

  it('should return false for any other string', () => {
    expect(coerceToBoolean('hello')).toBe(false)
    expect(coerceToBoolean('')).toBe(false)
    expect(coerceToBoolean('1')).toBe(false)
    expect(coerceToBoolean('yes')).toBe(false)
  })

  // Number -> Boolean
  it('should return true for non-zero positive number', () => {
    expect(coerceToBoolean(1)).toBe(true)
    expect(coerceToBoolean(42)).toBe(true)
    expect(coerceToBoolean(0.1)).toBe(true)
  })

  it('should return true for negative number', () => {
    expect(coerceToBoolean(-1)).toBe(true)
    expect(coerceToBoolean(-0.5)).toBe(true)
  })

  it('should return false for zero', () => {
    expect(coerceToBoolean(0)).toBe(false)
  })

  // null/undefined -> Boolean
  it('should return false for null', () => {
    expect(coerceToBoolean(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(coerceToBoolean(undefined)).toBe(false)
  })

  // Other types -> Boolean
  it('should return false for objects', () => {
    expect(coerceToBoolean({})).toBe(false)
    expect(coerceToBoolean([])).toBe(false)
  })
})

describe('coerceToString', () => {
  // null/undefined -> String
  it('should return empty string for null', () => {
    expect(coerceToString(null)).toBe('')
  })

  it('should return empty string for undefined', () => {
    expect(coerceToString(undefined)).toBe('')
  })

  // String -> String (identity)
  it('should return string as-is', () => {
    expect(coerceToString('hello')).toBe('hello')
    expect(coerceToString('')).toBe('')
  })

  // Number -> String
  it('should convert number to string', () => {
    expect(coerceToString(42)).toBe('42')
    expect(coerceToString(3.14)).toBe('3.14')
    expect(coerceToString(0)).toBe('0')
    expect(coerceToString(-1)).toBe('-1')
  })

  // Boolean -> String
  it('should convert boolean to string', () => {
    expect(coerceToString(true)).toBe('true')
    expect(coerceToString(false)).toBe('false')
  })

  // Any -> String
  it('should convert objects to string representation', () => {
    expect(coerceToString({})).toBe('[object Object]')
    expect(coerceToString([])).toBe('')
  })
})

describe('coerceToNumber', () => {
  // Number -> Number (identity)
  it('should return number as-is', () => {
    expect(coerceToNumber(42)).toBe(42)
    expect(coerceToNumber(3.14)).toBe(3.14)
    expect(coerceToNumber(0)).toBe(0)
    expect(coerceToNumber(-1)).toBe(-1)
  })

  // null/undefined -> Number
  it('should return 0 for null', () => {
    expect(coerceToNumber(null)).toBe(0)
  })

  it('should return 0 for undefined', () => {
    expect(coerceToNumber(undefined)).toBe(0)
  })

  // Boolean -> Number
  it('should return 1 for true', () => {
    expect(coerceToNumber(true)).toBe(1)
  })

  it('should return 0 for false', () => {
    expect(coerceToNumber(false)).toBe(0)
  })

  // String -> Number
  it('should parse numeric strings', () => {
    expect(coerceToNumber('42')).toBe(42)
    expect(coerceToNumber('3.14')).toBe(3.14)
    expect(coerceToNumber('-1')).toBe(-1)
    expect(coerceToNumber('0')).toBe(0)
  })

  it('should return 0 for non-numeric strings', () => {
    expect(coerceToNumber('hello')).toBe(0)
    expect(coerceToNumber('')).toBe(0)
    expect(coerceToNumber('abc123')).toBe(0)
  })

  it('should parse strings with leading numbers', () => {
    // parseFloat behavior: parses leading numeric portion
    expect(coerceToNumber('123abc')).toBe(123)
  })

  // Other types -> Number
  it('should return 0 for objects', () => {
    expect(coerceToNumber({})).toBe(0)
    expect(coerceToNumber([])).toBe(0)
  })
})
