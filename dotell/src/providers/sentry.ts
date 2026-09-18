import { addBreadcrumb, captureException } from '@sentry/nextjs'
import { warnIfDev } from '../dev.js'
import type { TrackProperties } from '../types.js'

export function dispatchSentryBreadcrumb(
  event: string,
  properties?: TrackProperties,
): void {
  try {
    addBreadcrumb({
      category: 'dotell',
      message: event,
      level: 'info',
      data: properties,
    })
  } catch (error) {
    warnIfDev(`dotell: Sentry breadcrumb failed. ${error}`)
  }
}

export function captureError(error: Error): void {
  try {
    captureException(error)
  } catch (err) {
    warnIfDev(`dotell: Sentry capture failed. ${err}`)
  }
}

export function dispatchSentryError(
  err: unknown,
  properties?: TrackProperties,
): void {
  try {
    captureException(err, {
      extra: properties,
    })
  } catch (error) {
    warnIfDev(`dotell: Sentry capture failed. ${error}`)
  }
}
