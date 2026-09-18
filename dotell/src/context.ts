export const isEdge =
  typeof EdgeRuntime !== 'undefined'

export const isClient =
  !isEdge && typeof window !== 'undefined'

export const isServer =
  !isEdge && typeof window === 'undefined'

export type RuntimeContext = 'client' | 'server' | 'edge'

export function detectContext(): RuntimeContext {
  if (isEdge) {
    return 'edge'
  }

  if (isClient) {
    return 'client'
  }

  return 'server'
}
