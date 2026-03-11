/**
 * ActionContext - Manages action dispatching for A2UI 0.9 components.
 *
 * Actions are triggered by user interactions (button clicks, form changes, etc.)
 * and are forwarded to the parent application for handling.
 */

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  Action,
  ActionPayload,
  ActionHandler,
  DynamicValue,
  DataModel,
} from '@a2ui-sdk/types/0.9'
import { isEventAction, isFunctionCallAction } from '@a2ui-sdk/types/0.9'
import { resolveContext, resolveValue } from '@a2ui-sdk/utils/0.9'
import type { FunctionRegistry } from '@a2ui-sdk/utils/0.9'

/**
 * Action context value interface.
 */
export interface ActionContextValue {
  /** Dispatches an action with resolved context */
  dispatchAction: (
    surfaceId: string,
    componentId: string,
    action: Action,
    dataModel: DataModel,
    basePath?: string | null
  ) => void

  /** The action handler callback (if set) */
  onAction: ActionHandler | null
}

/**
 * Action context for A2UI 0.9 rendering.
 */
export const ActionContext = createContext<ActionContextValue | null>(null)

/**
 * Props for ActionProvider.
 */
export interface ActionProviderProps {
  /** Callback when an action is dispatched */
  onAction?: ActionHandler
  /** Function registry for executing functionCall actions */
  functionRegistry?: FunctionRegistry
  /** Returns whether a surface has sendDataModel enabled */
  getSendDataModel?: (surfaceId: string) => boolean
  children: ReactNode
}

/**
 * Provider component for Action dispatching.
 */
export function ActionProvider({
  onAction,
  functionRegistry,
  getSendDataModel,
  children,
}: ActionProviderProps) {
  const dispatchAction = useCallback(
    (
      surfaceId: string,
      componentId: string,
      action: Action,
      dataModel: DataModel,
      basePath: string | null = null
    ) => {
      // Handle event actions - dispatch to onAction callback
      if (isEventAction(action)) {
        if (!onAction) {
          console.warn(
            '[A2UI 0.9] Event action dispatched but no handler is registered'
          )
          return
        }

        const resolvedContext = resolveContext(
          action.event.context as Record<string, DynamicValue> | undefined,
          dataModel,
          basePath
        )

        const payload: ActionPayload = {
          surfaceId,
          name: action.event.name,
          context: resolvedContext,
          sourceComponentId: componentId,
          timestamp: new Date().toISOString(),
        }

        // Attach dataModel if sendDataModel is enabled for this surface
        if (getSendDataModel?.(surfaceId)) {
          payload.dataModel = dataModel as Record<string, unknown>
        }

        onAction(payload)
        return
      }

      // Handle functionCall actions - execute locally via function registry
      if (isFunctionCallAction(action)) {
        if (!functionRegistry) {
          console.warn(
            `[A2UI 0.9] FunctionCall action "${action.functionCall.call}" dispatched but no function registry is available`
          )
          return
        }

        const fc = action.functionCall
        const resolvedArgs: Record<string, unknown> = {}
        if (fc.args) {
          for (const [key, val] of Object.entries(fc.args)) {
            resolvedArgs[key] = resolveValue(
              val,
              dataModel,
              basePath,
              undefined,
              functionRegistry
            )
          }
        }
        functionRegistry.execute(fc.call, resolvedArgs, dataModel, basePath)
        return
      }
    },
    [onAction, functionRegistry, getSendDataModel]
  )

  const value = useMemo<ActionContextValue>(
    () => ({
      dispatchAction,
      onAction: onAction ?? null,
    }),
    [dispatchAction, onAction]
  )

  return (
    <ActionContext.Provider value={value}>{children}</ActionContext.Provider>
  )
}

/**
 * Hook to access the Action context.
 *
 * @throws Error if used outside of ActionProvider
 */
export function useActionContext(): ActionContextValue {
  const context = useContext(ActionContext)
  if (!context) {
    throw new Error('useActionContext must be used within an ActionProvider')
  }
  return context
}
