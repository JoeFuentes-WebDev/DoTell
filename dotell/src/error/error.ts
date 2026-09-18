import { detectContext, isEdge } from '../context.js'
import { warnIfDev } from '../dev.js'
import { getHybridDeviceId } from '../identity/hybrid.js'
import { getResolvedUserId } from '../identity/state.js'
import type { IdentityState } from '../identity/state.js'
import { captureError, dispatchPostgresEvent } from '../providers/index.js'
import type { DotellConfig, EventContext, TrackProperties } from '../types.js'

function buildErrorProperties(
  identityState: IdentityState,
  err: Error,
  properties?: TrackProperties,
): Record<string, unknown> {
  const merged: Record<string, unknown> = properties ? { ...properties } : {}

  merged.message = err.message
  merged.name = err.name

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

  return merged
}

export function error(
  config: DotellConfig,
  identityState: IdentityState,
  err: Error,
  properties?: TrackProperties,
): void {
  const context = detectContext()

  if (isEdge || context === 'edge') {
    warnIfDev('dotell: Edge Runtime detected. error() skipped.')
    return
  }

  const userId = getResolvedUserId(identityState)

  if (userId === null) {
    warnIfDev('dotell: error() called before identify(). userId will be null.')
  }

  const eventContext: EventContext =
    context === 'client' ? 'client' : 'server'
  const eventProperties = buildErrorProperties(identityState, err, properties)

  if (context === 'client' && config.sentryDsn) {
    try {
      captureError(err)
    } catch (captureErr) {
      warnIfDev(`dotell: Sentry error failed. ${captureErr}`)
    }
  }

  try {
    dispatchPostgresEvent(config.db, {
      event: 'error',
      user_id: userId,
      properties: eventProperties,
      context: eventContext,
      identity_model: identityState.identityModel,
    })
  } catch (postgresErr) {
    warnIfDev(`dotell: Postgres error failed. ${postgresErr}`)
  }
}
