/**
 * Tests for action dispatch integration - event actions, functionCall actions,
 * and invalid action formats.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SurfaceProvider, useSurfaceContext } from '../contexts/SurfaceContext'
import { ActionProvider } from '../contexts/ActionContext'
import { useDispatchAction } from '../hooks/useDispatchAction'
import { useRef, type ReactNode } from 'react'
import { FunctionRegistry } from '@a2ui-sdk/utils/0.9'
import { createBasicFunctionRegistry } from '../basic-catalog'

/**
 * Test provider with all required contexts.
 */
function TestProvider({
  onAction,
  functionRegistry,
  children,
}: {
  onAction?: (payload: unknown) => void
  functionRegistry?: FunctionRegistry
  children: ReactNode
}) {
  return (
    <SurfaceProvider>
      <ActionProvider onAction={onAction} functionRegistry={functionRegistry}>
        {children}
      </ActionProvider>
    </SurfaceProvider>
  )
}

/**
 * Setup component that creates a surface with data.
 */
function SurfaceSetup({
  surfaceId,
  dataModel,
  children,
}: {
  surfaceId: string
  dataModel: Record<string, unknown>
  children: ReactNode
}) {
  const ctx = useSurfaceContext()
  const setupDone = useRef<null | true>(null)

  if (setupDone.current === null) {
    setupDone.current = true
    ctx.createSurface(surfaceId, 'catalog-1')
    ctx.updateDataModel(surfaceId, '/', dataModel)
  }

  return <>{children}</>
}

describe('Action dispatch integration', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('event action variant', () => {
    it('should trigger onAction callback with resolved context', () => {
      const onAction = vi.fn()

      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                event: {
                  name: 'submit',
                  context: {
                    userName: { path: '/user/name' },
                    staticVal: 'hello',
                  },
                },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider onAction={onAction}>
          <SurfaceSetup
            surfaceId="main"
            dataModel={{ user: { name: 'Alice' } }}
          >
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(onAction).toHaveBeenCalledTimes(1)
      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          surfaceId: 'main',
          name: 'submit',
          sourceComponentId: 'btn-1',
          context: {
            userName: 'Alice',
            staticVal: 'hello',
          },
        })
      )
    })

    it('should include timestamp in payload', () => {
      const onAction = vi.fn()

      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                event: { name: 'click' },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider onAction={onAction}>
          <SurfaceSetup surfaceId="main" dataModel={{}}>
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      )
    })

    it('should resolve function calls in event context when a registry is available', () => {
      const onAction = vi.fn()
      const registry = createBasicFunctionRegistry()

      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                event: {
                  name: 'submit',
                  context: {
                    formattedDate: {
                      call: 'formatDate',
                      args: {
                        value: { path: '/reservation/date' },
                        format: 'dd/MM/yyyy',
                        locale: 'en-US',
                      },
                      returnType: 'string',
                    },
                  },
                },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider onAction={onAction} functionRegistry={registry}>
          <SurfaceSetup
            surfaceId="main"
            dataModel={{ reservation: { date: '2024-06-15T14:30:00Z' } }}
          >
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            formattedDate: '15/06/2024',
          },
        })
      )
    })

    it('should keep event dispatch working when function-backed context cannot be resolved', () => {
      const onAction = vi.fn()

      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                event: {
                  name: 'submit',
                  context: {
                    formattedDate: {
                      call: 'formatDate',
                      args: {
                        value: { path: '/reservation/date' },
                        format: 'dd/MM/yyyy',
                      },
                      returnType: 'string',
                    },
                    rawDate: { path: '/reservation/date' },
                  },
                },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider onAction={onAction}>
          <SurfaceSetup
            surfaceId="main"
            dataModel={{ reservation: { date: '2024-06-15T14:30:00Z' } }}
          >
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            formattedDate: undefined,
            rawDate: '2024-06-15T14:30:00Z',
          },
        })
      )
    })
  })

  describe('functionCall action variant', () => {
    it('should execute registered function via function registry', () => {
      const executeFn = vi.fn()
      const registry = new FunctionRegistry()
      registry.register({
        name: 'openUrl',
        returnType: 'void',
        execute: executeFn,
      })

      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                functionCall: {
                  call: 'openUrl',
                  args: { url: 'https://example.com' },
                },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider functionRegistry={registry}>
          <SurfaceSetup surfaceId="main" dataModel={{}}>
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(executeFn).toHaveBeenCalledTimes(1)
      expect(executeFn).toHaveBeenCalledWith(
        { url: 'https://example.com' },
        expect.any(Object),
        null
      )
    })

    it('should warn when no function registry is available', () => {
      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                functionCall: { call: 'openUrl', args: { url: 'test' } },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider>
          <SurfaceSetup surfaceId="main" dataModel={{}}>
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('no function registry is available')
      )
    })

    it('should resolve path bindings in functionCall args', () => {
      const executeFn = vi.fn()
      const registry = new FunctionRegistry()
      registry.register({
        name: 'greet',
        returnType: 'void',
        execute: executeFn,
      })

      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                functionCall: {
                  call: 'greet',
                  args: { name: { path: '/user/name' } },
                },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider functionRegistry={registry}>
          <SurfaceSetup surfaceId="main" dataModel={{ user: { name: 'Bob' } }}>
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(executeFn).toHaveBeenCalledWith(
        { name: 'Bob' },
        expect.any(Object),
        null
      )
    })
  })

  describe('event action does NOT dispatch for functionCall, and vice versa', () => {
    it('functionCall action should not trigger onAction callback', () => {
      const onAction = vi.fn()
      const registry = new FunctionRegistry()
      registry.register({
        name: 'test',
        returnType: 'void',
        execute: vi.fn(),
      })

      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                functionCall: { call: 'test' },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider onAction={onAction} functionRegistry={registry}>
          <SurfaceSetup surfaceId="main" dataModel={{}}>
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(onAction).not.toHaveBeenCalled()
    })

    it('event action should not execute function registry', () => {
      const onAction = vi.fn()
      const executeFn = vi.fn()
      const registry = new FunctionRegistry()
      registry.register({
        name: 'click',
        returnType: 'void',
        execute: executeFn,
      })

      function TestComponent() {
        const dispatchAction = useDispatchAction()

        return (
          <button
            data-testid="dispatch"
            onClick={() =>
              dispatchAction('main', 'btn-1', {
                event: { name: 'click' },
              })
            }
          >
            Click
          </button>
        )
      }

      render(
        <TestProvider onAction={onAction} functionRegistry={registry}>
          <SurfaceSetup surfaceId="main" dataModel={{}}>
            <TestComponent />
          </SurfaceSetup>
        </TestProvider>
      )

      act(() => {
        screen.getByTestId('dispatch').click()
      })

      expect(onAction).toHaveBeenCalled()
      expect(executeFn).not.toHaveBeenCalled()
    })
  })
})
