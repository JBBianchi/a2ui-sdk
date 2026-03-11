/**
 * DataStore - Framework-agnostic data store with path-based subscriptions.
 *
 * Provides granular notifications when data model values change,
 * notifying only subscribers on affected paths (exact, ancestors, descendants).
 */

import { getValueByPath, setValueByPath } from './pathUtils.js'
import type { DataModel } from '@a2ui-sdk/types/0.9'

type Listener = () => void

export class DataStore {
  private data: DataModel
  private listeners: Map<string, Set<Listener>>

  constructor(initialData: DataModel = {}) {
    this.data = initialData
    this.listeners = new Map()
  }

  /**
   * Get the full data model snapshot.
   */
  getData(): DataModel {
    return this.data
  }

  /**
   * Get value at a specific path.
   */
  get(path: string): unknown {
    if (path === '/' || path === '') return this.data
    return getValueByPath(this.data, path)
  }

  /**
   * Get a snapshot function for useSyncExternalStore.
   * Returns the value at the given path.
   */
  getSnapshot(path: string): unknown {
    return this.get(path)
  }

  /**
   * Set value at a specific path.
   * Notifies affected subscribers (exact path, ancestors, descendants).
   */
  set(path: string, value: unknown): void {
    this.data = setValueByPath(this.data, path, value)
    this.notify(path)
  }

  /**
   * Replace the entire data model.
   */
  setAll(data: DataModel): void {
    this.data = data
    // Notify all listeners
    for (const listeners of this.listeners.values()) {
      for (const listener of listeners) {
        listener()
      }
    }
  }

  /**
   * Subscribe to changes at a specific path.
   * Listener is called when:
   * - The exact path changes
   * - Any ancestor path changes (bubble up)
   * - Any descendant path changes (cascade down)
   *
   * @returns Unsubscribe function
   */
  subscribe(path: string, listener: Listener): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set())
    }
    this.listeners.get(path)!.add(listener)

    return () => {
      const pathListeners = this.listeners.get(path)
      if (pathListeners) {
        pathListeners.delete(listener)
        if (pathListeners.size === 0) {
          this.listeners.delete(path)
        }
      }
    }
  }

  /**
   * Notify affected listeners when a path changes.
   * Notifies: exact match, ancestors (bubble up), descendants (cascade down).
   */
  private notify(changedPath: string): void {
    const normalizedChanged = changedPath === '' ? '/' : changedPath

    for (const [subscribedPath, listeners] of this.listeners) {
      if (this.isAffected(subscribedPath, normalizedChanged)) {
        for (const listener of listeners) {
          listener()
        }
      }
    }
  }

  /**
   * Determines if a subscribed path is affected by a change at changedPath.
   *
   * A subscriber is affected if:
   * - Exact match: subscribedPath === changedPath
   * - Ancestor: changedPath starts with subscribedPath (bubble up - parent sees child changes)
   * - Descendant: subscribedPath starts with changedPath (cascade down - child sees parent changes)
   */
  private isAffected(subscribedPath: string, changedPath: string): boolean {
    // Normalize paths
    const sub = subscribedPath === '' ? '/' : subscribedPath
    const changed = changedPath === '' ? '/' : changedPath

    // Exact match
    if (sub === changed) return true

    // Root always affected
    if (sub === '/' || changed === '/') return true

    // Ancestor check: subscribedPath is ancestor of changedPath
    // e.g., subscribed to /user, changed /user/name -> notify
    if (changed.startsWith(sub + '/')) return true

    // Descendant check: subscribedPath is descendant of changedPath
    // e.g., subscribed to /user/name, changed /user -> notify
    if (sub.startsWith(changed + '/')) return true

    return false
  }

  /**
   * Dispose the store, clearing all listeners.
   */
  dispose(): void {
    this.listeners.clear()
  }
}
