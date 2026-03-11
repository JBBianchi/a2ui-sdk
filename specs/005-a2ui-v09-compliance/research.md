# Research: A2UI v0.9 Specification Compliance

**Feature**: 005-a2ui-v09-compliance | **Date**: 2026-03-11

## R1: Granular Data Model Notification Strategy

**Decision**: Implement a path-based subscription store using `useSyncExternalStore` with a custom `DataStore` class that tracks subscribers per JSON Pointer path.

**Rationale**: The spec renderer guide mandates bubble-up (ancestor) and cascade-down (descendant) notifications. React's built-in context re-renders all consumers. `useSyncExternalStore` integrates cleanly with React 19's concurrent features and allows per-path granularity.

**Alternatives considered**:

- **Zustand/Jotai**: Would add external dependency to a library package. Rejected to keep dependencies minimal.
- **Custom EventEmitter + useEffect**: Works but doesn't integrate with React's concurrent mode. `useSyncExternalStore` is the React-blessed approach.
- **Signals (e.g., @preact/signals-react)**: Good perf but adds framework-specific dependency. Rejected for same reason as Zustand.

**Implementation approach**:

- `DataStore` class wraps the data model Map. Maintains a `Map<path, Set<callback>>` for subscriptions.
- On `set(path, value)`: notify exact match, iterate parent paths (bubble), iterate child paths (cascade).
- `useDataBinding` hook calls `useSyncExternalStore(store.subscribe(path), store.getSnapshot(path))`.
- `SurfaceContext` delegates data operations to `DataStore` per surface.

---

## R2: FunctionCall Evaluation Pipeline

**Decision**: Create a `FunctionRegistry` class in utils that maps function names to implementations. Wire it into `resolveValue`/`resolveString` via a registry parameter.

**Rationale**: The spec requires FunctionCall objects in DynamicValue positions to be evaluated. The existing `resolveValue` returns `undefined` for function calls. The registry pattern matches the spec's catalog function model and supports custom catalogs.

**Alternatives considered**:

- **Inline switch/case in resolveValue**: Simple but not extensible for custom catalogs. Rejected.
- **Passing functions as React context**: Would couple utils to React. Rejected — utils must remain framework-agnostic.

**Implementation approach**:

- `FunctionRegistry` holds a `Map<string, FunctionImplementation>`.
- `resolveValue(value, dataModel, basePath, registry)` — when value is a FunctionCall, look up in registry, resolve args recursively, invoke.
- `resolveString` delegates to `resolveValue` and coerces result to string.
- React layer creates registry from catalog functions and passes to resolution utilities via context.

---

## R3: formatString and Interpolation Scope

**Decision**: Remove automatic `${...}` interpolation from `resolveString`. Only apply it inside the `formatString` function implementation.

**Rationale**: The spec explicitly states interpolation via `${...}` is ONLY supported within `formatString`, not in general string properties. The current implementation applies interpolation to all strings, which violates the spec.

**Alternatives considered**:

- **Keep global interpolation as "convenience"**: Violates spec. Rejected.
- **Feature flag**: Over-engineering for a pre-1.0 breaking change. Rejected.

**Implementation approach**:

- Strip `hasInterpolation`/`interpolate` calls from `resolveString` in `dataBinding.ts`.
- Move interpolation logic into `formatString` function implementation in `functions/formatString.ts`.
- The existing interpolation engine (`utils/0.9/interpolation/`) is reused by `formatString`.

---

## R4: TR35 Date Pattern Support

**Decision**: Implement TR35 pattern parsing with a manual tokenizer that maps TR35 tokens to `Intl.DateTimeFormat` options, then formats using `Intl.DateTimeFormat`.

**Rationale**: `Intl.DateTimeFormat` supports locale-aware formatting but uses options objects, not TR35 patterns. A thin mapping layer converts TR35 tokens (yyyy, MM, dd, HH, mm, ss, etc.) to `Intl.DateTimeFormat` options. For patterns that don't map cleanly to a single `Intl.DateTimeFormat` call, format individual parts and concatenate.

**Alternatives considered**:

- **date-fns/format**: Adds 10KB+ dependency. Rejected for library bundle size.
- **Temporal API**: Not yet widely available. Rejected.
- **Full ICU implementation**: Overkill. Rejected.

**Implementation approach**:

- Parse TR35 pattern into tokens (year, month, day, hour, minute, second, period, literal).
- For each token, use `Intl.DateTimeFormat` with appropriate options to get the formatted part.
- Concatenate parts respecting literal text between tokens.
- Spec only requires the common TR35 tokens listed in the `formatDate` function description.

---

## R5: Type Coercion Layer

**Decision**: Implement a standalone `coerceValue<T>(value: unknown, targetType: 'string' | 'number' | 'boolean'): T` utility in `utils/0.9/coercion.ts`.

**Rationale**: The spec mandates a specific coercion table for cross-platform parity. Currently no standardized coercion exists. The utility must be used at all value resolution boundaries.

**Implementation approach**:

- `coerceToBoolean(v)`: "true"/"false" strings (case-insensitive), non-zero numbers → true, else false.
- `coerceToString(v)`: null/undefined → "", else String(v).
- `coerceToNumber(v)`: null/undefined → 0, numeric strings → parseFloat, else 0.
- Integrate into `resolveValue` when target type is known, and into `useFormBinding` for type-specific bindings.

---

## R6: Action Type Restructuring

**Decision**: Change `Action` type from flat `{ name, context }` to discriminated union `{ event: {...} } | { functionCall: FunctionCall }`. Update all consumers.

**Rationale**: The spec's `common_types.json#/$defs/Action` uses this discriminated structure. The current flat structure can't represent local function call actions.

**Implementation approach**:

- Update `Action` type in `types/0.9/index.ts`.
- Type guards: `isEventAction(a)` and `isFunctionCallAction(a)`.
- `ActionContext.dispatchAction`: check discriminant, dispatch event to `onAction`, execute functionCall locally.
- `ButtonComponent`: unwrap `action.event` for display/context, handle `action.functionCall` directly.
- `ActionPayload` (client-to-server): remains `{ name, context, surfaceId, ... }` — only extracted from `event` actions.

---

## R7: CheckRule Restructuring

**Decision**: Change `CheckRule` from embedded operators to `{ condition: DynamicBoolean, message: string }`.

**Rationale**: The spec wraps validation logic under a `condition` field that is a `DynamicBoolean`. The current structure embeds `call`/`args`/`and`/`or`/`not` directly on CheckRule.

**Implementation approach**:

- Update `CheckRule` type in `types/0.9/index.ts`.
- `evaluateCheckRule` in `validation.ts`: resolve `rule.condition` as a DynamicBoolean (literal boolean, path binding, or FunctionCall).
- `and`/`or`/`not` registered as callable functions in the function registry.
- `useValidation` hook passes function registry to evaluation.

---

## R8: Path-Based DataStore Implementation

**Decision**: Implement `DataStore` as a standalone class managing per-surface data with path-based subscriptions.

**Rationale**: The spec renderer guide describes a `DataModel` class with `subscribe(path, callback)` that supports bubble/cascade notifications. The current React implementation uses a single `surfaces` Map in context, triggering full re-renders.

**Implementation approach**:

- `DataStore` class per surface:
  - `data: Record<string, unknown>` — flat storage by JSON Pointer path.
  - `subscribers: Map<string, Set<Callback>>` — path → listener sets.
  - `get(path)` — resolve value.
  - `set(path, value)` — update and notify (exact + ancestors + descendants).
  - `subscribe(path, cb)` — returns unsubscribe function.
  - `getSnapshot(path)` — for `useSyncExternalStore`.
- `SurfaceContext` creates a `DataStore` per surface on `createSurface`.
- `useDataBinding` uses `useSyncExternalStore` with `DataStore.subscribe`/`getSnapshot`.
- `setDataValue` (two-way binding) delegates to `DataStore.set`.

---

## R9: Schema and Artifact Updates

**Decision**: Replace bundled schemas with copies from the upstream spec. Rename files and update all internal references.

**Rationale**: Schema file names, `$id` URLs, and structures have drifted from the upstream spec.

**Implementation approach**:

- Rename `standard_catalog.json` → `basic_catalog.json`.
- Rename `a2ui_client_capabilities_schema.json` → `a2ui_client_capabilities.json`.
- Update all `$id` from `https://a2ui.dev/specification/0.9/` to `https://a2ui.org/specification/v0_9/`.
- Update all internal `$ref` paths accordingly.
- Refresh or remove stale embedded docs (`a2ui_protocol.md`, `evolution_guide.md`).
