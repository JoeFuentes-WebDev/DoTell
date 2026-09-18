import { configsEqual, validateConfig } from './config.js'
import { createIdentityState } from './identity/state.js'
import { createInstance } from './instance.js'
import type { DotellConfig, DotellInstance } from './types.js'

let storedInstance: DotellInstance | null = null
let storedConfig: DotellConfig | null = null

export function initDotell(config: DotellConfig): DotellInstance {
  if (storedInstance !== null && storedConfig !== null) {
    if (configsEqual(config, storedConfig)) {
      console.warn(
        'dotell: initDotell() called again with identical config. Returning existing instance.',
      )
      return storedInstance
    }

    throw new Error(
      'dotell: initDotell() called with different config. Rejecting second initialization.',
    )
  }

  validateConfig(config)

  const identityState = createIdentityState(config.model)
  const instance = createInstance(config, identityState)

  storedInstance = instance
  storedConfig = config

  return instance
}
