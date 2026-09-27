import { buildPushHTTPRequest } from '@pushforge/builder'
import { normalizeReminders } from '../../src/lib/reminders.ts'
import type { Reminder } from '../../src/db/types.ts'

interface Env {
  SCHEDULE: KVNamespace
  PUSH_TOKEN: string
  VAPID_PRIVATE_KEY: string
}

type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

type ScheduleRecord = {
  subscription: StoredSubscription | null
  reminders: Reminder[]
  timeZone: string
  sent: Record<string, string>
}

const KV_KEY = 'device'
const ADMIN_CONTACT = 'mailto:lifeos@users.noreply.github.com'
const GRACE_MINUTES = 2

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(request)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })

    if (!authorized(request, env.PUSH_TOKEN)) {
      return json({ error: 'unauthorized' }, 401, headers)
    }

    const url = new URL(request.url)
    try {
      if (request.method === 'POST' && url.pathname === '/sync') {
        return await sync(request, env, headers)
      }
      if (request.method === 'DELETE' && url.pathname === '/sync') {
        return await clearSubscription(env, headers)
      }
      if (request.method === 'POST' && url.pathname === '/test') {
        return await sendTest(env, headers)
      }
    } catch {
      return json({ error: 'failed' }, 500, headers)
    }
    return json({ error: 'not_found' }, 404, headers)
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(dispatchDue(env))
  },
}

async function sync(request: Request, env: Env, headers: Headers): Promise<Response> {
  const length = Number(request.headers.get('content-length') ?? '0')
  if (length > 20_000) return json({ error: 'too_large' }, 413, headers)

  const body = (await request.json()) as unknown
  if (!isRecord(body)) return json({ error: 'bad_request' }, 400, headers)

  const subscription = parseSubscription(body.subscription)
  if (!subscription) return json({ error: 'bad_subscription' }, 400, headers)

  const reminders = normalizeReminders(body.reminders)
  const timeZone = typeof body.timeZone === 'string' && isTimeZone(body.timeZone)
    ? body.timeZone
    : 'UTC'

  const current = await readSchedule(env)
  const next: ScheduleRecord = {
    subscription,
    reminders,
    timeZone,
    sent: current?.sent ?? {},
  }
  await env.SCHEDULE.put(KV_KEY, JSON.stringify(next))
  return json({ ok: true }, 200, headers)
}

async function clearSubscription(env: Env, headers: Headers): Promise<Response> {
  const current = await readSchedule(env)
  if (!current) return json({ ok: true }, 200, headers)
  current.subscription = null
  await env.SCHEDULE.put(KV_KEY, JSON.stringify(current))
  return json({ ok: true }, 200, headers)
}

async function sendTest(env: Env, headers: Headers): Promise<Response> {
  const current = await readSchedule(env)
  if (!current?.subscription) return json({ error: 'no_subscription' }, 404, headers)
  const status = await deliver(env, current.subscription, 'LifeOS', 'Проверка уведомлений', 'lifeos-test')
  if (status === 404 || status === 410) {
    current.subscription = null
    await env.SCHEDULE.put(KV_KEY, JSON.stringify(current))
    return json({ error: 'gone' }, 410, headers)
  }
  if (status < 200 || status >= 300) return json({ error: 'push_failed' }, 502, headers)
  return json({ ok: true }, 200, headers)
}

async function dispatchDue(env: Env): Promise<void> {
  const current = await readSchedule(env)
  if (!current?.subscription || current.reminders.length === 0) return

  const now = localNow(current.timeZone)
  let changed = false
  for (const reminder of current.reminders) {
    if (!isDue(reminder, now, current.sent)) continue
    const status = await deliver(
      env,
      current.subscription,
      reminder.text,
      '',
      reminder.id.replace(/-/g, '').slice(0, 32),
    )
    if (status === 404 || status === 410) {
      current.subscription = null
      changed = true
      break
    }
    if (status >= 200 && status < 300) {
      current.sent[reminder.id] = now.date
      changed = true
    }
  }
  if (changed) await env.SCHEDULE.put(KV_KEY, JSON.stringify(current))
}

function isDue(
  reminder: Reminder,
  now: { date: string; minutes: number; weekday: number },
  sent: Record<string, string>,
): boolean {
  if (!reminder.enabled || !reminder.text.trim()) return false
  if (!reminder.days.includes(now.weekday)) return false
  if (sent[reminder.id] === now.date) return false
  const [hour, minute] = reminder.time.split(':').map(Number)
  const delta = now.minutes - (hour * 60 + minute)
  return delta >= 0 && delta <= GRACE_MINUTES
}

async function deliver(
  env: Env,
  subscription: StoredSubscription,
  title: string,
  body: string,
  topic: string,
): Promise<number> {
  const { endpoint, headers, body: payload } = await buildPushHTTPRequest({
    privateJWK: env.VAPID_PRIVATE_KEY,
    subscription,
    message: {
      payload: body ? { title, body } : { title },
      adminContact: ADMIN_CONTACT,
      options: { ttl: 3600, urgency: 'normal', topic },
    },
  })
  const response = await fetch(endpoint, { method: 'POST', headers, body: payload })
  return response.status
}

function localNow(timeZone: string): { date: string; minutes: number; weekday: number } {
  const zone = isTimeZone(timeZone) ? timeZone : 'UTC'
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  let hour = Number(get('hour'))
  if (hour === 24) hour = 0
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: hour * 60 + Number(get('minute')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  }
}

function parseSubscription(raw: unknown): StoredSubscription | null {
  if (!isRecord(raw) || typeof raw.endpoint !== 'string') return null
  if (!raw.endpoint.startsWith('https://')) return null
  if (!isRecord(raw.keys)) return null
  if (typeof raw.keys.p256dh !== 'string' || typeof raw.keys.auth !== 'string') return null
  return {
    endpoint: raw.endpoint,
    keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
  }
}

async function readSchedule(env: Env): Promise<ScheduleRecord | null> {
  const raw = await env.SCHEDULE.get(KV_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return null
    const subscription = parsed.subscription === null ? null : parseSubscription(parsed.subscription)
    const sent: Record<string, string> = {}
    if (isRecord(parsed.sent)) {
      for (const [key, value] of Object.entries(parsed.sent)) {
        if (typeof value === 'string') sent[key] = value
      }
    }
    return {
      subscription,
      reminders: normalizeReminders(parsed.reminders),
      timeZone: typeof parsed.timeZone === 'string' ? parsed.timeZone : 'UTC',
      sent,
    }
  } catch {
    return null
  }
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date())
    return true
  } catch {
    return false
  }
}

function authorized(request: Request, token: string): boolean {
  const header = request.headers.get('Authorization') ?? ''
  const prefix = 'Bearer '
  if (!header.startsWith(prefix) || !token) return false
  return safeEqual(header.slice(prefix.length), token)
}

function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a)
  const right = new TextEncoder().encode(b)
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i += 1) diff |= left[i]! ^ right[i]!
  return diff === 0
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') ?? '*')
  headers.set('Vary', 'Origin')
  headers.set('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

function json(body: unknown, status: number, extra: Headers): Response {
  const headers = new Headers(extra)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(body), { status, headers })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
