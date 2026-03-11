/**
 * T044: CheckRule / validation tests
 *
 * Tests for evaluateCheckRule and evaluateDynamicBoolean with
 * literal boolean, path binding, FunctionCall, and composed conditions.
 */

import { describe, it, expect } from 'vitest'
import {
  evaluateCheckRule,
  evaluateDynamicBoolean,
  evaluateChecks,
  type EvaluationContext,
} from '../validation.js'
import {
  FunctionRegistry,
  type FunctionImplementation,
} from '../functions/index.js'
import type { DataModel, CheckRule, DynamicBoolean } from '@a2ui-sdk/types/0.9'

function createTestRegistry(): FunctionRegistry {
  const registry = new FunctionRegistry()

  const isNotEmpty: FunctionImplementation = {
    name: 'isNotEmpty',
    returnType: 'boolean',
    execute(args) {
      const value = args.value
      if (value === null || value === undefined) return false
      if (typeof value === 'string') return value.trim().length > 0
      return true
    },
  }

  const greaterThan: FunctionImplementation = {
    name: 'greaterThan',
    returnType: 'boolean',
    execute(args) {
      return Number(args.value) > Number(args.threshold)
    },
  }

  const alwaysTrue: FunctionImplementation = {
    name: 'alwaysTrue',
    returnType: 'boolean',
    execute() {
      return true
    },
  }

  const alwaysFalse: FunctionImplementation = {
    name: 'alwaysFalse',
    returnType: 'boolean',
    execute() {
      return false
    },
  }

  registry.register(isNotEmpty)
  registry.register(greaterThan)
  registry.register(alwaysTrue)
  registry.register(alwaysFalse)

  return registry
}

describe('evaluateDynamicBoolean', () => {
  const model: DataModel = {
    user: { name: 'Alice', age: 25 },
    active: true,
    inactive: false,
    empty: '',
    zero: 0,
  }
  const registry = createTestRegistry()

  const makeContext = (
    overrides?: Partial<EvaluationContext>
  ): EvaluationContext => ({
    dataModel: model,
    basePath: null,
    registry,
    ...overrides,
  })

  describe('literal boolean', () => {
    it('should return true for literal true', () => {
      expect(evaluateDynamicBoolean(true, makeContext())).toBe(true)
    })

    it('should return false for literal false', () => {
      expect(evaluateDynamicBoolean(false, makeContext())).toBe(false)
    })
  })

  describe('path binding', () => {
    it('should resolve truthy path value to true', () => {
      const condition: DynamicBoolean = { path: '/active' }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(true)
    })

    it('should resolve falsy path value to false', () => {
      const condition: DynamicBoolean = { path: '/inactive' }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(false)
    })

    it('should resolve truthy string to true', () => {
      const condition: DynamicBoolean = { path: '/user/name' }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(true)
    })

    it('should resolve empty string to false', () => {
      const condition: DynamicBoolean = { path: '/empty' }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(false)
    })

    it('should resolve zero to false', () => {
      const condition: DynamicBoolean = { path: '/zero' }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(false)
    })

    it('should resolve missing path to false', () => {
      const condition: DynamicBoolean = { path: '/nonexistent' }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(false)
    })
  })

  describe('FunctionCall', () => {
    it('should evaluate a function that returns true', () => {
      const condition: DynamicBoolean = { call: 'alwaysTrue' }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(true)
    })

    it('should evaluate a function that returns false', () => {
      const condition: DynamicBoolean = { call: 'alwaysFalse' }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(false)
    })

    it('should evaluate a function with literal args', () => {
      const condition: DynamicBoolean = {
        call: 'greaterThan',
        args: { value: 10, threshold: 5 },
      }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(true)
    })

    it('should evaluate a function with path-bound args', () => {
      const condition: DynamicBoolean = {
        call: 'greaterThan',
        args: { value: { path: '/user/age' }, threshold: 18 },
      }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(true)
    })

    it('should evaluate a function with path-bound args that fail', () => {
      const condition: DynamicBoolean = {
        call: 'greaterThan',
        args: { value: { path: '/user/age' }, threshold: 30 },
      }
      expect(evaluateDynamicBoolean(condition, makeContext())).toBe(false)
    })

    it('should use legacy validation functions when no registry', () => {
      const condition: DynamicBoolean = {
        call: 'required',
        args: { value: 'hello' },
      }
      const ctx = makeContext({ registry: undefined })
      expect(evaluateDynamicBoolean(condition, ctx)).toBe(true)
    })

    it('should use legacy validation functions - required with empty string', () => {
      const condition: DynamicBoolean = {
        call: 'required',
        args: { value: '' },
      }
      const ctx = makeContext({ registry: undefined })
      expect(evaluateDynamicBoolean(condition, ctx)).toBe(false)
    })

    it('should return true for unknown function without registry', () => {
      const condition: DynamicBoolean = { call: 'unknownFn' }
      const ctx = makeContext({ registry: undefined })
      expect(evaluateDynamicBoolean(condition, ctx)).toBe(true)
    })
  })
})

describe('evaluateCheckRule', () => {
  const model: DataModel = { value: 'test', count: 5 }
  const registry = createTestRegistry()

  const makeContext = (): EvaluationContext => ({
    dataModel: model,
    basePath: null,
    registry,
  })

  it('should pass for a literal true condition', () => {
    const rule: CheckRule = { condition: true, message: 'Should pass' }
    expect(evaluateCheckRule(rule, makeContext())).toBe(true)
  })

  it('should fail for a literal false condition', () => {
    const rule: CheckRule = { condition: false, message: 'Should fail' }
    expect(evaluateCheckRule(rule, makeContext())).toBe(false)
  })

  it('should pass for a function that returns true', () => {
    const rule: CheckRule = {
      condition: { call: 'isNotEmpty', args: { value: 'hello' } },
      message: 'Value required',
    }
    expect(evaluateCheckRule(rule, makeContext())).toBe(true)
  })

  it('should fail for a function that returns false', () => {
    const rule: CheckRule = {
      condition: { call: 'isNotEmpty', args: { value: '' } },
      message: 'Value required',
    }
    expect(evaluateCheckRule(rule, makeContext())).toBe(false)
  })
})

describe('evaluateChecks', () => {
  const model: DataModel = { name: 'Alice', age: 25 }
  const registry = createTestRegistry()

  it('should return valid for empty checks array', () => {
    const result = evaluateChecks([], model, null, registry)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should return valid for undefined checks', () => {
    const result = evaluateChecks(undefined, model, null, registry)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should return valid when all checks pass', () => {
    const checks: CheckRule[] = [
      { condition: true, message: 'Always passes' },
      {
        condition: { call: 'isNotEmpty', args: { value: { path: '/name' } } },
        message: 'Name required',
      },
    ]
    const result = evaluateChecks(checks, model, null, registry)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should collect error messages from failing checks', () => {
    const checks: CheckRule[] = [
      {
        condition: { call: 'isNotEmpty', args: { value: '' } },
        message: 'Field is required',
      },
      {
        condition: { call: 'greaterThan', args: { value: 5, threshold: 10 } },
        message: 'Must be greater than 10',
      },
    ]
    const result = evaluateChecks(checks, model, null, registry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Field is required')
    expect(result.errors).toContain('Must be greater than 10')
  })

  it('should not include messages from passing checks', () => {
    const checks: CheckRule[] = [
      { condition: true, message: 'This passes' },
      { condition: false, message: 'This fails' },
    ]
    const result = evaluateChecks(checks, model, null, registry)
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(['This fails'])
  })
})
