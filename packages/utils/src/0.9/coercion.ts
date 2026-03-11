/**
 * Type coercion utilities per A2UI v0.9 spec renderer guide.
 * Implements the mandatory coercion table for cross-platform parity.
 */

/**
 * Coerce a value to boolean per spec coercion table.
 * - string "true" (case-insensitive) → true
 * - string "false" (case-insensitive) → false
 * - non-zero number → true, 0 → false
 * - null/undefined → false
 * - any other → false
 */
export function coerceToBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'true') return true
    if (lower === 'false') return false
    return false
  }
  if (typeof value === 'number') return value !== 0
  return false
}

/**
 * Coerce a value to string per spec coercion table.
 * - null/undefined → ""
 * - any other → String(value)
 */
export function coerceToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/**
 * Coerce a value to number per spec coercion table.
 * - null/undefined → 0
 * - boolean true → 1, false → 0
 * - numeric string → parseFloat result
 * - non-numeric string → 0
 * - any other → 0
 */
export function coerceToNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (value === null || value === undefined) return 0
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}
