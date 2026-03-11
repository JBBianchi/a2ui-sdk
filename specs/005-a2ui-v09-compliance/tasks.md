# Tasks: A2UI v0.9 Specification Compliance

**Input**: Design documents from `/specs/005-a2ui-v09-compliance/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included — the spec requires new test coverage for each changed component and utility (SC-006).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project scaffolding needed — this is an existing monorepo. Setup covers branch readiness and build verification.

- [x] T001 Verify clean build of all three packages in dependency order: `npm run build -w @a2ui-sdk/types && npm run build -w @a2ui-sdk/utils && npm run build -w @a2ui-sdk/react`
- [x] T002 Run existing test suites to establish baseline: `npm run test:run -w @a2ui-sdk/utils` and `npm run test:run -w @a2ui-sdk/react`

---

## Phase 2: Foundational (Types Package + Core Utils)

**Purpose**: All type definitions and core utility infrastructure that MUST be complete before any user story can be implemented. The types package is consumed by both utils and react — changes here unblock everything downstream.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Types: Core Type Restructuring

- [x] T003 Restructure `Action` type from flat `{ name, context }` to discriminated union `{ event: { name: string; context?: Record<string, DynamicValue> } } | { functionCall: FunctionCall }` in `packages/types/src/0.9/index.ts`. Add `isEventAction` and `isFunctionCallAction` type guards. (FR-001, FR-004)
- [x] T004 Restructure `CheckRule` type from embedded operators (`call`/`args`/`and`/`or`/`not`/`true`/`false`) to `{ condition: DynamicBoolean, message: string }` in `packages/types/src/0.9/index.ts`. Define `DynamicBoolean` as `boolean | { path: string } | FunctionCall`. (FR-005, FR-007)
- [x] T005 [P] Extend `DynamicValue` to include `unknown[]` array literal variant in `packages/types/src/0.9/index.ts`. (FR-050)
- [x] T006 [P] Add `version?: string` to `A2UIMessage` type (or create envelope) in `packages/types/src/0.9/index.ts`. (FR-047)
- [x] T007 [P] Extend `CreateSurfacePayload` with `theme?: ThemeConfig` and `sendDataModel?: boolean` in `packages/types/src/0.9/index.ts` (`root` already exists). Add `ThemeConfig` interface (`primaryColor`, `iconUrl`, `agentDisplayName`). (FR-028, FR-034, FR-053)
- [x] T008 [P] Add `AccessibilityAttributes` type (`label?: DynamicString`, `description?: DynamicString`) in `packages/types/src/0.9/index.ts`. (FR-031)
- [x] T009 [P] Restructure `ComponentCommon` to have `id` and `accessibility?: AccessibilityAttributes`. Create `CatalogComponentCommon` with `weight?: number` in `packages/types/src/0.9/index.ts`. (FR-051, FR-052)
- [x] T010 [P] Add `ErrorPayload` type (`code`, `surfaceId`, `path?`, `message`) in `packages/types/src/0.9/index.ts`. (FR-043)
- [x] T011 [P] Extend `ActionPayload` with optional `dataModel?: Record<string, unknown>` in `packages/types/src/0.9/index.ts`. (FR-035)

### Types: Component Prop Type Changes

- [x] T012 [P] Replace `primary?: boolean` with `variant?: 'default' | 'primary' | 'borderless'` on `ButtonComponentProps` in `packages/types/src/0.9/standard-catalog.ts`. (FR-008, FR-010)
- [x] T013 [P] Add `displayStyle?: 'checkbox' | 'chips'` and `filterable?: boolean` to `ChoicePickerComponentProps` in `packages/types/src/0.9/standard-catalog.ts`. (FR-021)
- [x] T014 [P] Add `min?: DynamicString` and `max?: DynamicString` to `DateTimeInputComponentProps`, remove `outputFormat`, document `enableDate` default as `false` in `packages/types/src/0.9/standard-catalog.ts`. (FR-022, FR-023, FR-024)
- [x] T015 [P] Add `validationRegexp?: string` to `TextFieldComponentProps` in `packages/types/src/0.9/standard-catalog.ts`. (FR-025)
- [x] T016 [P] Change `fit` enum value from `'scale-down'` to `'scaleDown'` on `ImageComponentProps` in `packages/types/src/0.9/standard-catalog.ts`. (FR-026)
- [x] T017 [P] Make `min` optional (default `0`) and remove implicit `max` default on `SliderComponentProps` in `packages/types/src/0.9/standard-catalog.ts`. (FR-027)
- [x] T018 Update all component prop types extending `ComponentCommon` to also extend `CatalogComponentCommon` for `weight` access in `packages/types/src/0.9/standard-catalog.ts`. Ensure all Checkable components reference the new `CheckRule` type.
- [x] T019 Build types package and verify no compilation errors: `npm run build -w @a2ui-sdk/types`

### Utils: Core Infrastructure

- [x] T020 Create `FunctionImplementation` interface and `FunctionRegistry` class (register, get, execute) in `packages/utils/src/0.9/functions/index.ts`. (per research R2 and data-model.md)
- [x] T021 [P] Create type coercion utilities (`coerceToBoolean`, `coerceToString`, `coerceToNumber`) in `packages/utils/src/0.9/coercion.ts` per spec coercion table. (FR-044, per research R5)
- [x] T022 Export new utils modules (`FunctionRegistry`, `FunctionImplementation`, coercion utilities) from `packages/utils/src/0.9/index.ts`.
- [x] T023 Build utils package and verify no compilation errors: `npm run build -w @a2ui-sdk/utils`

**Checkpoint**: Foundation ready — all type definitions and core utility infrastructure in place. User story implementation can begin.

---

## Phase 3: User Story 1 — Correct Action Dispatching (Priority: P1) 🎯 MVP

**Goal**: Buttons with `{ event }` dispatch to `onAction`; buttons with `{ functionCall }` execute locally. Old flat action format rejected.

**Independent Test**: Send a surface with two buttons — one event, one functionCall. Verify event dispatches to `onAction` and functionCall executes locally (e.g., `openUrl`).

### Tests for User Story 1

- [x] T024 [P] [US1] Write tests for `isEventAction` and `isFunctionCallAction` type guards in `packages/react/src/0.9/__tests__/action-guards.test.ts`
- [x] T025 [P] [US1] Write tests for action dispatching: event variant triggers `onAction`, functionCall variant executes locally, old flat format is rejected. In `packages/react/src/0.9/__tests__/action-dispatch.test.tsx`

### Implementation for User Story 1

- [x] T026 [US1] Update `ActionContext.tsx` to discriminate between `event` and `functionCall` action variants in `packages/react/src/0.9/contexts/ActionContext.tsx`. Event actions resolve context DynamicValues and call `onAction`. FunctionCall actions look up and execute from function registry. (FR-001, FR-002, FR-003)
- [x] T027 [US1] Update `useDispatchAction.ts` to use the new discriminated Action type in `packages/react/src/0.9/hooks/useDispatchAction.ts`. (FR-001)
- [x] T028 [US1] Update `ButtonComponent.tsx` to unwrap `action.event` / `action.functionCall` for dispatch in `packages/react/src/0.9/components/interactive/ButtonComponent.tsx`. (FR-001, FR-003)
- [x] T029 [US1] Implement `openUrl` function in `packages/utils/src/0.9/functions/openUrl.ts` using `window.open`. (FR-017) — needed for functionCall action testing
- [x] T030 [US1] Register `openUrl` in the function registry setup in `packages/react/src/0.9/standard-catalog/index.ts`. ⚠️ Shared file — serialize with T041 (US2) and T046a (US3).
- [x] T031 [US1] Run US1 tests and verify all pass.

**Checkpoint**: Action model works — event actions dispatch to server, functionCall actions execute locally.

---

## Phase 4: User Story 2 — Dynamic Data Display with Functions (Priority: P1)

**Goal**: FunctionCall objects in data binding positions evaluate correctly. `formatString`, `formatNumber`, `formatCurrency`, `formatDate`, `pluralize` produce formatted output. Raw strings do NOT interpolate.

**Independent Test**: Render Text components with function calls as `text` property. Verify formatted output. Verify raw `"Hello ${/name}"` is literal.

### Tests for User Story 2

- [x] T032 [P] [US2] Write tests for each catalog function: `formatString`, `formatNumber`, `formatCurrency`, `formatDate`, `pluralize` in `packages/utils/src/0.9/functions/__tests__/catalog-functions.test.ts`
- [x] T033 [P] [US2] Write tests for `resolveValue`/`resolveString` with FunctionCall evaluation and verify no auto-interpolation of raw strings in `packages/utils/src/0.9/__tests__/dataBinding-functions.test.ts`

### Implementation for User Story 2

- [x] T034 [P] [US2] Implement `formatString` function (with `${...}` interpolation) in `packages/utils/src/0.9/functions/formatString.ts`. Reuse existing interpolation engine. (FR-012)
- [x] T035 [P] [US2] Implement `formatNumber` function using `Intl.NumberFormat` in `packages/utils/src/0.9/functions/formatNumber.ts`. (FR-013)
- [x] T036 [P] [US2] Implement `formatCurrency` function using `Intl.NumberFormat` in `packages/utils/src/0.9/functions/formatCurrency.ts`. (FR-014)
- [x] T037 [P] [US2] Implement `formatDate` function with TR35 pattern support using `Intl.DateTimeFormat` in `packages/utils/src/0.9/functions/formatDate.ts`. (FR-015, per research R4)
- [x] T038 [P] [US2] Implement `pluralize` function using `Intl.PluralRules` in `packages/utils/src/0.9/functions/pluralize.ts`. (FR-016)
- [x] T039 [US2] Wire FunctionCall evaluation into `resolveValue` and `resolveString` in `packages/utils/src/0.9/dataBinding.ts` — when value is a FunctionCall, look up in registry, resolve args recursively, invoke. (FR-019)
- [x] T040 [US2] Remove automatic `${...}` interpolation from `resolveString` in `packages/utils/src/0.9/dataBinding.ts` — interpolation ONLY happens inside `formatString`. (FR-020, per research R3)
- [x] T041 [US2] Register all catalog functions (`formatString`, `formatNumber`, `formatCurrency`, `formatDate`, `pluralize`) in `packages/react/src/0.9/standard-catalog/index.ts`. (FR-011) ⚠️ Shared file — serialize with T030 (US1) and T046a (US3).
- [x] T042 [US2] Update `useDataBinding.ts` to pass function registry to resolution utilities in `packages/react/src/0.9/hooks/useDataBinding.ts`.
- [x] T043 [US2] Run US2 tests and verify all pass.

**Checkpoint**: Function evaluation pipeline works — formatted content renders correctly, raw strings are not interpolated.

---

## Phase 5: User Story 3 — Form Validation with CheckRules (Priority: P1)

**Goal**: CheckRules with `{ condition: DynamicBoolean, message }` evaluate reactively. `and`/`or`/`not` work as callable functions. Validation messages display on first failing check.

**Independent Test**: Render a TextField with `checks` using the new structure. Verify validation messages appear/disappear reactively as data model changes.

### Tests for User Story 3

- [x] T044 [P] [US3] Write tests for `evaluateCheckRule` with DynamicBoolean conditions (literal, path, FunctionCall, composed and/or/not) in `packages/utils/src/0.9/__tests__/validation-checkrule.test.ts`
- [x] T045 [P] [US3] Write tests for reactive validation in React components (message display, action disabling) in `packages/react/src/0.9/__tests__/validation-react.test.tsx`

### Implementation for User Story 3

- [x] T046 [P] [US3] Implement `and`, `or`, `not` as callable functions in `packages/utils/src/0.9/functions/logic.ts`. Register them in the function registry. (FR-018)
- [x] T046a [P] [US3] Wrap existing validation functions (`required`, `email`, `regex`, `length`, `numeric`) from `packages/utils/src/0.9/validation.ts` as `FunctionImplementation` objects and register them in `packages/react/src/0.9/standard-catalog/index.ts`. (FR-011, SC-003) ⚠️ Must complete before T047. Modifies `standard-catalog/index.ts` — serialize with T030 (US1) and T041 (US2) if stories run in parallel.
- [x] T047 [US3] Rewrite `evaluateCheckRule` in `packages/utils/src/0.9/validation.ts` to resolve `rule.condition` as a DynamicBoolean (literal boolean, path binding, or FunctionCall) through the function evaluation pipeline. (FR-005, FR-006, per research R7)
- [x] T048 [US3] Update `useValidation.ts` hook in `packages/react/src/0.9/hooks/useValidation.ts` to use reactive evaluation — subscribe to data model changes and re-evaluate conditions continuously. Display first failing check's message. (FR-006, FR-006a)
- [x] T049 [US3] Wire validation state to disable actions (Button clicks) when any CheckRule on the surface fails in `packages/react/src/0.9/contexts/ActionContext.tsx`. (FR-006a)
- [x] T050 [US3] Run US3 tests and verify all pass.

**Checkpoint**: Validation works reactively — CheckRules with compound conditions evaluate correctly, actions disabled on failure.

---

## Phase 6: User Story 4 — Button Variants (Priority: P2)

**Goal**: Buttons render with visually distinct styles for `"default"`, `"primary"`, and `"borderless"` variants.

**Independent Test**: Render three buttons with each variant and verify distinct visual styles.

### Tests for User Story 4

- [x] T051 [P] [US4] Write tests for Button variant rendering (default, primary, borderless, missing variant) in `packages/react/src/0.9/components/interactive/__tests__/ButtonVariant.test.tsx`

### Implementation for User Story 4

- [x] T052 [US4] Update `ButtonComponent.tsx` to replace `primary` prop logic with `variant` prop styling in `packages/react/src/0.9/components/interactive/ButtonComponent.tsx`. Implement distinct styles for each variant value. (FR-008, FR-009, FR-010)
- [x] T053 [US4] Run US4 tests and verify all pass.

**Checkpoint**: Button variants render correctly with distinct visual styles.

---

## Phase 7: User Story 5 — Component Property Alignment (Priority: P2)

**Goal**: ChoicePicker chips/filterable, DateTimeInput min/max/defaults, TextField regex, Image scaleDown, Slider optional min all work per spec.

**Independent Test**: Render each affected component with spec-compliant properties and verify correct behavior.

### Tests for User Story 5

- [x] T054 [P] [US5] Write tests for ChoicePicker `displayStyle: "chips"` and `filterable: true` in `packages/react/src/0.9/components/interactive/__tests__/ChoicePickerFeatures.test.tsx`
- [x] T055 [P] [US5] Write tests for DateTimeInput `min`/`max` constraints, default `enableDate: false`, removed `outputFormat` in `packages/react/src/0.9/components/interactive/__tests__/DateTimeInputFeatures.test.tsx`
- [x] T056 [P] [US5] Write tests for TextField `validationRegexp` in `packages/react/src/0.9/components/interactive/__tests__/TextFieldValidation.test.tsx`
- [x] T057 [P] [US5] Write tests for Image `fit: "scaleDown"` and Slider optional `min` in `packages/react/src/0.9/components/__tests__/ComponentProps.test.tsx`

### Implementation for User Story 5

- [x] T058 [P] [US5] Implement chip rendering mode and filter input in `packages/react/src/0.9/components/interactive/ChoicePickerComponent.tsx` for `displayStyle: "chips"` and `filterable: true`. (FR-021)
- [x] T059 [P] [US5] Implement `min`/`max` date constraints in `packages/react/src/0.9/components/interactive/DateTimeInputComponent.tsx`. Fix `enableDate` default to `false`. Remove `outputFormat` prop handling. (FR-022, FR-023, FR-024)
- [x] T060 [P] [US5] Implement `validationRegexp` client-side validation in `packages/react/src/0.9/components/interactive/TextFieldComponent.tsx`. (FR-025)
- [x] T061 [P] [US5] Update `ImageComponent.tsx` to map `"scaleDown"` to CSS `scale-down` in `packages/react/src/0.9/components/display/ImageComponent.tsx`. (FR-026)
- [x] T062 [P] [US5] Update `SliderComponent.tsx` to default `min` to `0` when omitted and remove implicit `max` default in `packages/react/src/0.9/components/interactive/SliderComponent.tsx`. (FR-027)
- [x] T063 [US5] Run US5 tests and verify all pass.

**Checkpoint**: All component property contracts match the v0.9 spec.

---

## Phase 8: User Story 6 — Theme and Accessibility Support (Priority: P2)

**Goal**: `createSurface` theme applies via CSS custom properties. All components render `aria-label`/`aria-description` from `accessibility` attribute.

**Independent Test**: Send `createSurface` with theme, render components with accessibility attributes, inspect DOM for CSS vars and ARIA attributes.

### Tests for User Story 6

- [x] T064 [P] [US6] Write tests for theme application (CSS custom properties from `primaryColor`) in `packages/react/src/0.9/__tests__/theme.test.tsx`
- [x] T065 [P] [US6] Write tests for accessibility attributes (`aria-label`, `aria-description`) on components in `packages/react/src/0.9/__tests__/accessibility.test.tsx`

### Implementation for User Story 6

- [x] T066 [P] [US6] Create `ThemeContext.tsx` in `packages/react/src/0.9/contexts/ThemeContext.tsx` — stores theme config from `createSurface`, provides `useTheme` hook, applies `primaryColor` via CSS custom properties. (FR-028, FR-029, FR-030)
- [x] T067 [P] [US6] Update `ComponentRenderer.tsx` to resolve `accessibility.label` and `accessibility.description` as DynamicStrings and apply `aria-label`/`aria-description` to rendered elements in `packages/react/src/0.9/components/ComponentRenderer.tsx`. (FR-031, FR-032, FR-033)
- [x] T068 [US6] Wire `ThemeContext` into `SurfaceContext.tsx` — store theme from `createSurface` message and provide to descendants in `packages/react/src/0.9/contexts/SurfaceContext.tsx`. (FR-028)
- [x] T069 [US6] Update `useA2UIMessageHandler.ts` to parse `theme` from `createSurface` messages in `packages/react/src/0.9/hooks/useA2UIMessageHandler.ts`.
- [x] T070 [US6] Export `useTheme` from `packages/react/src/0.9/index.ts`. (per contracts/public-api.md)
- [x] T071 [US6] Run US6 tests and verify all pass.

**Checkpoint**: Theme and accessibility fully operational — CSS custom properties applied, ARIA attributes rendered.

---

## Phase 9: User Story 7 — Protocol Envelope and Error Reporting (Priority: P3)

**Goal**: Messages include `version` field. `onError` callback reports unknown components, binding failures, validation errors. `sendDataModel` includes data model in action payloads.

**Independent Test**: Send unknown component type, verify `onError` called with error payload.

### Tests for User Story 7

- [x] T072 [P] [US7] Write tests for `onError` callback with unknown component types, binding failures in `packages/react/src/0.9/__tests__/error-reporting.test.tsx`
- [x] T073 [P] [US7] Write tests for `sendDataModel` behavior — action payloads include data model when enabled in `packages/react/src/0.9/__tests__/send-data-model.test.tsx`
- [x] T074 [P] [US7] Write tests for `version` field handling on messages in `packages/react/src/0.9/__tests__/version-handling.test.tsx`

### Implementation for User Story 7

- [x] T075 [P] [US7] Create `ErrorContext.tsx` in `packages/react/src/0.9/contexts/ErrorContext.tsx` — provides `reportError` function backed by `onError` callback. (FR-041)
- [x] T076 [US7] Add `onError` prop to `A2UIRenderer.tsx` and wire to `ErrorContext` in `packages/react/src/0.9/A2UIRenderer.tsx`. (FR-041)
- [x] T077 [US7] Report unknown component types via `ErrorContext` in `ComponentRenderer.tsx` in `packages/react/src/0.9/components/ComponentRenderer.tsx`. (FR-042)
- [x] T078 [US7] Report binding failures via `ErrorContext` in `useDataBinding.ts` in `packages/react/src/0.9/hooks/useDataBinding.ts`. (FR-042)
- [x] T079 [US7] Implement `sendDataModel` support — when flag is `true`, attach full data model to `ActionPayload` in `packages/react/src/0.9/contexts/ActionContext.tsx`. (FR-034, FR-035)
- [x] T080 [US7] Handle `version` field in `useA2UIMessageHandler.ts` — accept and report mismatches via `onError` with code `VERSION_MISMATCH` in `packages/react/src/0.9/hooks/useA2UIMessageHandler.ts`. (FR-047, FR-048)
- [x] T081 [US7] Export `ErrorPayload` type and `onError` prop from `packages/react/src/0.9/index.ts`.
- [x] T082 [US7] Run US7 tests and verify all pass.

**Checkpoint**: Error reporting and protocol envelope work — errors surface to host, data model attaches to actions when requested.

---

## Phase 10: User Story 8 — Data Model Semantics and Type Coercion (Priority: P3)

**Goal**: Auto-vivification, sparse arrays, primitive traversal errors, and standardized type coercion all work per spec.

**Independent Test**: Programmatically set nested paths and verify auto-vivification, sparse array preservation, primitive traversal errors, and coercion results.

### Tests for User Story 8

- [x] T083 [P] [US8] Write tests for `setValueByPath` — auto-vivification, sparse arrays, primitive traversal errors in `packages/utils/src/0.9/__tests__/pathUtils-advanced.test.ts`
- [x] T084 [P] [US8] Write tests for type coercion utilities (`coerceToBoolean`, `coerceToString`, `coerceToNumber`) in `packages/utils/src/0.9/__tests__/coercion.test.ts`

### Implementation for User Story 8

- [x] T085 [US8] Fix `setValueByPath` in `packages/utils/src/0.9/pathUtils.ts`: (a) auto-vivification with next-segment lookahead (numeric → Array, string → Object), (b) array index deletion preserves length with `undefined` (sparse), (c) throw on primitive traversal. (FR-038, FR-039, FR-040)
- [x] T086 [US8] Integrate type coercion into `resolveValue` boundaries and `useFormBinding` in `packages/utils/src/0.9/dataBinding.ts` and `packages/react/src/0.9/hooks/useDataBinding.ts`. (FR-044)
- [x] T087 [US8] Run US8 tests and verify all pass.

**Checkpoint**: Data model semantics correct — auto-vivification, sparse arrays, coercion all per spec.

---

## Phase 11: User Story 9 — Schema and Artifact Alignment (Priority: P3)

**Goal**: Bundled schemas use correct names, `$id` URLs, and structure. Stale docs refreshed or removed.

**Independent Test**: Inspect schema files for correct naming, `$id` prefixes, and validate against upstream spec.

### Implementation for User Story 9

- [x] T088 [P] [US9] Rename `standard_catalog.json` → `basic_catalog.json` in `packages/react/src/0.9/schemas/`. Update all imports referencing the old name. (FR-036)
- [x] T089 [P] [US9] Update all `$id` and `$ref` URLs from `https://a2ui.dev/specification/0.9/` to `https://a2ui.org/specification/v0_9/` in all schema files under `packages/react/src/0.9/schemas/`. (FR-037)
- [x] T090 [P] [US9] Update `a2ui_client_capabilities_schema.json` to match current upstream `a2ui_client_capabilities.json` in `packages/react/src/0.9/schemas/`. Rename if needed. (FR-054)
- [x] T091 [P] [US9] Update `server_to_client.json` and `client_to_server.json` schemas — add version field, error message type, updated `$id`/`$ref` in `packages/react/src/0.9/schemas/`. (FR-047)
- [x] T092 [US9] Refresh or remove stale embedded docs (`a2ui_protocol.md`, `evolution_guide.md`) in `packages/react/src/0.9/docs/`. (FR-055)
- [x] T092a [US9] Write schema validation tests — validate sample v0.9 messages against updated bundled schemas in `packages/react/src/0.9/__tests__/schema-validation.test.ts`. (SC-004)

**Checkpoint**: All schemas and docs match upstream spec.

---

## Phase 12: User Story 10 — Granular Data Model Notifications (Priority: P3)

**Goal**: Data model changes notify only affected subscribers (exact match, ancestors, descendants) — not the entire surface tree.

**Independent Test**: Render surface with components on different paths. Update one path. Verify only subscribed components re-render.

### Tests for User Story 10

- [x] T093 [P] [US10] Write tests for `DataStore` class — subscribe, set, get, bubble/cascade notifications, dispose in `packages/utils/src/0.9/__tests__/dataStore.test.ts`
- [x] T094 [P] [US10] Write tests for granular re-rendering — only affected components re-render on path change in `packages/react/src/0.9/__tests__/granular-render.test.tsx`

### Implementation for User Story 10

- [x] T095 [US10] Implement framework-agnostic `DataStore` class with path-based subscriptions (`subscribe(path, cb)`, `set(path, value)`, `get(path)`, `getSnapshot(path)`, `dispose()`) and bubble-up/cascade-down notification logic in `packages/utils/src/0.9/dataStore.ts`. Create React context wrapper in `packages/react/src/0.9/contexts/DataStoreContext.tsx`. (FR-045, FR-046, per research R1/R8)
- [x] T096 [US10] Update `SurfaceContext.tsx` to create a `DataStore` per surface on `createSurface` and delegate data operations to it in `packages/react/src/0.9/contexts/SurfaceContext.tsx`. (per research R8)
- [x] T097 [US10] Update `useDataBinding.ts` to use `useSyncExternalStore` with `DataStore.subscribe`/`getSnapshot` for granular subscriptions in `packages/react/src/0.9/hooks/useDataBinding.ts`. (per research R1)
- [x] T098 [US10] Run US10 tests and verify all pass.

**Checkpoint**: Granular notifications operational — only affected components re-render.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, missing minor items, integration validation, and cross-story concerns.

- [x] T099 [P] Implement component type-change detection in `SurfaceContext.tsx` — when `updateComponents` changes a component's type for an existing ID, destroy old and create fresh instance in `packages/react/src/0.9/contexts/SurfaceContext.tsx`. (FR-056)
- [x] T100 [P] Add 12 missing media/volume icons to `iconMap` in `packages/react/src/0.9/components/display/IconComponent.tsx`: `fastForward`, `pause`, `play`, `rewind`, `skipNext`, `skipPrevious`, `stop`, `volumeDown`, `volumeMute`, `volumeOff`, `volumeUp`. (FR-049)
- [x] T101 [P] Enforce explicit `root` requirement on `createSurface` — error if missing, remove fallback inference in `packages/react/src/0.9/hooks/useA2UIMessageHandler.ts`. (FR-053)
- [x] T102 [P] Handle edge cases: unregistered function fallback values, missing interpolation paths, empty data model with `sendDataModel`, Slider missing `max` error. Wire error reporting for each. (Edge Cases from spec)
- [x] T103 Update all existing tests affected by type changes (Action, CheckRule, Button variant, component props) across `packages/utils/src/0.9/__tests__/` and `packages/react/src/0.9/__tests__/`
- [x] T104 Run full test suite: `npm run test:run -w @a2ui-sdk/utils` and `npm run test:run -w @a2ui-sdk/react`
- [x] T105 Build all packages in order and verify clean build: `npm run build -w @a2ui-sdk/types && npm run build -w @a2ui-sdk/utils && npm run build -w @a2ui-sdk/react`
- [x] T106 Run quickstart.md validation scenarios (all 6 scenarios from `specs/005-a2ui-v09-compliance/quickstart.md`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1–US3 (Phases 3–5)**: All P1 — depend on Foundational. Can run in parallel but US1 is recommended first (provides `openUrl` and action dispatch used by US2/US3)
- **US4–US6 (Phases 6–8)**: All P2 — depend on Foundational. Can run in parallel with each other AND with P1 stories
- **US7–US10 (Phases 9–12)**: All P3 — depend on Foundational. US7 (error reporting) benefits from US1–US3 being done. US10 (DataStore) is independent.
- **Polish (Phase 13)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Actions)**: Foundational only — no cross-story deps. Produces `openUrl` function used by other stories.
- **US2 (Functions)**: Foundational only — benefits from US1's `openUrl` already being registered
- **US3 (Validation)**: Foundational only — uses function registry from Foundational
- **US4 (Button Variants)**: Foundational only — independent of other stories
- **US5 (Component Props)**: Foundational only — independent of other stories
- **US6 (Theme/Accessibility)**: Foundational only — independent of other stories
- **US7 (Error Reporting)**: Foundational only — benefits from integration with all other stories for error sources
- **US8 (Data Model)**: Foundational only — independent
- **US9 (Schemas)**: Foundational only — independent, file-only changes
- **US10 (Notifications)**: Foundational only — changes `useDataBinding` and `SurfaceContext`, coordinate with US2/US7 if parallel

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Type/interface tasks before implementation tasks
- Core logic before React integration
- Story complete before checkpoint

### Parallel Opportunities

- All Foundational type tasks (T005–T018) marked [P] can run in parallel (different type files/sections)
- Foundational utils tasks (T020, T021) can run in parallel (different files)
- All P1 stories (US1, US2, US3) can start simultaneously after Foundational
- All P2 stories (US4, US5, US6) can start simultaneously after Foundational
- US9 (schemas) can run fully parallel with any other story (file-only, no code deps)
- Within US5, all component implementations (T058–T062) are in different files and can run in parallel

---

## Parallel Example: User Story 2 (Functions)

```bash
# Launch all function implementations in parallel (different files):
Task: T034 "Implement formatString in packages/utils/src/0.9/functions/formatString.ts"
Task: T035 "Implement formatNumber in packages/utils/src/0.9/functions/formatNumber.ts"
Task: T036 "Implement formatCurrency in packages/utils/src/0.9/functions/formatCurrency.ts"
Task: T037 "Implement formatDate in packages/utils/src/0.9/functions/formatDate.ts"
Task: T038 "Implement pluralize in packages/utils/src/0.9/functions/pluralize.ts"

# Then sequentially wire into pipeline (shared file):
Task: T039 "Wire FunctionCall into resolveValue/resolveString"
Task: T040 "Remove auto-interpolation from resolveString"
```

---

## Parallel Example: User Story 5 (Component Props)

```bash
# Launch all component updates in parallel (different files):
Task: T058 "ChoicePicker chips + filterable"
Task: T059 "DateTimeInput min/max + defaults"
Task: T060 "TextField validationRegexp"
Task: T061 "Image scaleDown"
Task: T062 "Slider min optionality"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Action Dispatching)
4. **STOP and VALIDATE**: Test action dispatch independently
5. Core interaction model verified

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Actions) → Test → Core interactions work (MVP!)
3. US2 (Functions) → Test → Formatted data displays correctly
4. US3 (Validation) → Test → Forms validate per spec
5. US4–US6 (Button/Props/Theme) → Test → Component contracts aligned
6. US7–US10 (Errors/DataModel/Schemas/Notifications) → Test → Full compliance
7. Polish → Final validation → All 29 findings resolved

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Actions) + US4 (Button Variants)
   - Developer B: US2 (Functions) + US5 (Component Props)
   - Developer C: US3 (Validation) + US6 (Theme/Accessibility)
3. Then:
   - Developer A: US7 (Error Reporting)
   - Developer B: US8 (Data Model) + US9 (Schemas)
   - Developer C: US10 (Notifications)
4. All: Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: 108 tasks across 13 phases covering all 56 functional requirements and 8 edge cases
- ⚠️ `standard-catalog/index.ts` is modified by T030 (US1), T041 (US2), and T046a (US3) — if running stories in parallel, serialize these registration tasks
