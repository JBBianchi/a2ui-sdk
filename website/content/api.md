---
url: https://a2ui-sdk.js.org/api/
---

# API Reference

## V0.8

### React

````typescript
// @a2ui-sdk/react/0.8

/**
 * Provider component that processes A2UI messages and sets up contexts.
 * The messages prop is optional - use useA2UIMessageHandler hook for incremental updates.
 */
function A2UIProvider(props: {
  messages?: A2UIMessage[]
  catalog?: Catalog
  children: React.ReactNode
}): React.ReactElement

/**
 * Catalog containing components and functions.
 */
interface Catalog {
  components: Record<string, React.ComponentType<any>>
  functions?: Record<string, unknown>
}

/**
 * Standard catalog with all built-in components.
 * Use as base and extend with custom components.
 */
const standardCatalog: Catalog

/**
 * Main renderer component that renders all surfaces.
 */
function A2UIRenderer(): React.ReactElement

/**
 * Renders a component by ID from the component registry.
 */
function ComponentRenderer(props: {
  surfaceId: string
  componentId: string
}): React.ReactElement

/**
 * Returns a function to dispatch actions from custom components.
 */
function useDispatchAction(): (
  surfaceId: string,
  componentId: string,
  action: Action
) => void

/**
 * Resolves a ValueSource to its actual value.
 */
function useDataBinding<T = unknown>(
  surfaceId: string,
  source: ValueSource | undefined,
  defaultValue?: T
): T

/**
 * Hook for two-way data binding in form components.
 * @returns Tuple of [value, setValue]
 */
function useFormBinding<T = unknown>(
  surfaceId: string,
  source: ValueSource | undefined,
  defaultValue?: T
): [T, (value: T) => void]

/**
 * Hook to access the Surface context.
 */
function useSurfaceContext(): SurfaceContextValue

/**
 * Hook to access the DataModel context.
 */
function useDataModelContext(): DataModelContextValue

/**
 * Hook to access the current scope value.
 */
function useScope(): ScopeValue

/**
 * Hook to get the current scope base path.
 */
function useScopeBasePath(): string | null

/**
 * Provider component for action dispatching.
 * Creates a context for managing action handlers.
 *
 * Note: Usually not needed as A2UIProvider already includes this.
 * Use only for advanced customization scenarios.
 */
function ActionProvider(props: {
  onAction?: ActionHandler
  children: React.ReactNode
}): React.ReactElement

/**
 * Hook to access the Action context.
 * Provides access to the action dispatcher and handler.
 *
 * @throws Error if used outside of ActionProvider
 */
function useActionContext(): ActionContextValue

interface ActionContextValue {
  dispatchAction: (
    surfaceId: string,
    componentId: string,
    action: Action,
    basePath: string | null
  ) => void
  onAction: ActionHandler | null
}

/**
 * Hook for processing A2UI messages incrementally.
 * Use this to push messages without clearing existing state,
 * preserving user edits when new messages arrive.
 *
 * @returns Object with processMessage, processMessages, and clear functions
 *
 * @example
 * ```tsx
 * function MessageHandler({ children }) {
 *   const { processMessage, processMessages } = useA2UIMessageHandler()
 *
 *   useEffect(() => {
 *     // Listen for incremental updates
 *     const ws = new WebSocket('ws://example.com')
 *     ws.onmessage = (event) => {
 *       processMessage(JSON.parse(event.data))
 *     }
 *
 *     return () => ws.close()
 *   }, [processMessage, processMessages])
 *
 *   return <>{children}</>
 * }
 *
 * <A2UIProvider>
 *   <MessageHandler>
 *     <A2UIRenderer onAction={handleAction} />
 *   </MessageHandler>
 * </A2UIProvider>
 * ```
 */
function useA2UIMessageHandler(): {
  processMessage: (message: A2UIMessage) => void
  processMessages: (messages: A2UIMessage[]) => void
  clear: () => void
}
````

### Utils

```typescript
// @a2ui-sdk/utils/0.8

/**
 * Resolves a ValueSource to its actual value.
 *
 * @param source - The value source to resolve
 * @param dataModel - The data model to resolve against
 * @param basePath - Base path for relative path resolution (default: null)
 * @param defaultValue - Default value if resolution fails
 *
 * @example
 * // Literal values
 * resolveValue({ literalString: "Hello" }, {}, null); // "Hello"
 * resolveValue({ literalNumber: 42 }, {}, null);      // 42
 *
 * // Absolute path references
 * const model = { user: { name: "John" } };
 * resolveValue({ path: "/user/name" }, model, null);  // "John"
 *
 * // Relative path with basePath
 * const items = { items: [{ name: "Item 1" }] };
 * resolveValue({ path: "name" }, items, "/items/0");  // "Item 1"
 */
function resolveValue<T = unknown>(
  source: ValueSource | undefined,
  dataModel: DataModel,
  basePath: string | null = null,
  defaultValue?: T
): T

/**
 * Converts a DataEntry array to a plain object.
 * Used for processing dataModelUpdate message contents.
 */
function contentsToObject(contents: DataEntry[]): Record<string, DataModelValue>

/**
 * Resolves action context items to a plain object.
 * Used when dispatching actions to resolve all context values.
 *
 * @param context - Action context items to resolve
 * @param dataModel - The data model to resolve against
 * @param basePath - Base path for relative path resolution (default: null)
 */
function resolveActionContext(
  context: Array<{ key: string; value: ValueSource }> | undefined,
  dataModel: DataModel,
  basePath: string | null = null
): Record<string, unknown>

/**
 * Gets a value from the data model by path.
 */
function getValueByPath(
  dataModel: DataModel,
  path: string
): DataModelValue | undefined

/**
 * Sets a value in the data model by path, returning a new data model.
 * This function is immutable.
 */
function setValueByPath(
  dataModel: DataModel,
  path: string,
  value: unknown
): DataModel

/**
 * Merges data into the data model at a given path.
 * Used for dataModelUpdate messages where contents are merged.
 */
function mergeAtPath(
  dataModel: DataModel,
  path: string,
  data: Record<string, unknown>
): DataModel

/**
 * Normalizes a path to ensure it starts with '/' and has no trailing '/'.
 *
 * @example
 * normalizePath("user/name") // "/user/name"
 * normalizePath("/items/")   // "/items"
 */
function normalizePath(path: string): string

/**
 * Checks if a path is absolute (starts with '/').
 *
 * @example
 * isAbsolutePath("/user/name") // true
 * isAbsolutePath("name")       // false
 */
function isAbsolutePath(path: string): boolean

/**
 * Joins a base path with a relative path.
 *
 * @example
 * joinPaths("/items/0", "name")  // "/items/0/name"
 * joinPaths("/items", "../users") // "/users"
 */
function joinPaths(basePath: string, relativePath: string): string

/**
 * Resolves a path against a base path.
 * Absolute paths are returned as-is.
 * Relative paths are joined with the base path.
 * If basePath is null, relative paths are treated as absolute.
 *
 * @example
 * resolvePath("/user/name", "/items/0") // "/user/name" (absolute)
 * resolvePath("name", "/items/0")       // "/items/0/name" (relative)
 * resolvePath("name", null)             // "/name" (relative, no base)
 */
function resolvePath(path: string, basePath: string | null): string
```

### Types

```typescript
// @a2ui-sdk/types/0.8

/**
 * A2UI message from server to client.
 * Only one of the fields should be set per message.
 */
interface A2UIMessage {
  beginRendering?: BeginRenderingPayload
  surfaceUpdate?: SurfaceUpdatePayload
  dataModelUpdate?: DataModelUpdatePayload
  deleteSurface?: DeleteSurfacePayload
}

/**
 * Resolved action payload sent to the action handler.
 */
interface A2UIAction {
  surfaceId: string
  name: string
  context: Record<string, unknown>
  sourceComponentId: string
}

/**
 * Action handler callback function.
 */
type ActionHandler = (action: A2UIAction) => void

/**
 * Represents a value source - either a literal value or a reference to a data model path.
 */
type ValueSource =
  | { literalString: string }
  | { literalNumber: number }
  | { literalBoolean: boolean }
  | { literalArray: string[] }
  | { path: string }

/**
 * Action definition (attached to Button components).
 */
interface Action {
  name: string
  context?: ActionContextItem[]
}

/**
 * Scope value for collection scopes.
 * Tracks the current data path when rendering template-bound children.
 */
interface ScopeValue {
  /**
   * Base path for relative path resolution.
   * null = root scope (no scoping)
   * string = scoped to a specific data path (e.g., "/items/0")
   */
  basePath: string | null
}
```

## V0.9

> **⚠️ Draft Version Warning:** V0.9 is currently a draft implementation based on the A2UI specification as of 2026-03-11. The protocol has changed significantly recently and may continue to evolve. **We recommend using the stable v0.8 for production use until v0.9 reaches alpha or beta status.**

### React

````typescript
// @a2ui-sdk/react/0.9

/**
 * Provider component that processes A2UI messages and sets up contexts.
 * The messages prop is optional - use useA2UIMessageHandler hook for incremental updates.
 */
function A2UIProvider(props: {
  messages?: A2UIMessage[]
  catalog?: Catalog
  children: React.ReactNode
}): React.ReactElement

/**
 * Catalog containing components and functions.
 */
interface Catalog {
  components: Record<string, React.ComponentType<any>>
  functions: Record<string, unknown>
}

/**
 * Standard catalog with all built-in components.
 * Use as base and extend with custom components.
 */
const standardCatalog: Catalog

/**
 * Creates a FunctionRegistry pre-loaded with all standard functions
 * (format, logic, validation, navigation).
 */
function createStandardFunctionRegistry(): FunctionRegistry

/**
 * Main renderer component that renders all surfaces.
 * Wraps children with ErrorProvider, FunctionRegistryProvider,
 * ActionProvider, and ThemeProvider.
 */
function A2UIRenderer(props: {
  surfaceId?: string
  onAction?: ActionHandler
  onError?: ErrorHandler
  functionRegistry?: FunctionRegistry
}): React.ReactElement

/**
 * Renders a component by ID from the component registry.
 */
function ComponentRenderer(props: {
  surfaceId: string
  componentId: string
}): React.ReactElement

/**
 * Returns a function to dispatch actions from custom components.
 */
function useDispatchAction(): (
  surfaceId: string,
  componentId: string,
  action: Action
) => void

/**
 * Resolves a DynamicValue to its actual value.
 */
function useDataBinding<T = unknown>(
  source: DynamicValue | undefined,
  defaultValue?: T
): T

/**
 * Hook for two-way data binding in form components.
 * @returns Tuple of [value, setValue]
 */
function useFormBinding<T = unknown>(
  source: FormBindableValue | undefined,
  defaultValue?: T
): [T, (value: T) => void]

/**
 * Resolves a DynamicString with interpolation support.
 */
function useStringBinding(
  source: DynamicString | undefined,
  defaultValue?: string
): string

/**
 * Hook to access the data model for a surface.
 */
function useDataModel(): DataModel

/**
 * Hook to validate components with check rules.
 */
function useValidation(checks: CheckRule[] | undefined): ValidationResult

/**
 * Hook to access the Surface context.
 */
function useSurfaceContext(): SurfaceContextValue

/**
 * Hook to access the current scope value.
 */
function useScope(): ScopeValue

/**
 * Hook to get the current scope base path.
 */
function useScopeBasePath(): string | null

/**
 * Provider component for action dispatching.
 * Creates a context for managing action handlers.
 *
 * Note: Usually not needed as A2UIRenderer already includes this.
 * Use only for advanced customization scenarios.
 */
function ActionProvider(props: {
  onAction?: ActionHandler
  functionRegistry?: FunctionRegistry
  getSendDataModel?: (surfaceId: string) => boolean
  children: React.ReactNode
}): React.ReactElement

/**
 * Hook to access the Action context.
 * Provides access to the action dispatcher and handler.
 *
 * @throws Error if used outside of ActionProvider
 */
function useActionContext(): ActionContextValue

interface ActionContextValue {
  dispatchAction: (
    surfaceId: string,
    componentId: string,
    action: Action,
    dataModel: DataModel,
    basePath?: string | null
  ) => void
  onAction: ActionHandler | null
}

/**
 * Provider for a FunctionRegistry instance.
 * Usually not needed as A2UIRenderer already includes this.
 */
function FunctionRegistryProvider(props: {
  registry?: FunctionRegistry
  children: React.ReactNode
}): React.ReactElement

/**
 * Hook to access the function registry.
 */
function useFunctionRegistry(): FunctionRegistry | undefined

/**
 * Provider for error reporting.
 * Usually not needed as A2UIRenderer already includes this.
 */
function ErrorProvider(props: {
  onError?: ErrorHandler
  children: React.ReactNode
}): React.ReactElement

/**
 * Hook to access the error reporting context.
 */
function useErrorContext(): { reportError: (error: ErrorPayload) => void }

/**
 * Provider for surface-level theme configuration.
 * Usually not needed as A2UIRenderer already includes this.
 */
function ThemeProvider(props: {
  theme?: ThemeConfig
  children: React.ReactNode
}): React.ReactElement

/**
 * Hook to access the current theme configuration.
 */
function useTheme(): ThemeConfig | undefined

/**
 * Hook for processing A2UI messages incrementally.
 * Use this to push messages without clearing existing state,
 * preserving user edits when new messages arrive.
 *
 * @returns Object with processMessage, processMessages, and clear functions
 *
 * @example
 * ```tsx
 * function MessageHandler({ children }) {
 *   const { processMessage, processMessages } = useA2UIMessageHandler()
 *
 *   useEffect(() => {
 *     // Listen for incremental updates
 *     const ws = new WebSocket('ws://example.com')
 *     ws.onmessage = (event) => {
 *       processMessage(JSON.parse(event.data))
 *     }
 *
 *     return () => ws.close()
 *   }, [processMessage, processMessages])
 *
 *   return <>{children}</>
 * }
 *
 * <A2UIProvider>
 *   <MessageHandler>
 *     <A2UIRenderer onAction={handleAction} />
 *   </MessageHandler>
 * </A2UIProvider>
 * ```
 */
function useA2UIMessageHandler(): {
  processMessage: (message: A2UIMessage) => void
  processMessages: (messages: A2UIMessage[]) => void
  clear: () => void
}

/**
 * Type guards for discriminating action types.
 */
function isEventAction(action: Action): action is EventAction
function isFunctionCallAction(action: Action): action is FunctionCallAction
````

### Utils

```typescript
// @a2ui-sdk/utils/0.9

/**
 * Interpolates a string template with values from the data model.
 * Supports `${path}` syntax for data binding.
 * @example
 * interpolate("Hello ${/user/name}!", { user: { name: "World" } })
 * // => "Hello World!"
 */
function interpolate(template: string, dataModel: DataModel): string

/**
 * Checks if a string contains interpolation expressions.
 */
function hasInterpolation(value: string): boolean

/**
 * Resolves a DynamicValue to its actual value.
 * Handles literal values, path bindings, and function calls.
 */
function resolveValue<T = unknown>(
  value: FormBindableValue | undefined | null,
  dataModel: DataModel,
  basePath?: string | null,
  defaultValue?: T,
  registry?: FunctionRegistry
): T

/**
 * Resolves a DynamicString to a string.
 * Convenience wrapper with string coercion.
 */
function resolveString(
  value: DynamicString | undefined | null,
  dataModel: DataModel,
  basePath?: string | null,
  defaultValue?: string,
  registry?: FunctionRegistry
): string

/**
 * Resolves action context values to a plain object.
 */
function resolveContext(
  context: Record<string, DynamicValue> | undefined,
  dataModel: DataModel,
  basePath?: string | null
): Record<string, unknown>

/**
 * Gets a value from the data model at a JSON Pointer path.
 */
function getValueByPath(dataModel: DataModel, path: string): unknown

/**
 * Sets a value in the data model at a JSON Pointer path.
 */
function setValueByPath(
  dataModel: DataModel,
  path: string,
  value: unknown
): DataModel

/**
 * Evaluates a CheckRule's condition as a DynamicBoolean.
 */
function evaluateCheckRule(rule: CheckRule, context: EvaluationContext): boolean

/**
 * Evaluates all checks and returns a ValidationResult.
 */
function evaluateChecks(
  checks: CheckRule[] | undefined,
  dataModel: DataModel,
  basePath: string | null,
  registry?: FunctionRegistry
): ValidationResult

/**
 * Framework-agnostic data store with path-based subscriptions.
 * Supports useSyncExternalStore integration.
 */
class DataStore {
  get(path: string): unknown
  set(path: string, value: unknown): void
  subscribe(path: string, callback: () => void): () => void
  getSnapshot(): DataModel
}

/**
 * Registry for local function execution.
 */
class FunctionRegistry {
  register(name: string, fn: FunctionImplementation): void
  get(name: string): FunctionImplementation | undefined
  has(name: string): boolean
  execute(
    name: string,
    args: Record<string, unknown>,
    dataModel: DataModel,
    basePath: string | null
  ): unknown
}

/**
 * Coercion utilities (per spec coercion table).
 */
function coerceToBoolean(value: unknown): boolean
function coerceToString(value: unknown): string
function coerceToNumber(value: unknown): number
```

### Types

```typescript
// @a2ui-sdk/types/0.9

/**
 * A2UI message from server to client.
 * Optionally includes a protocol version field.
 */
type A2UIMessage = { version?: string } & (
  | { createSurface: CreateSurfacePayload }
  | { updateComponents: UpdateComponentsPayload }
  | { updateDataModel: UpdateDataModelPayload }
  | { deleteSurface: DeleteSurfacePayload }
)

/**
 * CreateSurface message payload.
 */
interface CreateSurfacePayload {
  surfaceId: string
  catalogId: string
  root: string
  theme?: ThemeConfig
  sendDataModel?: boolean
}

/**
 * Theme configuration for a surface.
 */
interface ThemeConfig {
  primaryColor?: string
  iconUrl?: string
  agentDisplayName?: string
}

/**
 * Resolved action payload sent to the action handler.
 */
interface A2UIAction {
  name: string
  surfaceId: string
  sourceComponentId: string
  timestamp: string // ISO 8601
  context: Record<string, unknown>
  dataModel?: Record<string, unknown>
}

/**
 * Action handler callback function.
 */
type ActionHandler = (action: A2UIAction) => void

/**
 * Error payload for client-to-server error reporting.
 */
interface ErrorPayload {
  code: string
  surfaceId: string
  path?: string
  message: string
}

/**
 * Error handler callback type.
 */
type ErrorHandler = (error: ErrorPayload) => void

/**
 * Dynamic value types for data binding.
 */
type DynamicValue =
  | string
  | number
  | boolean
  | unknown[]
  | { path: string }
  | FunctionCall
type DynamicString = string | { path: string } | FunctionCall
type DynamicNumber = number | { path: string } | FunctionCall
type DynamicBoolean = boolean | { path: string } | FunctionCall
type DynamicStringList = string[] | { path: string } | FunctionCall

/**
 * A function call expression.
 */
interface FunctionCall {
  call: string
  args?: Record<string, DynamicValue>
  returnType?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any'
}

/**
 * Action definition (attached to interactive components).
 * Discriminated union: either an event (dispatched to server)
 * or a functionCall (executed locally).
 */
type Action = EventAction | FunctionCallAction

interface EventAction {
  event: {
    name: string
    context?: Record<string, DynamicValue>
  }
}

interface FunctionCallAction {
  functionCall: FunctionCall
}

/**
 * Type guards for action discrimination.
 */
function isEventAction(action: Action): action is EventAction
function isFunctionCallAction(action: Action): action is FunctionCallAction

/**
 * Check rule for validation.
 * Uses condition-based DynamicBoolean evaluation.
 */
interface CheckRule {
  condition: DynamicBoolean
  message: string
}

/**
 * Validation result.
 */
interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Accessibility attributes for components.
 */
interface AccessibilityAttributes {
  label?: DynamicString
  description?: DynamicString
}

/**
 * Common properties for all components.
 */
interface ComponentCommon {
  id: string
  accessibility?: AccessibilityAttributes
}

/**
 * Common properties for catalog components.
 */
interface CatalogComponentCommon {
  weight?: number // flex-grow for Row/Column children
}

/**
 * Children definition for container components.
 */
type ChildList = string[] | TemplateBinding

/**
 * Template binding for dynamic child generation.
 */
interface TemplateBinding {
  componentId: string
  path: string
}
```
