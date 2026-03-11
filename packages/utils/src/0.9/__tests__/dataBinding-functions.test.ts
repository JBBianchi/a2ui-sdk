/**
 * T033: Data binding with FunctionCall tests
 *
 * Tests FunctionCall evaluation in resolveValue/resolveString,
 * and verifies NO auto-interpolation of raw strings.
 */

import { describe, it, expect } from 'vitest'
import { resolveValue, resolveString } from '../dataBinding.js'
import {
  FunctionRegistry,
  type FunctionImplementation,
} from '../functions/index.js'
import type { DataModel } from '@a2ui-sdk/types/0.9'

/** Helper: create a registry with some test functions */
function createTestRegistry(): FunctionRegistry {
  const registry = new FunctionRegistry()

  const toUpper: FunctionImplementation = {
    name: 'toUpper',
    returnType: 'string',
    execute(args) {
      return typeof args.value === 'string' ? args.value.toUpperCase() : ''
    },
  }

  const add: FunctionImplementation = {
    name: 'add',
    returnType: 'number',
    execute(args) {
      return Number(args.a) + Number(args.b)
    },
  }

  const isPositive: FunctionImplementation = {
    name: 'isPositive',
    returnType: 'boolean',
    execute(args) {
      return Number(args.value) > 0
    },
  }

  const returnsUndefined: FunctionImplementation = {
    name: 'returnsUndefined',
    returnType: 'void',
    execute() {
      return undefined
    },
  }

  registry.register(toUpper)
  registry.register(add)
  registry.register(isPositive)
  registry.register(returnsUndefined)

  return registry
}

describe('resolveValue with FunctionCall', () => {
  const model: DataModel = { user: { name: 'Alice' }, count: 10 }
  const registry = createTestRegistry()

  it('should evaluate a FunctionCall with literal args', () => {
    const result = resolveValue(
      { call: 'toUpper', args: { value: 'hello' } },
      model,
      null,
      undefined,
      registry
    )
    expect(result).toBe('HELLO')
  })

  it('should evaluate a FunctionCall with path-bound args', () => {
    const result = resolveValue(
      { call: 'toUpper', args: { value: { path: '/user/name' } } },
      model,
      null,
      undefined,
      registry
    )
    expect(result).toBe('ALICE')
  })

  it('should evaluate a FunctionCall with numeric args', () => {
    const result = resolveValue(
      { call: 'add', args: { a: 3, b: 7 } },
      model,
      null,
      undefined,
      registry
    )
    expect(result).toBe(10)
  })

  it('should return defaultValue when function returns undefined', () => {
    const result = resolveValue(
      { call: 'returnsUndefined' },
      model,
      null,
      'fallback',
      registry
    )
    expect(result).toBe('fallback')
  })

  it('should return defaultValue when no registry is provided for FunctionCall', () => {
    const result = resolveValue(
      { call: 'toUpper', args: { value: 'hello' } },
      model,
      null,
      'default'
    )
    expect(result).toBe('default')
  })

  it('should return defaultValue when function name is not registered', () => {
    const result = resolveValue(
      { call: 'nonExistent', args: {} },
      model,
      null,
      'missing',
      registry
    )
    expect(result).toBe('missing')
  })

  it('should handle FunctionCall with no args', () => {
    const result = resolveValue(
      { call: 'returnsUndefined' },
      model,
      null,
      undefined,
      registry
    )
    expect(result).toBeUndefined()
  })
})

describe('resolveString with FunctionCall', () => {
  const model: DataModel = { user: { name: 'Bob' }, count: 5 }
  const registry = createTestRegistry()

  it('should evaluate a FunctionCall and return string result', () => {
    const result = resolveString(
      { call: 'toUpper', args: { value: 'world' } },
      model,
      null,
      '',
      registry
    )
    expect(result).toBe('WORLD')
  })

  it('should convert numeric function result to string', () => {
    const result = resolveString(
      { call: 'add', args: { a: 2, b: 3 } },
      model,
      null,
      '',
      registry
    )
    expect(result).toBe('5')
  })

  it('should return defaultValue when function returns undefined', () => {
    const result = resolveString(
      { call: 'returnsUndefined' },
      model,
      null,
      'default',
      registry
    )
    expect(result).toBe('default')
  })

  it('should return defaultValue when no registry for FunctionCall', () => {
    const result = resolveString(
      { call: 'toUpper', args: { value: 'hi' } },
      model,
      null,
      'fallback'
    )
    expect(result).toBe('fallback')
  })
})

describe('resolveString NO auto-interpolation', () => {
  const model: DataModel = { name: 'Charlie' }

  it('should NOT interpolate ${/name} in a raw string', () => {
    const result = resolveString('Hello ${/name}', model)
    expect(result).toBe('Hello ${/name}')
  })

  it('should NOT interpolate ${name} in a raw string with basePath', () => {
    const result = resolveString('Value: ${name}', model, '/some/path')
    expect(result).toBe('Value: ${name}')
  })

  it('should return a plain string literal unchanged', () => {
    const result = resolveString('No interpolation here', model)
    expect(result).toBe('No interpolation here')
  })

  it('should return empty string for undefined input', () => {
    expect(resolveString(undefined, model)).toBe('')
    expect(resolveString(null, model)).toBe('')
  })

  it('should convert number values to string', () => {
    const result = resolveString(42 as unknown as string, model)
    expect(result).toBe('42')
  })

  it('should convert boolean values to string', () => {
    const result = resolveString(true as unknown as string, model)
    expect(result).toBe('true')
  })
})
