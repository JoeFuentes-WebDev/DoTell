export type IdentityModel = 'anonymous' | 'authenticated' | 'hybrid'

export type EventContext = 'client' | 'server'

export type IdentityRole = 'device' | 'worker'

export type TrackProperties = Record<string, unknown>

export interface IdentifyOptions {
  role?: IdentityRole
  parentId?: string
  [key: string]: unknown
}

export interface EventRow {
  id: string
  user_id: string | null
  event: string
  properties: Record<string, unknown> | null
  context: EventContext
  identity_model: IdentityModel
  created_at: Date | string
}

export type EventInsert = Omit<EventRow, 'id' | 'created_at'>

export interface DbClient {
  events: {
    create(args: { data: EventInsert }): Promise<unknown>
  }
}

export interface DotellConfig {
  model: IdentityModel
  db: DbClient
  posthogKey?: string
  sentryDsn?: string
}

export interface DotellInstance {
  track(event: string, properties?: TrackProperties): void
  identify(userId: string, traits?: IdentifyOptions): void
  error(error: Error, properties?: TrackProperties): void
}
