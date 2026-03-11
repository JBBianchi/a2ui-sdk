/**
 * Tests for ThemeContext - theme CSS custom properties and useTheme hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SurfaceProvider, useSurfaceContext } from '../contexts/SurfaceContext'
import {
  ComponentsMapProvider,
  type A2UIComponent,
} from '../contexts/ComponentsMapContext'
import { A2UIRenderer } from '../A2UIRenderer'
import { useTheme } from '../contexts/ThemeContext'
import { useRef, type ReactNode } from 'react'
import type { ComponentDefinition, ThemeConfig } from '@a2ui-sdk/types/0.9'

/**
 * Setup component that creates a surface with optional theme.
 */
function SurfaceSetup({
  surfaceId,
  components,
  theme,
  children,
}: {
  surfaceId: string
  components: ComponentDefinition[]
  theme?: ThemeConfig
  children: ReactNode
}) {
  const ctx = useSurfaceContext()
  const setupDone = useRef<null | true>(null)

  if (setupDone.current === null) {
    setupDone.current = true
    ctx.createSurface(surfaceId, 'catalog-1', 'root', theme)
    ctx.updateComponents(surfaceId, components)
  }

  return <>{children}</>
}

describe('Theme tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CSS custom property from theme.primaryColor', () => {
    it('should set --a2ui-primary-color CSS custom property when primaryColor is provided', () => {
      const TestText: A2UIComponent = ({
        componentId,
      }: {
        componentId: string
        [key: string]: unknown
      }) => <span data-testid={`text-${componentId}`}>Hello</span>

      const testComponents: Record<string, A2UIComponent> = {
        Text: TestText,
      }

      const { container } = render(
        <SurfaceProvider>
          <SurfaceSetup
            surfaceId="main"
            theme={{ primaryColor: '#ff5500' }}
            components={[{ id: 'root', component: 'Text', text: 'Hello' }]}
          >
            <ComponentsMapProvider components={testComponents}>
              <A2UIRenderer surfaceId="main" />
            </ComponentsMapProvider>
          </SurfaceSetup>
        </SurfaceProvider>
      )

      // ThemeProvider wraps children in a div with style
      const themeDiv = container.querySelector(
        '[style*="--a2ui-primary-color"]'
      )
      expect(themeDiv).not.toBeNull()
      expect(themeDiv?.getAttribute('style')).toContain('#ff5500')
    })

    it('should not set CSS custom property when no theme is provided', () => {
      const TestText: A2UIComponent = () => (
        <span data-testid="text">No theme</span>
      )

      const testComponents: Record<string, A2UIComponent> = {
        Text: TestText,
      }

      const { container } = render(
        <SurfaceProvider>
          <SurfaceSetup
            surfaceId="main"
            components={[{ id: 'root', component: 'Text', text: 'No theme' }]}
          >
            <ComponentsMapProvider components={testComponents}>
              <A2UIRenderer surfaceId="main" />
            </ComponentsMapProvider>
          </SurfaceSetup>
        </SurfaceProvider>
      )

      const themeDiv = container.querySelector(
        '[style*="--a2ui-primary-color"]'
      )
      expect(themeDiv).toBeNull()
    })

    it('should not set CSS custom property when theme has no primaryColor', () => {
      const TestText: A2UIComponent = () => (
        <span data-testid="text">Agent</span>
      )

      const testComponents: Record<string, A2UIComponent> = {
        Text: TestText,
      }

      const { container } = render(
        <SurfaceProvider>
          <SurfaceSetup
            surfaceId="main"
            theme={{ agentDisplayName: 'Agent' }}
            components={[{ id: 'root', component: 'Text', text: 'Agent' }]}
          >
            <ComponentsMapProvider components={testComponents}>
              <A2UIRenderer surfaceId="main" />
            </ComponentsMapProvider>
          </SurfaceSetup>
        </SurfaceProvider>
      )

      const themeDiv = container.querySelector(
        '[style*="--a2ui-primary-color"]'
      )
      expect(themeDiv).toBeNull()
    })
  })

  describe('useTheme hook', () => {
    it('should return theme config inside A2UIRenderer', () => {
      const ThemeReader: A2UIComponent = () => {
        const theme = useTheme()
        return (
          <span data-testid="theme-reader">
            {theme?.primaryColor ?? 'none'}|{theme?.agentDisplayName ?? 'none'}
          </span>
        )
      }

      const testComponents: Record<string, A2UIComponent> = {
        ThemeReader: ThemeReader,
      }

      render(
        <SurfaceProvider>
          <SurfaceSetup
            surfaceId="main"
            theme={{
              primaryColor: '#00ff00',
              agentDisplayName: 'TestBot',
            }}
            components={[{ id: 'root', component: 'ThemeReader' }]}
          >
            <ComponentsMapProvider components={testComponents}>
              <A2UIRenderer surfaceId="main" />
            </ComponentsMapProvider>
          </SurfaceSetup>
        </SurfaceProvider>
      )

      expect(screen.getByTestId('theme-reader')).toHaveTextContent(
        '#00ff00|TestBot'
      )
    })

    it('should return undefined when no theme is set', () => {
      const ThemeReader: A2UIComponent = () => {
        const theme = useTheme()
        return (
          <span data-testid="theme-reader">
            {theme === undefined ? 'undefined' : 'defined'}
          </span>
        )
      }

      const testComponents: Record<string, A2UIComponent> = {
        ThemeReader: ThemeReader,
      }

      render(
        <SurfaceProvider>
          <SurfaceSetup
            surfaceId="main"
            components={[{ id: 'root', component: 'ThemeReader' }]}
          >
            <ComponentsMapProvider components={testComponents}>
              <A2UIRenderer surfaceId="main" />
            </ComponentsMapProvider>
          </SurfaceSetup>
        </SurfaceProvider>
      )

      expect(screen.getByTestId('theme-reader')).toHaveTextContent('undefined')
    })
  })
})
