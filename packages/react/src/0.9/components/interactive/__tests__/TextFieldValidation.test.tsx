/**
 * Tests for TextField validationRegexp feature.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  SurfaceProvider,
  useSurfaceContext,
} from '../../../contexts/SurfaceContext'
import { ActionProvider } from '../../../contexts/ActionContext'
import { ComponentsMapProvider } from '../../../contexts/ComponentsMapContext'
import { ComponentRenderer } from '../../ComponentRenderer'
import { useRef, type ReactNode } from 'react'
import type { ComponentDefinition } from '@a2ui-sdk/types/0.9'
import { standardCatalog } from '../../../standard-catalog'

function TestProvider({ children }: { children: ReactNode }) {
  return (
    <SurfaceProvider>
      <ActionProvider>
        <ComponentsMapProvider components={standardCatalog.components}>
          {children}
        </ComponentsMapProvider>
      </ActionProvider>
    </SurfaceProvider>
  )
}

function SurfaceSetup({
  surfaceId,
  components,
  dataModel = {},
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
    ctx.updateDataModel(surfaceId, '/', dataModel)
  }

  return <>{children}</>
}

describe('TextFieldComponent validationRegexp', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show error when input does not match validationRegexp', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'tf-1',
        component: 'TextField',
        label: 'Email',
        value: { path: '/email' },
        validationRegexp: '^[^@]+@[^@]+\\.[^@]+$',
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ email: 'not-an-email' }}
        >
          <ComponentRenderer surfaceId="main" componentId="tf-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    // The initial value 'not-an-email' does not match the email regex
    expect(screen.getByText(/does not match pattern/)).toBeInTheDocument()
    const input = screen.getByLabelText('Email') as HTMLInputElement
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('should not show error when input matches validationRegexp', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'tf-1',
        component: 'TextField',
        label: 'Email',
        value: { path: '/email' },
        validationRegexp: '^[^@]+@[^@]+\\.[^@]+$',
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ email: 'user@example.com' }}
        >
          <ComponentRenderer surfaceId="main" componentId="tf-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    // Valid email - no error message
    expect(screen.queryByText(/does not match pattern/)).not.toBeInTheDocument()
    const input = screen.getByLabelText('Email') as HTMLInputElement
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('should silently skip validation when regex is invalid', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'tf-1',
        component: 'TextField',
        label: 'Name',
        value: { path: '/name' },
        validationRegexp: '[invalid(regex',
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ name: 'anything' }}
        >
          <ComponentRenderer surfaceId="main" componentId="tf-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    // Invalid regex is silently skipped - no error shown
    expect(screen.queryByText(/does not match pattern/)).not.toBeInTheDocument()
    const input = screen.getByLabelText('Name') as HTMLInputElement
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('should not validate when value is empty', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'tf-1',
        component: 'TextField',
        label: 'Code',
        value: { path: '/code' },
        validationRegexp: '^[A-Z]{3}$',
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ code: '' }}
        >
          <ComponentRenderer surfaceId="main" componentId="tf-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    // Empty value should not trigger validation error
    expect(screen.queryByText(/does not match pattern/)).not.toBeInTheDocument()
  })

  it('should update validation state when input changes', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'tf-1',
        component: 'TextField',
        label: 'Zip',
        value: { path: '/zip' },
        validationRegexp: '^\\d{5}$',
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ zip: '' }}
        >
          <ComponentRenderer surfaceId="main" componentId="tf-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    const input = screen.getByLabelText('Zip') as HTMLInputElement

    // Enter invalid value
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(screen.getByText(/does not match pattern/)).toBeInTheDocument()

    // Enter valid value
    fireEvent.change(input, { target: { value: '12345' } })
    expect(screen.queryByText(/does not match pattern/)).not.toBeInTheDocument()
  })
})
