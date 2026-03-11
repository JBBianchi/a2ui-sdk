# Quickstart Validation: A2UI v0.9 Compliance

**Feature**: 005-a2ui-v09-compliance | **Date**: 2026-03-11

## Validation Scenarios

These scenarios can be used to validate the implementation is correct after each phase.

### Scenario 1: Action Model (P1 — after types + utils + react action changes)

**Input message**:

```json
{
  "version": "v0.9",
  "createSurface": { "surfaceId": "test", "root": "root", "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json" }
}
{"updateComponents": { "surfaceId": "test", "components": [
  { "id": "root", "component": "Column", "children": ["btn-event", "btn-fn"] },
  { "id": "btn-event-child", "component": "Text", "text": "Submit" },
  { "id": "btn-event", "component": "Button", "child": "btn-event-child", "variant": "primary",
    "action": { "event": { "name": "submit", "context": { "ts": "now" } } } },
  { "id": "btn-fn-child", "component": "Text", "text": "Open Docs" },
  { "id": "btn-fn", "component": "Button", "child": "btn-fn-child", "variant": "borderless",
    "action": { "functionCall": { "call": "openUrl", "args": { "url": "https://a2ui.org" } } } }
]}}
```

**Expected**:

- Two buttons render: "Submit" (primary style) and "Open Docs" (borderless style)
- Clicking "Submit" triggers `onAction` with `{ name: "submit", context: { ts: "now" }, surfaceId: "test", ... }`
- Clicking "Open Docs" opens `https://a2ui.org` in browser, does NOT trigger `onAction`

### Scenario 2: Function Evaluation (P1 — after function registry wired)

**Input**:

```json
{"updateComponents": { "surfaceId": "test", "components": [
  { "id": "price", "component": "Text",
    "text": { "call": "formatCurrency", "args": { "value": { "path": "/price" }, "currency": "USD" } } },
  { "id": "greeting", "component": "Text",
    "text": { "call": "formatString", "args": { "value": "Hello ${/user/name}!" } } }
]}}
{"updateDataModel": { "surfaceId": "test", "path": "/", "value": { "price": 42.5, "user": { "name": "Alice" } } }}
```

**Expected**:

- Price text shows "$42.50" (or locale-appropriate)
- Greeting shows "Hello Alice!"
- Raw string `"Test ${/foo}"` on a Text component shows literal `"Test ${/foo}"` (no interpolation)

### Scenario 3: CheckRule Validation (P1 — after validation restructured)

**Input**:

```json
{
  "updateComponents": {
    "surfaceId": "test",
    "components": [
      {
        "id": "email-field",
        "component": "TextField",
        "label": "Email",
        "value": { "path": "/email" },
        "checks": [
          {
            "condition": {
              "call": "required",
              "args": { "value": { "path": "/email" } },
              "returnType": "boolean"
            },
            "message": "Email is required"
          },
          {
            "condition": {
              "call": "email",
              "args": { "value": { "path": "/email" } },
              "returnType": "boolean"
            },
            "message": "Must be a valid email"
          }
        ]
      }
    ]
  }
}
```

**Expected**:

- Empty field shows "Email is required"
- "abc" shows "Must be a valid email"
- "alice@example.com" shows no errors

### Scenario 4: Theme and Accessibility (P2)

**Input**:

```json
{
  "createSurface": {
    "surfaceId": "themed", "root": "root",
    "theme": { "primaryColor": "#FF5733", "agentDisplayName": "Travel Bot" }
  }
}
{"updateComponents": { "surfaceId": "themed", "components": [
  { "id": "root", "component": "Column", "children": ["btn"],
    "accessibility": { "label": "Main content" } },
  { "id": "btn-child", "component": "Text", "text": "Book Now" },
  { "id": "btn", "component": "Button", "child": "btn-child", "variant": "primary",
    "action": { "event": { "name": "book" } },
    "accessibility": { "label": "Book a flight", "description": "Click to start booking" } }
]}}
```

**Expected**:

- Primary button uses #FF5733 as accent color
- Column has `aria-label="Main content"`
- Button has `aria-label="Book a flight"` and `aria-description="Click to start booking"`

### Scenario 5: Data Model Semantics (P3)

**Programmatic test**:

```typescript
// Auto-vivification
store.set('/a/b/0/c', 'value')
// Expected: { a: { b: [{ c: 'value' }] } }

// Sparse array
store.set('/items', [1, 2, 3])
store.set('/items/1', undefined)
// Expected: [1, undefined, 3] (length 3)

// Primitive traversal error
store.set('/name', 'hello')
store.set('/name/first', 'world')
// Expected: throws Error
```

### Scenario 6: Error Reporting (P3)

**Input**: Send a component with `"component": "NonExistentWidget"`.

**Expected**: `onError` called with:

```json
{
  "code": "UNKNOWN_COMPONENT",
  "surfaceId": "test",
  "message": "Unknown component type: NonExistentWidget"
}
```
