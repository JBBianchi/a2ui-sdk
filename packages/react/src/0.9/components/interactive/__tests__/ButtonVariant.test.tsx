/**
 * Tests for Button variant rendering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

function TestProvider({
  onAction,
  children,
}: {
  onAction?: (payload: unknown) => void
  children: ReactNode
}) {
  return (
    <SurfaceProvider>
      <ActionProvider onAction={onAction}>
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

describe('ButtonComponent variants', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render with variant="default" using outline style', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'btn-1',
        component: 'Button',
        child: 'btn-text',
        variant: 'default',
        action: { event: { name: 'click' } },
      },
      { id: 'btn-text', component: 'Text', text: 'Default Button' },
    ]

    render(
      <TestProvider>
        <SurfaceSetup surfaceId="main" components={components}>
          <ComponentRenderer surfaceId="main" componentId="btn-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    const button = screen.getByRole('button', { name: 'Default Button' })
    expect(button).toBeInTheDocument()
    // variant='default' maps to shadcn 'outline'
    expect(button).toHaveAttribute('data-variant', 'outline')
  })

  it('should render with variant="primary" using default (primary) style', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'btn-1',
        component: 'Button',
        child: 'btn-text',
        variant: 'primary',
        action: { event: { name: 'click' } },
      },
      { id: 'btn-text', component: 'Text', text: 'Primary Button' },
    ]

    render(
      <TestProvider>
        <SurfaceSetup surfaceId="main" components={components}>
          <ComponentRenderer surfaceId="main" componentId="btn-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    const button = screen.getByRole('button', { name: 'Primary Button' })
    expect(button).toBeInTheDocument()
    // variant='primary' maps to shadcn 'default' (primary styling)
    expect(button).toHaveAttribute('data-variant', 'default')
  })

  it('should render with variant="borderless" using ghost style', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'btn-1',
        component: 'Button',
        child: 'btn-text',
        variant: 'borderless',
        action: { event: { name: 'click' } },
      },
      { id: 'btn-text', component: 'Text', text: 'Borderless Button' },
    ]

    render(
      <TestProvider>
        <SurfaceSetup surfaceId="main" components={components}>
          <ComponentRenderer surfaceId="main" componentId="btn-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    const button = screen.getByRole('button', { name: 'Borderless Button' })
    expect(button).toBeInTheDocument()
    // variant='borderless' maps to shadcn 'ghost'
    expect(button).toHaveAttribute('data-variant', 'ghost')
  })

  it('should default to outline style when variant is not specified', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'btn-1',
        component: 'Button',
        child: 'btn-text',
        action: { event: { name: 'click' } },
      },
      { id: 'btn-text', component: 'Text', text: 'No Variant Button' },
    ]

    render(
      <TestProvider>
        <SurfaceSetup surfaceId="main" components={components}>
          <ComponentRenderer surfaceId="main" componentId="btn-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    const button = screen.getByRole('button', { name: 'No Variant Button' })
    expect(button).toBeInTheDocument()
    // Missing variant defaults to 'default' which maps to 'outline'
    expect(button).toHaveAttribute('data-variant', 'outline')
  })

  it('each variant should produce distinct CSS classes', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'btn-default',
        component: 'Button',
        child: 'txt-default',
        variant: 'default',
        action: { event: { name: 'click' } },
      },
      { id: 'txt-default', component: 'Text', text: 'Default' },
      {
        id: 'btn-primary',
        component: 'Button',
        child: 'txt-primary',
        variant: 'primary',
        action: { event: { name: 'click' } },
      },
      { id: 'txt-primary', component: 'Text', text: 'Primary' },
      {
        id: 'btn-borderless',
        component: 'Button',
        child: 'txt-borderless',
        variant: 'borderless',
        action: { event: { name: 'click' } },
      },
      { id: 'txt-borderless', component: 'Text', text: 'Borderless' },
    ]

    render(
      <TestProvider>
        <SurfaceSetup surfaceId="main" components={components}>
          <ComponentRenderer surfaceId="main" componentId="btn-default" />
          <ComponentRenderer surfaceId="main" componentId="btn-primary" />
          <ComponentRenderer surfaceId="main" componentId="btn-borderless" />
        </SurfaceSetup>
      </TestProvider>
    )

    const defaultBtn = screen.getByRole('button', { name: 'Default' })
    const primaryBtn = screen.getByRole('button', { name: 'Primary' })
    const borderlessBtn = screen.getByRole('button', { name: 'Borderless' })

    // All three variants should map to different shadcn variants
    expect(defaultBtn.getAttribute('data-variant')).toBe('outline')
    expect(primaryBtn.getAttribute('data-variant')).toBe('default')
    expect(borderlessBtn.getAttribute('data-variant')).toBe('ghost')

    // They should all have different class names
    const defaultClasses = defaultBtn.className
    const primaryClasses = primaryBtn.className
    const borderlessClasses = borderlessBtn.className

    expect(defaultClasses).not.toBe(primaryClasses)
    expect(defaultClasses).not.toBe(borderlessClasses)
    expect(primaryClasses).not.toBe(borderlessClasses)
  })
})
