/** Aggregates + series for H7 detail — analysis/10_detail_stats.md */

import type { Entry, Tracker } from '@/db'
import {
  formatClockTime,
  formatCountValue,
  formatMeasureValue,
  unitFromTracker,
} from '@/lib/cellDisplay'
import { formatHistoryDayRu } from '@/lib/detailRange'

export type NumericDetailType = 'time' | 'count' | 'distance' | 'weight'

export function isNumericDetailType(
  type: Tracker['type'],
): type is NumericDetailType {
  return (
    type === 'time' ||
    type === 'count' ||
    type === 'distance' ||
    type === 'weight'
  )
}

export interface DetailPoint {
  date: string
  /** Plot / compare value (time = effective minutes, may be ≥ 1440). */
  y: number
  /** Clock minutes 0..1439 for time display; same as y otherwise. */
  displayY: number
}

export interface StatCardModel {
  label: string
  value: string
  unit?: string
  subline?: string
}

export interface DetailStatModel {
  cards: [StatCardModel, StatCardModel, StatCardModel, StatCardModel]
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

/** Points for ranged entries of matching kind, sorted by date. */
export function buildDetailPoints(
  tracker: Tracker,
  entries: Entry[],
): DetailPoint[] {
  if (!isNumericDetailType(tracker.type)) return []
  const points: DetailPoint[] = []
  for (const e of entries) {
    const v = e.value
    if (tracker.type === 'time' && v.kind === 'time') {
      const displayY = v.minutesOfDay
      const y = displayY + (v.nextDay ? 1440 : 0)
      points.push({ date: e.date, y, displayY })
    } else if (tracker.type === 'count' && v.kind === 'count') {
      points.push({ date: e.date, y: v.value, displayY: v.value })
    } else if (tracker.type === 'distance' && v.kind === 'distance') {
      points.push({ date: e.date, y: v.value, displayY: v.value })
    } else if (tracker.type === 'weight' && v.kind === 'weight') {
      points.push({ date: e.date, y: v.value, displayY: v.value })
    }
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return points
}

function formatNumericValue(tracker: Tracker, y: number): string {
  if (tracker.type === 'count') return formatCountValue(y)
  if (tracker.type === 'time') {
    return formatClockTime(((y % 1440) + 1440) % 1440, timeFormatOf(tracker))
  }
  return formatMeasureValue(y)
}

function unitSuffix(tracker: Tracker): string | undefined {
  if (tracker.type === 'time') return undefined
  const u = unitFromTracker(tracker)
  return u || undefined
}

function emptyCard(label: string): StatCardModel {
  return { label, value: '—' }
}

/** Argmin / argmax; ties → earlier date. */
function extreme(
  points: DetailPoint[],
  mode: 'min' | 'max',
): DetailPoint | null {
  if (points.length === 0) return null
  let best = points[0]
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    const better =
      mode === 'min'
        ? p.y < best.y || (p.y === best.y && p.date < best.date)
        : p.y > best.y || (p.y === best.y && p.date < best.date)
    if (better) best = p
  }
  return best
}

export function buildDetailStats(
  tracker: Tracker,
  points: DetailPoint[],
): DetailStatModel {
  const n = points.length
  const isTime = tracker.type === 'time'
  const unit = unitSuffix(tracker)

  const avgLabel = 'СРЕДНЕЕ'
  const countLabel = 'ЗАПИСИ'
  const loLabel = isTime ? 'РАНЬШЕ' : 'МИН'
  const hiLabel = isTime ? 'ПОЗЖЕ' : 'МАКС'

  if (n === 0) {
    return {
      cards: [
        emptyCard(avgLabel),
        { label: countLabel, value: '0' },
        emptyCard(loLabel),
        emptyCard(hiLabel),
      ],
    }
  }

  const sum = points.reduce((acc, p) => acc + p.y, 0)
  const avgY = sum / n
  const lo = extreme(points, 'min')!
  const hi = extreme(points, 'max')!

  const avgDisplay = isTime
    ? formatClockTime(
        ((Math.round(avgY) % 1440) + 1440) % 1440,
        timeFormatOf(tracker),
      )
    : formatNumericValue(tracker, avgY)

  const loValue = isTime
    ? formatClockTime(lo.displayY, timeFormatOf(tracker))
    : formatNumericValue(tracker, lo.y)
  const hiValue = isTime
    ? formatClockTime(hi.displayY, timeFormatOf(tracker))
    : formatNumericValue(tracker, hi.y)

  return {
    cards: [
      {
        label: avgLabel,
        value: avgDisplay,
        unit: isTime ? undefined : unit,
      },
      { label: countLabel, value: String(n) },
      {
        label: loLabel,
        value: loValue,
        unit: isTime ? undefined : unit,
        subline: formatHistoryDayRu(lo.date),
      },
      {
        label: hiLabel,
        value: hiValue,
        unit: isTime ? undefined : unit,
        subline: formatHistoryDayRu(hi.date),
      },
    ],
  }
}

/** Meta Unit badge — RU caps for known units; count free-text uppercased. */
export function unitBadgeLabel(tracker: Tracker): string | null {
  if (tracker.type === 'weight') {
    const u = unitFromTracker(tracker)
    return u === 'lb' ? 'ФУНТЫ' : 'КИЛОГРАММЫ'
  }
  if (tracker.type === 'distance') {
    const u = unitFromTracker(tracker)
    return u === 'mi' ? 'МИЛИ' : 'КИЛОМЕТРЫ'
  }
  if (tracker.type === 'count') {
    const raw =
      tracker.config && 'unit' in tracker.config && tracker.config.unit
        ? String(tracker.config.unit).trim()
        : ''
    return raw ? raw.toUpperCase() : null
  }
  return null
}
