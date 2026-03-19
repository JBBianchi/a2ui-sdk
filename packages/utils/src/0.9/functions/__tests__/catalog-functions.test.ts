/**
 * T032: Catalog function tests
 *
 * Tests for formatString, formatNumber, formatCurrency, formatDate, pluralize.
 */

import { describe, it, expect } from 'vitest'
import { formatString } from '../formatString.js'
import { formatNumber } from '../formatNumber.js'
import { formatCurrency } from '../formatCurrency.js'
import { formatDate } from '../formatDate.js'
import { pluralize } from '../pluralize.js'

describe('formatString', () => {
  it('should interpolate a template with data model paths', () => {
    const result = formatString.execute(
      { template: 'Hello, ${/user/name}!' },
      { user: { name: 'Alice' } },
      null
    )
    expect(result).toBe('Hello, Alice!')
  })

  it('should accept "value" as alias for "template"', () => {
    const result = formatString.execute(
      { value: 'Count: ${/count}' },
      { count: 42 },
      null
    )
    expect(result).toBe('Count: 42')
  })

  it('should return empty string if template is not a string', () => {
    expect(formatString.execute({ template: 123 }, {}, null)).toBe('')
    expect(formatString.execute({ template: null }, {}, null)).toBe('')
    expect(formatString.execute({}, {}, null)).toBe('')
  })

  it('should return the template as-is if no interpolation expressions', () => {
    const result = formatString.execute({ template: 'Hello, world!' }, {}, null)
    expect(result).toBe('Hello, world!')
  })

  it('should resolve relative paths with basePath', () => {
    const result = formatString.execute(
      { template: '${name}' },
      { user: { name: 'Bob' } },
      '/user'
    )
    expect(result).toBe('Bob')
  })

  it('has correct name and returnType', () => {
    expect(formatString.name).toBe('formatString')
    expect(formatString.returnType).toBe('string')
  })
})

describe('formatNumber', () => {
  it('should format a basic number', () => {
    const result = formatNumber.execute({ value: 1234.5 }, {}, null)
    expect(typeof result).toBe('string')
    // The formatted string should contain the digits
    expect(result).toContain('1')
    expect(result).toContain('234')
  })

  it('should return empty string for NaN value', () => {
    expect(formatNumber.execute({ value: 'abc' }, {}, null)).toBe('')
    expect(formatNumber.execute({ value: undefined }, {}, null)).toBe('')
  })

  it('should respect minimumFractionDigits', () => {
    const result = formatNumber.execute(
      { value: 42, minimumFractionDigits: 2 },
      {},
      null
    )
    expect(result).toContain('42')
    expect(result).toMatch(/42[.,]00/)
  })

  it('should respect maximumFractionDigits', () => {
    const result = formatNumber.execute(
      { value: 3.14159, maximumFractionDigits: 2 },
      {},
      null
    )
    expect(result).toContain('3')
    // Should be truncated/rounded to 2 decimal places
    expect(result).toMatch(/3[.,]14/)
  })

  it('should handle locale parameter', () => {
    const result = formatNumber.execute(
      { value: 1234.5, locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('1,234.5')
  })

  it('should handle notation parameter', () => {
    const result = formatNumber.execute(
      { value: 1000000, notation: 'compact', locale: 'en-US' },
      {},
      null
    )
    expect(result).toContain('M')
  })

  it('should handle string numeric value', () => {
    const result = formatNumber.execute(
      { value: '1234', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('1,234')
  })

  it('has correct name and returnType', () => {
    expect(formatNumber.name).toBe('formatNumber')
    expect(formatNumber.returnType).toBe('string')
  })
})

describe('formatCurrency', () => {
  it('should format a value as USD by default', () => {
    const result = formatCurrency.execute(
      { value: 99.99, locale: 'en-US' },
      {},
      null
    )
    expect(result).toContain('99.99')
    expect(result).toContain('$')
  })

  it('should format with specified currency', () => {
    const result = formatCurrency.execute(
      { value: 100, currency: 'EUR', locale: 'en-US' },
      {},
      null
    )
    // Should contain the euro sign or EUR
    expect(result).toMatch(/€|EUR/)
  })

  it('should return empty string for NaN value', () => {
    expect(formatCurrency.execute({ value: 'abc' }, {}, null)).toBe('')
    expect(formatCurrency.execute({ value: undefined }, {}, null)).toBe('')
  })

  it('should handle locale parameter', () => {
    const result = formatCurrency.execute(
      { value: 1234.56, currency: 'USD', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('$1,234.56')
  })

  it('should default currency to USD when not specified', () => {
    const result = formatCurrency.execute(
      { value: 50, locale: 'en-US' },
      {},
      null
    )
    expect(result).toContain('$')
  })

  it('should handle zero value', () => {
    const result = formatCurrency.execute(
      { value: 0, locale: 'en-US' },
      {},
      null
    )
    expect(result).toContain('$')
    expect(result).toContain('0')
  })

  it('has correct name and returnType', () => {
    expect(formatCurrency.name).toBe('formatCurrency')
    expect(formatCurrency.returnType).toBe('string')
  })
})

describe('formatDate', () => {
  // Use a fixed date for deterministic tests
  const isoDate = '2024-06-15T14:30:00Z'

  it('should format a date with default formatting (no format)', () => {
    const result = formatDate.execute({ value: isoDate }, {}, null)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should format using TR35 pattern yyyy-MM-dd', () => {
    const result = formatDate.execute(
      { value: isoDate, format: 'yyyy-MM-dd', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('2024-06-15')
  })

  it('should handle pattern with literal text in quotes', () => {
    const result = formatDate.execute(
      { value: isoDate, format: "yyyy 'year'", locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('2024 year')
  })

  it('should return empty string for invalid date', () => {
    expect(formatDate.execute({ value: 'not-a-date' }, {}, null)).toBe('')
  })

  it('should return empty string for non-date types', () => {
    expect(formatDate.execute({ value: null }, {}, null)).toBe('')
    expect(formatDate.execute({ value: undefined }, {}, null)).toBe('')
    expect(formatDate.execute({ value: {} }, {}, null)).toBe('')
  })

  it('should handle numeric timestamps', () => {
    const timestamp = new Date('2024-01-01T00:00:00Z').getTime()
    const result = formatDate.execute(
      { value: timestamp, format: 'yyyy', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('2024')
  })

  it('should handle locale parameter', () => {
    const result = formatDate.execute(
      { value: isoDate, format: 'MMMM', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('June')
  })

  it('should handle format with only literal separators', () => {
    const result = formatDate.execute(
      { value: isoDate, format: 'dd/MM/yyyy', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('15/06/2024')
  })

  it('should not treat pattern as a supported alias', () => {
    const result = formatDate.execute(
      { value: isoDate, pattern: 'yyyy-MM-dd', locale: 'en-US' },
      {},
      null
    )
    expect(result).not.toBe('2024-06-15')
  })

  it('has correct name and returnType', () => {
    expect(formatDate.name).toBe('formatDate')
    expect(formatDate.returnType).toBe('string')
  })
})

describe('pluralize', () => {
  it('should select the "one" form for count=1', () => {
    const result = pluralize.execute(
      {
        count: 1,
        one: '{count} item',
        other: '{count} items',
        locale: 'en-US',
      },
      {},
      null
    )
    expect(result).toBe('1 item')
  })

  it('should select the "other" form for count > 1', () => {
    const result = pluralize.execute(
      {
        count: 5,
        one: '{count} item',
        other: '{count} items',
        locale: 'en-US',
      },
      {},
      null
    )
    expect(result).toBe('5 items')
  })

  it('should replace # with count', () => {
    const result = pluralize.execute(
      { count: 3, one: '# apple', other: '# apples', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('3 apples')
  })

  it('should fallback to "other" when category form is missing', () => {
    const result = pluralize.execute(
      { count: 1, other: '{count} things', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('1 things')
  })

  it('should return count as string if no matching forms', () => {
    const result = pluralize.execute({ count: 7 }, {}, null)
    expect(result).toBe('7')
  })

  it('should accept "value" as alias for "count"', () => {
    const result = pluralize.execute(
      { value: 2, one: '# cat', other: '# cats', locale: 'en-US' },
      {},
      null
    )
    expect(result).toBe('2 cats')
  })

  it('should return empty string for NaN count', () => {
    expect(pluralize.execute({ count: 'abc' }, {}, null)).toBe('')
  })

  it('should handle zero count', () => {
    const result = pluralize.execute(
      {
        count: 0,
        zero: 'No items',
        one: '# item',
        other: '# items',
        locale: 'en-US',
      },
      {},
      null
    )
    // In English, 0 maps to "other" by PluralRules, not "zero"
    // So this should fall to "other" unless "zero" is explicitly mapped
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('has correct name and returnType', () => {
    expect(pluralize.name).toBe('pluralize')
    expect(pluralize.returnType).toBe('string')
  })
})
