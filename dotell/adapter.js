Searching the dotell and AmGoing codebases for the DbClient interface, package config, migration, and initDotell usage.

Here are the five artifacts, then a proposed adapter design.

1. DbClient interface — src/types.ts

types.ts
Ln 27–31
export interface DbClient {
  events: {
    create(args: { data: EventInsert }): Promise<unknown>
  }
}
EventInsert (what gets passed as data):


types.ts
Ln 15–25
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
dotell calls it fire-and-forget from providers/postgres.ts:


postgres.ts
Ln 4–7
export function dispatchPostgresEvent(db: DbClient, eventRow: EventInsert): void {
  void db.events.create({ data: eventRow }).catch((error) => {
    warnIfDev(`dotell: Postgres write failed. ${error}`)
  })
}
2. dotell package.json

package.json
Ln 1–50
{
  "name": "@joefuentes/dotell",
  "version": "1.0.0",
  "description": "Unified observability baseline for Next.js App Router apps",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "migrations"
  ],
  "sideEffects": false,
  ...
  "dependencies": {
    "@sentry/nextjs": "^8.0.0",
    "posthog-js": "^1.57.0"
  },
  ...
}
Single export today — no adapter subpath yet. No Supabase dependency.

3. Migration — migrations/001_create_events.sql

001_create_events.sql
Ln 1–13
CREATE TABLE events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event          TEXT NOT NULL,
  user_id        TEXT,
  properties     JSONB,
  context        TEXT CHECK (context IN ('client', 'server')),
  identity_model TEXT CHECK (identity_model IN ('anonymous', 'authenticated', 'hybrid')),
  created_at     TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_events_user_id    ON events(user_id);
CREATE INDEX idx_events_event      ON events(event);
CREATE INDEX idx_events_created_at ON events(created_at);
Column names match EventInsert exactly (user_id, not userId).

4. AmGoing lib/dotell.ts

dotell.ts
Ln 1–76
"use client";
import {
  initDotell,
  type DbClient,
  type DotellInstance,
  type TrackProperties,
} from "@joefuentes/dotell";
const eventsDb: DbClient = {
  events: {
    create: async function createEvent() {
      return {};
    },
  },
};
let dotellInstance: DotellInstance | null = null;
let identifiedUuid: string | null = null;
// ... env helpers ...
function getDotellInstance(): DotellInstance {
  if (dotellInstance === null) {
    dotellInstance = initDotell({
      model: "authenticated",
      db: eventsDb,
      posthogKey: getPosthogKey(),
      sentryDsn: getSentryDsn(),
    });
  }
  return dotellInstance;
}
// ... identify + track wrapper ...
The DbClient is a no-op stub — create ignores payload and returns {}. Postgres sink does nothing.

5. Where initDotell(...) is called
Only one call site in AmGoing:


dotell.ts
Ln 43–48
dotellInstance = initDotell({
  model: "authenticated",
  db: eventsDb,
  posthogKey: getPosthogKey(),
  sentryDsn: getSentryDsn(),
});
Consumers import track from @/lib/dotell (e.g. ActivityCard.tsx, useSignalMutation.ts) — they never call initDotell directly.

AmGoing already has a server Supabase client at lib/supabase/server.ts using @supabase/supabase-js with the service role key. The dotell events table migration has not been applied to AmGoing's Supabase yet (no events table in their migrations).

Proposed adapter design (no code yet)
Goal
A small factory that wraps any SupabaseClient into dotell's DbClient shape, so apps like AmGoing can replace the no-op stub with a real Postgres sink.

Recommended API
// @joefuentes/dotell/adapters/supabase  (proposed subpath)
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DbClient } from '@joefuentes/dotell'
export interface SupabaseDbClientOptions {
  /** defaults to 'events' */
  table?: string
}
export function createSupabaseDbClient(
  supabase: SupabaseClient,
  options?: SupabaseDbClientOptions,
): DbClient
Implementation sketch:

create: ({ data }) =>
  supabase
    .from(table)
    .insert(data)           // snake_case EventInsert maps 1:1
    .select('id')
    .single()
    .then(({ data: row, error }) => {
      if (error) throw error
      return row
    })
No field mapping needed — dotell already emits snake_case matching the migration.

Where it should live
Option	Pros	Cons
A. Subpath on @joefuentes/dotell (./adapters/supabase)
Generic, reusable, co-located with DbClient type
Requires dotell 1.1.0: new export, peerDependency on @supabase/supabase-js, tsup entry
B. Separate package (@joefuentes/dotell-supabase)
Keeps dotell core dependency-free
Extra publish/maintenance
C. AmGoing-local (lib/dotell-db.ts)
Fastest for AmGoing, zero dotell release
Not generic; duplicated in every Supabase app
Recommendation: Option A — a thin adapter module in dotell, exported as a subpath. It matches dotell's "duck-typed DbClient, no ORM adapters in core" philosophy while still offering a first-party convenience for Supabase (the most common direct-Postgres path for your apps).

Package shape (Option A)
src/
  adapters/
    supabase.ts      # createSupabaseDbClient only
  index.ts           # unchanged — no Supabase import here
"exports": {
  ".": { ... },
  "./adapters/supabase": {
    "import": "./dist/adapters/supabase.js",
    "types": "./dist/adapters/supabase.d.ts"
  }
},
"peerDependencies": {
  "@supabase/supabase-js": ">=2.0.0"
},
"peerDependenciesMeta": {
  "@supabase/supabase-js": { "optional": true }
}
Core @joefuentes/dotell stays Supabase-free; only consumers of the subpath need the peer.

AmGoing wiring (two instances, not one)
This is the important architectural split:

Context	Module	db	Why
Client (current lib/dotell.ts)
Keep stub or omit Postgres
No-op / PostHog+Sentry only
Client-side track() would write to Postgres from the browser — needs anon key + RLS policies, or exposes service role (bad)
Server (new lib/dotell-server.ts)
createSupabaseDbClient(getSupabaseServerClient())
Real writes
Server track() / error() already Postgres-only per dotell routing
Recommended AmGoing pattern:

// lib/dotell-server.ts  (server-only, no "use client")
import { initDotell } from '@joefuentes/dotell'
import { createSupabaseDbClient } from '@joefuentes/dotell/adapters/supabase'
import { getSupabaseServerClient } from '@/lib/supabase/server'
export const dotell = initDotell({
  model: 'authenticated',
  db: createSupabaseDbClient(getSupabaseServerClient()),
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  sentryDsn: process.env.SENTRY_DSN,
})
Keep existing client lib/dotell.ts for browser PostHog events (card_expand, signal_action, etc.) with the no-op stub until you explicitly want client-side Postgres (via RLS) or a /api/events proxy.

Prerequisites before AmGoing can use it
Run dotell migration in AmGoing Supabase (001_create_events.sql → new AmGoing migration, e.g. 024_dotell_events.sql)
RLS policy (if ever writing from browser): insert-only for anon/authenticated; service role bypasses RLS for server path
dotell release 1.1.0 with adapter subpath (or AmGoing-local copy as interim)
Error handling
Adapter should throw on Supabase error (return rejected Promise). dotell's dispatchPostgresEvent already .catch()es and swallows — no change to core behavior.

What we're explicitly not building
No Supabase Realtime, no reads, no upserts — only insert matching events.create
No auth/user binding inside the adapter — dotell owns user_id in the row
No change to dotell's DbClient interface
No client-side service-role usage
If this direction works for you, next step would be: implement createSupabaseDbClient in dotell (1.1.0), add the AmGoing migration, then wire lib/dotell-server.ts while leaving the client wrapper as-is for PostHog-only tracking.