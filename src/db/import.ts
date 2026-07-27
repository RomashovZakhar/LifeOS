/** Import LifeOS backup JSON — replace mode (analysis/04b). */

import { toRaw } from 'vue'
import { db, SCHEMA_VERSION } from './database'
import { applyThemeToDocument } from './settings'
import type { AppSettings, LifeOsExport, Theme } from './types'

export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

const ARRAY_KEYS = [
  'trackers',
  'entries',
  'checklist_items',
  'checklist_days',
  'exercises',
  'workout_templates',
  'workout_sessions',
] as const

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Strip Vue proxies / ensure IDB-cloneable plain data. */
function toPlainExport(doc: LifeOsExport): LifeOsExport {
  // JSON round-trip: nested reactive proxies survive toRaw(root).
  return JSON.parse(JSON.stringify(toRaw(doc))) as LifeOsExport
}

/** Parse + validate export document. Throws ImportError. */
export function parseExportDocument(raw: unknown): LifeOsExport {
  if (!isPlainObject(raw)) {
    throw new ImportError('Файл не похож на экспорт LifeOS')
  }

  const schemaVersion = raw.schemaVersion
  if (typeof schemaVersion !== 'number' || !Number.isFinite(schemaVersion)) {
    throw new ImportError('В файле нет версии схемы')
  }
  if (schemaVersion !== SCHEMA_VERSION) {
    throw new ImportError(
      `Версия файла (${schemaVersion}) не совпадает с приложением (${SCHEMA_VERSION})`,
    )
  }

  if (!isPlainObject(raw.settings)) {
    throw new ImportError('В файле нет settings')
  }

  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(raw[key])) {
      throw new ImportError(`В файле нет массива «${key}»`)
    }
  }

  const theme = raw.settings.theme
  if (theme !== 'dark' && theme !== 'light') {
    throw new ImportError('Некорректная тема в settings')
  }

  return raw as unknown as LifeOsExport
}

export async function parseExportFile(file: File): Promise<LifeOsExport> {
  let text: string
  try {
    text = await file.text()
  } catch {
    throw new ImportError('Не удалось прочитать файл')
  }
  let json: unknown
  try {
    json = JSON.parse(text) as unknown
  } catch {
    throw new ImportError('Файл не является JSON')
  }
  return parseExportDocument(json)
}

/**
 * Wipe all app stores and load export. Atomic transaction.
 * Applies theme from imported settings.
 */
export async function replaceFromExport(doc: LifeOsExport): Promise<void> {
  const plain = toPlainExport(doc)
  const settings: AppSettings = {
    ...plain.settings,
    id: 'app',
    schemaVersion: SCHEMA_VERSION,
    theme: plain.settings.theme as Theme,
  }

  await db.transaction(
    'rw',
    [
      db.settings,
      db.trackers,
      db.entries,
      db.checklist_items,
      db.checklist_days,
      db.exercises,
      db.workout_templates,
      db.workout_sessions,
    ],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.trackers.clear(),
        db.entries.clear(),
        db.checklist_items.clear(),
        db.checklist_days.clear(),
        db.exercises.clear(),
        db.workout_templates.clear(),
        db.workout_sessions.clear(),
      ])

      await db.settings.put(settings)
      await db.trackers.bulkPut(plain.trackers)
      await db.entries.bulkPut(plain.entries)
      await db.checklist_items.bulkPut(plain.checklist_items)
      await db.checklist_days.bulkPut(plain.checklist_days)
      await db.exercises.bulkPut(plain.exercises)
      await db.workout_templates.bulkPut(plain.workout_templates)
      await db.workout_sessions.bulkPut(plain.workout_sessions)
    },
  )

  applyThemeToDocument(settings.theme)
}
