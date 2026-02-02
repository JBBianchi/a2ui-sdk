# @a2ui-sdk/react

React implementation for rendering A2UI protocol. This package provides React components and hooks for integrating A2UI renderer into your application.

## Installation

```bash
npm install @a2ui-sdk/react
```

### Peer Dependencies

- `react` ^19.0.0
- `react-dom` ^19.0.0

## Usage

### v0.8

#### Basic Usage

```tsx
import {
  A2UIProvider,
  A2UIRenderer,
  type A2UIMessage,
  type A2UIAction,
} from '@a2ui-sdk/react/0.8'

function App() {
  const messages: A2UIMessage[] = [
    // A2UI messages from your backend
  ]

  const handleAction = (action: A2UIAction) => {
    console.log('Action received:', action)
  }

  return (
    <A2UIProvider messages={messages}>
      <A2UIRenderer onAction={handleAction} />
    </A2UIProvider>
  )
}
```

#### Custom Components

You can override default components or add new custom components via the `catalog` prop on `A2UIProvider`. Use `standardCatalog` as a base and extend it with your custom components.

```tsx
import {
  A2UIProvider,
  A2UIRenderer,
  standardCatalog,
  type A2UIMessage,
  type A2UIAction,
} from '@a2ui-sdk/react/0.8'

// Extend standard catalog with custom components
const customCatalog = {
  ...standardCatalog,
  components: {
    ...standardCatalog.components,
    // Override default Button component with a custom one
    Button: CustomButtonComponent,
    // Add a new custom Switch component
    Switch: CustomSwitchComponent,
  },
}

function App() {
  return (
    <A2UIProvider catalog={customCatalog} messages={messages}>
      <A2UIRenderer onAction={handleAction} />
    </A2UIProvider>
  )
}
```

Implementing a custom button component with action dispatch:

```tsx
import {
  useDispatchAction,
  ComponentRenderer,
  type ButtonComponentProps,
} from '@a2ui-sdk/react/0.8'

export function CustomButtonComponent({
  surfaceId,
  componentId,
  child,
  action,
}: ButtonComponentProps) {
  const dispatchAction = useDispatchAction()

  const handleClick = () => {
    if (action) {
      dispatchAction(surfaceId, componentId, action)
    }
  }

  return (
    <button onClick={handleClick}>
      <ComponentRenderer surfaceId={surfaceId} componentId={child} />
    </button>
  )
}
```

Implementing a custom switch component with data binding:

```tsx
import { useDataBinding, useFormBinding } from '@a2ui-sdk/react/0.8'

export function CustomSwitchComponent({
  surfaceId,
  componentId,
  label,
  value,
}: SwitchComponentProps) {
  const labelText = useDataBinding<string>(surfaceId, label, '')
  const [checked, setChecked] = useFormBinding<boolean>(surfaceId, value, false)

  const handleChange = (newChecked: boolean) => {
    setChecked(newChecked)
  }

  return (
    <Switch checked={checked} onChange={handleChange}>
      {labelText}
    </Switch>
  )
}
```

### v0.9

#### Basic Usage

```tsx
import {
  A2UIProvider,
  A2UIRenderer,
  type A2UIMessage,
  type A2UIAction,
} from '@a2ui-sdk/react/0.9'

function App() {
  const messages: A2UIMessage[] = [
    // A2UI messages from your backend
  ]

  const handleAction = (action: A2UIAction) => {
    console.log('Action:', action.name, action.context)
  }

  return (
    <A2UIProvider messages={messages}>
      <A2UIRenderer onAction={handleAction} />
    </A2UIProvider>
  )
}
```

#### Custom Components

Override or extend the standard catalog the same way as in v0.8:

```tsx
import {
  A2UIProvider,
  A2UIRenderer,
  standardCatalog,
  type A2UIMessage,
  type A2UIAction,
} from '@a2ui-sdk/react/0.9'

// Extend standard catalog with custom components
const customCatalog = {
  ...standardCatalog,
  components: {
    ...standardCatalog.components,
    // Override default components or add new ones
    Button: CustomButtonComponent,
  },
}

function App() {
  return (
    <A2UIProvider catalog={customCatalog} messages={messages}>
      <A2UIRenderer onAction={handleAction} />
    </A2UIProvider>
  )
}
```

## Exports

### v0.9 (Latest)

```tsx
import {
  // Components
  A2UIProvider,
  A2UIRenderer,
  ComponentRenderer,

  // Catalog
  standardCatalog,

  // Hooks
  useDispatchAction,
  useDataBinding,
  useFormBinding,
  useStringBinding,
  useDataModel,
  useValidation,
  useSurfaceContext,
  useScope,
  useScopeBasePath,
  useA2UIMessageHandler,

  // Context Providers & Hooks
  ActionProvider,
  useActionContext,

  // Types
  type A2UIMessage,
  type A2UIAction,
  type A2UIProviderProps,
  type A2UIRendererProps,
  type ComponentsMap,
  type Component,
  type Action,
  type DynamicValue,
  type DynamicString,
  type DynamicNumber,
  type DynamicBoolean,
  type DynamicStringList,
  type ChildList,
  type TemplateBinding,
  type CheckRule,
  type Checkable,
  type ValidationResult,
  type ScopeValue,
  type DataModel,
  type A2UIMessageHandler,
} from '@a2ui-sdk/react/0.9'
```

### v0.8

```tsx
import {
  // Components
  A2UIProvider,
  A2UIRenderer,
  ComponentRenderer,

  // Catalog
  standardCatalog,

  // Hooks
  useDispatchAction,
  useDataBinding,
  useFormBinding,
  useSurfaceContext,
  useDataModelContext,
  useScope,
  useScopeBasePath,
  useA2UIMessageHandler,

  // Context Providers & Hooks
  ActionProvider,
  useActionContext,

  // Types
  type A2UIMessage,
  type A2UIAction,
  type A2UIProviderProps,
  type A2UIRendererProps,
  type ComponentsMap,
  type Action,
  type ValueSource,
  type ScopeValue,
  type A2UIMessageHandler,
} from '@a2ui-sdk/react/0.8'
```

### Namespace Import

```tsx
import { v0_8, v0_9 } from '@a2ui-sdk/react'

// Use v0.9 API
const { A2UIProvider, A2UIRenderer } = v0_9
```

## Incremental Message Handling

**New in v0.8 & v0.9**: For applications that receive messages incrementally (e.g., via WebSocket or SSE), you can use the `useA2UIMessageHandler` hook to push new messages without clearing state. This preserves user edits.

### Problem

When using the `messages` prop on `A2UIProvider`, changing the messages array causes the provider to clear all state and reprocess from scratch. This loses user edits:

```tsx
// ❌ This loses user edits when new messages arrive
function App() {
  const [messages, setMessages] = useState<A2UIMessage[]>(initialMessages)

  useEffect(() => {
    const ws = new WebSocket('ws://example.com')
    ws.onmessage = (event) => {
      const newMessage = JSON.parse(event.data)
      setMessages((prev) => [...prev, newMessage]) // Triggers full clear & reprocess!
    }
  }, [])

  return (
    <A2UIProvider messages={messages}>
      <A2UIRenderer onAction={handleAction} />
    </A2UIProvider>
  )
}
```

### Solution

Use `useA2UIMessageHandler` hook to process messages incrementally:

```tsx
import {
  A2UIProvider,
  A2UIRenderer,
  useA2UIMessageHandler,
  type A2UIMessage,
  type A2UIAction,
} from '@a2ui-sdk/react/0.8' // or '@a2ui-sdk/react/0.9'

function App() {
  const handleAction = (action: A2UIAction) => {
    console.log('Action:', action)
  }

  return (
    <A2UIProvider>
      <MessageHandler>
        <A2UIRenderer onAction={handleAction} />
      </MessageHandler>
    </A2UIProvider>
  )
}

function MessageHandler({ children }: { children: React.ReactNode }) {
  const { processMessage, processMessages } = useA2UIMessageHandler()

  useEffect(() => {
    // Process initial messages
    processMessages(initialMessages)

    // Listen for incremental updates
    const ws = new WebSocket('ws://example.com')
    ws.onmessage = (event) => {
      const newMessage = JSON.parse(event.data)
      processMessage(newMessage) // Incremental - preserves user edits!
    }

    return () => ws.close()
  }, [processMessage, processMessages])

  return <>{children}</>
}
```

The `useA2UIMessageHandler` hook returns:

- **`processMessage(message: A2UIMessage)`**: Process a single message incrementally
- **`processMessages(messages: A2UIMessage[])`**: Process multiple messages in order
- **`clear()`**: Clear all surfaces and state (rarely needed)

## Hooks

### useA2UIMessageHandler

See [Incremental Message Handling](#incremental-message-handling) above for usage details.

### useDataBinding

Resolves a dynamic value from the data model:

```tsx
const value = useDataBinding({ path: '/user/name' })
// Returns the value at /user/name in the data model
```

### useFormBinding

Two-way binding for form components:

```tsx
const [value, setValue] = useFormBinding({ path: '/form/email' })
// value: current value
// setValue: update the data model
```

### useDispatchAction

Dispatch actions from custom components:

```tsx
const dispatch = useDispatchAction()

const handleClick = () => {
  dispatch({
    name: 'submit',
    context: { formId: 'contact' },
  })
}
```

### useValidation

Validate form inputs against check rules:

```tsx
const { valid, errors } = useValidation(checks)
// valid: boolean
// errors: string[] - list of failed validation messages
```

### ActionProvider & useActionContext

For advanced use cases, you can create custom action handling middleware by using `ActionProvider` and `useActionContext` directly. This is useful when you need to intercept, transform, or augment actions before they reach your action handler.

```tsx
import {
  A2UIProvider,
  A2UIRenderer,
  ActionProvider,
  useActionContext,
} from '@a2ui-sdk/react/0.9'

function ActionLogger({ children }: { children: React.ReactNode }) {
  const { onAction } = useActionContext()

  // You can access the action handler here
  // and potentially wrap it with logging or other middleware logic

  return <>{children}</>
}

function App() {
  const handleAction = (action: A2UIAction) => {
    console.log('Action:', action)
  }

  return (
    <A2UIProvider messages={messages}>
      <ActionProvider onAction={handleAction}>
        <ActionLogger>
          <A2UIRenderer />
        </ActionLogger>
      </ActionProvider>
    </A2UIProvider>
  )
}
```

**Note:** In most cases, you don't need to use `ActionProvider` directly as `A2UIProvider` already includes it. Use this only for advanced customization scenarios.

## License

Apache-2.0
