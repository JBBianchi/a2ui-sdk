/**
 * A2UI 0.9 React Renderer - Public API
 *
 * This is the main entry point for the A2UI 0.9 React renderer library.
 * Import from '@a2ui-sdk/react/0.9'
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

// ============ Types ============

export type {
  // Message types
  A2UIMessage,
  CreateSurfacePayload,
  UpdateComponentsPayload,
  UpdateDataModelPayload,
  DeleteSurfacePayload,
  // Component types
  ComponentDefinition,
  ComponentCommon,
  CatalogComponentCommon,
  // Value types
  DynamicValue,
  DynamicString,
  DynamicNumber,
  DynamicBoolean,
  DynamicStringList,
  ChildList,
  TemplateBinding,
  // Action types
  Action,
  EventAction,
  FunctionCallAction,
  ActionPayload as A2UIAction,
  ActionHandler,
  // Error types
  ErrorPayload,
  ErrorHandler,
  // Theme types
  ThemeConfig,
  AccessibilityAttributes,
  // Validation types
  CheckRule,
  Checkable,
  ValidationResult,
  // State types
  ScopeValue,
  DataModel,
} from '@a2ui-sdk/types/0.9'

export { isEventAction, isFunctionCallAction } from '@a2ui-sdk/types/0.9'

export type { A2UIProviderProps } from './contexts/A2UIProvider'
export type { A2UIRendererProps } from './A2UIRenderer'
export type {
  Catalog,
  CatalogComponent,
  CatalogComponents,
} from './standard-catalog'

// ============ Components ============

export { A2UIProvider } from './contexts/A2UIProvider'
export { A2UIRenderer } from './A2UIRenderer'
export { ComponentRenderer } from './components/ComponentRenderer'
export {
  standardCatalog,
  createStandardFunctionRegistry,
} from './standard-catalog'

// ============ Hooks ============

export { useDispatchAction } from './hooks/useDispatchAction'
export {
  useDataBinding,
  useFormBinding,
  useStringBinding,
  useDataModel,
} from './hooks/useDataBinding'
export { useValidation } from './hooks/useValidation'
export { useSurfaceContext } from './contexts/SurfaceContext'
export { useScope, useScopeBasePath } from './contexts/ScopeContext'
export { ActionProvider, useActionContext } from './contexts/ActionContext'
export {
  FunctionRegistryProvider,
  useFunctionRegistry,
} from './contexts/FunctionRegistryContext'
export { ErrorProvider, useErrorContext } from './contexts/ErrorContext'
export { ThemeProvider, useTheme } from './contexts/ThemeContext'
export { useA2UIMessageHandler } from './hooks/useA2UIMessageHandler'
export type { A2UIMessageHandler } from './hooks/useA2UIMessageHandler'
