/**
 * T083: setValueByPath advanced tests
 *
 * Tests auto-vivification, sparse array deletion, and primitive traversal errors.
 */

import { describe, it, expect } from 'vitest'
import { setValueByPath } from '../pathUtils.js'
import type { DataModel } from '@a2ui-sdk/types/0.9'

describe('setValueByPath - auto-vivification', () => {
  it('should auto-vivify an object when next segment is a string key', () => {
    const model: DataModel = {}
    const result = setValueByPath(model, '/user/name', 'Alice')
    expect(result).toEqual({ user: { name: 'Alice' } })
  })

  it('should auto-vivify nested objects deeply', () => {
    const model: DataModel = {}
    const result = setValueByPath(model, '/a/b/c/d', 'deep')
    expect(result).toEqual({ a: { b: { c: { d: 'deep' } } } })
  })

  it('should auto-vivify an array when next segment is numeric', () => {
    const model: DataModel = {}
    const result = setValueByPath(model, '/items/0', 'first')
    expect(result).toEqual({ items: ['first'] })
    expect(Array.isArray(result.items)).toBe(true)
  })

  it('should auto-vivify mixed array and object paths', () => {
    const model: DataModel = {}
    const result = setValueByPath(model, '/users/0/name', 'Bob')
    expect(result).toEqual({ users: [{ name: 'Bob' }] })
    expect(Array.isArray(result.users)).toBe(true)
  })

  it('should auto-vivify within existing array elements', () => {
    const model: DataModel = { items: [null] }
    const result = setValueByPath(model, '/items/0/label', 'hello')
    expect(result).toEqual({ items: [{ label: 'hello' }] })
  })

  it('should auto-vivify array within array', () => {
    const model: DataModel = {}
    const result = setValueByPath(model, '/matrix/0/0', 42)
    expect(result).toEqual({ matrix: [[42]] })
    expect(Array.isArray(result.matrix)).toBe(true)
    expect(Array.isArray((result.matrix as unknown[])[0])).toBe(true)
  })

  it('should not modify original data model (immutability)', () => {
    const model: DataModel = { user: { name: 'Alice' } }
    const result = setValueByPath(model, '/user/name', 'Bob')
    expect(result).toEqual({ user: { name: 'Bob' } })
    expect(model).toEqual({ user: { name: 'Alice' } })
  })
})

describe('setValueByPath - sparse array deletion', () => {
  it('should set element to undefined (not splice) when deleting from array', () => {
    const model: DataModel = { items: ['a', 'b', 'c'] }
    const result = setValueByPath(model, '/items/1', undefined)
    const items = result.items as unknown[]
    // Array length should be preserved
    expect(items.length).toBe(3)
    expect(items[0]).toBe('a')
    expect(items[1]).toBeUndefined()
    expect(items[2]).toBe('c')
  })

  it('should preserve array length when deleting last element', () => {
    const model: DataModel = { items: ['x', 'y'] }
    const result = setValueByPath(model, '/items/1', undefined)
    const items = result.items as unknown[]
    expect(items.length).toBe(2)
    expect(items[0]).toBe('x')
    expect(items[1]).toBeUndefined()
  })

  it('should handle setting null into array (not deletion)', () => {
    const model: DataModel = { items: ['a', 'b'] }
    const result = setValueByPath(model, '/items/0', null)
    const items = result.items as unknown[]
    expect(items[0]).toBeNull()
    expect(items.length).toBe(2)
  })

  it('should delete object properties when setting undefined', () => {
    const model: DataModel = { user: { name: 'Alice', age: 30 } }
    const result = setValueByPath(model, '/user/age', undefined)
    expect(result).toEqual({ user: { name: 'Alice' } })
    expect('age' in (result.user as Record<string, unknown>)).toBe(false)
  })
})

describe('setValueByPath - primitive traversal throws TypeError', () => {
  it('should throw TypeError when traversing through a string', () => {
    const model: DataModel = { name: 'Alice' }
    expect(() => setValueByPath(model, '/name/first', 'X')).toThrow(TypeError)
    expect(() => setValueByPath(model, '/name/first', 'X')).toThrow(
      /Cannot traverse through primitive/
    )
  })

  it('should throw TypeError when traversing through a number', () => {
    const model: DataModel = { count: 42 }
    expect(() => setValueByPath(model, '/count/sub', 'X')).toThrow(TypeError)
  })

  it('should throw TypeError when traversing through a boolean', () => {
    const model: DataModel = { active: true }
    expect(() => setValueByPath(model, '/active/sub', 'X')).toThrow(TypeError)
  })

  it('should include the path in the TypeError message', () => {
    const model: DataModel = { a: { b: 'primitive' } }
    expect(() => setValueByPath(model, '/a/b/c', 'X')).toThrow(/\/a\/b/)
  })
})

describe('setValueByPath - edge cases', () => {
  it('should replace entire data model when path is "/"', () => {
    const model: DataModel = { old: 'data' }
    const result = setValueByPath(model, '/', { new: 'data' })
    expect(result).toEqual({ new: 'data' })
  })

  it('should return empty object when path is "/" and value is undefined', () => {
    const model: DataModel = { data: 'value' }
    const result = setValueByPath(model, '/', undefined)
    expect(result).toEqual({})
  })

  it('should return original model when "/" value is not an object', () => {
    const model: DataModel = { data: 'value' }
    const result = setValueByPath(model, '/', 'string' as unknown as DataModel)
    expect(result).toEqual(model)
  })

  it('should set value at top-level path', () => {
    const model: DataModel = {}
    const result = setValueByPath(model, '/key', 'value')
    expect(result).toEqual({ key: 'value' })
  })
})
