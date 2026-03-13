import { useRef, type ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Ajv2020 from '../../../node_modules/ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { SurfaceProvider, useSurfaceContext } from '../contexts/SurfaceContext'
import { ActionProvider } from '../contexts/ActionContext'
import { ComponentsMapProvider } from '../contexts/ComponentsMapContext'
import { ComponentRenderer } from '../components/ComponentRenderer'
import { standardCatalog } from '../standard-catalog'
import type { ComponentDefinition } from '@a2ui-sdk/types/0.9'
import {
  componentSmokeScenarios,
  getBasicCatalogSchema,
  getCommonTypesSchema,
} from './schema-contract.utils'

const ajv = new Ajv2020({
  allErrors: true,
  discriminator: true,
  strict: false,
})
addFormats(ajv)
ajv.addSchema(getCommonTypesSchema(), 'common_types.json')
ajv.addSchema(getBasicCatalogSchema(), 'basic_catalog.json')

function getComponentValidator(componentName: string) {
  return ajv.compile({
    $ref: `basic_catalog.json#/components/${componentName}`,
  })
}

function formatValidationErrors(errors: typeof ajv.errors): string {
  return (
    errors
      ?.map((error) =>
        `${error.instancePath || '/'} ${error.message ?? ''}`.trim()
      )
      .join('\n') ?? 'Unknown validation error'
  )
}

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

describe('v0.9 schema-backed component smoke tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  for (const scenario of componentSmokeScenarios) {
    it(`${scenario.name} fixture validates and renders`, () => {
      const rootComponent = scenario.components.find(
        (component) => component.id === scenario.rootId
      )
      expect(rootComponent).toBeDefined()

      const validate = getComponentValidator(scenario.name)
      const valid = validate(rootComponent)
      expect(valid, formatValidationErrors(validate.errors)).toBe(true)

      const { container } = render(
        <TestProvider>
          <SurfaceSetup
            surfaceId={`surface-${scenario.name}`}
            components={scenario.components}
            dataModel={scenario.dataModel}
          >
            <ComponentRenderer
              surfaceId={`surface-${scenario.name}`}
              componentId={scenario.rootId}
            />
          </SurfaceSetup>
        </TestProvider>
      )

      expect(screen.queryByText(/Unknown component:/i)).not.toBeInTheDocument()
      expect(container.innerHTML.trim().length).toBeGreaterThan(0)
    })
  }
})
