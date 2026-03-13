/**
 * Tests for delayed validation visibility across interactive inputs.
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
import type { CheckRule, ComponentDefinition } from '@a2ui-sdk/types/0.9'
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

describe('validation visibility', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps TextField checks quiet until first edit, then reacts to validity changes', () => {
    const checks: CheckRule[] = [
      {
        condition: {
          call: 'length',
          args: { value: { path: '/name' }, min: 5 },
        },
        message: 'Name must be at least 5 characters',
      },
    ]

    const components: ComponentDefinition[] = [
      {
        id: 'name-input',
        component: 'TextField',
        label: 'Name',
        value: { path: '/name' },
        checks,
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ name: 'abc' }}
        >
          <ComponentRenderer surfaceId="main" componentId="name-input" />
        </SurfaceSetup>
      </TestProvider>
    )

    const input = screen.getByLabelText('Name') as HTMLInputElement

    expect(
      screen.queryByText('Name must be at least 5 characters')
    ).not.toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'false')

    fireEvent.change(input, { target: { value: 'abcd' } })

    expect(
      screen.getByText('Name must be at least 5 characters')
    ).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')

    fireEvent.change(input, { target: { value: 'abcde' } })

    expect(
      screen.queryByText('Name must be at least 5 characters')
    ).not.toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('shows CheckBox validation after the first invalid toggle', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'terms',
        component: 'CheckBox',
        label: 'Accept terms',
        value: { path: '/accepted' },
        checks: [
          {
            condition: { path: '/accepted' },
            message: 'Accept terms to continue',
          },
        ],
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ accepted: true }}
        >
          <ComponentRenderer surfaceId="main" componentId="terms" />
        </SurfaceSetup>
      </TestProvider>
    )

    const checkbox = screen.getByRole('checkbox')

    expect(
      screen.queryByText('Accept terms to continue')
    ).not.toBeInTheDocument()
    expect(checkbox).toHaveAttribute('aria-invalid', 'false')

    fireEvent.click(checkbox)

    expect(screen.getByText('Accept terms to continue')).toBeInTheDocument()
    expect(checkbox).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows ChoicePicker validation after the first invalid selection change', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'fruits',
        component: 'ChoicePicker',
        label: 'Pick fruits',
        variant: 'multipleSelection',
        options: [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ],
        value: { path: '/fruits' },
        checks: [
          {
            condition: {
              call: 'required',
              args: { value: { path: '/fruits' } },
            },
            message: 'Pick at least one fruit',
          },
        ],
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ fruits: ['apple'] }}
        >
          <ComponentRenderer surfaceId="main" componentId="fruits" />
        </SurfaceSetup>
      </TestProvider>
    )

    expect(
      screen.queryByText('Pick at least one fruit')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('checkbox')[0])

    expect(screen.getByText('Pick at least one fruit')).toBeInTheDocument()
  })

  it('shows DateTimeInput validation after the first invalid edit', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'date',
        component: 'DateTimeInput',
        label: 'Start date',
        enableDate: true,
        value: { path: '/startDate' },
        checks: [
          {
            condition: {
              call: 'required',
              args: { value: { path: '/startDate' } },
            },
            message: 'Start date is required',
          },
        ],
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ startDate: '2024-01-01' }}
        >
          <ComponentRenderer surfaceId="main" componentId="date" />
        </SurfaceSetup>
      </TestProvider>
    )

    const input = screen.getByLabelText('Start date') as HTMLInputElement

    expect(screen.queryByText('Start date is required')).not.toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'false')

    fireEvent.change(input, { target: { value: '' } })

    expect(screen.getByText('Start date is required')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows Slider validation after the first invalid value change', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'amount',
        component: 'Slider',
        label: 'Amount',
        min: 0,
        max: 10,
        value: { path: '/amount' },
        checks: [
          {
            condition: {
              call: 'numeric',
              args: {
                value: { path: '/amount' },
                min: 5,
                max: 10,
              },
            },
            message: 'Amount must be between 5 and 10',
          },
        ],
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ amount: 5 }}
        >
          <ComponentRenderer surfaceId="main" componentId="amount" />
        </SurfaceSetup>
      </TestProvider>
    )

    const sliderThumb = screen.getByRole('slider')
    const slider = document.querySelector('[data-slot="slider"]')

    expect(
      screen.queryByText('Amount must be between 5 and 10')
    ).not.toBeInTheDocument()
    expect(slider).not.toBeNull()
    expect(slider).toHaveAttribute('aria-invalid', 'false')

    fireEvent.keyDown(sliderThumb, { key: 'ArrowLeft' })

    expect(
      screen.getByText('Amount must be between 5 and 10')
    ).toBeInTheDocument()
    expect(slider).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps button disabling immediate even when a sibling input has not been interacted with', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'name-input',
        component: 'TextField',
        label: 'Name',
        value: { path: '/name' },
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
      {
        id: 'submit-text',
        component: 'Text',
        text: 'Submit',
      },
      {
        id: 'submit',
        component: 'Button',
        child: 'submit-text',
        checks: [
          {
            condition: {
              call: 'required',
              args: { value: { path: '/name' } },
            },
            message: 'Name is required',
          },
        ],
        action: {
          event: {
            name: 'submit',
            context: {},
          },
        },
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ name: '' }}
        >
          <ComponentRenderer surfaceId="main" componentId="name-input" />
          <ComponentRenderer surfaceId="main" componentId="submit" />
        </SurfaceSetup>
      </TestProvider>
    )

    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  })
})
