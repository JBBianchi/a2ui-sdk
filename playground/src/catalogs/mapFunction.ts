import { isRecord } from './catalogFunctionUtils'

type FunctionImplementation = {
  name: string
  returnType: 'any'
  execute(
    args: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    basePath: string | null
  ): unknown
}

export const mapFunction: FunctionImplementation = {
  name: 'map',
  returnType: 'any',
  execute(
    args: Record<string, unknown>,
    _dataModel: Record<string, unknown>,
    _basePath: string | null
  ) {
    const value = args.value // Expect to be { "path": "/some/path" } that has been resolved by the caller to the actual value at that path
    const dataset = args.dataset as
      | Array<Record<string, unknown>>
      | Record<string, unknown>
      | undefined // Expect to be { "path": "/some/path" } that has been resolved by the caller to the actual value at that path
    const key = typeof args.key === 'string' ? args.key : null

    if (value === undefined || dataset === undefined || key === null) {
      return undefined
    }

    const candidates = Array.isArray(dataset)
      ? dataset
      : isRecord(dataset)
        ? Object.values(dataset)
        : []

    return candidates.find((entry) => isRecord(entry) && entry[key] === value)
  },
}
