/**
 * Tests for DateTimeInput features: min/max constraints, enableDate default, outputFormat.
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

describe('DateTimeInputComponent features', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('min/max constraints', () => {
    it('should apply min constraint to the input', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'Start Date',
          enableDate: true,
          min: '2024-01-01',
          value: { path: '/startDate' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ startDate: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('Start Date') as HTMLInputElement
      expect(input).toHaveAttribute('min', '2024-01-01')
    })

    it('should apply max constraint to the input', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'End Date',
          enableDate: true,
          max: '2025-12-31',
          value: { path: '/endDate' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ endDate: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('End Date') as HTMLInputElement
      expect(input).toHaveAttribute('max', '2025-12-31')
    })

    it('should apply both min and max constraints', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'Date Range',
          enableDate: true,
          min: '2024-01-01',
          max: '2024-12-31',
          value: { path: '/date' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ date: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('Date Range') as HTMLInputElement
      expect(input).toHaveAttribute('min', '2024-01-01')
      expect(input).toHaveAttribute('max', '2024-12-31')
    })

    it('should not have min/max when not specified', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'Open Date',
          enableDate: true,
          value: { path: '/openDate' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ openDate: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('Open Date') as HTMLInputElement
      expect(input).not.toHaveAttribute('min')
      expect(input).not.toHaveAttribute('max')
    })
  })

  describe('enableDate default', () => {
    it('should default enableDate to false, rendering a time input', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'Time Only',
          enableTime: true,
          value: { path: '/time' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ time: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('Time Only') as HTMLInputElement
      // When enableDate=false (default) and enableTime=true, type should be 'time'
      expect(input.type).toBe('time')
    })

    it('should render time input when both enableDate and enableTime are default (false)', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'Default Input',
          value: { path: '/val' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ val: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('Default Input') as HTMLInputElement
      // enableDate=false, enableTime=false => falls through to 'time'
      expect(input.type).toBe('time')
    })

    it('should render date input when enableDate=true', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'Date Input',
          enableDate: true,
          value: { path: '/date' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ date: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('Date Input') as HTMLInputElement
      expect(input.type).toBe('date')
    })

    it('should render datetime-local when both enableDate and enableTime are true', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'DateTime Input',
          enableDate: true,
          enableTime: true,
          value: { path: '/datetime' },
        },
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ datetime: '' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('DateTime Input') as HTMLInputElement
      expect(input.type).toBe('datetime-local')
    })
  })

  describe('outputFormat prop', () => {
    it('should not apply outputFormat to the rendered input (prop is not recognized by the component)', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'dt-1',
          component: 'DateTimeInput',
          label: 'Formatted Date',
          enableDate: true,
          outputFormat: 'YYYY-MM-DD',
          value: { path: '/fdate' },
        } as ComponentDefinition,
      ]

      render(
        <TestProvider>
          <SurfaceSetup
            surfaceId="main"
            components={components}
            dataModel={{ fdate: '2024-06-15' }}
          >
            <ComponentRenderer surfaceId="main" componentId="dt-1" />
          </SurfaceSetup>
        </TestProvider>
      )

      const input = screen.getByLabelText('Formatted Date') as HTMLInputElement
      // The component renders the raw value; outputFormat is not used
      expect(input.value).toBe('2024-06-15')
      // No extra formatting attributes
      expect(input).not.toHaveAttribute('data-output-format')
    })
  })
})
