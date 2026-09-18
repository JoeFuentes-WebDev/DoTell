import type { IdentifyOptions } from '../types.js'
import type { IdentityState } from './state.js'

export function setHybridIdentity(
  state: IdentityState,
  userId: string,
  options?: IdentifyOptions,
): void {
  if (options?.role === 'device') {
    state.sessionOwnerId = userId
    state.pinUserId = null
    state.activeRole = 'device'
    return
  }

  if (options?.role === 'worker') {
    state.pinUserId = userId
    state.activeRole = 'worker'
  }
}

export function getHybridUserId(state: IdentityState): string | null {
  if (state.pinUserId && state.activeRole === 'worker') {
    return state.pinUserId
  }

  return state.sessionOwnerId
}

export function getHybridDeviceId(state: IdentityState): string | null {
  return state.sessionOwnerId
}
