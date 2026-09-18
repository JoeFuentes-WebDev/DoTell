import type { DotellConfig, IdentityModel } from './types.js'
import { warnIfDev } from './dev.js'

const VALID_MODELS: IdentityModel[] = ['anonymous', 'authenticated', 'hybrid']

export function validateConfig(config: DotellConfig): void {
  if (!config.db?.events?.create) {
    throw new Error('dotell: db client is required')
  }

  if (!VALID_MODELS.includes(config.model)) {
    throw new Error(`dotell: unrecognized identity model "${config.model}"`)
  }

  if (!config.posthogKey) {
    warnIfDev('dotell: posthogKey is not configured. PostHog will be skipped.')
  }

  if (!config.sentryDsn) {
    warnIfDev('dotell: sentryDsn is not configured. Sentry will be skipped.')
  }
}

export function configsEqual(a: DotellConfig, b: DotellConfig): boolean {
  return (
    a.model === b.model &&
    a.db === b.db &&
    a.posthogKey === b.posthogKey &&
    a.sentryDsn === b.sentryDsn
  )
}
