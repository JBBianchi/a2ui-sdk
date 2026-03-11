/**
 * useDataBinding - Hook for resolving data bindings in components.
 *
 * Supports the 0.9 simplified value format:
 * - Literal values: `"string"`, `42`, `true`
 * - Path bindings: `{"path": "/absolute"}` or `{"path": "relative"}`
 */

import { useCallback, useSyncExternalStore } from 'react'
import type {
  DynamicValue,
  DynamicString,
  DataModel,
  FormBindableValue,
} from '@a2ui-sdk/types/0.9'
import { useSurfaceContext } from '../contexts/SurfaceContext'
import { useScope } from '../contexts/ScopeContext'
import { useFunctionRegistry } from '../contexts/FunctionRegistryContext'
import {
  resolveValue,
  resolveString,
  isPathBinding,
  resolvePath,
} from '@a2ui-sdk/utils/0.9'

/**
 * Computes the subscription path for a given source and basePath.
 * Returns the resolved absolute path for path bindings, or '/' as fallback.
 */
function getSubscriptionPath(
  source: FormBindableValue | DynamicString | undefined | null,
  basePath: string | null
): string {
  if (isPathBinding(source)) {
    return resolvePath(source.path, basePath)
  }
  return '/'
}

/** No-op subscribe for when DataStore is not available */
const noopSubscribe: (cb: () => void) => () => void = () => () => {}

/** Stable empty data model for non-existent surfaces */
const EMPTY_DATA_MODEL: DataModel = {}

/**
 * Resolves a DynamicValue to its actual value.
 *
 * Uses useSyncExternalStore with the DataStore for granular re-rendering
 * when available, falling back to snapshot-based resolution otherwise.
 *
 * @param surfaceId - The surface ID for data model lookup
 * @param source - The dynamic value (literal or path binding)
 * @param defaultValue - Default value if source is undefined or path not found
 * @returns The resolved value
 *
 * @example
 * ```tsx
 * function TextComponent({ surfaceId, component }) {
 *   const textValue = useDataBinding<string>(surfaceId, component.text, '');
 *   return <span>{textValue}</span>;
 * }
 * ```
 */
export function useDataBinding<T = unknown>(
  surfaceId: string,
  source: DynamicValue | undefined,
  defaultValue?: T
): T {
  const { getDataModel, getDataStore } = useSurfaceContext()
  const { basePath } = useScope()
  const registry = useFunctionRegistry()
  const dataStore = getDataStore(surfaceId)

  const subPath = getSubscriptionPath(source, basePath)

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!dataStore) return () => {}
      return dataStore.subscribe(subPath, cb)
    },
    [dataStore, subPath]
  )

  const getSnapshot = useCallback(() => {
    const dataModel = dataStore ? dataStore.getData() : getDataModel(surfaceId)
    return resolveValue<T>(
      source,
      dataModel,
      basePath,
      defaultValue,
      registry ?? undefined
    )
  }, [
    dataStore,
    getDataModel,
    surfaceId,
    source,
    basePath,
    defaultValue,
    registry,
  ])

  return useSyncExternalStore(
    dataStore ? subscribe : noopSubscribe,
    getSnapshot,
    getSnapshot
  )
}

/**
 * Resolves a DynamicString to a string value.
 *
 * @param surfaceId - The surface ID for data model lookup
 * @param source - The dynamic string value
 * @param defaultValue - Default value if source is undefined or path not found
 * @returns The resolved string
 */
export function useStringBinding(
  surfaceId: string,
  source: DynamicString | undefined,
  defaultValue = ''
): string {
  const { getDataModel, getDataStore } = useSurfaceContext()
  const { basePath } = useScope()
  const registry = useFunctionRegistry()
  const dataStore = getDataStore(surfaceId)

  const subPath = getSubscriptionPath(source, basePath)

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!dataStore) return () => {}
      return dataStore.subscribe(subPath, cb)
    },
    [dataStore, subPath]
  )

  const getSnapshot = useCallback(() => {
    const dataModel = dataStore ? dataStore.getData() : getDataModel(surfaceId)
    return resolveString(
      source,
      dataModel,
      basePath,
      defaultValue,
      registry ?? undefined
    )
  }, [
    dataStore,
    getDataModel,
    surfaceId,
    source,
    basePath,
    defaultValue,
    registry,
  ])

  return useSyncExternalStore(
    dataStore ? subscribe : noopSubscribe,
    getSnapshot,
    getSnapshot
  )
}

/**
 * Gets the full data model for a surface.
 * Useful for components that need access to multiple values.
 *
 * @param surfaceId - The surface ID
 * @returns The data model for this surface
 */
export function useDataModel(surfaceId: string): DataModel {
  const { getDataModel, getDataStore } = useSurfaceContext()
  const dataStore = getDataStore(surfaceId)

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!dataStore) return () => {}
      return dataStore.subscribe('/', cb)
    },
    [dataStore]
  )

  const getSnapshot = useCallback(() => {
    if (dataStore) return dataStore.getData()
    const model = getDataModel(surfaceId)
    // Return stable reference for empty models to avoid infinite loops
    // when useSyncExternalStore compares snapshots with Object.is
    if (model && typeof model === 'object' && Object.keys(model).length === 0) {
      return EMPTY_DATA_MODEL
    }
    return model
  }, [dataStore, getDataModel, surfaceId])

  return useSyncExternalStore(
    dataStore ? subscribe : noopSubscribe,
    getSnapshot,
    getSnapshot
  )
}

/**
 * Hook for two-way data binding in form components.
 * Returns both the current value and a setter function.
 *
 * @param surfaceId - The surface ID
 * @param source - The dynamic value (must be a path binding for setting)
 * @param defaultValue - Default value if not found
 * @returns Tuple of [value, setValue]
 *
 * @example
 * ```tsx
 * function TextFieldComponent({ surfaceId, component }) {
 *   const [value, setValue] = useFormBinding<string>(surfaceId, component.value, '');
 *
 *   return (
 *     <input
 *       value={value}
 *       onChange={(e) => setValue(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useFormBinding<T = unknown>(
  surfaceId: string,
  source: FormBindableValue | undefined,
  defaultValue?: T
): [T, (value: T) => void] {
  const { getDataModel, setDataValue, getDataStore } = useSurfaceContext()
  const { basePath } = useScope()
  const registry = useFunctionRegistry()
  const dataStore = getDataStore(surfaceId)

  const subPath = getSubscriptionPath(source, basePath)

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!dataStore) return () => {}
      return dataStore.subscribe(subPath, cb)
    },
    [dataStore, subPath]
  )

  const getSnapshot = useCallback(() => {
    const dataModel = dataStore ? dataStore.getData() : getDataModel(surfaceId)
    return resolveValue<T>(
      source,
      dataModel,
      basePath,
      defaultValue,
      registry ?? undefined
    )
  }, [
    dataStore,
    getDataModel,
    surfaceId,
    source,
    basePath,
    defaultValue,
    registry,
  ])

  const value = useSyncExternalStore(
    dataStore ? subscribe : noopSubscribe,
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (newValue: T) => {
      // Only path bindings can be updated
      if (isPathBinding(source)) {
        // Resolve the path against the current scope
        const path = source.path.startsWith('/')
          ? source.path
          : basePath
            ? `${basePath}/${source.path}`
            : `/${source.path}`
        setDataValue(surfaceId, path, newValue)
      }
    },
    [setDataValue, surfaceId, source, basePath]
  )

  return [value, setValue]
}
