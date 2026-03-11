/**
 * T093: DataStore tests
 *
 * Tests subscribe, set, get, getSnapshot, bubble-up notifications,
 * cascade-down notifications, dispose cleanup, setAll.
 */

import { describe, it, expect, vi } from 'vitest'
import { DataStore } from '../dataStore.js'

describe('DataStore', () => {
  describe('constructor', () => {
    it('should initialize with empty data model by default', () => {
      const store = new DataStore()
      expect(store.getData()).toEqual({})
    })

    it('should initialize with provided data model', () => {
      const initial = { user: { name: 'Alice' } }
      const store = new DataStore(initial)
      expect(store.getData()).toEqual(initial)
    })
  })

  describe('get', () => {
    it('should return value at a path', () => {
      const store = new DataStore({ user: { name: 'Alice', age: 30 } })
      expect(store.get('/user/name')).toBe('Alice')
      expect(store.get('/user/age')).toBe(30)
    })

    it('should return undefined for missing path', () => {
      const store = new DataStore({ user: { name: 'Alice' } })
      expect(store.get('/nonexistent')).toBeUndefined()
    })

    it('should return entire data model for root path', () => {
      const data = { key: 'value' }
      const store = new DataStore(data)
      expect(store.get('/')).toEqual(data)
    })

    it('should return entire data model for empty string path', () => {
      const data = { key: 'value' }
      const store = new DataStore(data)
      expect(store.get('')).toEqual(data)
    })
  })

  describe('getSnapshot', () => {
    it('should return same value as get', () => {
      const store = new DataStore({ count: 42 })
      expect(store.getSnapshot('/count')).toBe(store.get('/count'))
    })
  })

  describe('set', () => {
    it('should set a value at a path', () => {
      const store = new DataStore({ user: { name: 'Alice' } })
      store.set('/user/name', 'Bob')
      expect(store.get('/user/name')).toBe('Bob')
    })

    it('should create new paths (auto-vivify)', () => {
      const store = new DataStore({})
      store.set('/user/name', 'Charlie')
      expect(store.get('/user/name')).toBe('Charlie')
    })

    it('should handle array values', () => {
      const store = new DataStore({ items: ['a', 'b'] })
      store.set('/items/1', 'B')
      expect(store.get('/items/1')).toBe('B')
      expect(store.get('/items/0')).toBe('a')
    })
  })

  describe('subscribe - exact path notifications', () => {
    it('should notify listener when exact path changes', () => {
      const store = new DataStore({ count: 0 })
      const listener = vi.fn()

      store.subscribe('/count', listener)
      store.set('/count', 1)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should not notify after unsubscribe', () => {
      const store = new DataStore({ count: 0 })
      const listener = vi.fn()

      const unsub = store.subscribe('/count', listener)
      unsub()
      store.set('/count', 1)

      expect(listener).not.toHaveBeenCalled()
    })

    it('should support multiple listeners on the same path', () => {
      const store = new DataStore({ count: 0 })
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      store.subscribe('/count', listener1)
      store.subscribe('/count', listener2)
      store.set('/count', 1)

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('should not notify listeners on unrelated paths', () => {
      const store = new DataStore({ a: 1, b: 2 })
      const listener = vi.fn()

      store.subscribe('/a', listener)
      store.set('/b', 3)

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('subscribe - bubble-up notifications (ancestor paths)', () => {
    it('should notify ancestor when descendant changes', () => {
      const store = new DataStore({ user: { name: 'Alice' } })
      const listener = vi.fn()

      store.subscribe('/user', listener)
      store.set('/user/name', 'Bob')

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should notify root subscriber for any change', () => {
      const store = new DataStore({ deep: { nested: { value: 1 } } })
      const listener = vi.fn()

      store.subscribe('/', listener)
      store.set('/deep/nested/value', 2)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should notify multiple ancestor levels', () => {
      const store = new DataStore({ a: { b: { c: 1 } } })
      const listenerA = vi.fn()
      const listenerAB = vi.fn()

      store.subscribe('/a', listenerA)
      store.subscribe('/a/b', listenerAB)
      store.set('/a/b/c', 2)

      expect(listenerA).toHaveBeenCalledTimes(1)
      expect(listenerAB).toHaveBeenCalledTimes(1)
    })
  })

  describe('subscribe - cascade-down notifications (descendant paths)', () => {
    it('should notify descendant when ancestor changes', () => {
      const store = new DataStore({ user: { name: 'Alice', age: 30 } })
      const listener = vi.fn()

      store.subscribe('/user/name', listener)
      store.set('/user', { name: 'Bob', age: 25 })

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should notify deeply nested subscriber when parent changes', () => {
      const store = new DataStore({ a: { b: { c: 1 } } })
      const listener = vi.fn()

      store.subscribe('/a/b/c', listener)
      store.set('/a', { b: { c: 2 } })

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('setAll', () => {
    it('should replace entire data model', () => {
      const store = new DataStore({ old: 'data' })
      store.setAll({ new: 'data' })
      expect(store.getData()).toEqual({ new: 'data' })
      expect(store.get('/old')).toBeUndefined()
      expect(store.get('/new')).toBe('data')
    })

    it('should notify all listeners', () => {
      const store = new DataStore({ a: 1, b: 2 })
      const listenerA = vi.fn()
      const listenerB = vi.fn()
      const listenerC = vi.fn()

      store.subscribe('/a', listenerA)
      store.subscribe('/b', listenerB)
      store.subscribe('/c', listenerC)

      store.setAll({ a: 10, c: 30 })

      expect(listenerA).toHaveBeenCalledTimes(1)
      expect(listenerB).toHaveBeenCalledTimes(1)
      expect(listenerC).toHaveBeenCalledTimes(1)
    })
  })

  describe('dispose', () => {
    it('should clear all listeners', () => {
      const store = new DataStore({ count: 0 })
      const listener = vi.fn()

      store.subscribe('/count', listener)
      store.dispose()
      store.set('/count', 1)

      expect(listener).not.toHaveBeenCalled()
    })

    it('should allow continued use after dispose (just no notifications)', () => {
      const store = new DataStore({ x: 1 })
      store.dispose()
      store.set('/x', 2)
      expect(store.get('/x')).toBe(2)
    })
  })

  describe('unsubscribe cleanup', () => {
    it('should clean up empty listener sets after all listeners unsubscribe', () => {
      const store = new DataStore({ x: 1 })
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      const unsub1 = store.subscribe('/x', listener1)
      const unsub2 = store.subscribe('/x', listener2)

      unsub1()
      unsub2()

      // After both unsubscribe, setting should not notify anyone
      store.set('/x', 2)
      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })

    it('should handle unsubscribing the same listener twice gracefully', () => {
      const store = new DataStore({ x: 1 })
      const listener = vi.fn()

      const unsub = store.subscribe('/x', listener)
      unsub()
      // Second unsubscribe should not throw
      expect(() => unsub()).not.toThrow()
    })
  })
})
