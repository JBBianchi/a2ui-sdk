/**
 * Tests for granular DataStore notification behavior.
 *
 * T094: Placeholder test that validates DataStore's path-based subscription
 * notification contract at the unit level. Verifies that subscribing to /a
 * and updating /b does NOT trigger the /a listener, while updating /a does.
 *
 * This validates the granular notification contract even before React integration
 * (T096/T097 pending).
 */

import { describe, it, expect, vi } from 'vitest'
import { DataStore } from '@a2ui-sdk/utils/0.9'

describe('Granular Render - DataStore Notifications (T094)', () => {
  it('should NOT notify /a subscriber when /b is updated', () => {
    const store = new DataStore({ a: 1, b: 2 })
    const listenerA = vi.fn()

    store.subscribe('/a', listenerA)
    store.set('/b', 99)

    expect(listenerA).not.toHaveBeenCalled()
  })

  it('should notify /a subscriber when /a is updated', () => {
    const store = new DataStore({ a: 1, b: 2 })
    const listenerA = vi.fn()

    store.subscribe('/a', listenerA)
    store.set('/a', 42)

    expect(listenerA).toHaveBeenCalledTimes(1)
  })

  it('should notify /a subscriber when /a/child is updated (ancestor notification)', () => {
    const store = new DataStore({ a: { child: 1 }, b: 2 })
    const listenerA = vi.fn()

    store.subscribe('/a', listenerA)
    store.set('/a/child', 99)

    expect(listenerA).toHaveBeenCalledTimes(1)
  })

  it('should notify /a/child subscriber when /a is updated (descendant notification)', () => {
    const store = new DataStore({ a: { child: 1 }, b: 2 })
    const listenerChild = vi.fn()

    store.subscribe('/a/child', listenerChild)
    store.set('/a', { child: 99 })

    expect(listenerChild).toHaveBeenCalledTimes(1)
  })

  it('should NOT notify /a/child subscriber when /b is updated', () => {
    const store = new DataStore({ a: { child: 1 }, b: 2 })
    const listenerChild = vi.fn()

    store.subscribe('/a/child', listenerChild)
    store.set('/b', 99)

    expect(listenerChild).not.toHaveBeenCalled()
  })

  it('should support multiple listeners on different paths independently', () => {
    const store = new DataStore({ x: 1, y: 2, z: 3 })
    const listenerX = vi.fn()
    const listenerY = vi.fn()
    const listenerZ = vi.fn()

    store.subscribe('/x', listenerX)
    store.subscribe('/y', listenerY)
    store.subscribe('/z', listenerZ)

    store.set('/y', 20)

    expect(listenerX).not.toHaveBeenCalled()
    expect(listenerY).toHaveBeenCalledTimes(1)
    expect(listenerZ).not.toHaveBeenCalled()
  })

  it('should unsubscribe correctly', () => {
    const store = new DataStore({ a: 1 })
    const listener = vi.fn()

    const unsubscribe = store.subscribe('/a', listener)

    store.set('/a', 10)
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()

    store.set('/a', 20)
    expect(listener).toHaveBeenCalledTimes(1) // Should not be called again
  })

  it('should notify all listeners when setAll is called', () => {
    const store = new DataStore({ a: 1, b: 2 })
    const listenerA = vi.fn()
    const listenerB = vi.fn()

    store.subscribe('/a', listenerA)
    store.subscribe('/b', listenerB)

    store.setAll({ a: 10, b: 20 })

    expect(listenerA).toHaveBeenCalledTimes(1)
    expect(listenerB).toHaveBeenCalledTimes(1)
  })

  it('should return correct values after set', () => {
    const store = new DataStore({ counter: 0 })

    store.set('/counter', 5)

    expect(store.get('/counter')).toBe(5)
    expect(store.getData()).toEqual({ counter: 5 })
  })

  it('should clear all listeners on dispose', () => {
    const store = new DataStore({ a: 1 })
    const listener = vi.fn()

    store.subscribe('/a', listener)
    store.dispose()

    store.set('/a', 42)
    expect(listener).not.toHaveBeenCalled()
  })

  it('should notify root subscriber when any path is updated', () => {
    const store = new DataStore({ a: 1, b: { c: 2 } })
    const rootListener = vi.fn()

    store.subscribe('/', rootListener)
    store.set('/b/c', 99)

    expect(rootListener).toHaveBeenCalledTimes(1)
  })
})
