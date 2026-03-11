/**
 * openUrl - Opens a URL using the browser's native handler.
 *
 * Per spec, no scheme restrictions are applied.
 */

import type { FunctionImplementation } from './index.js'

export const openUrl: FunctionImplementation = {
  name: 'openUrl',
  returnType: 'void',
  execute(args: Record<string, unknown>) {
    const url = args.url
    if (typeof url !== 'string' || !url) {
      console.warn('[A2UI] openUrl: missing or invalid "url" argument')
      return
    }
    window.open(url, '_blank')
  },
}
