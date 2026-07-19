import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  ChecklistDay,
  ChecklistItem,
  Entry,
  Exercise,
  Tracker,
  WorkoutSession,
  WorkoutTemplate,
} from './types'

export const SCHEMA_VERSION = 1

export class LifeOsDB extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  trackers!: EntityTable<Tracker, 'id'>
  entries!: EntityTable<Entry, 'id'>
  checklist_items!: EntityTable<ChecklistItem, 'id'>
  checklist_days!: EntityTable<ChecklistDay, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  workout_templates!: EntityTable<WorkoutTemplate, 'id'>
  workout_sessions!: EntityTable<WorkoutSession, 'id'>

  constructor() {
    super('lifeos')

    this.version(SCHEMA_VERSION).stores({
      settings: 'id',
      trackers: 'id, type, sortOrder, symbol',
      entries: 'id, trackerId, date, [trackerId+date]',
      checklist_items: 'id, trackerId, sortOrder',
      checklist_days: 'id, trackerId, date, [trackerId+date]',
      exercises: 'id, name, archivedAt',
      workout_templates: 'id, name',
      workout_sessions: 'id, date, status',
    })
  }
}

export const db = new LifeOsDB()
