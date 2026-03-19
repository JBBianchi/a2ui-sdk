# Feature Specification: A2UI v0.9 Specification Compliance

**Feature Branch**: `005-a2ui-v09-compliance`
**Created**: 2026-03-11
**Status**: Draft
**Input**: Bring the a2ui-sdk repository into full compliance with the latest A2UI v0.9 specification draft, addressing all 29 findings (5 Critical, 12 Major, 12 Minor) from the compliance audit report.

## Clarifications

### Session 2026-03-11

- Q: Should the v0.9 module breaking changes (removing old action/CheckRule formats) include a deprecation period? → A: Hard break — remove old formats entirely, document in changelog. This is a pre-1.0 SDK tracking a draft spec; downstream consumers expect breaking changes.
- Q: When should CheckRule validation be evaluated? → A: Reactively on every data model change (per spec renderer guide "Checkable" trait). Components subscribe to CheckRule conditions as reactive streams, displaying the first failing check's message continuously. Actions are reactively disabled when checks fail.
- Q: How should locale be handled for formatting functions? → A: Per spec — no `locale` argument on any function. Server sends locale-neutral data (ISO 8601, raw numbers); renderer formats using browser default locale (`navigator.language`).
- Q: Should `openUrl` restrict URL schemes? → A: No restrictions. The spec defines `url` as `"format": "uri"` with no scheme constraints, and describes "Opens the specified URL in a browser or handler" — supporting any URI scheme the platform can handle.
- Q: Does ChoicePicker need a `variant` property? → A: Already implemented (`mutuallyExclusive`/`multipleSelection`). Only `displayStyle` and `filterable` are missing per compliance report.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Correct Action Dispatching (Priority: P1)

A downstream developer builds a surface with buttons. Some buttons send events to the server (e.g., "submit form"), while others trigger client-side behavior (e.g., "open a URL"). The renderer must correctly handle both action variants, dispatching server events via the `onAction` callback and executing local function calls (like `openUrl`) on the client.

**Why this priority**: Actions are the primary interaction mechanism. If the action model is wrong, no user interaction works correctly. This is the most critical runtime contract between server and renderer.

**Independent Test**: Can be tested by sending a message with a button whose action is `{ event: { name: "submit" } }` and another with `{ functionCall: { call: "openUrl", args: { url: "https://example.com" } } }`. Verify the first dispatches to `onAction` and the second opens a URL.

**Acceptance Scenarios**:

1. **Given** a surface with a button using `{ event: { name: "submit", context: { id: { path: "/item/id" } } } }`, **When** the user clicks the button, **Then** the renderer dispatches an action payload with `name: "submit"` and resolved context values to the `onAction` callback.
2. **Given** a surface with a button using `{ functionCall: { call: "openUrl", args: { url: "https://example.com" } } }`, **When** the user clicks the button, **Then** the renderer opens the URL without dispatching to `onAction`.
3. **Given** a server message with the old flat action format `{ name: "submit" }`, **When** processed by the renderer, **Then** the renderer rejects or ignores the malformed action (does not crash).

---

### User Story 2 - Dynamic Data Display with Functions (Priority: P1)

A downstream developer creates a surface showing formatted content: currency amounts, dates, interpolated strings, and pluralized labels. The renderer must evaluate `FunctionCall` objects in data binding positions (e.g., `{ call: "formatCurrency", args: { value: { path: "/price" }, currencyCode: "USD" } }`) and render the formatted output.

**Why this priority**: Without function evaluation, dynamic content displays raw unformatted data or fails silently. This is core to the data binding contract.

**Independent Test**: Can be tested by sending a surface with Text components whose `text` property uses `formatString`, `formatNumber`, `formatCurrency`, `formatDate`, and `pluralize` function calls. Verify rendered output matches expected formatted values.

**Acceptance Scenarios**:

1. **Given** a Text component with `text: { call: "formatString", args: { value: "Hello ${/user/name}, you have ${/count} items" } }` and data model `{ user: { name: "Alice" }, count: 5 }`, **When** rendered, **Then** the text displays "Hello Alice, you have 5 items".
2. **Given** a Text component with `text: { call: "formatCurrency", args: { value: { path: "/price" }, currencyCode: "USD" } }` and data model `{ price: 19.99 }`, **When** rendered, **Then** the text displays "$19.99" (or locale-appropriate equivalent).
3. **Given** a Text component with `text: "Hello ${/name}"` (raw string, NOT inside a `formatString` call), **When** rendered, **Then** the text displays the literal string "Hello ${/name}" without interpolation.
4. **Given** a Text component with `text: { call: "formatDate", args: { value: { path: "/date" }, format: "yyyy-MM-dd" } }`, **When** rendered, **Then** the text displays the date formatted per the TR35 pattern.

---

### User Story 3 - Form Validation with CheckRules (Priority: P1)

A downstream developer builds a form with validated inputs. Each input has `checks` using the v0.9 `{ condition, message }` structure, where `condition` is a `DynamicBoolean` (a function call like `required`, `regex`, or composed via `and`/`or`/`not`). The renderer must evaluate these conditions and display validation messages.

**Why this priority**: Form validation is essential for interactive surfaces. The current CheckRule structure is incompatible with the spec, meaning all validation from spec-compliant servers would fail.

**Independent Test**: Can be tested by sending a surface with a TextField that has `checks: [{ condition: { call: "required", args: { value: { path: "/email" } }, returnType: "boolean" }, message: "Email is required" }]`. Verify the validation message appears when the field is empty.

**Acceptance Scenarios**:

1. **Given** a TextField with `checks: [{ condition: { call: "required", args: { value: { path: "/email" } }, returnType: "boolean" }, message: "Email is required" }]` and an empty data model, **When** the user interacts with the field, **Then** the message "Email is required" is displayed.
2. **Given** a TextField with a compound check using `{ condition: { call: "and", args: { values: [{ call: "required", ... }, { call: "email", ... }] }, returnType: "boolean" }, message: "Valid email required" }`, **When** the user enters "notanemail", **Then** the validation message is displayed.
3. **Given** a TextField with a check whose condition resolves to `true`, **When** rendered, **Then** no validation error is shown.

---

### User Story 4 - Button Variants and Component Contract Alignment (Priority: P2)

A downstream developer renders buttons with different visual treatments. The server sends buttons with `variant: "primary"`, `variant: "borderless"`, or `variant: "default"`. The renderer must display visually distinct styles for each variant.

**Why this priority**: Component prop contracts must match the spec for interoperability. Button is the most common interactive component.

**Independent Test**: Can be tested by rendering three buttons with each variant value and verifying distinct visual styles.

**Acceptance Scenarios**:

1. **Given** a Button with `variant: "primary"`, **When** rendered, **Then** the button displays with a prominent/primary visual style.
2. **Given** a Button with `variant: "borderless"`, **When** rendered, **Then** the button displays without borders or background.
3. **Given** a Button with no `variant` specified, **When** rendered, **Then** the button displays with the "default" style.
4. **Given** a Button with the old `primary: true` property, **When** rendered, **Then** the renderer ignores the unrecognized property and uses default styling.

---

### User Story 5 - Component Property Alignment (Priority: P2)

A downstream developer uses ChoicePicker with chips display, DateTimeInput with min/max constraints, TextField with regex validation, Slider with optional min, and Image with `scaleDown` fit. All component props must match the v0.9 spec contracts.

**Why this priority**: Mismatched component props cause silent failures or incorrect rendering. These are the most common points of interop failure.

**Independent Test**: Can be tested by rendering each affected component with spec-compliant properties and verifying correct behavior.

**Acceptance Scenarios**:

1. **Given** a ChoicePicker with `displayStyle: "chips"` and `filterable: true`, **When** rendered, **Then** options display as chips and a filter input is available.
2. **Given** a DateTimeInput with `min: "2024-01-01"` and `max: "2024-12-31"`, **When** the user tries to select a date outside this range, **Then** the selection is constrained.
3. **Given** a DateTimeInput with neither `enableDate` nor `enableTime` set, **When** rendered, **Then** both default to `false` (no picker shown until explicitly enabled).
4. **Given** a TextField with `validationRegexp: "^[A-Z]+$"`, **When** the user enters "abc", **Then** client-side validation fails.
5. **Given** an Image with `fit: "scaleDown"`, **When** rendered, **Then** the image uses the CSS `scale-down` object-fit behavior.
6. **Given** a Slider with no `min` specified, **When** rendered, **Then** the slider defaults to `min: 0`.

---

### User Story 6 - Theme and Accessibility Support (Priority: P2)

A downstream developer receives a `createSurface` message with a `theme` containing `primaryColor`, `iconUrl`, and `agentDisplayName`. Components also include `accessibility` attributes (`label`, `description`). The renderer must apply theming and output ARIA attributes.

**Why this priority**: Accessibility is a compliance requirement for many deployments. Theme support enables brand customization.

**Independent Test**: Can be tested by sending a `createSurface` with theme and components with accessibility attributes, then inspecting the DOM for CSS custom properties and ARIA attributes.

**Acceptance Scenarios**:

1. **Given** a `createSurface` with `theme: { primaryColor: "#FF5733" }`, **When** the surface renders, **Then** primary-colored elements use the specified color.
2. **Given** a Button with `accessibility: { label: "Submit order", description: "Click to place your order" }`, **When** rendered, **Then** the button element has `aria-label="Submit order"` and `aria-description="Click to place your order"`.
3. **Given** a `createSurface` with `theme: { agentDisplayName: "Travel Bot", iconUrl: "https://example.com/icon.png" }`, **When** rendered, **Then** the surface exposes the agent name and icon for display by the host application.

---

### User Story 7 - Protocol Envelope and Error Reporting (Priority: P3)

A downstream developer integrates the renderer and needs to handle version validation and error reporting. Messages include a `version` field. The renderer reports errors (unknown component types, failed data bindings, validation failures) back to the server via an `onError` callback.

**Why this priority**: Error reporting enables server-side debugging and graceful degradation. Version validation prevents silent incompatibility.

**Independent Test**: Can be tested by sending a message with an unknown component type and verifying an error is reported via `onError`.

**Acceptance Scenarios**:

1. **Given** a message with `version: "v0.9"`, **When** processed, **Then** the renderer accepts and processes the message.
2. **Given** a message with an unknown component type, **When** processed, **Then** the renderer calls `onError` with the component path and a descriptive message.
3. **Given** a component with a data binding path that resolves to `undefined`, **When** rendered, **Then** the renderer reports the resolution failure via `onError`.
4. **Given** `sendDataModel: true` on `createSurface`, **When** the user dispatches any action, **Then** the action payload includes the full surface data model as metadata.

---

### User Story 8 - Data Model Semantics and Type Coercion (Priority: P3)

A downstream developer relies on the data model behaving per the spec: auto-vivification of nested paths, sparse array support, primitive traversal errors, and standardized type coercion when binding values to component properties of specific types.

**Why this priority**: Correct data model behavior ensures consistency across renderers. Incorrect behavior causes subtle bugs in complex surfaces.

**Independent Test**: Can be tested by programmatically updating the data model at nested paths and verifying auto-vivification, sparse arrays, and coercion behavior.

**Acceptance Scenarios**:

1. **Given** an empty data model, **When** setting value at path `/a/b/0/c`, **Then** intermediate segments are auto-vivified (object for string segments, array for numeric segments).
2. **Given** an array `[1, 2, 3]` at path `/items`, **When** setting index 1 to `undefined`, **Then** the array becomes `[1, undefined, 3]` (sparse, length preserved).
3. **Given** a string `"hello"` at path `/name`, **When** attempting to set `/name/first`, **Then** an error is thrown (cannot traverse through primitive).
4. **Given** a data binding that resolves to the string `"true"`, **When** consumed by a component expecting a boolean, **Then** the value is coerced to `true`.
5. **Given** a data binding that resolves to `null`, **When** consumed as a string, **Then** the value is coerced to `""` (empty string).

---

### User Story 9 - Schema and Artifact Alignment (Priority: P3)

A downstream developer validates messages against the bundled JSON schemas. The schemas must use the correct file names, `$id` URLs, and structure matching the upstream A2UI v0.9 specification.

**Why this priority**: Schema drift causes validation failures for developers using standard JSON Schema tooling.

**Independent Test**: Can be tested by validating sample messages against the bundled schemas and comparing schema `$id` values to the upstream spec.

**Acceptance Scenarios**:

1. **Given** the bundled catalog schema, **When** inspected, **Then** it is named `basic_catalog.json` with `$id` using `https://a2ui.org/specification/v0_9/` prefix.
2. **Given** the client capabilities schema, **When** inspected, **Then** it matches the current upstream `a2ui_client_capabilities.json` structure.
3. **Given** embedded protocol documentation, **When** inspected, **Then** it reflects current v0.9 patterns (no stale references to `primary: boolean`, outdated interpolation syntax, etc.).

---

### User Story 10 - Granular Data Model Notifications (Priority: P3)

A downstream developer builds a surface with many components. When a single data model path changes, only components subscribed to that path (or ancestor/descendant paths) should re-render, not the entire surface tree.

**Why this priority**: Performance optimization for complex surfaces. Current brute-force re-render is functional but inefficient.

**Independent Test**: Can be tested by rendering a surface with many components, updating a single data path, and measuring how many components re-render.

**Acceptance Scenarios**:

1. **Given** a surface with components bound to `/user/name` and `/user/age`, **When** only `/user/name` changes, **Then** only the component bound to `/user/name` (and any ancestor-path subscribers) re-renders.
2. **Given** a component subscribed to `/user`, **When** `/user/name` changes, **Then** the `/user` subscriber is notified (bubble up).
3. **Given** a component subscribed to `/user/name`, **When** the entire `/user` object is replaced, **Then** the `/user/name` subscriber is notified (cascade down).

---

### Edge Cases

- What happens when a `FunctionCall` references an unregistered function name? The renderer should return a fallback value (empty string for strings, `false` for booleans) and report an error via `onError`.
- What happens when `formatString` receives a template with a path that doesn't exist in the data model? The interpolation should produce an empty string for that placeholder and report via `onError`.
- What happens when `updateComponents` changes a component's `type` (e.g., from `Text` to `Button`)? The renderer must fully destroy the old component instance and create a fresh one, resetting all internal state.
- What happens when a `createSurface` message is missing the required `root` component ID? The renderer should report an error via `onError` and not render the surface.
- What happens when a `CheckRule.condition` is a literal boolean (`true` or `false`) rather than a function call? The renderer should accept it as a valid `DynamicBoolean` and use the literal value directly.
- What happens when `sendDataModel` is `true` but the data model is empty? The action payload should include an empty object `{}` as the data model metadata.
- What happens when a Slider has no `max` property? The renderer should treat `max` as required, report an error via `onError` if missing, and MUST NOT render the track/thumb — only the error is reported.
- What happens when type coercion encounters an unconvertible value (e.g., string `"abc"` to number)? Per spec, it coerces to `0`.

## Requirements _(mandatory)_

### Functional Requirements

#### Action Model (Critical)

- **FR-001**: The renderer MUST support ONLY the discriminated Action type: `{ event: { name: string, context?: Record<string, DynamicValue> } }` for server events and `{ functionCall: FunctionCall }` for local function calls. The old flat `{ name, context }` structure MUST NOT be accepted.
- **FR-002**: When an action has the `event` variant, the renderer MUST resolve all `DynamicValue` entries in `context` against the data model and dispatch the resolved payload to the `onAction` callback.
- **FR-003**: When an action has the `functionCall` variant, the renderer MUST look up the named function in the catalog registry and execute it locally without dispatching to `onAction`.

#### CheckRule / Validation Model (Critical)

- **FR-005**: The renderer MUST support `CheckRule` as `{ condition: DynamicBoolean, message: string }` where `DynamicBoolean` can be a literal boolean, a data binding path, or a `FunctionCall` returning boolean.
- **FR-006**: The renderer MUST evaluate `condition` by resolving `DynamicBoolean` through the data binding and function evaluation pipeline. Evaluation MUST be reactive — components subscribe to CheckRule conditions as streams and continuously re-evaluate as the data model changes.
- **FR-006a**: The renderer MUST display the `message` of the first failing check. Actions (e.g., Button clicks) MUST be reactively disabled when any validation check on the surface fails.
- **FR-007**: The renderer MUST NOT support the old embedded `call`/`args`/`and`/`or`/`not` structure directly on `CheckRule`.

#### Button Component (Critical)

- **FR-008**: The Button component MUST support a `variant` property with values `"default"`, `"primary"`, and `"borderless"`, defaulting to `"default"`.
- **FR-009**: The Button component MUST render visually distinct styles for each variant.
- **FR-010**: The Button component MUST NOT support the `primary: boolean` property.

#### Catalog Functions (Critical)

- **FR-011**: The renderer MUST implement and register the following catalog functions: `formatString`, `formatNumber`, `formatCurrency`, `formatDate`, `pluralize`, `openUrl`.
- **FR-012**: `formatString` MUST support `${...}` interpolation syntax, resolving embedded path references against the data model.
- **FR-013**: `formatNumber` MUST support grouping and decimal formatting options.
- **FR-014**: `formatCurrency` MUST support currency code and locale-aware formatting.
- **FR-015**: `formatDate` MUST support TR35 date/time patterns.
- **FR-016**: `pluralize` MUST support CLDR plural categories (zero, one, two, few, many, other).
- **FR-017**: `openUrl` MUST open the specified URL in the browser or platform handler. No URI scheme restrictions are imposed — any valid URI is accepted (per spec `"format": "uri"` with no scheme constraints).
- **FR-018**: The `and`, `or`, and `not` logical operators MUST be registered as callable functions (not just structural operators), accepting `DynamicBoolean` arguments.

#### FunctionCall Evaluation in Data Binding (Critical)

- **FR-019**: The data binding resolution pipeline (`resolveValue`, `resolveString`) MUST evaluate `FunctionCall` objects by looking up the function name in the catalog registry and invoking it with resolved arguments.
- **FR-020**: String interpolation via `${...}` MUST ONLY be applied when evaluating a `formatString` function call, NOT on general string properties.

#### Component Property Alignment (Major)

- **FR-021**: ChoicePicker MUST support `displayStyle` (`"checkbox"` or `"chips"`, default `"checkbox"`) and `filterable` (boolean, default `false`).
- **FR-022**: DateTimeInput MUST support `min` and `max` properties as `DynamicString` values.
- **FR-023**: DateTimeInput MUST default both `enableDate` and `enableTime` to `false`.
- **FR-024**: DateTimeInput MUST NOT include a non-spec `outputFormat` property.
- **FR-025**: TextField MUST support an optional `validationRegexp` property for client-side regex validation.
- **FR-026**: Image MUST use `"scaleDown"` (camelCase) in the `fit` enum, not `"scale-down"`.
- **FR-027**: Slider MUST treat `min` as optional (default `0`) and MUST NOT provide an implicit default for `max`.

#### Theme Support (Major)

- **FR-028**: `createSurface` MUST accept an optional `theme` object with `primaryColor` (hex string), `iconUrl` (URI), and `agentDisplayName` (string).
- **FR-029**: The renderer MUST apply `primaryColor` to primary-styled elements (buttons, links, accents).
- **FR-030**: The renderer MUST expose `iconUrl` and `agentDisplayName` to the host application for display.

#### Accessibility (Major)

- **FR-031**: Every component MUST support an optional `accessibility` property with `label` (`DynamicString`) and `description` (`DynamicString`).
- **FR-032**: When `accessibility.label` is provided, the rendered element MUST include an `aria-label` attribute with the resolved value.
- **FR-033**: When `accessibility.description` is provided, the rendered element MUST include an `aria-description` attribute with the resolved value.

#### sendDataModel Support (Major)

- **FR-034**: `createSurface` MUST accept an optional `sendDataModel` boolean.
- **FR-035**: When `sendDataModel` is `true`, every action dispatched from that surface MUST include the full data model as metadata in the action payload.

#### Catalog Naming and Schema IDs (Major)

- **FR-036**: The bundled catalog schema MUST be named `basic_catalog.json` (not `standard_catalog.json`).
- **FR-037**: All schema `$id` and `$ref` URLs MUST use the `https://a2ui.org/specification/v0_9/` prefix.

#### DataModel Update Semantics (Major)

- **FR-038**: When setting a value at a nested path, the renderer MUST auto-vivify intermediate segments, using an Array for numeric next-segments and an Object for string next-segments.
- **FR-039**: Setting an array index to `undefined` MUST preserve the array's length (sparse array), not splice the element.
- **FR-040**: Attempting to traverse through a primitive value MUST throw an error.

#### Client-to-Server Error Reporting (Major)

- **FR-041**: The renderer MUST support an `onError` callback alongside `onAction`.
- **FR-042**: The renderer MUST report errors for: unknown component types, failed data binding resolution, and validation failures.
- **FR-043**: Error payloads MUST include `code`, `surfaceId`, and `message`. Validation errors MUST additionally include `path`.

#### Type Coercion (Major)

- **FR-044**: The renderer MUST implement standardized type coercion per the spec: `"true"`/`"false"` strings to booleans (case-insensitive), non-zero numbers to `true`, `null`/`undefined` to `""` for strings and `0` for numbers, numeric strings to parsed numbers (non-parsable to `0`).

#### Data Model Notification Strategy (Major)

- **FR-045**: A data model change at a specific path MUST notify exact-match subscribers, ancestor subscribers (bubble up), and descendant subscribers (cascade down).
- **FR-046**: The notification strategy MUST avoid re-rendering the entire surface tree when only a single path changes.

#### Version Envelope (Minor)

- **FR-047**: The message type MUST include an optional `version` field.
- **FR-048**: The renderer SHOULD validate the version and report mismatches via `onError` with code `VERSION_MISMATCH`.

#### Missing Icons (Minor)

- **FR-049**: The icon map MUST include all 57 icons from the spec, including the 12 missing media/volume icons: `fastForward`, `pause`, `play`, `rewind`, `skipNext`, `skipPrevious`, `stop`, `volumeDown`, `volumeMute`, `volumeOff`, `volumeUp`.

#### DynamicValue Array Literal (Minor)

- **FR-050**: The `DynamicValue` type MUST include array literals as a valid variant.

#### Weight Property Placement (Minor)

- **FR-051**: The `weight` property MUST be on a catalog-level common type (`CatalogComponentCommon`), not on the protocol-level `ComponentCommon`.
- **FR-052**: The protocol-level `ComponentCommon` MUST include `id` and `accessibility` (not `weight`).

#### Root Handling (Minor)

- **FR-053**: The renderer MUST require an explicit `root` component ID on `createSurface` and MUST NOT infer a root from the component tree.

#### Client Capabilities Schema (Minor)

- **FR-054**: The bundled client capabilities schema MUST match the current upstream `a2ui_client_capabilities.json` structure.

#### Stale Documentation (Minor)

- **FR-055**: Embedded protocol documentation MUST be refreshed to reflect current v0.9 patterns or removed in favor of upstream references.

#### Component Type-Change Lifecycle (Minor)

- **FR-056**: When `updateComponents` changes a component's type for an existing ID, the renderer MUST destroy the old component instance and create a fresh one, resetting all internal state.

### Key Entities

- **Action**: A user interaction trigger, either an `event` (server-bound) or `functionCall` (client-local). Contains resolved context values.
- **CheckRule**: A validation rule with a `condition` (DynamicBoolean) and `message` (string). Evaluated against the data model.
- **FunctionCall**: A named function invocation with arguments. Used in data binding, actions, and validation conditions. References functions from the catalog registry.
- **DynamicValue**: A value that can be a literal (string, number, boolean, array), a data binding path reference, or a FunctionCall.
- **Theme**: Surface-level visual customization with `primaryColor`, `iconUrl`, and `agentDisplayName`.
- **AccessibilityAttributes**: Component-level `label` and `description` for ARIA output.
- **Surface**: Top-level container with an ID, root component, component tree, data model, theme, and sendDataModel flag.
- **CatalogFunction**: A registered function (formatString, formatNumber, formatCurrency, formatDate, pluralize, openUrl, and, or, not) that can be invoked via FunctionCall objects.

### Assumptions

- Changes to the v0.9 module are hard breaking (no deprecation layer). Old formats (flat action structure, embedded CheckRule operators) are removed entirely. Changes must be documented in the changelog.
- The A2UI v0.9 spec is the authoritative source for all type structures, property names, and behavioral requirements.
- The `openUrl` function uses the browser's native `window.open` or equivalent mechanism.
- Formatting functions (`formatNumber`, `formatCurrency`, `formatDate`, `pluralize`) use the browser's default locale (`navigator.language`). The spec defines no `locale` argument on any function; the server sends locale-neutral data (ISO 8601, raw numbers) and the renderer formats using the client locale.
- TR35 date patterns are supported using the platform's `Intl.DateTimeFormat` or a lightweight formatter (not a full ICU implementation).
- CLDR plural categories are supported using the platform's `Intl.PluralRules`.
- The `primaryColor` theme property is applied via CSS custom properties, allowing host applications to further customize.
- The granular notification strategy uses an internal subscription mechanism (not exposed in the public API).
- Existing v0.8 implementation and public API are not affected by these changes (v0.9 is a separate module).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 29 compliance findings from the audit report are resolved — 0 Critical, 0 Major, 0 Minor findings remain when re-audited against the v0.9 spec.
- **SC-002**: 100% of the 18 catalog components render correctly when receiving spec-compliant v0.9 messages.
- **SC-003**: All 14 catalog functions (formatString, formatNumber, formatCurrency, formatDate, pluralize, openUrl, required, regex, length, numeric, email, and, or, not) execute correctly when invoked via FunctionCall objects.
- **SC-004**: All bundled JSON schemas validate successfully against sample messages generated from the upstream spec examples.
- **SC-005**: Data model updates at a single path cause re-renders only for components subscribed to affected paths (exact, ancestor, or descendant), not the entire surface tree.
- **SC-006**: All existing tests pass (with necessary updates), and new test coverage is added for each changed component and utility.
- **SC-007**: The v0.9 public API (`A2UIProvider`, `A2UIRenderer`, `onAction`, hooks) is well-documented, with breaking changes listed in the changelog. `onError` is added as a new optional callback. (Note: backward compatibility is NOT a goal — this is a pre-1.0 SDK tracking a draft spec; breaking changes are expected and documented.)
- **SC-008**: Accessibility attributes produce valid ARIA output verifiable by automated accessibility testing tools.
