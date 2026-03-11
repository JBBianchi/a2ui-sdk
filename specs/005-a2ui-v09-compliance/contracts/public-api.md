# Public API Contract Changes: A2UI v0.9 Compliance

**Feature**: 005-a2ui-v09-compliance | **Date**: 2026-03-11

## Breaking Changes (v0.9 module only)

### 1. Action Type

**Before** (consumers of `@a2ui-sdk/types/0.9`):

```typescript
import type { Action } from '@a2ui-sdk/types/0.9'
// Action was: { name: string, context?: Record<string, DynamicValue> }
```

**After**:

```typescript
import type { Action } from '@a2ui-sdk/types/0.9'
// Action is now: { event: { name: string, context?: ... } } | { functionCall: FunctionCall }
```

**Migration**: Wrap existing action definitions in `{ event: { ... } }`.

### 2. CheckRule Type

**Before**:

```typescript
// CheckRule had: { call?, args?, and?, or?, not?, true?, false?, message }
```

**After**:

```typescript
// CheckRule is now: { condition: DynamicBoolean, message: string }
```

**Migration**: Move `call`/`args` into `condition: { call, args, returnType: "boolean" }`.

### 3. Button `primary` → `variant`

**Before**: `primary?: boolean`
**After**: `variant?: 'default' | 'primary' | 'borderless'`

**Migration**: Replace `primary: true` with `variant: "primary"`.

### 4. DateTimeInput defaults

**Before**: `enableDate` defaulted to `true`
**After**: `enableDate` defaults to `false` (per spec)

**Migration**: Add explicit `enableDate: true` where date picking was expected.

### 5. DynamicValue

**Before**: `string | number | boolean | { path } | FunctionCall`
**After**: `string | number | boolean | unknown[] | { path } | FunctionCall`

**Migration**: No action needed (additive).

### 6. ComponentCommon / CatalogComponentCommon

**Before**: `ComponentCommon` had `id` and `weight`
**After**: `ComponentCommon` has `id` and `accessibility`. `CatalogComponentCommon` has `weight`.

**Migration**: Component implementations using `weight` from `ComponentCommon` must reference `CatalogComponentCommon` instead.

## New Public API Additions

### onError Callback

```typescript
// A2UIRenderer props
<A2UIRenderer
  onAction={handleAction}
  onError={handleError}    // NEW: optional error callback
/>

// Error handler signature
type ErrorHandler = (error: ErrorPayload) => void

interface ErrorPayload {
  code: string        // "VALIDATION_FAILED" | "UNKNOWN_COMPONENT" | "BINDING_FAILED" | string
  surfaceId: string
  path?: string       // JSON pointer for validation errors
  message: string
}
```

### ThemeContext

```typescript
import { useTheme } from '@a2ui-sdk/react/0.9'

// Inside a custom component:
const theme = useTheme()
// theme.primaryColor, theme.iconUrl, theme.agentDisplayName
```

### FunctionRegistry

```typescript
import type { FunctionImplementation } from '@a2ui-sdk/utils/0.9'

// Custom functions can be registered via catalog extensions
const customCatalog = {
  ...standardCatalog,
  functions: {
    ...standardCatalog.functions,
    myFunction: { name: 'myFunction', returnType: 'string', execute: (args, dataModel, basePath) => { ... } }
  }
}
```

## Unchanged Public API

The following remain backward-compatible:

- `A2UIProvider` — accepts `messages`, `components` (custom catalog), children
- `A2UIRenderer` — accepts `onAction` (unchanged), adds optional `onError`
- `useDispatchAction` — signature unchanged (internally uses new Action discriminant)
- `useDataBinding` — signature unchanged (internally uses DataStore)
- `useFormBinding` — signature unchanged
- `useStringBinding` — signature unchanged
- `ComponentRenderer` — signature unchanged (internally adds accessibility attrs)
- Custom component registration via `components` prop on `A2UIProvider`
