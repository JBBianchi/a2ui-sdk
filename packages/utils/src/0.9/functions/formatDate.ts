/**
 * formatDate - Date formatting with TR35 format support via Intl.DateTimeFormat.
 *
 * Per research R4, a thin TR35 tokenizer maps common patterns to
 * Intl.DateTimeFormat options.
 */

import type { FunctionImplementation } from './index.js'

/**
 * Map of TR35 pattern tokens to Intl.DateTimeFormat options.
 */
const TR35_TOKENS: Record<string, Intl.DateTimeFormatOptions> = {
  yyyy: { year: 'numeric' },
  yy: { year: '2-digit' },
  MMMM: { month: 'long' },
  MMM: { month: 'short' },
  MM: { month: '2-digit' },
  M: { month: 'numeric' },
  dd: { day: '2-digit' },
  d: { day: 'numeric' },
  EEEE: { weekday: 'long' },
  EEE: { weekday: 'short' },
  HH: { hour: '2-digit', hour12: false },
  H: { hour: 'numeric', hour12: false },
  hh: { hour: '2-digit', hour12: true },
  h: { hour: 'numeric', hour12: true },
  mm: { minute: '2-digit' },
  m: { minute: 'numeric' },
  ss: { second: '2-digit' },
  s: { second: 'numeric' },
  a: { hour12: true },
}

/**
 * Sorted token keys by length (longest first) so we match greedily.
 */
const SORTED_TOKENS = Object.keys(TR35_TOKENS).sort(
  (a, b) => b.length - a.length
)

/**
 * Parse a TR35 format string into parts: tokens and literal strings.
 */
function parseTR35Pattern(
  format: string
): Array<
  { type: 'token'; value: string } | { type: 'literal'; value: string }
> {
  const parts: Array<
    { type: 'token'; value: string } | { type: 'literal'; value: string }
  > = []
  let i = 0

  while (i < format.length) {
    // Check for quoted literal text (e.g., 'at')
    if (format[i] === "'") {
      let end = format.indexOf("'", i + 1)
      if (end === -1) end = format.length
      parts.push({ type: 'literal', value: format.slice(i + 1, end) })
      i = end + 1
      continue
    }

    // Try to match a TR35 token
    let matched = false
    for (const token of SORTED_TOKENS) {
      if (format.startsWith(token, i)) {
        parts.push({ type: 'token', value: token })
        i += token.length
        matched = true
        break
      }
    }

    if (!matched) {
      // Literal character
      const last = parts[parts.length - 1]
      if (last && last.type === 'literal') {
        last.value += format[i]
      } else {
        parts.push({ type: 'literal', value: format[i] })
      }
      i++
    }
  }

  return parts
}

/**
 * Format a single token using Intl.DateTimeFormat.
 */
function formatToken(date: Date, token: string, locale?: string): string {
  const options = TR35_TOKENS[token]
  if (!options) return token

  try {
    const formatted = new Intl.DateTimeFormat(locale, options).format(date)
    return formatted
  } catch {
    return token
  }
}

export const formatDate: FunctionImplementation = {
  name: 'formatDate',
  returnType: 'string',
  execute(args: Record<string, unknown>) {
    const value = args.value
    const format = typeof args.format === 'string' ? args.format : undefined
    const locale = typeof args.locale === 'string' ? args.locale : undefined

    // Parse the input value to a Date
    let date: Date
    if (value instanceof Date) {
      date = value
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value)
    } else {
      return ''
    }

    if (isNaN(date.getTime())) {
      return ''
    }

    // If no format string is provided, use default locale formatting.
    if (!format) {
      try {
        return new Intl.DateTimeFormat(locale).format(date)
      } catch {
        return date.toLocaleDateString()
      }
    }

    // Parse TR35 format string and format each part.
    const parts = parseTR35Pattern(format)
    return parts
      .map((part) => {
        if (part.type === 'literal') return part.value
        return formatToken(date, part.value, locale)
      })
      .join('')
  },
}
