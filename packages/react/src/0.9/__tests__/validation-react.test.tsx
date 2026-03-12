/**
 * Tests for reactive validation in React components.
 *
 * Covers CheckRule condition evaluation, reactive updates when data model
 * changes, and button disabling when validation fails.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SurfaceProvider, useSurfaceContext } from '../contexts/SurfaceContext'
import {
  ComponentsMapProvider,
  type A2UIComponent,
} from '../contexts/ComponentsMapContext'
import { A2UIRenderer } from '../A2UIRenderer'
import { useValidation } from '../hooks/useValidation'
import { useRef, type ReactNode } from 'react'
import type { CheckRule, ComponentDefinition } from '@a2ui-sdk/types/0.9'

/**
 * Setup component that creates a surface with data and components.
 */
function SurfaceSetup({
  surfaceId,
  dataModel,
  components,
  children,
}: {
  surfaceId: string
  dataModel: Record<string, unknown>
  components?: ComponentDefinition[]
  children: ReactNode
}) {
  const ctx = useSurfaceContext()
  const setupDone = useRef<null | true>(null)

  if (setupDone.current === null) {
    setupDone.current = true
    ctx.createSurface(surfaceId, 'catalog-1')
    ctx.updateDataModel(surfaceId, '/', dataModel)
    if (components) {
      ctx.updateComponents(surfaceId, components)
    }
  }

  return <>{children}</>
}

describe('Reactive validation React tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CheckRule with boolean condition', () => {
    it('should show no error when condition is true (path resolves to truthy)', () => {
      const checks: CheckRule[] = [
        {
          condition: { path: '/isValid' },
          message: 'Validation failed',
        },
      ]

      function TestComponent() {
        const result = useValidation('main', checks)
        return (
          <div>
            <span data-testid="valid">{result.valid ? 'yes' : 'no'}</span>
            <span data-testid="errors">{result.errors.join(', ')}</span>
          </div>
        )
      }

      render(
        <SurfaceProvider>
          <SurfaceSetup surfaceId="main" dataModel={{ isValid: true }}>
            <TestComponent />
          </SurfaceSetup>
        </SurfaceProvider>
      )

      expect(screen.getByTestId('valid')).toHaveTextContent('yes')
      expect(screen.getByTestId('errors')).toHaveTextContent('')
    })

    it('should show message when condition is false (path resolves to falsy)', () => {
      const checks: CheckRule[] = [
        {
          condition: { path: '/isValid' },
          message: 'Validation failed',
        },
      ]

      function TestComponent() {
        const result = useValidation('main', checks)
        return (
          <div>
            <span data-testid="valid">{result.valid ? 'yes' : 'no'}</span>
            <span data-testid="errors">{result.errors.join(', ')}</span>
          </div>
        )
      }

      render(
        <SurfaceProvider>
          <SurfaceSetup surfaceId="main" dataModel={{ isValid: false }}>
            <TestComponent />
          </SurfaceSetup>
        </SurfaceProvider>
      )

      expect(screen.getByTestId('valid')).toHaveTextContent('no')
      expect(screen.getByTestId('errors')).toHaveTextContent(
        'Validation failed'
      )
    })
  })

  describe('reactive validation on data model changes', () => {
    it('should update from invalid to valid when data model changes', () => {
      const checks: CheckRule[] = [
        {
          condition: {
            call: 'required',
            args: { value: { path: '/email' } },
          },
          message: 'Email is required',
        },
      ]

      function TestComponent() {
        const ctx = useSurfaceContext()
        const result = useValidation('main', checks)

        return (
          <div>
            <span data-testid="valid">{result.valid ? 'yes' : 'no'}</span>
            <span data-testid="errors">{result.errors.join(', ')}</span>
            <button
              data-testid="fill-email"
              onClick={() =>
                ctx.updateDataModel('main', '/email', 'user@example.com')
              }
            >
              Fill email
            </button>
          </div>
        )
      }

      render(
        <SurfaceProvider>
          <SurfaceSetup surfaceId="main" dataModel={{ email: '' }}>
            <TestComponent />
          </SurfaceSetup>
        </SurfaceProvider>
      )

      // Initially invalid
      expect(screen.getByTestId('valid')).toHaveTextContent('no')
      expect(screen.getByTestId('errors')).toHaveTextContent(
        'Email is required'
      )

      // Update data model
      act(() => {
        screen.getByTestId('fill-email').click()
      })

      // Now valid
      expect(screen.getByTestId('valid')).toHaveTextContent('yes')
      expect(screen.getByTestId('errors')).toHaveTextContent('')
    })

    it('should update from valid to invalid when data is cleared', () => {
      const checks: CheckRule[] = [
        {
          condition: {
            call: 'required',
            args: { value: { path: '/name' } },
          },
          message: 'Name is required',
        },
      ]

      function TestComponent() {
        const ctx = useSurfaceContext()
        const result = useValidation('main', checks)

        return (
          <div>
            <span data-testid="valid">{result.valid ? 'yes' : 'no'}</span>
            <button
              data-testid="clear-name"
              onClick={() => ctx.updateDataModel('main', '/name', '')}
            >
              Clear name
            </button>
          </div>
        )
      }

      render(
        <SurfaceProvider>
          <SurfaceSetup surfaceId="main" dataModel={{ name: 'Alice' }}>
            <TestComponent />
          </SurfaceSetup>
        </SurfaceProvider>
      )

      // Initially valid
      expect(screen.getByTestId('valid')).toHaveTextContent('yes')

      // Clear the name
      act(() => {
        screen.getByTestId('clear-name').click()
      })

      // Now invalid
      expect(screen.getByTestId('valid')).toHaveTextContent('no')
    })
  })

  describe('button disabled when validation fails', () => {
    it('should disable button when checks fail', () => {
      // Use a custom Button that uses useValidation like the real one
      const TestButton: A2UIComponent = ({
        surfaceId,
        checks,
      }: {
        surfaceId: string
        checks?: CheckRule[]
        [key: string]: unknown
      }) => {
        const { valid } = useValidation(surfaceId, checks)
        return (
          <button data-testid="btn" disabled={!valid}>
            Submit
          </button>
        )
      }

      const testComponents: Record<string, A2UIComponent> = {
        Button: TestButton,
      }

      render(
        <SurfaceProvider>
          <SurfaceSetup
            surfaceId="main"
            dataModel={{ name: '' }}
            components={[
              {
                id: 'root',
                component: 'Button',
                checks: [
                  {
                    condition: {
                      call: 'required',
                      args: { value: { path: '/name' } },
                    },
                    message: 'Name is required',
                  },
                ],
              },
            ]}
          >
            <ComponentsMapProvider components={testComponents}>
              <A2UIRenderer surfaceId="main" />
            </ComponentsMapProvider>
          </SurfaceSetup>
        </SurfaceProvider>
      )

      expect(screen.getByTestId('btn')).toBeDisabled()
    })

    it('should enable button when checks pass', () => {
      const TestButton: A2UIComponent = ({
        surfaceId,
        checks,
      }: {
        surfaceId: string
        checks?: CheckRule[]
        [key: string]: unknown
      }) => {
        const { valid } = useValidation(surfaceId, checks)
        return (
          <button data-testid="btn" disabled={!valid}>
            Submit
          </button>
        )
      }

      const testComponents: Record<string, A2UIComponent> = {
        Button: TestButton,
      }

      render(
        <SurfaceProvider>
          <SurfaceSetup
            surfaceId="main"
            dataModel={{ name: 'Alice' }}
            components={[
              {
                id: 'root',
                component: 'Button',
                checks: [
                  {
                    condition: {
                      call: 'required',
                      args: { value: { path: '/name' } },
                    },
                    message: 'Name is required',
                  },
                ],
              },
            ]}
          >
            <ComponentsMapProvider components={testComponents}>
              <A2UIRenderer surfaceId="main" />
            </ComponentsMapProvider>
          </SurfaceSetup>
        </SurfaceProvider>
      )

      expect(screen.getByTestId('btn')).not.toBeDisabled()
    })
  })
})
