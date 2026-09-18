import { detectContext, isEdge } from '../context.js'
import { warnIfDev } from '../dev.js'
import { getHybridDeviceId } from '../identity/hybrid.js'
import { getResolvedUserId } from '../identity/state.js'
import type { IdentityState } from '../identity/state.js'
import {
  dispatchPostHogTrack,
  dispatchPostgresEvent,
  dispatchSentryBreadcrumb,
} from '../providers/index.js'
import type { DotellConfig, EventContext, TrackProperties } from '../types.js'

function buildEventProperties(
  identityState: IdentityState,
  properties?: TrackProperties,
): Record<string, unknown> | null {
  const merged: Record<string, unknown> = properties ? { ...properties } : {}

  if (
    identityState.identityModel === 'hybrid' &&
    identityState.pinUserId &&
    identityState.activeRole === 'worker'
  ) {
    const deviceId = getHybridDeviceId(identityState)
    if (deviceId) {
      merged.deviceId = deviceId
      merged.role = 'worker'
    }
  }

  return Object.keys(merged).length > 0 ? merged : null
}

export function track(
  config: DotellConfig,
  identityState: IdentityState,
  event: string,
  properties?: TrackProperties,
): void {
  const context = detectContext()

  if (isEdge || context === 'edge') {
    warnIfDev('dotell: Edge Runtime detected. track() skipped.')
    return
  }

  const userId = getResolvedUserId(identityState)

  if (userId === null) {
    warnIfDev('dotell: track() called before identify(). userId will be null.')
  }

  const eventContext: EventContext =
    context === 'client' ? 'client' : 'server'
  const eventProperties = buildEventProperties(identityState, properties)

  if (context === 'client') {
    if (config.posthogKey) {
      try {
        dispatchPostHogTrack(
          config.posthogKey,
          event,
          properties,
          identityState.identityModel,
        )
      } catch (error) {
        warnIfDev(`dotell: PostHog track failed. ${error}`)
      }
    }

    if (config.sentryDsn) {
      try {
        dispatchSentryBreadcrumb(event, properties)
      } catch (error) {
        warnIfDev(`dotell: Sentry track failed. ${error}`)
      }
    }
  }

  try {
    dispatchPostgresEvent(config.db, {
      event,
      user_id: userId,
      properties: eventProperties,
      context: eventContext,
      identity_model: identityState.identityModel,
    })
  } catch (error) {
    warnIfDev(`dotell: Postgres track failed. ${error}`)
  }
}
