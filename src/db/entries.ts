import { db } from './database'
import type { Entry, EntryValue } from './types'

export async function getEntry(
  trackerId: string,
  date: string,
): Promise<Entry | undefined> {
  return db.entries.where('[trackerId+date]').equals([trackerId, date]).first()
}

export async function deleteEntryById(id: string): Promise<void> {
  await db.entries.delete(id)
}

export async function upsertEntry(
  trackerId: string,
  date: string,
  value: EntryValue,
): Promise<Entry> {
  const existing = await getEntry(trackerId, date)
  const updatedAt = new Date().toISOString()
  if (existing) {
    const next: Entry = { ...existing, value, updatedAt }
    await db.entries.put(next)
    return next
  }
  const entry: Entry = {
    id: crypto.randomUUID(),
    trackerId,
    date,
    value,
    updatedAt,
  }
  await db.entries.add(entry)
  return entry
}

export async function toggleCompletionEntry(
  trackerId: string,
  date: string,
): Promise<void> {
  const existing = await getEntry(trackerId, date)
  if (existing) {
    await db.entries.delete(existing.id)
    return
  }
  await upsertEntry(trackerId, date, { kind: 'completion' })
}

export async function setCompletionEntry(
  trackerId: string,
  date: string,
): Promise<void> {
  await upsertEntry(trackerId, date, { kind: 'completion' })
}

export async function listEntriesForTracker(
  trackerId: string,
): Promise<Entry[]> {
  return db.entries.where('trackerId').equals(trackerId).toArray()
}

export function filterEntriesInRange(
  entries: Entry[],
  from: string,
  to: string,
): Entry[] {
  return entries
    .filter((e) => e.date >= from && e.date <= to)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
