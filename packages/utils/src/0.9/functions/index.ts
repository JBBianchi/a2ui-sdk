/**
 * Function registry for A2UI catalog functions.
 * Framework-agnostic — used by both utils and React packages.
 */

/**
 * Interface for a catalog function implementation.
 */
export interface FunctionImplementation {
  name: string
  returnType: 'string' | 'number' | 'boolean' | 'void'
  execute(
    args: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    basePath: string | null
  ): unknown
}

/**
 * Registry for catalog functions.
 * Maps function names to their implementations.
 */
export class FunctionRegistry {
  private functions = new Map<string, FunctionImplementation>()

  register(fn: FunctionImplementation): void {
    this.functions.set(fn.name, fn)
  }

  get(name: string): FunctionImplementation | undefined {
    return this.functions.get(name)
  }

  has(name: string): boolean {
    return this.functions.has(name)
  }

  execute(
    name: string,
    args: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    basePath: string | null
  ): unknown {
    const fn = this.functions.get(name)
    if (!fn) {
      return undefined
    }
    return fn.execute(args, dataModel, basePath)
  }
}
