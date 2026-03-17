import { describe, expect, it } from 'vitest'
import { createBasicFunctionRegistry } from '../basic-catalog'
import { getSchemaFunctionContracts } from './schema-contract.utils'

function getRegisteredFunctionNames(registry: object): string[] {
  const functions = (
    registry as {
      functions?: Map<
        string,
        {
          returnType?: string
        }
      >
    }
  ).functions

  if (!(functions instanceof Map)) {
    throw new Error('Could not inspect FunctionRegistry internals in test')
  }

  return [...functions.keys()].sort()
}

function getRegisteredReturnType(
  registry: object,
  functionName: string
): string | undefined {
  const functions = (
    registry as {
      functions?: Map<
        string,
        {
          returnType?: string
        }
      >
    }
  ).functions

  return functions?.get(functionName)?.returnType
}

describe('v0.9 function schema contract alignment', () => {
  const schemaContracts = getSchemaFunctionContracts()
  const registry = createBasicFunctionRegistry()
  const schemaFunctionNames = Object.keys(schemaContracts).sort()

  it('matches function names between schema and the basic function registry', () => {
    expect(getRegisteredFunctionNames(registry)).toEqual(schemaFunctionNames)
  })

  for (const functionName of schemaFunctionNames) {
    it(`${functionName} matches schema return type`, () => {
      expect(registry.has(functionName)).toBe(true)
      expect(getRegisteredReturnType(registry, functionName)).toBe(
        schemaContracts[functionName]?.returnType
      )
    })
  }
})
