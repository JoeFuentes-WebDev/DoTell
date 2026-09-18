import type { IdentityModel, IdentityRole, IdentifyOptions } from '../types.js'
import { getAnonymousId } from './anonymous.js'
import { setAuthenticatedIdentity } from './authenticated.js'
import { getHybridUserId, setHybridIdentity } from './hybrid.js'

export interface IdentityState {
  identityModel: IdentityModel
  userId: string | null
  sessionOwnerId: string | null
  pinUserId: string | null
  activeRole: IdentityRole | null
}

export function createIdentityState(model: IdentityModel): IdentityState {
  return {
    identityModel: model,
    userId: null,
    sessionOwnerId: null,
    pinUserId: null,
    activeRole: null,
  }
}

export function setIdentity(
  state: IdentityState,
  userId: string,
  options?: IdentifyOptions,
): void {
  switch (state.identityModel) {
    case 'anonymous':
      break

    case 'authenticated':
      setAuthenticatedIdentity(state, userId)
      break

    case 'hybrid':
      setHybridIdentity(state, userId, options)
      break
  }
}

export function getResolvedUserId(state: IdentityState): string | null {
  switch (state.identityModel) {
    case 'anonymous':
      return getAnonymousId()

    case 'authenticated':
      return state.userId

    case 'hybrid':
      return getHybridUserId(state)
  }
}
