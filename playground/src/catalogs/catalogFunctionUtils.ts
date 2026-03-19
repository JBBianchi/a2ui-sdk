function decodePointerSegment(segment: string) {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}

export function resolveScopedPath(path: string, basePath: string | null) {
  if (path.startsWith('/')) {
    return path
  }

  return basePath ? `${basePath}/${path}` : `/${path}`
}

export function getValueAtPath(model: unknown, path: string): unknown {
  if (path === '/') {
    return model
  }

  if (!path.startsWith('/')) {
    return undefined
  }

  const segments = path
    .slice(1)
    .split('/')
    .filter(Boolean)
    .map(decodePointerSegment)

  let current: unknown = model

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index)) {
        return undefined
      }
      current = current[index]
      continue
    }

    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment]
      continue
    }

    return undefined
  }

  return current
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getPathArg(
  args: Record<string, unknown>,
  primaryKey: string,
  aliasKey: string
) {
  const candidate = args[primaryKey] ?? args[aliasKey]
  return typeof candidate === 'string' ? candidate : null
}
