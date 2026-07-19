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
