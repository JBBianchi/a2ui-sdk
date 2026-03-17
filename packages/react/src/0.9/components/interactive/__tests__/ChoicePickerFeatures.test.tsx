/**
 * Tests for ChoicePicker chips and filterable features.
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
import { basicCatalog } from '../../../basic-catalog'

function TestProvider({ children }: { children: ReactNode }) {
  return (
    <SurfaceProvider>
      <ActionProvider>
        <ComponentsMapProvider components={basicCatalog.components}>
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

describe('ChoicePickerComponent features', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('displayStyle="chips"', () => {
    it('should render chip elements for multi-selection', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'picker-1',
          component: 'ChoicePicker',
          label: 'Pick Colors',
          displayStyle: 'chips',
          options: [
            { value: 'red', label: 'Red' },
            { value: 'blue', label: 'Blue' },
            { value: 'green', label: 'Green' },
          ],
          value: { path: '/colors' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ colors: [] }}
          >
            <ComponentRenderer surfaceId="main" componentId="picker-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      // Chips are rendered as buttons with rounded-full class
      const chipButtons = screen.getAllByRole('button')
      expect(chipButtons).toHaveLength(3)

      // Each chip should have the rounded-full class indicating chip style
      chipButtons.forEach((btn) => {
        expect(btn.className).toContain('rounded-full')
      })

      // All option labels should be visible
      expect(screen.getByText('Red')).toBeInTheDocument()
      expect(screen.getByText('Blue')).toBeInTheDocument()
      expect(screen.getByText('Green')).toBeInTheDocument()
    })

    it('should render chip elements for single selection (mutuallyExclusive)', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'picker-1',
          component: 'ChoicePicker',
          label: 'Pick Size',
          variant: 'mutuallyExclusive',
          displayStyle: 'chips',
          options: [
            { value: 's', label: 'Small' },
            { value: 'm', label: 'Medium' },
            { value: 'l', label: 'Large' },
          ],
          value: { path: '/size' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ size: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="picker-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const chipButtons = screen.getAllByRole('button')
      expect(chipButtons).toHaveLength(3)
      chipButtons.forEach((btn) => {
        expect(btn.className).toContain('rounded-full')
      })
    })
  })

  describe('displayStyle="checkbox" (default)', () => {
    it('should render checkboxes when variant is multipleSelection', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'picker-1',
          component: 'ChoicePicker',
          label: 'Pick Fruits',
          variant: 'multipleSelection',
          options: [
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ],
          value: { path: '/fruits' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ fruits: [] }}
          >
            <ComponentRenderer surfaceId="main" componentId="picker-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      // Should render checkbox role elements
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(2)

      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Banana')).toBeInTheDocument()
    })

    it('should not render chip-style buttons when displayStyle is checkbox', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'picker-1',
          component: 'ChoicePicker',
          label: 'Pick Items',
          variant: 'multipleSelection',
          displayStyle: 'checkbox',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
          value: { path: '/items' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ items: [] }}
          >
            <ComponentRenderer surfaceId="main" componentId="picker-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      // Should have checkboxes, not chip-style buttons
      expect(screen.getAllByRole('checkbox')).toHaveLength(2)
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })
  })

  describe('filterable', () => {
    it('should show filter input when filterable=true', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'picker-1',
          component: 'ChoicePicker',
          label: 'Pick Language',
          variant: 'multipleSelection',
          filterable: true,
          options: [
            { value: 'js', label: 'JavaScript' },
            { value: 'ts', label: 'TypeScript' },
            { value: 'py', label: 'Python' },
          ],
          value: { path: '/lang' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ lang: [] }}
          >
            <ComponentRenderer surfaceId="main" componentId="picker-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const filterInput = screen.getByPlaceholderText('Filter options...')
      expect(filterInput).toBeInTheDocument()
    })

    it('should not show filter input when filterable=false (default)', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'picker-1',
          component: 'ChoicePicker',
          label: 'Pick Language',
          options: [
            { value: 'js', label: 'JavaScript' },
            { value: 'ts', label: 'TypeScript' },
          ],
          value: { path: '/lang' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ lang: [] }}
          >
            <ComponentRenderer surfaceId="main" componentId="picker-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      expect(
        screen.queryByPlaceholderText('Filter options...')
      ).not.toBeInTheDocument()
    })

    it('should filter options when typing in filter input', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'picker-1',
          component: 'ChoicePicker',
          label: 'Pick Language',
          variant: 'multipleSelection',
          filterable: true,
          options: [
            { value: 'js', label: 'JavaScript' },
            { value: 'ts', label: 'TypeScript' },
            { value: 'py', label: 'Python' },
          ],
          value: { path: '/lang' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ lang: [] }}
          >
            <ComponentRenderer surfaceId="main" componentId="picker-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      // All options visible initially
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Python')).toBeInTheDocument()

      // Type in the filter
      const filterInput = screen.getByPlaceholderText('Filter options...')
      fireEvent.change(filterInput, { target: { value: 'Script' } })

      // Only options containing "Script" should remain
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.queryByText('Python')).not.toBeInTheDocument()
    })
  })
})
