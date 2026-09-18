import type { DbClient, EventInsert } from '../types.js'

export interface SupabaseDbClientOptions {
  /** Postgres table name. Defaults to `events`. */
  table?: string
}

interface SupabaseInsertResponse {
  data: { id: string } | null
  error: { message: string } | null
}

/** Structural type compatible with `@supabase/supabase-js` insert chains. */
export interface SupabaseEventsClient {
  from(table: string): {
    insert(values: EventInsert): {
      select(columns: string): {
        single(): PromiseLike<SupabaseInsertResponse>
      }
    }
  }
}

export function createSupabaseDbClient(
  supabase: SupabaseEventsClient,
  options: SupabaseDbClientOptions = {},
): DbClient {
  const table = options.table ?? 'events'

  return {
    events: {
      create: async ({ data }) => {
        const { data: row, error } = await supabase
          .from(table)
          .insert(data)
          .select('id')
          .single()

        if (error) {
          throw new Error(error.message)
        }

        return row
      },
    },
  }
}
