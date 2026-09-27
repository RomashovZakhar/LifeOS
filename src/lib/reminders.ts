import type { Reminder } from '../db/types'

export const REMINDER_TEXT_MAX = 120
export const REMINDER_MAX_COUNT = 20

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

/** Monday-first display order. Values are JS weekdays (0 = Sunday). */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const

export function createReminder(): Reminder {
  return {
    id: crypto.randomUUID(),
    text: '',
    time: '09:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  }
}

export function normalizeReminders(raw: unknown): Reminder[] {
  if (!Array.isArray(raw)) return []
  const out: Reminder[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    const next = normalizeReminder(item)
    if (!next || seen.has(next.id)) continue
    seen.add(next.id)
    out.push(next)
    if (out.length >= REMINDER_MAX_COUNT) break
  }
  return out
}

export function formatReminderDays(days: readonly number[]): string {
  const set = new Set(days)
  if (set.size === 0) return 'ни одного дня'
  if (set.size === 7) return 'каждый день'
  return WEEKDAY_ORDER.filter((day) => set.has(day))
    .map((day) => WEEKDAY_SHORT[day])
    .join(' ')
}

function normalizeReminder(raw: unknown): Reminder | null {
  if (typeof raw !== 'object' || raw === null) return null
  const item = raw as Record<string, unknown>
  if (typeof item.id !== 'string' || !item.id.trim()) return null
  if (typeof item.text !== 'string') return null
  if (typeof item.time !== 'string' || !TIME_RE.test(item.time)) return null
  if (!Array.isArray(item.days)) return null

  const days: number[] = []
  for (const day of item.days) {
    if (typeof day !== 'number' || !Number.isInteger(day)) continue
    if (day < 0 || day > 6) continue
    if (!days.includes(day)) days.push(day)
  }

  return {
    id: item.id,
    text: item.text.trim().slice(0, REMINDER_TEXT_MAX),
    time: item.time,
    days,
    enabled: item.enabled !== false,
  }
}
