import { db, SCHEMA_VERSION } from './database'
import { ensureSettings } from './settings'
import type { LifeOsExport } from './types'

export async function buildExportDocument(): Promise<LifeOsExport> {
  const settings = await ensureSettings()
  const [
    trackers,
    entries,
    checklist_items,
    checklist_days,
    exercises,
    workout_templates,
    workout_sessions,
  ] = await Promise.all([
    db.trackers.toArray(),
    db.entries.toArray(),
    db.checklist_items.toArray(),
    db.checklist_days.toArray(),
    db.exercises.toArray(),
    db.workout_templates.toArray(),
    db.workout_sessions.toArray(),
  ])

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    settings,
    trackers,
    entries,
    checklist_items,
    checklist_days,
    exercises,
    workout_templates,
    workout_sessions,
  }
}

export async function downloadExportJson(): Promise<void> {
  const doc = await buildExportDocument()
  const blob = new Blob([JSON.stringify(doc, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lifeos-export-${doc.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
