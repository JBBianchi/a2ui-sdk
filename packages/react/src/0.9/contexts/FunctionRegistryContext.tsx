/**
 * FunctionRegistryContext - Provides the function registry to descendant components.
 *
 * The function registry is used for evaluating function calls in data bindings
 * and validation checks. It is set up by A2UIRenderer and consumed by hooks
 * like useDataBinding and useValidation.
 */

import { createContext, useContext, type ReactNode } from 'react'
import type { FunctionRegistry } from '@a2ui-sdk/utils/0.9'

/**
 * Context for the function registry.
 * Defaults to null when no registry is provided.
 */
export const FunctionRegistryContext = createContext<FunctionRegistry | null>(
  null
)

/**
 * Props for FunctionRegistryProvider.
 */
export interface FunctionRegistryProviderProps {
  /** The function registry instance */
  registry?: FunctionRegistry
  children: ReactNode
}

/**
 * Provider component for the function registry.
 *
 * Wraps children with a FunctionRegistryContext that provides access
 * to the registry for data binding resolution and validation.
 */
export function FunctionRegistryProvider({
  registry,
  children,
}: FunctionRegistryProviderProps) {
  return (
    <FunctionRegistryContext.Provider value={registry ?? null}>
      {children}
    </FunctionRegistryContext.Provider>
  )
}

/**
 * Hook to access the function registry from context.
 *
 * Returns the registry if available, or null if no registry was provided.
 * Unlike other context hooks, this does NOT throw if used outside a provider,
 * since function registry is optional.
 *
 * @returns The function registry, or null if not provided
 */
export function useFunctionRegistry(): FunctionRegistry | null {
  return useContext(FunctionRegistryContext)
}
