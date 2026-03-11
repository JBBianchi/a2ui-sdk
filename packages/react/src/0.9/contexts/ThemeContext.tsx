/**
 * ThemeContext - Provides theme configuration from createSurface.
 *
 * Applies primaryColor via CSS custom properties.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { ThemeConfig } from '@a2ui-sdk/types/0.9'

export interface ThemeContextValue {
  theme: ThemeConfig | undefined
}

const ThemeContext = createContext<ThemeContextValue>({ theme: undefined })

export interface ThemeProviderProps {
  theme: ThemeConfig | undefined
  children: ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const value = useMemo(() => ({ theme }), [theme])

  // Apply primaryColor as CSS custom property
  const style = theme?.primaryColor
    ? ({ '--a2ui-primary-color': theme.primaryColor } as React.CSSProperties)
    : undefined

  return (
    <ThemeContext.Provider value={value}>
      <div style={style}>{children}</div>
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access the current theme.
 */
export function useTheme(): ThemeConfig | undefined {
  return useContext(ThemeContext).theme
}
