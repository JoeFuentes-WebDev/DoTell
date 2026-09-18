import { detectContext } from './context.js'
import { warnIfDev } from './dev.js'
import { identify as identifyImpl } from './identify.js'
import { error as errorImpl } from './error/index.js'
import { getResolvedUserId } from './identity/state.js'
import { dispatchPostHogIdentify } from './providers/index.js'
import { track as trackImpl } from './track/index.js'
import type { IdentityState } from './identity/state.js'
import type {
  DotellConfig,
  DotellInstance,
  IdentifyOptions,
  TrackProperties,
} from './types.js'

export function createInstance(
  config: DotellConfig,
  identityState: IdentityState,
): DotellInstance {
  return {
    track(event: string, properties?: TrackProperties): void {
      trackImpl(config, identityState, event, properties)
    },

    identify(userId: string, traits?: IdentifyOptions): void {
      identifyImpl(config, identityState, userId, traits)

      const context = detectContext()
      if (context === 'client' && config.posthogKey) {
        const resolvedUserId = getResolvedUserId(identityState)
        if (resolvedUserId !== null) {
          dispatchPostHogIdentify(
            config.posthogKey,
            resolvedUserId,
            traits,
            identityState.identityModel,
          )
        } else {
          warnIfDev('dotell: PostHog identify skipped — no resolved userId.')
        }
      }
    },

    error(err: Error, properties?: TrackProperties): void {
      errorImpl(config, identityState, err, properties)
    },
  }
}
