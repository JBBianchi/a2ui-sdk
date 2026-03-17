import { describe, expect, it } from 'vitest'
import { basicCatalog } from '../basic-catalog'
import {
  getSchemaComponentContracts,
  getTypeScriptComponentContracts,
} from './schema-contract.utils'

function sortedKeys(record: Record<string, unknown>): string[] {
  return Object.keys(record).sort()
}

describe('v0.9 component schema contract alignment', () => {
  const schemaContracts = getSchemaComponentContracts()
  const typeContracts = getTypeScriptComponentContracts()
  const schemaComponentNames = sortedKeys(schemaContracts)
  const typeComponentNames = sortedKeys(typeContracts)
  const registryComponentNames = sortedKeys(basicCatalog.components)

  it('matches component names across schema, types, and the basic catalog', () => {
    expect(typeComponentNames).toEqual(schemaComponentNames)
    expect(registryComponentNames).toEqual(schemaComponentNames)
  })

  for (const componentName of schemaComponentNames) {
    it(`${componentName} matches prop names, required flags, and enum literals`, () => {
      const schemaContract = schemaContracts[componentName]
      const typeContract = typeContracts[componentName]

      expect(typeContract).toBeDefined()

      const schemaPropNames = sortedKeys(schemaContract.props)
      const typePropNames = sortedKeys(typeContract.props)
      expect(typePropNames).toEqual(schemaPropNames)

      for (const propName of schemaPropNames) {
        expect(typeContract.props[propName]?.required).toBe(
          schemaContract.props[propName]?.required
        )

        const schemaEnumValues = schemaContract.props[propName]?.enumValues
        if (schemaEnumValues) {
          expect(typeContract.props[propName]?.enumValues).toEqual(
            schemaEnumValues
          )
        }
      }
    })
  }
})
