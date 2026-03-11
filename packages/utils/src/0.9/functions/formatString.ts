/**
 * formatString - String interpolation function.
 *
 * Per spec, `${...}` interpolation ONLY happens inside formatString,
 * not in general resolveString.
 */

import type { FunctionImplementation } from './index.js'
import { interpolate } from '../interpolation/index.js'

export const formatString: FunctionImplementation = {
  name: 'formatString',
  returnType: 'string',
  execute(
    args: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    basePath: string | null
  ) {
    const template = args.template ?? args.value
    if (typeof template !== 'string') {
      return ''
    }
    return interpolate(template, dataModel, basePath)
  },
}
