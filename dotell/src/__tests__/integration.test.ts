import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { DbClient, DotellConfig } from '../types.js'

const {
  mockPostHogCapture,
  mockPostHogIdentify,
  mockPostHogInit,
  mockSentryAddBreadcrumb,
  mockSentryCaptureException,
} = vi.hoisted(() => ({
  mockPostHogCapture: vi.fn(),
  mockPostHogIdentify: vi.fn(),
  mockPostHogInit: vi.fn(),
  mockSentryAddBreadcrumb: vi.fn(),
  mockSentryCaptureException: vi.fn(),
}))

type RuntimeContext = 'client' | 'server' | 'edge'

function createMockDb(): DbClient & {
  events: { create: ReturnType<typeof vi.fn> }
} {
  return {
    events: {
      create: vi.fn().mockResolvedValue({ id: 'evt_1' }),
    },
  }
}

function createConfig(
  db: DbClient,
  overrides: Partial<Omit<DotellConfig, 'db'>> = {},
): DotellConfig {
  return {
    model: 'authenticated',
    db,
    posthogKey: 'phk_test',
    sentryDsn: 'https://sentry.example/1',
    ...overrides,
  }
}

function setupLocalStorage(): void {
  const store: Record<string, string> = {}
  ;(globalThis as typeof globalThis & { localStorage: Storage }).localStorage = {
    get length() {
      return Object.keys(store).length
    },
    clear: () => {
      for (const key of Object.keys(store)) {
        delete store[key]
      }
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key]
    },
    setItem: (key: string, value: string) => {
      store[key] = value
    },
  }
}

function setRuntimeContext(context: RuntimeContext): void {
  delete (globalThis as typeof globalThis & { EdgeRuntime?: string }).EdgeRuntime
  delete (globalThis as typeof globalThis & { window?: typeof globalThis }).window
  delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage

  if (context === 'edge') {
    ;(globalThis as typeof globalThis & { EdgeRuntime: string }).EdgeRuntime =
      'edge'
    return
  }

  if (context === 'client') {
    ;(globalThis as typeof globalThis & { window: typeof globalThis }).window =
      globalThis
    setupLocalStorage()
  }
}

async function loadDotell(context: RuntimeContext) {
  vi.resetModules()
  setRuntimeContext(context)

  vi.doMock('posthog-js', () => ({
    default: {
      init: mockPostHogInit,
      capture: mockPostHogCapture,
      identify: mockPostHogIdentify,
    },
  }))

  vi.doMock('@sentry/nextjs', () => ({
    addBreadcrumb: mockSentryAddBreadcrumb,
    captureException: mockSentryCaptureException,
  }))

  const { initDotell } = await import('../init.js')
  return initDotell
}

async function flushAsync(): Promise<void> {
  await vi.waitFor(async () => {
    await new Promise((resolve) => setImmediate(resolve))
  })
}

describe('dotell integration', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockPostHogCapture.mockReset()
    mockPostHogIdentify.mockReset()
    mockPostHogInit.mockReset()
    mockSentryAddBreadcrumb.mockReset()
    mockSentryCaptureException.mockReset()
  })

  afterEach(async () => {
    await flushAsync()
    vi.restoreAllMocks()
    delete (globalThis as typeof globalThis & { EdgeRuntime?: string }).EdgeRuntime
    delete (globalThis as typeof globalThis & { window?: typeof globalThis }).window
    delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage
    process.env.NODE_ENV = 'test'
  })

  describe('initDotell()', () => {
    it('throws when db client is missing', async () => {
      const initDotell = await loadDotell('server')

      expect(() =>
        initDotell({
          model: 'authenticated',
          db: {} as DbClient,
        }),
      ).toThrow('dotell: db client is required')
    })

    it('throws on unrecognized identity model', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()

      expect(() =>
        initDotell({
          model: 'invalid' as DotellConfig['model'],
          db,
        }),
      ).toThrow('dotell: unrecognized identity model')
    })

    it('warns but does not throw when PostHog key is missing', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()

      expect(() =>
        initDotell(createConfig(db, { posthogKey: undefined })),
      ).not.toThrow()

      expect(warnSpy).toHaveBeenCalledWith(
        'dotell: posthogKey is not configured. PostHog will be skipped.',
      )
    })

    it('warns but does not throw when Sentry DSN is missing', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()

      expect(() =>
        initDotell(createConfig(db, { sentryDsn: undefined })),
      ).not.toThrow()

      expect(warnSpy).toHaveBeenCalledWith(
        'dotell: sentryDsn is not configured. Sentry will be skipped.',
      )
    })

    it('returns the same instance on second call with identical config and warns', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const config = createConfig(db)

      const first = initDotell(config)
      const second = initDotell(config)

      expect(second).toBe(first)
      expect(warnSpy).toHaveBeenCalledWith(
        'dotell: initDotell() called again with identical config. Returning existing instance.',
      )
    })

    it('throws when called again with different config', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()

      initDotell(createConfig(db, { model: 'authenticated' }))

      expect(() =>
        initDotell(createConfig(db, { model: 'hybrid' })),
      ).toThrow('dotell: initDotell() called with different config')
    })
  })

  describe('track()', () => {
    it('routes client calls to PostHog, Sentry, and Postgres', async () => {
      const initDotell = await loadDotell('client')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_abc')
      await vi.waitFor(() => {
        expect(mockPostHogIdentify).toHaveBeenCalled()
      })

      const result = dotell.track('page_view', { path: '/home' })

      expect(result).toBeUndefined()

      await vi.waitFor(() => {
        expect(mockPostHogCapture).toHaveBeenCalledWith('page_view', {
          path: '/home',
          identityModel: 'authenticated',
        })
      })
      expect(mockSentryAddBreadcrumb).toHaveBeenCalledWith({
        category: 'dotell',
        message: 'page_view',
        level: 'info',
        data: { path: '/home' },
      })
      expect(db.events.create).toHaveBeenCalledWith({
        data: {
          event: 'page_view',
          user_id: 'user_abc',
          properties: { path: '/home' },
          context: 'client',
          identity_model: 'authenticated',
        },
      })
    })

    it('routes server calls to Postgres only', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_server')
      dotell.track('server_action', { action: 'save' })
      await flushAsync()

      expect(mockPostHogCapture).not.toHaveBeenCalled()
      expect(mockSentryAddBreadcrumb).not.toHaveBeenCalled()
      expect(db.events.create).toHaveBeenCalledWith({
        data: {
          event: 'server_action',
          user_id: 'user_server',
          properties: { action: 'save' },
          context: 'server',
          identity_model: 'authenticated',
        },
      })
    })

    it('warns and writes null userId when called before identify() in authenticated model', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.track('early_event')
      await flushAsync()

      expect(warnSpy).toHaveBeenCalledWith(
        'dotell: track() called before identify(). userId will be null.',
      )
      expect(db.events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'early_event',
          user_id: null,
        }),
      })
    })

    it('skips all providers on edge runtime and warns', async () => {
      const initDotell = await loadDotell('edge')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db))

      dotell.track('edge_event')
      await flushAsync()

      expect(warnSpy).toHaveBeenCalledWith(
        'dotell: Edge Runtime detected. track() skipped.',
      )
      expect(mockPostHogCapture).not.toHaveBeenCalled()
      expect(mockSentryAddBreadcrumb).not.toHaveBeenCalled()
      expect(db.events.create).not.toHaveBeenCalled()
    })

    it('does not throw when Postgres write fails', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      db.events.create.mockRejectedValue(new Error('db down'))
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_1')
      expect(() => dotell.track('fail_event')).not.toThrow()
      await flushAsync()

      expect(db.events.create).toHaveBeenCalled()
    })

    it('does not throw when PostHog capture fails', async () => {
      const initDotell = await loadDotell('client')
      const db = createMockDb()
      mockPostHogCapture.mockImplementation(() => {
        throw new Error('posthog down')
      })
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_1')
      await vi.waitFor(() => {
        expect(mockPostHogIdentify).toHaveBeenCalled()
      })

      expect(() => dotell.track('ph_fail')).not.toThrow()

      await vi.waitFor(() => {
        expect(mockPostHogCapture).toHaveBeenCalled()
      })
    })

    it('does not throw when Sentry breadcrumb fails', async () => {
      const initDotell = await loadDotell('client')
      const db = createMockDb()
      mockSentryAddBreadcrumb.mockImplementation(() => {
        throw new Error('sentry down')
      })
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_1')
      expect(() => dotell.track('sentry_fail')).not.toThrow()
      await flushAsync()

      expect(mockSentryAddBreadcrumb).toHaveBeenCalled()
    })
  })

  describe('identify()', () => {
    it('sets authenticated identity in memory and sends PostHog traits on client', async () => {
      const initDotell = await loadDotell('client')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      const result = dotell.identify('user_auth', { plan: 'pro' })
      expect(result).toBeUndefined()

      await vi.waitFor(() => {
        expect(mockPostHogIdentify).toHaveBeenCalledWith('user_auth', {
          plan: 'pro',
          identityModel: 'authenticated',
        })
      })

      expect(db.events.create).not.toHaveBeenCalled()

      dotell.track('after_identify')
      await flushAsync()

      expect(db.events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ user_id: 'user_auth' }),
      })
    })

    it('updates in-memory state on server without PostHog or Postgres', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_server_only')
      await flushAsync()

      expect(mockPostHogIdentify).not.toHaveBeenCalled()
      expect(db.events.create).not.toHaveBeenCalled()

      dotell.track('server_track')
      await flushAsync()

      expect(db.events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ user_id: 'user_server_only' }),
      })
    })

    it('resolves anonymous UUID on client without identify()', async () => {
      const initDotell = await loadDotell('client')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'anonymous' }))

      dotell.track('anon_event')
      await flushAsync()

      const createCall = db.events.create.mock.calls[0]?.[0] as {
        data: { user_id: string | null }
      }
      expect(createCall.data.user_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
      expect(db.events.create).toHaveBeenCalledTimes(1)
    })

    it('writes null userId for anonymous model on server', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'anonymous' }))

      dotell.track('anon_server')
      await flushAsync()

      expect(db.events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'anon_server',
          user_id: null,
        }),
      })
    })

    it('handles hybrid PIN user with deviceId in properties and clears PIN on device restore', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'hybrid' }))

      dotell.identify('device_kiosk_1', { role: 'device' })
      dotell.identify('pin_user_99', { role: 'worker' })

      dotell.track('worker_action', { screen: 'checkout' })
      await flushAsync()

      expect(db.events.create).toHaveBeenCalledWith({
        data: {
          event: 'worker_action',
          user_id: 'pin_user_99',
          properties: {
            screen: 'checkout',
            deviceId: 'device_kiosk_1',
            role: 'worker',
          },
          context: 'server',
          identity_model: 'hybrid',
        },
      })

      db.events.create.mockClear()
      dotell.identify('device_kiosk_1', { role: 'device' })
      dotell.track('device_action')
      await flushAsync()

      expect(db.events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'device_action',
          user_id: 'device_kiosk_1',
          properties: null,
        }),
      })
    })

    it('writes null userId for hybrid before any identify()', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'hybrid' }))

      dotell.track('hybrid_early')
      await flushAsync()

      expect(warnSpy).toHaveBeenCalledWith(
        'dotell: track() called before identify(). userId will be null.',
      )
      expect(db.events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: null,
          identity_model: 'hybrid',
        }),
      })
    })

    it('is a no-op on edge runtime and warns', async () => {
      const initDotell = await loadDotell('edge')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_edge')
      await flushAsync()

      expect(warnSpy).toHaveBeenCalledWith(
        'dotell: edge runtime detected. identify() is a no-op.',
      )
      expect(mockPostHogIdentify).not.toHaveBeenCalled()
      expect(db.events.create).not.toHaveBeenCalled()
    })
  })

  describe('error()', () => {
    it('forwards to Sentry and Postgres on client with reserved event name', async () => {
      const initDotell = await loadDotell('client')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))
      const err = new Error('Something broke')

      dotell.identify('user_err')
      const result = dotell.error(err, { page: '/checkout' })
      expect(result).toBeUndefined()
      await flushAsync()

      expect(mockSentryCaptureException).toHaveBeenCalledWith(err)
      expect(db.events.create).toHaveBeenCalledWith({
        data: {
          event: 'error',
          user_id: 'user_err',
          properties: {
            page: '/checkout',
            message: 'Something broke',
            name: 'Error',
          },
          context: 'client',
          identity_model: 'authenticated',
        },
      })
    })

    it('writes Postgres only on server', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))
      const err = new Error('Server failure')

      dotell.identify('user_srv')
      dotell.error(err)
      await flushAsync()

      expect(mockSentryCaptureException).not.toHaveBeenCalled()
      expect(db.events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'error',
          user_id: 'user_srv',
          context: 'server',
        }),
      })
    })

    it('skips all providers on edge runtime', async () => {
      const initDotell = await loadDotell('edge')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db))

      dotell.error(new Error('edge err'))
      await flushAsync()

      expect(warnSpy).toHaveBeenCalledWith(
        'dotell: Edge Runtime detected. error() skipped.',
      )
      expect(mockSentryCaptureException).not.toHaveBeenCalled()
      expect(db.events.create).not.toHaveBeenCalled()
    })

    it('includes hybrid deviceId in error properties for worker role', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      const dotell = initDotell(createConfig(db, { model: 'hybrid' }))
      const err = new Error('Worker crash')

      dotell.identify('device_2', { role: 'device' })
      dotell.identify('worker_2', { role: 'worker' })
      dotell.error(err, { step: 'payment' })
      await flushAsync()

      expect(db.events.create).toHaveBeenCalledWith({
        data: {
          event: 'error',
          user_id: 'worker_2',
          properties: {
            step: 'payment',
            message: 'Worker crash',
            name: 'Error',
            deviceId: 'device_2',
            role: 'worker',
          },
          context: 'server',
          identity_model: 'hybrid',
        },
      })
    })

    it('does not throw when Postgres write fails', async () => {
      const initDotell = await loadDotell('server')
      const db = createMockDb()
      db.events.create.mockRejectedValue(new Error('db error'))
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_1')
      expect(() => dotell.error(new Error('fail'))).not.toThrow()
      await flushAsync()
    })

    it('does not throw when Sentry capture fails', async () => {
      const initDotell = await loadDotell('client')
      const db = createMockDb()
      mockSentryCaptureException.mockImplementation(() => {
        throw new Error('sentry capture failed')
      })
      const dotell = initDotell(createConfig(db, { model: 'authenticated' }))

      dotell.identify('user_1')
      expect(() => dotell.error(new Error('app error'))).not.toThrow()
      await flushAsync()
    })
  })
})
