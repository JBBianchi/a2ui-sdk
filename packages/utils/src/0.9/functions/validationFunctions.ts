/**
 * Wraps existing validation functions as FunctionImplementation objects
 * so they can be registered in the FunctionRegistry.
 */

import type { FunctionImplementation } from './index.js'
import { validationFunctions } from '../validation.js'

function wrapValidationFn(name: string): FunctionImplementation {
  return {
    name,
    returnType: 'boolean',
    execute(args: Record<string, unknown>) {
      const fn = validationFunctions[name]
      if (!fn) return false
      return fn(args)
    },
  }
}

export const requiredFn = wrapValidationFn('required')
export const emailFn = wrapValidationFn('email')
export const regexFn = wrapValidationFn('regex')
export const lengthFn = wrapValidationFn('length')
export const numericFn = wrapValidationFn('numeric')
