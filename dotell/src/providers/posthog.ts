import { warnIfDev } from '../dev.js'
import type { IdentifyOptions, TrackProperties } from '../types.js'
import type { IdentityModel } from '../types.js'

let initialized = false

function runPostHogDispatch(
  posthogKey: string,
  dispatch: (posthog: typeof import('posthog-js').default) => void,
): void {
  void (async () => {
    try {
      const posthog = (await import('posthog-js')).default

      if (!initialized) {
        posthog.init(posthogKey)
        initialized = true
      }

      dispatch(posthog)
    } catch (error) {
      warnIfDev(`dotell: PostHog dispatch failed. ${error}`)
    }
  })()
}

export function dispatchPostHogTrack(
  posthogKey: string,
  event: string,
  properties: TrackProperties | undefined,
  identityModel: IdentityModel,
): void {
  try {
    runPostHogDispatch(posthogKey, (posthog) => {
      posthog.capture(event, {
        ...properties,
        identityModel,
      })
    })
  } catch (error) {
    warnIfDev(`dotell: PostHog track failed. ${error}`)
  }
}

export function dispatchPostHogIdentify(
  posthogKey: string,
  userId: string,
  traits: IdentifyOptions | undefined,
  identityModel: IdentityModel,
): void {
  try {
    runPostHogDispatch(posthogKey, (posthog) => {
      posthog.identify(userId, {
        ...traits,
        identityModel,
      })
    })
  } catch (error) {
    warnIfDev(`dotell: PostHog identify failed. ${error}`)
  }
}
