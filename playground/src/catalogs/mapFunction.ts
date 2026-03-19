import {
  getPathArg,
  getValueAtPath,
  isRecord,
  resolveScopedPath,
} from './catalogFunctionUtils'

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
    dataModel: Record<string, unknown>,
    basePath: string | null
  ) {
    const valuePath = getPathArg(args, 'valuePath', 'value')
    const datasetPath = getPathArg(args, 'datasetPath', 'dataset')
    const key = typeof args.key === 'string' ? args.key : null

    if (!valuePath || !datasetPath || !key) {
      return undefined
    }

    const value = getValueAtPath(
      dataModel,
      resolveScopedPath(valuePath, basePath)
    )
    const dataset = getValueAtPath(
      dataModel,
      resolveScopedPath(datasetPath, basePath)
    )

    if (value === undefined || dataset === undefined) {
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
