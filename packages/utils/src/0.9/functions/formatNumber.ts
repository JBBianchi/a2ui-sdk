/**
 * formatNumber - Number formatting via Intl.NumberFormat.
 */

import type { FunctionImplementation } from './index.js'

export const formatNumber: FunctionImplementation = {
  name: 'formatNumber',
  returnType: 'string',
  execute(args: Record<string, unknown>) {
    const value = Number(args.value)
    if (isNaN(value)) return ''

    const locale = typeof args.locale === 'string' ? args.locale : undefined

    const options: Intl.NumberFormatOptions = {}
    if (args.minimumFractionDigits !== undefined) {
      options.minimumFractionDigits = Number(args.minimumFractionDigits)
    }
    if (args.maximumFractionDigits !== undefined) {
      options.maximumFractionDigits = Number(args.maximumFractionDigits)
    }
    if (typeof args.style === 'string') {
      options.style = args.style as Intl.NumberFormatOptions['style']
    }
    if (typeof args.notation === 'string') {
      options.notation = args.notation as Intl.NumberFormatOptions['notation']
    }

    try {
      return new Intl.NumberFormat(locale, options).format(value)
    } catch {
      return String(value)
    }
  },
}
