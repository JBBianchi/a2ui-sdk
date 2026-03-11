/**
 * Validation utilities for A2UI 0.9 Renderer.
 *
 * Implements validation functions and CheckRule evaluation
 * using condition-based DynamicBoolean for the `checks` property
 * on input components and Buttons.
 */

import type {
  CheckRule,
  DynamicBoolean,
  DynamicValue,
  DataModel,
  FunctionCall,
  ValidationResult,
} from '@a2ui-sdk/types/0.9'
import { resolveValue } from './dataBinding.js'
import type { FunctionRegistry } from './functions/index.js'

// ============ Validation Functions ============

/**
 * Type for a validation function.
 * Takes resolved arguments and returns a boolean.
 */
export type ValidationFunction = (args: Record<string, unknown>) => boolean

/**
 * Built-in validation functions.
 */
export const validationFunctions: Record<string, ValidationFunction> = {
  /**
   * Checks if a value is present (not null, undefined, or empty string).
   */
  required: ({ value }) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  },

  /**
   * Validates email format.
   */
  email: ({ value }) => {
    if (typeof value !== 'string') return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },

  /**
   * Tests value against a regular expression pattern.
   */
  regex: ({ value, pattern }) => {
    if (typeof value !== 'string') return false
    if (typeof pattern !== 'string') return false
    try {
      return new RegExp(pattern).test(value)
    } catch {
      return false
    }
  },

  /**
   * Validates string length within min/max bounds.
   */
  length: ({ value, min, max }) => {
    const str = String(value ?? '')
    const len = str.length
    if (min !== undefined && min !== null && len < Number(min)) return false
    if (max !== undefined && max !== null && len > Number(max)) return false
    return true
  },

  /**
   * Validates numeric value within min/max bounds.
   */
  numeric: ({ value, min, max }) => {
    const num = Number(value)
    if (isNaN(num)) return false
    if (min !== undefined && min !== null && num < Number(min)) return false
    if (max !== undefined && max !== null && num > Number(max)) return false
    return true
  },
}

// ============ DynamicBoolean Evaluation ============

/**
 * Context for evaluating expressions.
 */
export interface EvaluationContext {
  dataModel: DataModel
  basePath: string | null
  registry?: FunctionRegistry
  /** @deprecated Use registry instead */
  functions?: Record<string, ValidationFunction>
}

/**
 * Helper to check if a value is a FunctionCall.
 */
function isFunctionCall(value: DynamicBoolean): value is FunctionCall {
  return typeof value === 'object' && value !== null && 'call' in value
}

/**
 * Helper to check if a value is a path binding.
 */
function isPathBinding(value: DynamicBoolean): value is { path: string } {
  return typeof value === 'object' && value !== null && 'path' in value
}

/**
 * Resolves function arguments from DynamicValue to actual values.
 */
export function resolveArgs(
  args: Record<string, DynamicValue> | undefined,
  dataModel: DataModel,
  basePath: string | null,
  registry?: FunctionRegistry
): Record<string, unknown> {
  if (!args) return {}

  const resolved: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(args)) {
    resolved[key] = resolveValue(
      value,
      dataModel,
      basePath,
      undefined,
      registry
    )
  }
  return resolved
}

/**
 * Evaluates a DynamicBoolean condition.
 * Supports: literal boolean, path binding, FunctionCall.
 */
export function evaluateDynamicBoolean(
  condition: DynamicBoolean,
  context: EvaluationContext
): boolean {
  const { dataModel, basePath, registry } = context

  // Literal boolean
  if (typeof condition === 'boolean') {
    return condition
  }

  // Path binding
  if (isPathBinding(condition)) {
    const value = resolveValue(
      condition,
      dataModel,
      basePath,
      undefined,
      registry
    )
    return Boolean(value)
  }

  // FunctionCall
  if (isFunctionCall(condition)) {
    if (registry) {
      const resolvedArgs = resolveArgs(
        condition.args,
        dataModel,
        basePath,
        registry
      )
      const result = registry.execute(
        condition.call,
        resolvedArgs,
        dataModel,
        basePath
      )
      return Boolean(result)
    }
    // Fallback to legacy validation functions
    const { functions = validationFunctions } = context
    const fn = functions[condition.call]
    if (!fn) {
      console.warn(`[A2UI] Unknown validation function: ${condition.call}`)
      return true
    }
    const resolvedArgs = resolveArgs(condition.args, dataModel, basePath)
    return fn(resolvedArgs)
  }

  // Unknown condition type - default to pass
  return true
}

/**
 * Evaluates a CheckRule by resolving its condition as a DynamicBoolean.
 *
 * @param rule - The check rule to evaluate
 * @param context - Evaluation context with data model and scope
 * @returns true if the check passes, false if it fails
 */
export function evaluateCheckRule(
  rule: CheckRule,
  context: EvaluationContext
): boolean {
  return evaluateDynamicBoolean(rule.condition, context)
}

/**
 * Evaluates all checks for a component and returns validation result.
 *
 * @param checks - Array of check rules
 * @param dataModel - The data model for value resolution
 * @param basePath - The current scope base path (for relative paths)
 * @param registry - Optional function registry for FunctionCall evaluation
 * @returns ValidationResult with valid flag and error messages
 */
export function evaluateChecks(
  checks: CheckRule[] | undefined,
  dataModel: DataModel,
  basePath: string | null,
  registry?: FunctionRegistry
): ValidationResult {
  if (!checks || checks.length === 0) {
    return { valid: true, errors: [] }
  }

  const context: EvaluationContext = {
    dataModel,
    basePath,
    registry,
  }

  const errors: string[] = []

  for (const check of checks) {
    const passes = evaluateCheckRule(check, context)
    if (!passes && check.message) {
      errors.push(check.message)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
