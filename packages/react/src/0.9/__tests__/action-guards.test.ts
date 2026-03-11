/**
 * Tests for isEventAction and isFunctionCallAction type guards.
 */

import { describe, it, expect } from 'vitest'
import {
  isEventAction,
  isFunctionCallAction,
  type Action,
  type EventAction,
  type FunctionCallAction,
} from '@a2ui-sdk/types/0.9'

describe('Action type guards', () => {
  const eventAction: EventAction = {
    event: { name: 'click' },
  }

  const functionCallAction: FunctionCallAction = {
    functionCall: { call: 'openUrl', args: { url: 'https://example.com' } },
  }

  describe('isEventAction', () => {
    it('should return true for an event action', () => {
      expect(isEventAction(eventAction)).toBe(true)
    })

    it('should return true for event action with context', () => {
      const action: Action = {
        event: { name: 'submit', context: { key: 'value' } },
      }
      expect(isEventAction(action)).toBe(true)
    })

    it('should return false for a functionCall action', () => {
      expect(isEventAction(functionCallAction)).toBe(false)
    })

    it('should return false for an empty object', () => {
      expect(isEventAction({} as Action)).toBe(false)
    })

    it('should throw for undefined (uses "in" operator)', () => {
      expect(() => isEventAction(undefined as unknown as Action)).toThrow()
    })

    it('should throw for null (uses "in" operator)', () => {
      expect(() => isEventAction(null as unknown as Action)).toThrow()
    })
  })

  describe('isFunctionCallAction', () => {
    it('should return true for a functionCall action', () => {
      expect(isFunctionCallAction(functionCallAction)).toBe(true)
    })

    it('should return true for functionCall with no args', () => {
      const action: Action = {
        functionCall: { call: 'doSomething' },
      }
      expect(isFunctionCallAction(action)).toBe(true)
    })

    it('should return false for an event action', () => {
      expect(isFunctionCallAction(eventAction)).toBe(false)
    })

    it('should return false for an empty object', () => {
      expect(isFunctionCallAction({} as Action)).toBe(false)
    })

    it('should throw for undefined (uses "in" operator)', () => {
      expect(() =>
        isFunctionCallAction(undefined as unknown as Action)
      ).toThrow()
    })

    it('should throw for null (uses "in" operator)', () => {
      expect(() => isFunctionCallAction(null as unknown as Action)).toThrow()
    })
  })

  describe('mutual exclusivity', () => {
    it('event action should not pass functionCall guard', () => {
      expect(isEventAction(eventAction)).toBe(true)
      expect(isFunctionCallAction(eventAction)).toBe(false)
    })

    it('functionCall action should not pass event guard', () => {
      expect(isFunctionCallAction(functionCallAction)).toBe(true)
      expect(isEventAction(functionCallAction)).toBe(false)
    })
  })
})
