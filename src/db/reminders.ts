import { db } from './database'
import { normalizeReminders } from '../lib/reminders'
import { ensureSettings } from './settings'
import type { Reminder } from './types'

export async function listReminders(): Promise<Reminder[]> {
  const settings = await ensureSettings()
  return normalizeReminders(settings.reminders)
}

export async function setReminders(reminders: Reminder[]): Promise<Reminder[]> {
  const next = normalizeReminders(reminders)
  await ensureSettings()
  await db.settings.update('app', { reminders: next })
  return next
}
