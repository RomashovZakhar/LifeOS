import { listReminders, setReminders, type Reminder } from '@/db'
import { normalizeReminders } from '@/lib/reminders'

const SUB_KEY = 'lifeos.push.subscription'

export type PushAvailability =
  | 'ready'
  | 'needs-permission'
  | 'denied'
  | 'unsupported'
  | 'needs-install'
  | 'unconfigured'

type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

function envValue(
  name: 'VITE_PUSH_ENDPOINT' | 'VITE_VAPID_PUBLIC_KEY' | 'VITE_PUSH_TOKEN',
): string {
  const value = import.meta.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

export function pushConfigured(): boolean {
  return Boolean(
    envValue('VITE_PUSH_ENDPOINT') &&
      envValue('VITE_VAPID_PUBLIC_KEY') &&
      envValue('VITE_PUSH_TOKEN'),
  )
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** iOS delivers Web Push only from a Home Screen install. */
export function mustInstallToHomeScreen(): boolean {
  const ua = navigator.userAgent
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!ios) return false
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return !standalone
}

export function pushAvailability(): PushAvailability {
  if (!pushConfigured()) return 'unconfigured'
  if (!pushSupported()) return 'unsupported'
  if (mustInstallToHomeScreen()) return 'needs-install'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission === 'granted' && loadSubscription()) return 'ready'
  return 'needs-permission'
}

let writeChain: Promise<unknown> = Promise.resolve()

export function persistReminders(reminders: Reminder[]): Promise<Reminder[]> {
  const run = writeChain.then(async () => {
    const saved = await setReminders(reminders)
    scheduleSync(saved)
    return saved
  })
  writeChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export async function enablePush(): Promise<PushAvailability> {
  const availability = pushAvailability()
  if (availability === 'unconfigured' || availability === 'unsupported') {
    return availability
  }
  if (availability === 'needs-install' || availability === 'denied') {
    return availability
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return pushAvailability()

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    const key = urlBase64ToUint8Array(envValue('VITE_VAPID_PUBLIC_KEY'))
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key.buffer.slice(
        key.byteOffset,
        key.byteOffset + key.byteLength,
      ) as ArrayBuffer,
    })
  }

  const stored = toStoredSubscription(subscription.toJSON())
  if (!stored) throw new Error('Подписка без ключей')
  saveSubscription(stored)
  await syncSchedule(await listReminders())
  return 'ready'
}

/** After import, push the restored schedule if this device is already subscribed. */
export async function syncStoredReminders(): Promise<void> {
  if (pushAvailability() !== 'ready') return
  await syncSchedule(await listReminders())
}

export async function disablePush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  await subscription?.unsubscribe()
  saveSubscription(null)
  if (!pushConfigured()) return
  await authed('/sync', 'DELETE')
}

export async function sendTestPush(): Promise<void> {
  if (pushAvailability() !== 'ready') {
    throw new Error('Сначала включи уведомления')
  }
  const response = await authed('/test', 'POST')
  if (!response.ok) throw new Error('Не удалось отправить')
}

let syncTimer: number | undefined
let pendingSync: Reminder[] | null = null

function scheduleSync(reminders: Reminder[]): void {
  pendingSync = reminders
  window.clearTimeout(syncTimer)
  syncTimer = window.setTimeout(() => {
    const next = pendingSync
    pendingSync = null
    if (!next) return
    void syncSchedule(next).catch(() => {})
  }, 500)
}

async function syncSchedule(reminders: Reminder[]): Promise<void> {
  if (!pushConfigured()) return
  const subscription = loadSubscription()
  if (!subscription) return
  const response = await authed('/sync', 'POST', {
    subscription,
    reminders: normalizeReminders(reminders),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  })
  if (!response.ok) throw new Error('Не удалось сохранить расписание')
}

function loadSubscription(): StoredSubscription | null {
  try {
    const raw = localStorage.getItem(SUB_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isStoredSubscription(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function saveSubscription(subscription: StoredSubscription | null): void {
  if (!subscription) {
    localStorage.removeItem(SUB_KEY)
    return
  }
  localStorage.setItem(SUB_KEY, JSON.stringify(subscription))
}

function toStoredSubscription(raw: PushSubscriptionJSON): StoredSubscription | null {
  if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys.auth) return null
  return {
    endpoint: raw.endpoint,
    keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
  }
}

function isStoredSubscription(raw: unknown): raw is StoredSubscription {
  if (typeof raw !== 'object' || raw === null) return false
  const item = raw as Record<string, unknown>
  if (typeof item.endpoint !== 'string') return false
  if (typeof item.keys !== 'object' || item.keys === null) return false
  const keys = item.keys as Record<string, unknown>
  return typeof keys.p256dh === 'string' && typeof keys.auth === 'string'
}

async function authed(
  path: string,
  method: 'POST' | 'DELETE',
  body?: unknown,
): Promise<Response> {
  const endpoint = envValue('VITE_PUSH_ENDPOINT').replace(/\/$/, '')
  return fetch(`${endpoint}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${envValue('VITE_PUSH_TOKEN')}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}
