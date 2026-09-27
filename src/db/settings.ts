import { db, SCHEMA_VERSION } from './database'
import { currentMonth, todayDate } from './dates'
import type { AppSettings, Theme } from './types'

export async function ensureSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('app')
  if (existing) return existing

  const created: AppSettings = {
    id: 'app',
    schemaVersion: SCHEMA_VERSION,
    theme: 'dark',
    lastViewedMonth: currentMonth(),
    lastSelectedDate: todayDate(),
    locale: 'ru',
  }
  await db.settings.put(created)
  return created
}

export const DEFAULT_REST_SECONDS = 60
export const MAX_REST_SECONDS = 15 * 60

export function normalizeRestSeconds(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_REST_SECONDS
  const n = Math.floor(value)
  if (n < 1 || n > MAX_REST_SECONDS) return DEFAULT_REST_SECONDS
  return n
}

export async function getRestSeconds(): Promise<number> {
  const s = await ensureSettings()
  return normalizeRestSeconds(s.restSeconds)
}

export async function setRestSeconds(seconds: number): Promise<void> {
  const n = Math.floor(seconds)
  if (n < 1 || n > MAX_REST_SECONDS) return
  await ensureSettings()
  await db.settings.update('app', { restSeconds: n })
}

export async function setTheme(theme: Theme): Promise<void> {
  await ensureSettings()
  await db.settings.update('app', { theme })
}

export async function setViewState(month: string, date: string): Promise<void> {
  await ensureSettings()
  await db.settings.update('app', {
    lastViewedMonth: month,
    lastSelectedDate: date,
  })
}

export function applyThemeToDocument(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#000000' : '#F5F5F5')
  }
}
