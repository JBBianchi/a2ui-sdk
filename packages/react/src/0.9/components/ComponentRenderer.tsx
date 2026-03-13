/**
 * ComponentRenderer - Routes component rendering based on type.
 *
 * Uses the flat discriminator format from 0.9 protocol where
 * the component type is a property on the component itself.
 * Props are spread directly to components like in v0.8.
 */

import { memo, useContext } from 'react'
import type { AccessibilityAttributes } from '@a2ui-sdk/types/0.9'
import { useComponent } from '../hooks/useComponent'
import { useStringBinding } from '../hooks/useDataBinding'
import { ComponentsMapContext } from '../contexts/ComponentsMapContext'
import { UnknownComponent } from './UnknownComponent'

/**
 * Props for ComponentRenderer.
 */
export interface ComponentRendererProps {
  surfaceId: string
  componentId: string
}

/**
 * Set of component IDs currently being rendered (for circular reference detection).
 */
const renderingComponents = new Set<string>()

/**
 * Renders a component based on its type from the component registry.
 * Supports custom component overrides via ComponentsMapContext.
 *
 * @example
 * ```tsx
 * // Render a component by ID
 * <ComponentRenderer surfaceId="surface-1" componentId="text-1" />
 * ```
 */
export const ComponentRenderer = memo(function ComponentRenderer({
  surfaceId,
  componentId,
}: ComponentRendererProps) {
  const component = useComponent(surfaceId, componentId)
  const componentsMapContext = useContext(ComponentsMapContext)

  // Check for circular reference
  const renderKey = `${surfaceId}:${componentId}`
  if (renderingComponents.has(renderKey)) {
    console.error(
      `[A2UI 0.9] Circular reference detected for component "${componentId}" on surface "${surfaceId}". Skipping render.`
    )
    return null
  }

  if (!component) {
    console.warn(
      `[A2UI 0.9] Component not found: ${componentId} on surface ${surfaceId}`
    )
    return null
  }

  // Get the component type from the discriminator property
  const componentType = component.component

  const ComponentImpl = componentsMapContext?.getComponent(componentType)

  // If component type is unknown, render the fallback
  if (!ComponentImpl) {
    return (
      <UnknownComponent
        surfaceId={surfaceId}
        componentId={componentId}
        componentType={componentType}
      />
    )
  }

  // Add to rendering set for circular reference detection
  renderingComponents.add(renderKey)

  const accessibility = component.accessibility as
    | AccessibilityAttributes
    | undefined
  const _generation = component._generation as number | undefined

  // Build props by excluding metadata fields (type discriminator, id,
  // accessibility, and _generation which is an internal type-change counter)
  const metadataKeys = new Set([
    'component',
    'id',
    'accessibility',
    '_generation',
  ])
  const props: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(component)) {
    if (!metadataKeys.has(key)) {
      props[key] = value
    }
  }

  // Use _generation in the key so that component type changes force a full
  // unmount/remount, resetting any internal React state from the previous type.
  const instanceKey = _generation
    ? `${componentId}:${_generation}`
    : componentId

  try {
    return (
      <AccessibleComponent
        key={instanceKey}
        surfaceId={surfaceId}
        componentId={componentId}
        accessibility={accessibility as AccessibilityAttributes | undefined}
        ComponentImpl={ComponentImpl}
        props={props}
      />
    )
  } finally {
    // Remove from rendering set after render
    renderingComponents.delete(renderKey)
  }
})

ComponentRenderer.displayName = 'A2UI.ComponentRenderer'

/**
 * Inner component that resolves accessibility DynamicStrings via hooks
 * and renders the actual component implementation with aria attributes.
 */
const AccessibleComponent = memo(function AccessibleComponent({
  surfaceId,
  componentId,
  accessibility,
  ComponentImpl,
  props,
}: {
  surfaceId: string
  componentId: string
  accessibility: AccessibilityAttributes | undefined
  ComponentImpl: React.ComponentType<Record<string, unknown>>
  props: Record<string, unknown>
}) {
  const ariaLabel = useStringBinding(surfaceId, accessibility?.label, '')
  const ariaDescription = useStringBinding(
    surfaceId,
    accessibility?.description,
    ''
  )

  const ariaProps: Record<string, string> = {}
  if (ariaLabel) {
    ariaProps['aria-label'] = ariaLabel
  }
  if (ariaDescription) {
    ariaProps['aria-description'] = ariaDescription
  }

  return (
    <ComponentImpl
      surfaceId={surfaceId}
      componentId={componentId}
      {...props}
      {...ariaProps}
    />
  )
})

AccessibleComponent.displayName = 'A2UI.AccessibleComponent'
