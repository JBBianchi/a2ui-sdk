/**
 * useValidationVisibility - Delays visible validation affordances until interaction.
 */

import { useCallback, useMemo, useState } from 'react'

const EMPTY_ERRORS: string[] = []

/**
 * Controls when validation UI should be shown for an interactive component.
 *
 * Validation logic still runs immediately; this hook only gates visible
 * affordances like error text, error styling, and aria-invalid.
 */
export function useValidationVisibility(valid: boolean, errors: string[]) {
  const [hasInteracted, setHasInteracted] = useState(false)

  const markInteracted = useCallback(() => {
    setHasInteracted((current) => current || true)
  }, [])

  return useMemo(
    () => ({
      hasInteracted,
      markInteracted,
      visibleValid: !hasInteracted || valid,
      visibleErrors: hasInteracted ? errors : EMPTY_ERRORS,
    }),
    [errors, hasInteracted, markInteracted, valid]
  )
}
