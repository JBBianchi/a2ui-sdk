/**
 * Tests for version handling in useA2UIMessageHandler.
 *
 * T074: Validates that version='0.9' processes normally (no warning),
 * version='0.8' logs a warning, and missing version processes normally.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { SurfaceProvider, useSurfaceContext } from '../contexts/SurfaceContext'
import { useA2UIMessageHandler } from '../hooks/useA2UIMessageHandler'

/**
 * Test component that exposes message handler and surface context.
 */
function TestConsumer({
  onReady,
}: {
  onReady: (
    handler: ReturnType<typeof useA2UIMessageHandler>,
    ctx: ReturnType<typeof useSurfaceContext>
  ) => void
}) {
  const handler = useA2UIMessageHandler()
  const ctx = useSurfaceContext()
  onReady(handler, ctx)
  return <div>Consumer</div>
}

describe('Version Handling (T074)', () => {
  let handler: ReturnType<typeof useA2UIMessageHandler>
  let ctx: ReturnType<typeof useSurfaceContext>

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithProvider = () => {
    render(
      <SurfaceProvider>
        <TestConsumer
          onReady={(h, c) => {
            handler = h
            ctx = c
          }}
        />
      </SurfaceProvider>
    )
  }

  it('should process message with version="0.9" normally without warning', () => {
    renderWithProvider()

    act(() => {
      handler.processMessage({
        version: '0.9',
        createSurface: {
          surfaceId: 'main',
          catalogId: 'catalog-1',
        },
      })
    })

    const surface = ctx.getSurface('main')
    expect(surface).toBeDefined()
    expect(surface?.surfaceId).toBe('main')
    // No version mismatch warning should be logged
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('does not match expected version')
    )
  })

  it('should log warning for message with version="0.8"', () => {
    renderWithProvider()

    act(() => {
      handler.processMessage({
        version: '0.8',
        createSurface: {
          surfaceId: 'main',
          catalogId: 'catalog-1',
        },
      })
    })

    // Should still process the message (surface is created)
    const surface = ctx.getSurface('main')
    expect(surface).toBeDefined()

    // But should log a version mismatch warning
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"0.8"'))
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('does not match expected version "0.9"')
    )
  })

  it('should process message without version field normally (no warning)', () => {
    renderWithProvider()

    act(() => {
      handler.processMessage({
        createSurface: {
          surfaceId: 'main',
          catalogId: 'catalog-1',
        },
      })
    })

    const surface = ctx.getSurface('main')
    expect(surface).toBeDefined()
    expect(surface?.surfaceId).toBe('main')
    // No version warning should be logged
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('does not match expected version')
    )
  })

  it('should log warning for any non-0.9 version string', () => {
    renderWithProvider()

    act(() => {
      handler.processMessage({
        version: '1.0',
        createSurface: {
          surfaceId: 'main',
          catalogId: 'catalog-1',
        },
      })
    })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"1.0"'))
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('does not match expected version "0.9"')
    )
  })

  it('should still process the message content even with version mismatch', () => {
    renderWithProvider()

    act(() => {
      handler.processMessage({
        version: '0.8',
        createSurface: {
          surfaceId: 'test-surface',
          catalogId: 'cat-1',
        },
      })
    })

    // Surface should be created despite version mismatch
    const surface = ctx.getSurface('test-surface')
    expect(surface).toBeDefined()
    expect(surface?.catalogId).toBe('cat-1')
  })

  it('should handle updateComponents with version field', () => {
    renderWithProvider()

    // First create the surface
    act(() => {
      handler.processMessage({
        createSurface: {
          surfaceId: 'main',
          catalogId: 'catalog-1',
        },
      })
    })

    // Then send updateComponents with version
    act(() => {
      handler.processMessage({
        version: '0.9',
        updateComponents: {
          surfaceId: 'main',
          components: [{ id: 'text-1', component: 'Text', text: 'Hello' }],
        },
      })
    })

    expect(ctx.getComponent('main', 'text-1')).toBeDefined()
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('does not match expected version')
    )
  })
})
