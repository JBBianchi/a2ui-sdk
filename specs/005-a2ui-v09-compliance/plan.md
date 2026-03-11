# Implementation Plan: A2UI v0.9 Specification Compliance

**Branch**: `005-a2ui-v09-compliance` | **Date**: 2026-03-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-a2ui-v09-compliance/spec.md`

## Summary

Bring the a2ui-sdk v0.9 module into full compliance with the latest A2UI v0.9 specification by resolving all 29 audit findings across types, utils, and react packages. The work spans type restructuring (Action, CheckRule, DynamicValue), implementing 6 missing catalog functions with a function evaluation pipeline, aligning 6 component contracts, adding theme/accessibility/error-reporting/sendDataModel support, fixing data model semantics, and implementing granular path-based notifications.

## Technical Context

**Language/Version**: TypeScript 5.9
**Primary Dependencies**: React 19, Radix UI, Tailwind CSS (class-variance-authority), lucide-react
**Storage**: N/A (client-side rendering library)
**Testing**: Vitest + React Testing Library + jsdom
**Target Platform**: Web browsers (any modern browser with `Intl` support)
**Project Type**: Library (npm workspaces monorepo with 3 packages: types, utils, react)
**Performance Goals**: Granular re-renders — only components bound to changed data paths should re-render
**Constraints**: No breaking changes to v0.8 module; v0.9 changes are hard-breaking (pre-1.0 SDK)
**Scale/Scope**: 3 packages, ~20 source files affected, ~15 test files to update/create

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                     | Status | Notes                                                                                                                                                         |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Source-First Authoring Contract            | N/A    | Not applicable — this project is a rendering SDK, not an editor. No source-format exchange.                                                                   |
| II. Privacy and Network Isolation             | PASS   | The renderer does not initiate network calls. `openUrl` delegates to the browser's native handler. All data stays client-side.                                |
| III. Validation and Diagnostics Ownership     | PASS   | The renderer owns CheckRule evaluation and emits structured errors via `onError` callback. No validation callbacks required from host.                        |
| IV. Accessibility and Usability Baseline      | PASS   | Adding `accessibility` (aria-label, aria-description) to all components. Existing keyboard operability preserved.                                             |
| V. Compatibility and Extensibility Discipline | PASS   | v0.9 targets declared spec version. Breaking changes are explicit and documented. Custom catalogs and components remain supported via typed extension points. |

**Gate result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-a2ui-v09-compliance/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── public-api.md    # Public API contract changes
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── types/src/0.9/
│   ├── index.ts                    # Core types: Action, CheckRule, DynamicValue, messages, errors
│   └── standard-catalog.ts         # Component prop types: Button variant, ChoicePicker, DateTimeInput, etc.
│
├── utils/src/0.9/
│   ├── index.ts                    # Public exports
│   ├── dataBinding.ts              # resolveValue/resolveString with FunctionCall evaluation + type coercion
│   ├── validation.ts               # CheckRule evaluation with condition-based DynamicBoolean
│   ├── pathUtils.ts                # setValueByPath with auto-vivification and sparse arrays
│   ├── coercion.ts                 # NEW: Type coercion utilities per spec
│   ├── dataStore.ts                # NEW: Framework-agnostic DataStore class (path-based subscriptions)
│   ├── functions/                  # NEW: Catalog function implementations
│   │   ├── index.ts                # Function registry and executor
│   │   ├── formatString.ts         # String interpolation (moved from general resolveString)
│   │   ├── formatNumber.ts         # Number formatting via Intl.NumberFormat
│   │   ├── formatCurrency.ts       # Currency formatting via Intl.NumberFormat
│   │   ├── formatDate.ts           # Date formatting via Intl.DateTimeFormat with TR35 patterns
│   │   ├── pluralize.ts            # Pluralization via Intl.PluralRules
│   │   ├── openUrl.ts              # URL opening via window.open
│   │   └── logic.ts                # and/or/not as callable functions
│   └── interpolation/              # Existing interpolation engine (used by formatString)
│
├── react/src/0.9/
│   ├── index.ts                    # Public exports (add onError, ThemeContext)
│   ├── A2UIRenderer.tsx            # Strict root requirement, error reporting
│   ├── standard-catalog/index.ts   # Wire function registry with all 14 functions
│   ├── contexts/
│   │   ├── ActionContext.tsx        # Discriminated action dispatch (event vs functionCall), sendDataModel
│   │   ├── SurfaceContext.tsx       # Theme storage, type-change detection, granular notifications
│   │   ├── ErrorContext.tsx         # NEW: Error reporting context
│   │   ├── ThemeContext.tsx         # NEW: Theme context with CSS custom properties
│   │   ├── DataStoreContext.tsx     # NEW: React context wrapper for DataStore (from utils)
│   │   └── ScopeContext.tsx         # Existing (unchanged)
│   ├── hooks/
│   │   ├── useA2UIMessageHandler.ts # Version field handling
│   │   ├── useDataBinding.ts        # Use DataStore subscriptions, type coercion
│   │   ├── useValidation.ts         # Reactive CheckRule with DynamicBoolean conditions
│   │   └── useDispatchAction.ts     # Event vs functionCall dispatch
│   ├── components/
│   │   ├── ComponentRenderer.tsx    # Accessibility attrs, error reporting for unknowns
│   │   ├── display/
│   │   │   ├── ImageComponent.tsx   # fit: scaleDown
│   │   │   └── IconComponent.tsx    # 12 missing icons
│   │   └── interactive/
│   │       ├── ButtonComponent.tsx  # variant enum, functionCall actions
│   │       ├── ChoicePickerComponent.tsx  # displayStyle, filterable
│   │       ├── DateTimeInputComponent.tsx # min/max, fix defaults, remove outputFormat
│   │       ├── TextFieldComponent.tsx     # validationRegexp
│   │       └── SliderComponent.tsx        # optional min, no default max
│   └── schemas/
│       ├── basic_catalog.json       # RENAMED from standard_catalog.json, updated $id/$ref
│       ├── common_types.json        # Updated $id/$ref URLs
│       ├── server_to_client.json    # Updated $id/$ref, version field
│       ├── client_to_server.json    # Updated $id/$ref, error message type
│       └── a2ui_client_capabilities.json  # RENAMED, updated structure
```

**Structure Decision**: Existing monorepo structure is preserved. New files are added within existing package boundaries following the established pattern. The `functions/` directory is new under utils to house catalog function implementations. New React contexts (`ErrorContext`, `ThemeContext`, `DataStoreContext`) follow the existing context pattern.
