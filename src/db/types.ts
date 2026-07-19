/** Persistence types — analysis/04b_data_model.md */

export type Theme = 'dark' | 'light'

export type TrackerType =
  | 'completion'
  | 'time'
  | 'count'
  | 'distance'
  | 'weight'
  | 'workout_portal'
  | 'checklist'

export type EntryValue =
  | { kind: 'completion' }
  | { kind: 'time'; minutesOfDay: number; nextDay: boolean }
  | { kind: 'count'; value: number }
  | { kind: 'distance'; value: number }
  | { kind: 'weight'; value: number }

export type TrackingMode = 'weight_reps' | 'reps_only' | 'duration'

export type SessionStatus = 'in_progress' | 'completed'

export interface AppSettings {
  id: 'app'
  schemaVersion: number
  theme: Theme
  lastViewedMonth: string // YYYY-MM
  lastSelectedDate: string // YYYY-MM-DD
  locale: 'ru'
}

export type TrackerConfig =
  | Record<string, never>
  | { timeFormat: '24h' | 'ampm' }
  | { unit?: string }
  | { unit: string }

export interface Tracker {
  id: string
  name: string
  symbol: string
  type: TrackerType
  sortOrder: number
  createdAt: string
  config: TrackerConfig
}

export interface Entry {
  id: string
  trackerId: string
  date: string
  value: EntryValue
  updatedAt: string
}

export interface ChecklistItem {
  id: string
  trackerId: string
  title: string
  sortOrder: number
}

export interface ChecklistDayLine {
  itemId: string
  title: string
  checked: boolean
}

export interface ChecklistDay {
  id: string
  trackerId: string
  date: string
  lines: ChecklistDayLine[]
  updatedAt: string
}

export interface Exercise {
  id: string
  name: string
  trackingMode: TrackingMode
  createdAt: string
  archivedAt: string | null
}

export interface WorkoutTemplate {
  id: string
  name: string
  exerciseIds: string[]
  updatedAt: string
}

export interface SessionSet {
  id: string
  sortOrder: number
  weightKg?: number
  reps?: number
  durationSeconds?: number
}

export interface SessionExercise {
  id: string
  exerciseId: string
  sortOrder: number
  sets: SessionSet[]
}

export interface WorkoutSession {
  id: string
  date: string
  status: SessionStatus
  startedAt: string
  pausedAt: string | null
  pauseAccumulatedSeconds: number
  endedAt: string | null
  durationSeconds: number | null
  templateId: string | null
  exercises: SessionExercise[]
  updatedAt: string
}

export interface LifeOsExport {
  exportedAt: string
  schemaVersion: number
  settings: AppSettings
  trackers: Tracker[]
  entries: Entry[]
  checklist_items: ChecklistItem[]
  checklist_days: ChecklistDay[]
  exercises: Exercise[]
  workout_templates: WorkoutTemplate[]
  workout_sessions: WorkoutSession[]
}
