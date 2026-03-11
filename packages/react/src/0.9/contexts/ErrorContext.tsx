/**
 * ErrorContext - Provides error reporting for A2UI 0.9.
 *
 * Components use reportError to send structured errors to the host
 * via the onError callback.
 */

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { ErrorPayload, ErrorHandler } from '@a2ui-sdk/types/0.9'

export interface ErrorContextValue {
  reportError: (error: ErrorPayload) => void
}

const ErrorContext = createContext<ErrorContextValue>({
  reportError: () => {},
})

export interface ErrorProviderProps {
  onError?: ErrorHandler
  children: ReactNode
}

export function ErrorProvider({ onError, children }: ErrorProviderProps) {
  const reportError = useCallback(
    (error: ErrorPayload) => {
      if (onError) {
        onError(error)
      } else {
        console.warn('[A2UI 0.9] Error:', error.code, error.message)
      }
    },
    [onError]
  )

  const value = useMemo(() => ({ reportError }), [reportError])

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
}

/**
 * Hook to report errors to the host.
 */
export function useErrorContext(): ErrorContextValue {
  return useContext(ErrorContext)
}
