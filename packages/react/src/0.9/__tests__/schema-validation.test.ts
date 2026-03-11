/**
 * Tests for A2UI v0.9 schema structure validation.
 *
 * T092a: Validates that schema files contain expected structure and required fields
 * by parsing the JSON schema files directly (no JSON Schema validator library needed).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const schemasDir = resolve(__dirname, '../schemas')

function loadSchema(filename: string): Record<string, unknown> {
  const content = readFileSync(resolve(schemasDir, filename), 'utf-8')
  return JSON.parse(content)
}

describe('Schema Validation (T092a)', () => {
  describe('server_to_client.json', () => {
    const schema = loadSchema('server_to_client.json')

    it('should have $id with a2ui.org prefix', () => {
      expect(schema.$id).toBe(
        'https://a2ui.org/specification/v0_9/server_to_client.json'
      )
    })

    it('should define createSurface message with required fields', () => {
      const defs = schema.$defs as Record<string, Record<string, unknown>>
      const createSurface = defs.CreateSurfaceMessage as Record<string, unknown>
      expect(createSurface).toBeDefined()

      // Should require the createSurface property
      expect(createSurface.required).toContain('createSurface')

      // The createSurface property should require surfaceId, catalogId, root
      const props = createSurface.properties as Record<
        string,
        Record<string, unknown>
      >
      const createSurfaceObj = props.createSurface as Record<string, unknown>
      expect(createSurfaceObj.required).toEqual(
        expect.arrayContaining(['surfaceId', 'catalogId', 'root'])
      )
    })

    it('should define updateComponents message structure', () => {
      const defs = schema.$defs as Record<string, Record<string, unknown>>
      const updateComponents = defs.UpdateComponentsMessage as Record<
        string,
        unknown
      >
      expect(updateComponents).toBeDefined()

      // Should require the updateComponents property
      expect(updateComponents.required).toContain('updateComponents')

      // The updateComponents property should have surfaceId and components
      const props = updateComponents.properties as Record<
        string,
        Record<string, unknown>
      >
      const updateComponentsObj = props.updateComponents as Record<
        string,
        unknown
      >
      const updateProps = updateComponentsObj.properties as Record<
        string,
        unknown
      >
      expect(updateProps.surfaceId).toBeDefined()
      expect(updateProps.components).toBeDefined()
    })

    it('should use oneOf for message discrimination', () => {
      expect(schema.oneOf).toBeDefined()
      expect(Array.isArray(schema.oneOf)).toBe(true)
      const oneOf = schema.oneOf as Array<Record<string, unknown>>
      expect(oneOf.length).toBeGreaterThanOrEqual(3) // at least createSurface, updateComponents, updateDataModel
    })

    it('should define version as optional string property', () => {
      const props = schema.properties as Record<string, Record<string, unknown>>
      expect(props.version).toBeDefined()
      expect(props.version.type).toBe('string')
    })
  })

  describe('client_to_server.json', () => {
    const schema = loadSchema('client_to_server.json')

    it('should define action with required fields', () => {
      const props = schema.properties as Record<string, Record<string, unknown>>
      const action = props.action as Record<string, unknown>
      expect(action).toBeDefined()

      const required = action.required as string[]
      expect(required).toContain('name')
      expect(required).toContain('surfaceId')
      expect(required).toContain('sourceComponentId')
      expect(required).toContain('timestamp')
      expect(required).toContain('context')
    })

    it('should define action.dataModel as optional', () => {
      const props = schema.properties as Record<string, Record<string, unknown>>
      const action = props.action as Record<string, unknown>
      const actionProps = action.properties as Record<
        string,
        Record<string, unknown>
      >

      // dataModel should be defined in properties but NOT in required
      expect(actionProps.dataModel).toBeDefined()
      const required = action.required as string[]
      expect(required).not.toContain('dataModel')
    })

    it('should define error with VALIDATION_FAILED variant', () => {
      const props = schema.properties as Record<string, Record<string, unknown>>
      const error = props.error as Record<string, unknown>
      expect(error).toBeDefined()

      // Error uses oneOf for different error types
      const oneOf = error.oneOf as Array<Record<string, unknown>>
      expect(oneOf).toBeDefined()
      expect(oneOf.length).toBeGreaterThanOrEqual(1)

      // Find the VALIDATION_FAILED variant
      const validationFailed = oneOf.find((variant) => {
        const variantProps = variant.properties as Record<
          string,
          Record<string, unknown>
        >
        return variantProps?.code?.const === 'VALIDATION_FAILED'
      })
      expect(validationFailed).toBeDefined()

      // It should require code, path, message, surfaceId
      const vfRequired = validationFailed!.required as string[]
      expect(vfRequired).toContain('code')
      expect(vfRequired).toContain('path')
      expect(vfRequired).toContain('message')
      expect(vfRequired).toContain('surfaceId')
    })
  })

  describe('common_types.json', () => {
    const schema = loadSchema('common_types.json')

    it('should have $id with a2ui.org/specification/v0_9/ prefix', () => {
      expect(schema.$id).toContain('a2ui.org/specification/v0_9/')
    })

    it('should define ComponentCommon with required id', () => {
      const defs = schema.$defs as Record<string, Record<string, unknown>>
      const componentCommon = defs.ComponentCommon as Record<string, unknown>
      expect(componentCommon).toBeDefined()
      expect(componentCommon.required).toContain('id')
    })

    it('should define DynamicValue type', () => {
      const defs = schema.$defs as Record<string, Record<string, unknown>>
      expect(defs.DynamicValue).toBeDefined()
    })

    it('should define DynamicString type', () => {
      const defs = schema.$defs as Record<string, Record<string, unknown>>
      expect(defs.DynamicString).toBeDefined()
    })
  })

  describe('basic_catalog.json', () => {
    const schema = loadSchema('basic_catalog.json')

    it('should have $id with a2ui.org/specification/v0_9/ prefix', () => {
      expect(schema.$id).toContain('a2ui.org/specification/v0_9/')
    })

    it('should define component types in components object', () => {
      const components = schema.components as Record<string, unknown>
      expect(components).toBeDefined()
      // Should have at least Text component
      expect(components.Text).toBeDefined()
    })

    it('should have catalogId field', () => {
      expect(schema.catalogId).toBeDefined()
      expect(typeof schema.catalogId).toBe('string')
    })

    it('should have $schema reference', () => {
      expect(schema.$schema).toBeDefined()
    })
  })
})
