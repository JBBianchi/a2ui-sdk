/**
 * Tests for Image scaleDown fit and Slider min/max defaults.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  SurfaceProvider,
  useSurfaceContext,
} from '../../contexts/SurfaceContext'
import { ActionProvider } from '../../contexts/ActionContext'
import { ComponentsMapProvider } from '../../contexts/ComponentsMapContext'
import { ComponentRenderer } from '../ComponentRenderer'
import { useRef, type ReactNode } from 'react'
import type { ComponentDefinition } from '@a2ui-sdk/types/0.9'
import { standardCatalog } from '../../standard-catalog'

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
    ctx.createSurface(surfaceId, 'catalog-1', 'root')
    ctx.updateComponents(surfaceId, components)
    ctx.updateDataModel(surfaceId, '/', dataModel)
  }

  return <>{children}</>
}

describe('Image component props', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should apply object-scale-down class when fit="scaleDown"', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'img-1',
        component: 'Image',
        url: 'https://example.com/photo.jpg',
        fit: 'scaleDown',
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup surfaceId="main" components={components}>
          <ComponentRenderer surfaceId="main" componentId="img-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    // alt="" gives the img a "presentation" role, so query by tag
    const img = document.querySelector('img')!
    expect(img).toBeInTheDocument()
    // fit='scaleDown' should map to CSS class 'object-scale-down'
    expect(img.className).toContain('object-scale-down')
  })

  it('should apply object-cover class by default', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'img-1',
        component: 'Image',
        url: 'https://example.com/photo.jpg',
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup surfaceId="main" components={components}>
          <ComponentRenderer surfaceId="main" componentId="img-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    const img = document.querySelector('img')!
    expect(img).toBeInTheDocument()
    expect(img.className).toContain('object-cover')
  })

  it('should apply object-contain class for fit="contain"', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'img-1',
        component: 'Image',
        url: 'https://example.com/photo.jpg',
        fit: 'contain',
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup surfaceId="main" components={components}>
          <ComponentRenderer surfaceId="main" componentId="img-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    const img = document.querySelector('img')!
    expect(img).toBeInTheDocument()
    expect(img.className).toContain('object-contain')
  })
})

describe('Slider component props', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should default min to 0 when omitted', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'slider-1',
        component: 'Slider',
        label: 'Volume',
        max: 100,
        value: { path: '/volume' },
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ volume: 50 }}
        >
          <ComponentRenderer surfaceId="main" componentId="slider-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    // The min display text should show 0
    expect(screen.getByText('0')).toBeInTheDocument()
    // The max display text should show 100
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should not have implicit max=100 when max is omitted', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'slider-1',
        component: 'Slider',
        label: 'Score',
        value: { path: '/score' },
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ score: 5 }}
        >
          <ComponentRenderer surfaceId="main" componentId="slider-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    // The slider renders min=0 in the first span and current value in the middle
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    // The max display span (last child of the flex container) should be empty
    // since no max was provided - confirming no implicit max=100 in the display
    const flexContainer = document.querySelector(
      '.flex.justify-between.text-sm'
    )
    const maxSpan = flexContainer?.querySelector('span:last-child')
    expect(maxSpan?.textContent).toBe('')
  })

  it('should use provided min value', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'slider-1',
        component: 'Slider',
        label: 'Temperature',
        min: 10,
        max: 50,
        value: { path: '/temp' },
      },
    ]

    render(
      <TestProvider>
        <SurfaceSetup
          surfaceId="main"
          components={components}
          dataModel={{ temp: 25 }}
        >
          <ComponentRenderer surfaceId="main" componentId="slider-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })
})
