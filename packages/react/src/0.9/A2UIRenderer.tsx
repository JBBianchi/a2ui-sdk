/**
 * A2UIRenderer - Component for rendering A2UI 0.9 surfaces.
 *
 * This component renders the surfaces from the A2UI context.
 * It must be used within an A2UIProvider.
 *
 * @example
 * ```tsx
 * import { A2UIProvider, A2UIRenderer, A2UIMessage, A2UIAction } from '@a2ui-sdk/react/0.9'
 *
 * function App() {
 *   const messages: A2UIMessage[] = [...]
 *   const handleAction = (action: A2UIAction) => {
 *     console.log('Action:', action)
 *   }
 *   return (
 *     <A2UIProvider messages={messages}>
 *       <A2UIRenderer onAction={handleAction} />
 *     </A2UIProvider>
 *   )
 * }
 * ```
 */

import { useCallback } from 'react'
import { useSurfaceContext } from './contexts/SurfaceContext'
import { ActionProvider } from './contexts/ActionContext'
import { ErrorProvider } from './contexts/ErrorContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { FunctionRegistryProvider } from './contexts/FunctionRegistryContext'
import { ComponentRenderer } from './components/ComponentRenderer'
import type { ActionHandler, ErrorHandler } from '@a2ui-sdk/types/0.9'
import type { FunctionRegistry } from '@a2ui-sdk/utils/0.9'

/**
 * Props for A2UIRenderer.
 */
export interface A2UIRendererProps {
  /** Optional surface ID to render a specific surface (renders all if not provided) */
  surfaceId?: string
  /** Callback when an action is dispatched */
  onAction?: ActionHandler
  /** Callback when an error occurs */
  onError?: ErrorHandler
  /** Function registry for executing functionCall actions and data binding */
  functionRegistry?: FunctionRegistry
}

/**
 * Component for rendering A2UI 0.9 surfaces.
 *
 * Renders all surfaces from the A2UI context, or a specific surface if surfaceId is provided.
 * Must be used within an A2UIProvider.
 *
 * @example
 * ```tsx
 * // Render all surfaces
 * <A2UIProvider messages={messages}>
 *   <A2UIRenderer onAction={handleAction} />
 * </A2UIProvider>
 *
 * // Render specific surface
 * <A2UIProvider messages={messages}>
 *   <A2UIRenderer surfaceId="sidebar" onAction={handleAction} />
 *   <A2UIRenderer surfaceId="main" onAction={handleAction} />
 * </A2UIProvider>
 * ```
 */
export function A2UIRenderer({
  surfaceId,
  onAction,
  onError,
  functionRegistry,
}: A2UIRendererProps) {
  const { surfaces, getSurface } = useSurfaceContext()

  const getSendDataModel = useCallback(
    (id: string) => getSurface(id)?.sendDataModel === true,
    [getSurface]
  )

  // Render specific surface if surfaceId is provided
  if (surfaceId) {
    const surface = surfaces.get(surfaceId)
    if (!surface || !surface.created) {
      return null
    }

    const rootId = surface.root
    if (!rootId) {
      return null
    }

    return (
      <ErrorProvider onError={onError}>
        <FunctionRegistryProvider registry={functionRegistry}>
          <ActionProvider
            onAction={onAction}
            functionRegistry={functionRegistry}
            getSendDataModel={getSendDataModel}
          >
            <ThemeProvider theme={surface.theme}>
              <ComponentRenderer surfaceId={surfaceId} componentId={rootId} />
            </ThemeProvider>
          </ActionProvider>
        </FunctionRegistryProvider>
      </ErrorProvider>
    )
  }

  // Render all surfaces
  const surfaceEntries = Array.from(surfaces.entries())

  if (surfaceEntries.length === 0) {
    return null
  }

  return (
    <ErrorProvider onError={onError}>
      <FunctionRegistryProvider registry={functionRegistry}>
        <ActionProvider
          onAction={onAction}
          functionRegistry={functionRegistry}
          getSendDataModel={getSendDataModel}
        >
          {surfaceEntries.map(([id, surface]) => {
            if (!surface.created) {
              return null
            }

            const rootId = surface.root
            if (!rootId) {
              return null
            }

            return (
              <ThemeProvider key={id} theme={surface.theme}>
                <ComponentRenderer surfaceId={id} componentId={rootId} />
              </ThemeProvider>
            )
          })}
        </ActionProvider>
      </FunctionRegistryProvider>
    </ErrorProvider>
  )
}

A2UIRenderer.displayName = 'A2UI.Renderer'
