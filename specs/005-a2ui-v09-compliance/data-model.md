# Data Model: A2UI v0.9 Specification Compliance

**Feature**: 005-a2ui-v09-compliance | **Date**: 2026-03-11

## Type Changes (packages/types/src/0.9/index.ts)

### Action (RESTRUCTURED)

**Before**:

```typescript
interface Action {
  name: string
  context?: Record<string, DynamicValue>
}
```

**After**:

```typescript
type Action =
  | { event: { name: string; context?: Record<string, DynamicValue> } }
  | { functionCall: FunctionCall }
```

**Relationships**: Referenced by `ButtonComponentProps.action`. Consumed by `ActionContext.dispatchAction`. Event actions produce `ActionPayload` for `onAction` callback. FunctionCall actions invoke catalog functions locally.

### CheckRule (RESTRUCTURED)

**Before**:

```typescript
interface CheckRule {
  message: string
  call?: string
  args?: Record<string, DynamicValue>
  and?: CheckRule[]
  or?: CheckRule[]
  not?: CheckRule
  true?: true
  false?: false
}
```

**After**:

```typescript
interface CheckRule {
  condition: DynamicBoolean
  message: string
}
```

**Relationships**: Referenced by all Checkable components (Button, TextField, CheckBox, ChoicePicker, Slider, DateTimeInput). Evaluated by `evaluateCheckRule` in validation.ts. `condition` is a `DynamicBoolean` resolved via the function evaluation pipeline.

### DynamicValue (EXTENDED)

**Before**:

```typescript
type DynamicValue = string | number | boolean | { path: string } | FunctionCall
```

**After**:

```typescript
type DynamicValue =
  | string
  | number
  | boolean
  | unknown[]
  | { path: string }
  | FunctionCall
```

**Change**: Added `unknown[]` array literal variant per spec.

### A2UIMessage (EXTENDED)

**Before**: Union of message payloads without version.

**After**: Add optional `version?: string` to each message type or create envelope:

```typescript
type A2UIMessage = {
  version?: string
} & (
  | { createSurface: CreateSurfacePayload }
  | { updateComponents: UpdateComponentsPayload }
  | { updateDataModel: UpdateDataModelPayload }
  | { deleteSurface: DeleteSurfacePayload }
)
```

### CreateSurfacePayload (EXTENDED)

**Before**:

```typescript
interface CreateSurfacePayload {
  surfaceId: string
  catalogId?: string
}
```

**After**:

```typescript
interface CreateSurfacePayload {
  surfaceId: string
  catalogId?: string
  root: string
  theme?: ThemeConfig
  sendDataModel?: boolean
}
```

### ThemeConfig (NEW)

```typescript
interface ThemeConfig {
  primaryColor?: string // Hex color, e.g., "#FF5733"
  iconUrl?: string // URI for agent icon
  agentDisplayName?: string // Agent display name
}
```

### AccessibilityAttributes (NEW)

```typescript
interface AccessibilityAttributes {
  label?: DynamicString
  description?: DynamicString
}
```

### ComponentCommon (RESTRUCTURED)

**Before**:

```typescript
interface ComponentCommon {
  id: string
  weight?: number
}
```

**After**:

```typescript
interface ComponentCommon {
  id: string
  accessibility?: AccessibilityAttributes
}

interface CatalogComponentCommon {
  weight?: number
}
```

### ErrorPayload (NEW)

```typescript
interface ErrorPayload {
  code: string // e.g., "VALIDATION_FAILED", "UNKNOWN_COMPONENT", "BINDING_FAILED"
  surfaceId: string
  path?: string // JSON pointer to failing field (for validation errors)
  message: string
}
```

### ActionPayload (EXTENDED)

**Before**:

```typescript
interface ActionPayload {
  name: string
  surfaceId: string
  sourceComponentId: string
  timestamp: string
  context: Record<string, unknown>
}
```

**After**: Add optional data model metadata:

```typescript
interface ActionPayload {
  name: string
  surfaceId: string
  sourceComponentId: string
  timestamp: string
  context: Record<string, unknown>
  dataModel?: Record<string, unknown> // Included when sendDataModel is true
}
```

## Type Changes (packages/types/src/0.9/standard-catalog.ts)

### ButtonComponentProps

**Before**: `primary?: boolean`
**After**: `variant?: 'default' | 'primary' | 'borderless'` (default: `'default'`)

### ChoicePickerComponentProps (EXTENDED)

Add:

- `displayStyle?: 'checkbox' | 'chips'` (default: `'checkbox'`)
- `filterable?: boolean` (default: `false`)

### DateTimeInputComponentProps (MODIFIED)

- Add: `min?: DynamicString`, `max?: DynamicString`
- Remove: `outputFormat?: string`
- Fix default: `enableDate` defaults to `false` (was `true`)

### TextFieldComponentProps (EXTENDED)

Add: `validationRegexp?: string`

### SliderComponentProps (MODIFIED)

- Change: `min` from required to optional (default: `0`)
- No default for `max` (remains required)

### ImageComponentProps (MODIFIED)

- Change: `fit` enum value `'scale-down'` → `'scaleDown'`

## New Entities (packages/utils/src/0.9/)

### FunctionImplementation

```typescript
interface FunctionImplementation {
  name: string
  returnType: 'string' | 'number' | 'boolean' | 'void'
  execute(
    args: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    basePath: string | null
  ): unknown
}
```

### FunctionRegistry

```typescript
class FunctionRegistry {
  register(fn: FunctionImplementation): void
  get(name: string): FunctionImplementation | undefined
  execute(
    name: string,
    args: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    basePath: string | null
  ): unknown
}
```

### DataStore

```typescript
class DataStore {
  get(path: string): unknown
  set(path: string, value: unknown): void
  subscribe(path: string, callback: () => void): () => void
  getSnapshot(path: string): unknown
  dispose(): void
}
```

## State Transitions

### Surface Lifecycle

```
[No Surface] → createSurface → [Created: has id, catalogId, root, theme, sendDataModel, empty components/data]
[Created] → updateComponents → [Updated: components map modified]
[Updated] → updateDataModel → [Data Updated: DataStore notified at path]
[Any State] → deleteSurface → [No Surface: DataStore disposed]
```

### Component Type-Change on updateComponents

```
[Component exists with type A] → updateComponents with same id, type B → [Destroy A] → [Create B with fresh state]
[Component exists with type A] → updateComponents with same id, type A → [Update properties only]
```

### Action Dispatch Flow

```
[Button click] → resolve Action discriminant
  → if { event }: resolve context DynamicValues → create ActionPayload → if sendDataModel: attach dataModel → call onAction
  → if { functionCall }: lookup function → resolve args → execute locally (e.g., openUrl)
```
