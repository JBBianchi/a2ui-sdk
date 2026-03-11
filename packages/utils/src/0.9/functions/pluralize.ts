/**
 * pluralize - Pluralization via Intl.PluralRules.
 *
 * Accepts a count and a map of plural forms (zero, one, two, few, many, other).
 * Returns the matching form with optional count substitution.
 */

import type { FunctionImplementation } from './index.js'

export const pluralize: FunctionImplementation = {
  name: 'pluralize',
  returnType: 'string',
  execute(args: Record<string, unknown>) {
    const count = Number(args.count ?? args.value)
    if (isNaN(count)) return ''

    const locale = typeof args.locale === 'string' ? args.locale : undefined

    try {
      const rules = new Intl.PluralRules(locale)
      const category = rules.select(count)

      // Look for the matching plural form in args
      const form = args[category]
      if (typeof form === 'string') {
        // Replace {count} or # with the actual count
        return form.replace(/\{count\}|#/g, String(count))
      }

      // Fallback to 'other' if the specific category is missing
      const other = args.other
      if (typeof other === 'string') {
        return other.replace(/\{count\}|#/g, String(count))
      }

      return String(count)
    } catch {
      return String(count)
    }
  },
}
