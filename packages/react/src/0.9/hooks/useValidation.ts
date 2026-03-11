/**
 * useValidation - Hook for evaluating checks on components.
 *
 * Provides reactive validation based on data model changes.
 */

import { useMemo } from 'react'
import type { CheckRule, ValidationResult } from '@a2ui-sdk/types/0.9'
import { useSurfaceContext } from '../contexts/SurfaceContext'
import { useScope } from '../contexts/ScopeContext'
import { evaluateChecks, type FunctionRegistry } from '@a2ui-sdk/utils/0.9'

/**
 * Hook for evaluating validation checks on a component.
 *
 * @param surfaceId - The surface ID for data model lookup
 * @param checks - Array of check rules to evaluate
 * @param registry - Optional function registry for FunctionCall evaluation
 * @returns ValidationResult with valid flag and error messages
 */
export function useValidation(
  surfaceId: string,
  checks: CheckRule[] | undefined,
  registry?: FunctionRegistry
): ValidationResult {
  const { getDataModel } = useSurfaceContext()
  const { basePath } = useScope()

  return useMemo(() => {
    const dataModel = getDataModel(surfaceId)
    return evaluateChecks(checks, dataModel, basePath, registry)
  }, [getDataModel, surfaceId, checks, basePath, registry])
}
