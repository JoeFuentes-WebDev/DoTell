import { warnIfDev } from '../dev.js'
import type { DbClient, EventInsert } from '../types.js'

export function dispatchPostgresEvent(db: DbClient, eventRow: EventInsert): void {
  void db.events.create({ data: eventRow }).catch((error) => {
    warnIfDev(`dotell: Postgres write failed. ${error}`)
  })
}
