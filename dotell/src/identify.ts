import { detectContext, isEdge } from './context.js'
import { warnIfDev } from './dev.js'
import { setIdentity } from './identity/state.js'
import type { IdentityState } from './identity/state.js'
import type { DotellConfig, IdentifyOptions } from './types.js'

export function identify(
  config: DotellConfig,
  identityState: IdentityState,
  userId: string,
  traits?: IdentifyOptions,
): void {
  const context = detectContext()

  if (isEdge) {
    warnIfDev('dotell: edge runtime detected. identify() is a no-op.')
    return
  }

  setIdentity(identityState, userId, traits)

  void config
  void context
}
