import type {
  ChecklistDay,
  Entry,
  Tracker,
  WorkoutSession,
} from '@/db'

const EMPTY = '·'

function formatDuration(seconds: number): string {
  const totalMin = Math.floor(seconds / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/** Integer for count; measure values always one decimal. */
export function formatCountValue(value: number): string {
  return String(Math.round(value))
}

export function formatMeasureValue(value: number): string {
  return value.toFixed(1)
}

export function unitFromTracker(tracker: Tracker): string {
  if (tracker.config && 'unit' in tracker.config && tracker.config.unit) {
    return String(tracker.config.unit).toLowerCase()
  }
  if (tracker.type === 'distance') return 'km'
  if (tracker.type === 'weight') return 'kg'
  return ''
}

/** `22:30` or `10:30 PM` (12→12 AM/PM; wheel storage stays minutesOfDay). */
export function formatClockTime(
  minutesOfDay: number,
  timeFormat: '24h' | 'ampm' = '24h',
): string {
  const h24 = ((Math.floor(minutesOfDay / 60) % 24) + 24) % 24
  const m = ((minutesOfDay % 60) + 60) % 60
  const mm = String(m).padStart(2, '0')
  if (timeFormat !== 'ampm') {
    return `${String(h24).padStart(2, '0')}:${mm}`
  }
  const period = h24 < 12 ? 'AM' : 'PM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${mm} ${period}`
}

function timeFormatOf(tracker: Tracker): '24h' | 'ampm' {
  if (
    tracker.config &&
    'timeFormat' in tracker.config &&
    tracker.config.timeFormat === 'ampm'
  ) {
    return 'ampm'
  }
  return '24h'
}

export function cellTextForTracker(
  tracker: Tracker,
  _date: string,
  entry: Entry | undefined,
  session: WorkoutSession | undefined,
  checklistDay: ChecklistDay | undefined,
): string {
  switch (tracker.type) {
    case 'completion':
      return entry?.value.kind === 'completion' ? '×' : EMPTY
    case 'time': {
      if (!entry || entry.value.kind !== 'time') return EMPTY
      return formatClockTime(entry.value.minutesOfDay, timeFormatOf(tracker))
    }
    case 'count':
      if (!entry || entry.value.kind !== 'count') return EMPTY
      return formatCountValue(entry.value.value)
    case 'distance':
    case 'weight': {
      if (
        !entry ||
        (entry.value.kind !== 'distance' && entry.value.kind !== 'weight')
      ) {
        return EMPTY
      }
      const unit = unitFromTracker(tracker)
      return `${formatMeasureValue(entry.value.value)} ${unit}`
    }
    case 'workout_portal': {
      if (
        session?.status === 'completed' &&
        session.durationSeconds != null
      ) {
        return formatDuration(session.durationSeconds)
      }
      return EMPTY
    }
    case 'checklist': {
      if (!checklistDay) return EMPTY
      const done = checklistDay.lines.filter((l) => l.checked).length
      if (done === 0) return EMPTY
      const pct = Math.round((100 * done) / checklistDay.lines.length)
      return `${pct}%`
    }
    default:
      return EMPTY
  }
}
