import type { IdentityState } from './state.js'

export function setAuthenticatedIdentity(
  state: IdentityState,
  userId: string,
): void {
  state.userId = userId
}
