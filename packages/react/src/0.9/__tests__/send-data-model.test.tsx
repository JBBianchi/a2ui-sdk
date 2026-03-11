/**
 * Tests for sendDataModel behavior in action payloads.
 *
 * T073: Validates that when sendDataModel=true on createSurface, action payloads
 * include dataModel; when sendDataModel=false or unset, dataModel is NOT included.
 */

import { useRef, type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SurfaceProvider, useSurfaceContext } from '../contexts/SurfaceContext'
import { ActionProvider, useActionContext } from '../contexts/ActionContext'

/**
 * Test provider with action handling and getSendDataModel support.
 */
function TestProvider({
  onAction,
  children,
}: {
  onAction?: (payload: unknown) => void
  children: ReactNode
}) {
  return (
    <SurfaceProvider>
      <InnerProvider onAction={onAction}>{children}</InnerProvider>
    </SurfaceProvider>
  )
}

/**
 * Inner provider that reads surface context for getSendDataModel.
 */
function InnerProvider({
  onAction,
  children,
}: {
  onAction?: (payload: unknown) => void
  children: ReactNode
}) {
  const { getSurface } = useSurfaceContext()

  const getSendDataModel = (surfaceId: string) =>
    getSurface(surfaceId)?.sendDataModel === true

  return (
    <ActionProvider onAction={onAction} getSendDataModel={getSendDataModel}>
      {children}
    </ActionProvider>
  )
}

/**
 * Setup component that creates a surface with optional sendDataModel flag.
 */
function SurfaceSetup({
  surfaceId,
  dataModel,
  sendDataModel,
  children,
}: {
  surfaceId: string
  dataModel: Record<string, unknown>
  sendDataModel?: boolean
  children: ReactNode
}) {
  const ctx = useSurfaceContext()
  const setupDone = useRef<null | true>(null)

  if (setupDone.current === null) {
    setupDone.current = true
    ctx.createSurface(surfaceId, 'catalog-1', 'root', undefined, sendDataModel)
    ctx.updateDataModel(surfaceId, '/', dataModel)
  }

  return <>{children}</>
}

/**
 * Component that dispatches an action using the ActionContext.
 */
function ActionDispatcher({ surfaceId }: { surfaceId: string }) {
  const actionCtx = useActionContext()
  const surfaceCtx = useSurfaceContext()

  return (
    <button
      data-testid="dispatch"
      onClick={() => {
        const dataModel = surfaceCtx.getDataModel(surfaceId)
        actionCtx.dispatchAction(
          surfaceId,
          'btn-1',
          {
            event: { name: 'submit', context: { key: 'value' } },
          },
          dataModel
        )
      }}
    >
      Dispatch
    </button>
  )
}

describe('sendDataModel (T073)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should include dataModel in action payload when sendDataModel=true', () => {
    const onAction = vi.fn()

    render(
      <TestProvider onAction={onAction}>
        <SurfaceSetup
          surfaceId="main"
          dataModel={{ user: { name: 'Alice' }, count: 42 }}
          sendDataModel={true}
        >
          <ActionDispatcher surfaceId="main" />
        </SurfaceSetup>
      </TestProvider>
    )

    act(() => {
      screen.getByTestId('dispatch').click()
    })

    expect(onAction).toHaveBeenCalledTimes(1)
    const payload = onAction.mock.calls[0][0]
    expect(payload.dataModel).toBeDefined()
    expect(payload.dataModel).toEqual({ user: { name: 'Alice' }, count: 42 })
  })

  it('should NOT include dataModel in action payload when sendDataModel=false', () => {
    const onAction = vi.fn()

    render(
      <TestProvider onAction={onAction}>
        <SurfaceSetup
          surfaceId="main"
          dataModel={{ user: { name: 'Bob' } }}
          sendDataModel={false}
        >
          <ActionDispatcher surfaceId="main" />
        </SurfaceSetup>
      </TestProvider>
    )

    act(() => {
      screen.getByTestId('dispatch').click()
    })

    expect(onAction).toHaveBeenCalledTimes(1)
    const payload = onAction.mock.calls[0][0]
    expect(payload.dataModel).toBeUndefined()
  })

  it('should NOT include dataModel in action payload when sendDataModel is not set', () => {
    const onAction = vi.fn()

    render(
      <TestProvider onAction={onAction}>
        <SurfaceSetup surfaceId="main" dataModel={{ items: [1, 2, 3] }}>
          <ActionDispatcher surfaceId="main" />
        </SurfaceSetup>
      </TestProvider>
    )

    act(() => {
      screen.getByTestId('dispatch').click()
    })

    expect(onAction).toHaveBeenCalledTimes(1)
    const payload = onAction.mock.calls[0][0]
    expect(payload.dataModel).toBeUndefined()
  })

  it('should include correct action metadata alongside dataModel', () => {
    const onAction = vi.fn()

    render(
      <TestProvider onAction={onAction}>
        <SurfaceSetup
          surfaceId="surface-1"
          dataModel={{ value: 'test' }}
          sendDataModel={true}
        >
          <ActionDispatcher surfaceId="surface-1" />
        </SurfaceSetup>
      </TestProvider>
    )

    act(() => {
      screen.getByTestId('dispatch').click()
    })

    expect(onAction).toHaveBeenCalledTimes(1)
    const payload = onAction.mock.calls[0][0]
    expect(payload.surfaceId).toBe('surface-1')
    expect(payload.name).toBe('submit')
    expect(payload.sourceComponentId).toBe('btn-1')
    expect(payload.timestamp).toBeDefined()
    expect(payload.context).toEqual({ key: 'value' })
    expect(payload.dataModel).toEqual({ value: 'test' })
  })

  it('should handle sendDataModel=true with empty data model', () => {
    const onAction = vi.fn()

    render(
      <TestProvider onAction={onAction}>
        <SurfaceSetup surfaceId="main" dataModel={{}} sendDataModel={true}>
          <ActionDispatcher surfaceId="main" />
        </SurfaceSetup>
      </TestProvider>
    )

    act(() => {
      screen.getByTestId('dispatch').click()
    })

    expect(onAction).toHaveBeenCalledTimes(1)
    const payload = onAction.mock.calls[0][0]
    expect(payload.dataModel).toEqual({})
  })
})
