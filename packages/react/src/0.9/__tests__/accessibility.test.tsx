/**
 * Tests for accessibility attributes rendered by ComponentRenderer.
 *
 * ComponentRenderer extracts `accessibility` from component definitions
 * and renders aria-label / aria-description on the component wrapper.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SurfaceProvider, useSurfaceContext } from '../contexts/SurfaceContext'
import { ComponentsMapProvider } from '../contexts/ComponentsMapContext'
import { ComponentRenderer } from '../components/ComponentRenderer'
import { useRef, type ReactNode } from 'react'
import type { ComponentDefinition } from '@a2ui-sdk/types/0.9'

/**
 * Setup component that creates a surface with data and components.
 */
function SurfaceSetup({
  surfaceId,
  components,
  dataModel,
  children,
}: {
  surfaceId: string
  components: ComponentDefinition[]
  dataModel?: Record<string, unknown>
  children: ReactNode
}) {
  const ctx = useSurfaceContext()
  const setupDone = useRef<null | true>(null)

  if (setupDone.current === null) {
    setupDone.current = true
    ctx.createSurface(surfaceId, 'catalog-1')
    ctx.updateComponents(surfaceId, components)
    if (dataModel) {
      ctx.updateDataModel(surfaceId, '/', dataModel)
    }
  }

  return <>{children}</>
}

/**
 * Test component that renders a div with all spread props
 * including aria attributes.
 */
function TestText(props: Record<string, unknown>) {
  const { text, componentId, ...rest } = props
  return (
    <span data-testid={`text-${componentId}`} {...rest}>
      {text as string}
    </span>
  )
}

describe('Accessibility tests', () => {
  const testComponents = { Text: TestText }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('aria-label', () => {
    it('should render aria-label when accessibility.label is a literal string', () => {
      render(
        <SurfaceProvider>
          <ComponentsMapProvider components={testComponents}>
            <SurfaceSetup
              surfaceId="main"
              components={[
                {
                  id: 'root',
                  component: 'Text',
                  text: 'Hello',
                  accessibility: { label: 'Greeting text' },
                },
              ]}
            >
              <ComponentRenderer surfaceId="main" componentId="root" />
            </SurfaceSetup>
          </ComponentsMapProvider>
        </SurfaceProvider>
      )

      const el = screen.getByTestId('text-root')
      expect(el).toHaveAttribute('aria-label', 'Greeting text')
    })
  })

  describe('aria-description', () => {
    it('should render aria-description when accessibility.description is a literal string', () => {
      render(
        <SurfaceProvider>
          <ComponentsMapProvider components={testComponents}>
            <SurfaceSetup
              surfaceId="main"
              components={[
                {
                  id: 'root',
                  component: 'Text',
                  text: 'Hello',
                  accessibility: {
                    description: 'This is a greeting message',
                  },
                },
              ]}
            >
              <ComponentRenderer surfaceId="main" componentId="root" />
            </SurfaceSetup>
          </ComponentsMapProvider>
        </SurfaceProvider>
      )

      const el = screen.getByTestId('text-root')
      expect(el).toHaveAttribute(
        'aria-description',
        'This is a greeting message'
      )
    })
  })

  describe('path bindings for accessibility', () => {
    it('should resolve path bindings for label', () => {
      render(
        <SurfaceProvider>
          <ComponentsMapProvider components={testComponents}>
            <SurfaceSetup
              surfaceId="main"
              dataModel={{ labelText: 'Dynamic label' }}
              components={[
                {
                  id: 'root',
                  component: 'Text',
                  text: 'Hello',
                  accessibility: { label: { path: '/labelText' } },
                },
              ]}
            >
              <ComponentRenderer surfaceId="main" componentId="root" />
            </SurfaceSetup>
          </ComponentsMapProvider>
        </SurfaceProvider>
      )

      const el = screen.getByTestId('text-root')
      expect(el).toHaveAttribute('aria-label', 'Dynamic label')
    })

    it('should resolve path bindings for description', () => {
      render(
        <SurfaceProvider>
          <ComponentsMapProvider components={testComponents}>
            <SurfaceSetup
              surfaceId="main"
              dataModel={{ descText: 'Dynamic description' }}
              components={[
                {
                  id: 'root',
                  component: 'Text',
                  text: 'Hello',
                  accessibility: { description: { path: '/descText' } },
                },
              ]}
            >
              <ComponentRenderer surfaceId="main" componentId="root" />
            </SurfaceSetup>
          </ComponentsMapProvider>
        </SurfaceProvider>
      )

      const el = screen.getByTestId('text-root')
      expect(el).toHaveAttribute('aria-description', 'Dynamic description')
    })
  })

  describe('no accessibility attributes', () => {
    it('should not render ARIA attributes when accessibility is not defined', () => {
      render(
        <SurfaceProvider>
          <ComponentsMapProvider components={testComponents}>
            <SurfaceSetup
              surfaceId="main"
              components={[
                {
                  id: 'root',
                  component: 'Text',
                  text: 'No a11y',
                },
              ]}
            >
              <ComponentRenderer surfaceId="main" componentId="root" />
            </SurfaceSetup>
          </ComponentsMapProvider>
        </SurfaceProvider>
      )

      const el = screen.getByTestId('text-root')
      expect(el).not.toHaveAttribute('aria-label')
      expect(el).not.toHaveAttribute('aria-description')
    })
  })

  describe('both label and description', () => {
    it('should render both aria-label and aria-description', () => {
      render(
        <SurfaceProvider>
          <ComponentsMapProvider components={testComponents}>
            <SurfaceSetup
              surfaceId="main"
              components={[
                {
                  id: 'root',
                  component: 'Text',
                  text: 'Hello',
                  accessibility: {
                    label: 'Label text',
                    description: 'Description text',
                  },
                },
              ]}
            >
              <ComponentRenderer surfaceId="main" componentId="root" />
            </SurfaceSetup>
          </ComponentsMapProvider>
        </SurfaceProvider>
      )

      const el = screen.getByTestId('text-root')
      expect(el).toHaveAttribute('aria-label', 'Label text')
      expect(el).toHaveAttribute('aria-description', 'Description text')
    })
  })
})
