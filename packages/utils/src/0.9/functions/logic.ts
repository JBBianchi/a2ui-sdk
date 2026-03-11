/**
 * Logic functions: and, or, not - registered as callable functions.
 *
 * These operate on boolean values and support nesting via FunctionCall args.
 */

import type { FunctionImplementation } from './index.js'

export const and: FunctionImplementation = {
  name: 'and',
  returnType: 'boolean',
  execute(args: Record<string, unknown>) {
    // All values in args must be truthy
    return Object.values(args).every((v) => Boolean(v))
  },
}

export const or: FunctionImplementation = {
  name: 'or',
  returnType: 'boolean',
  execute(args: Record<string, unknown>) {
    // At least one value in args must be truthy
    return Object.values(args).some((v) => Boolean(v))
  },
}

export const not: FunctionImplementation = {
  name: 'not',
  returnType: 'boolean',
  execute(args: Record<string, unknown>) {
    // Negate the 'value' arg
    return !args.value
  },
}
