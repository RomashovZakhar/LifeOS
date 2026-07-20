import { db } from './database'
import type { Tracker, TrackerConfig, TrackerType } from './types'

export async function hasWorkoutPortal(): Promise<boolean> {
  const n = await db.trackers.where('type').equals('workout_portal').count()
  return n > 0
}

export async function getTracker(id: string): Promise<Tracker | undefined> {
  return db.trackers.get(id)
}

export async function isSymbolTaken(
  symbol: string,
  exceptId?: string,
): Promise<boolean> {
  const needle = symbol.trim().toLowerCase()
  if (!needle) return false
  const all = await db.trackers.toArray()
  return all.some(
    (t) =>
      t.symbol.toLowerCase() === needle &&
      (exceptId === undefined || t.id !== exceptId),
  )
}

export async function createTracker(input: {
  name: string
  symbol: string
  type: TrackerType
  config: TrackerConfig
}): Promise<Tracker> {
  const symbol = input.symbol.trim().toUpperCase()
  if (!symbol || symbol.length > 5) throw new Error('Invalid symbol')
  if (await isSymbolTaken(symbol)) throw new Error('Symbol taken')
  if (input.type === 'workout_portal' && (await hasWorkoutPortal())) {
    throw new Error('Workout portal already exists')
  }
  const last = await db.trackers.orderBy('sortOrder').last()
  const sortOrder = (last?.sortOrder ?? -1) + 1
  const tracker: Tracker = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    symbol,
    type: input.type,
    sortOrder,
    createdAt: new Date().toISOString(),
    config: input.config,
  }
  await db.trackers.add(tracker)
  return tracker
}

export async function updateTracker(
  id: string,
  patch: {
    name: string
    symbol: string
    config: TrackerConfig
  },
): Promise<Tracker> {
  const existing = await getTracker(id)
  if (!existing) throw new Error('Tracker not found')
  const symbol = patch.symbol.trim().toUpperCase()
  if (!symbol || symbol.length > 5) throw new Error('Invalid symbol')
  if (await isSymbolTaken(symbol, id)) throw new Error('Symbol taken')
  const next: Tracker = {
    ...existing,
    name: patch.name.trim(),
    symbol,
    config: patch.config,
  }
  await db.trackers.put(next)
  return next
}

/** Ordinary → entries; checklist → items+days; portal → sessions (04b §6). */
export async function deleteTrackerCascade(id: string): Promise<void> {
  const tracker = await getTracker(id)
  if (!tracker) return

  await db.transaction(
    'rw',
    db.trackers,
    db.entries,
    db.checklist_items,
    db.checklist_days,
    db.workout_sessions,
    async () => {
      if (
        tracker.type === 'completion' ||
        tracker.type === 'time' ||
        tracker.type === 'count' ||
        tracker.type === 'distance' ||
        tracker.type === 'weight'
      ) {
        await db.entries.where('trackerId').equals(id).delete()
      } else if (tracker.type === 'checklist') {
        await db.checklist_items.where('trackerId').equals(id).delete()
        await db.checklist_days.where('trackerId').equals(id).delete()
      } else if (tracker.type === 'workout_portal') {
        // Один portal в V1 → все sessions
        await db.workout_sessions.toCollection().delete()
      }
      await db.trackers.delete(id)
    },
  )
}
