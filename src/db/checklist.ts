import { db } from './database'
import { todayDate } from './dates'
import type { ChecklistDay, ChecklistDayLine, ChecklistItem } from './types'

export function checklistDayDone(day: ChecklistDay): number {
  return day.lines.filter((l) => l.checked).length
}

export function checklistDayPercent(day: ChecklistDay): number | null {
  if (day.lines.length === 0) return null
  const done = checklistDayDone(day)
  if (done === 0) return null
  return Math.round((100 * done) / day.lines.length)
}

export async function listChecklistItems(
  trackerId: string,
): Promise<ChecklistItem[]> {
  return db.checklist_items
    .where('trackerId')
    .equals(trackerId)
    .sortBy('sortOrder')
}

export async function getChecklistDay(
  trackerId: string,
  date: string,
): Promise<ChecklistDay | undefined> {
  return db.checklist_days
    .where('[trackerId+date]')
    .equals([trackerId, date])
    .first()
}

export async function listChecklistDays(
  trackerId: string,
): Promise<ChecklistDay[]> {
  return db.checklist_days.where('trackerId').equals(trackerId).toArray()
}

export async function createChecklistItem(
  trackerId: string,
  title: string,
): Promise<ChecklistItem> {
  const items = await listChecklistItems(trackerId)
  const sortOrder = (items.at(-1)?.sortOrder ?? -1) + 1
  const item: ChecklistItem = {
    id: crypto.randomUUID(),
    trackerId,
    title: title.trim(),
    sortOrder,
  }
  await db.checklist_items.add(item)
  return item
}

export async function renameChecklistItem(
  id: string,
  title: string,
): Promise<void> {
  const item = await db.checklist_items.get(id)
  if (!item) return
  await db.checklist_items.put({ ...item, title: title.trim() })
}

/** Hard delete definition only — checklist_days untouched (07). */
export async function deleteChecklistItem(id: string): Promise<void> {
  await db.checklist_items.delete(id)
}

export async function reorderChecklistItems(
  trackerId: string,
  orderedIds: string[],
): Promise<void> {
  await db.transaction('rw', db.checklist_items, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const item = await db.checklist_items.get(orderedIds[i])
      if (!item || item.trackerId !== trackerId) continue
      if (item.sortOrder !== i) {
        await db.checklist_items.put({ ...item, sortOrder: i })
      }
    }
  })
}

function linesFromItems(items: ChecklistItem[]): ChecklistDayLine[] {
  return items.map((item) => ({
    itemId: item.id,
    title: item.title,
    checked: false,
  }))
}

function mergeTodayLines(
  existing: ChecklistDayLine[],
  items: ChecklistItem[],
): ChecklistDayLine[] {
  const itemById = new Map(items.map((i) => [i.id, i]))
  const itemIds = new Set(itemById.keys())

  const kept = existing
    .filter((l) => itemIds.has(l.itemId) || l.checked)
    .map((l) => {
      const item = itemById.get(l.itemId)
      return item ? { ...l, title: item.title } : l
    })

  const present = new Set(kept.map((l) => l.itemId))
  for (const item of items) {
    if (!present.has(item.id)) {
      kept.push({ itemId: item.id, title: item.title, checked: false })
    }
  }
  return kept
}

function linesEqual(a: ChecklistDayLine[], b: ChecklistDayLine[]): boolean {
  if (a.length !== b.length) return false
  return a.every(
    (l, i) =>
      l.itemId === b[i].itemId &&
      l.title === b[i].title &&
      l.checked === b[i].checked,
  )
}

/**
 * Open/create day snapshot per 07 ensureDay.
 * Future → no create. Empty items → no create.
 * Today → merge definition; past existing → as-is.
 */
export async function ensureChecklistDay(
  trackerId: string,
  date: string,
  today = todayDate(),
): Promise<ChecklistDay | null> {
  const existing = await getChecklistDay(trackerId, date)

  if (date > today) {
    return existing ?? null
  }

  const items = await listChecklistItems(trackerId)

  if (!existing) {
    if (items.length === 0) return null
    const day: ChecklistDay = {
      id: crypto.randomUUID(),
      trackerId,
      date,
      lines: linesFromItems(items),
      updatedAt: new Date().toISOString(),
    }
    await db.checklist_days.add(day)
    return day
  }

  if (date === today) {
    const nextLines = mergeTodayLines(existing.lines, items)
    if (!linesEqual(existing.lines, nextLines)) {
      const next: ChecklistDay = {
        ...existing,
        lines: nextLines,
        updatedAt: new Date().toISOString(),
      }
      await db.checklist_days.put(next)
      return next
    }
  }

  return existing
}

export async function toggleChecklistLine(
  trackerId: string,
  date: string,
  itemId: string,
  today = todayDate(),
): Promise<ChecklistDay | null> {
  if (date > today) return null

  const day = await ensureChecklistDay(trackerId, date, today)
  if (!day) return null

  const idx = day.lines.findIndex((l) => l.itemId === itemId)
  if (idx < 0) return day

  const lines = day.lines.map((l, i) =>
    i === idx ? { ...l, checked: !l.checked } : l,
  )
  const next: ChecklistDay = {
    ...day,
    lines,
    updatedAt: new Date().toISOString(),
  }
  await db.checklist_days.put(next)
  return next
}

export function filterDaysInRange(
  days: ChecklistDay[],
  from: string,
  to: string,
): ChecklistDay[] {
  return days
    .filter((d) => d.date >= from && d.date <= to)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Days that light up heatmap / count as progress (done > 0). */
export function daysWithProgress(days: ChecklistDay[]): ChecklistDay[] {
  return days.filter((d) => checklistDayDone(d) > 0)
}
