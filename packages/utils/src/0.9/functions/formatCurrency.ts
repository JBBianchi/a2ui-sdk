/**
 * formatCurrency - Currency formatting via Intl.NumberFormat.
 */

import type { FunctionImplementation } from './index.js'

export const formatCurrency: FunctionImplementation = {
  name: 'formatCurrency',
  returnType: 'string',
  execute(args: Record<string, unknown>) {
    const value = Number(args.value)
    if (isNaN(value)) return ''

    const currency = typeof args.currency === 'string' ? args.currency : 'USD'
    const locale = typeof args.locale === 'string' ? args.locale : undefined

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(value)
    } catch {
      return String(value)
    }
  },
}
