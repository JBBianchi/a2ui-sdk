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

export const getFunction: FunctionImplementation = {
  name: 'get',
  returnType: 'any',
  execute(
    args: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    basePath: string | null
  ) {
    const valuePath = getPathArg(args, 'valuePath', 'value')
    const key = typeof args.key === 'string' ? args.key : null

    if (!key) {
      return undefined
    }

    const source =
      valuePath !== null
        ? getValueAtPath(dataModel, resolveScopedPath(valuePath, basePath))
        : args.value

    if (!isRecord(source)) {
      return undefined
    }

    return source[key]
  },
}
