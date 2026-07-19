import {
  badgeMonthRu,
  dayNumberFromDate,
  formatDateKey,
} from '@/lib/calendar'
import { todayDate } from '@/db/dates'

export type DetailRange = 'week' | 'month' | 'year' | 'all'

export interface DateBounds {
  from: string
  to: string
}

function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00`)
}

function addDays(date: string, delta: number): string {
  const d = parseDate(date)
  d.setDate(d.getDate() + delta)
  return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Inclusive bounds for ENTRIES count + history list. */
export function boundsForRange(
  range: DetailRange,
  today = todayDate(),
  _createdAtIso?: string,
): DateBounds {
  if (range === 'week') {
    return { from: addDays(today, -6), to: today }
  }
  if (range === 'month') {
    const d = parseDate(today)
    return {
      from: formatDateKey(d.getFullYear(), d.getMonth(), 1),
      to: today,
    }
  }
  if (range === 'year') {
    return { from: addDays(today, -364), to: today }
  }
  // All-time: все записи до сегодня (не резать по createdAt —
  // логи за дни до создания трекера иначе пропадают)
  return { from: '0001-01-01', to: today }
}

export interface HeatmapCell {
  date: string
  filled: boolean
  inRange: boolean
}

export interface HeatmapColumn {
  cells: HeatmapCell[]
  monthLabel: string | null
}

/** GitHub-style weeks (Mon→Sun), ~17 weeks ≈ кадр photo_24. */
export function buildHeatmapColumns(
  filledDates: Set<string>,
  today = todayDate(),
  weekCount = 17,
): HeatmapColumn[] {
  const end = parseDate(today)
  // Align end week to Sunday (end of week containing today)
  const endDow = end.getDay() // 0 Sun
  const daysToSunday = endDow === 0 ? 0 : 7 - endDow
  const lastSunday = new Date(end)
  lastSunday.setDate(end.getDate() + daysToSunday)

  const totalDays = weekCount * 7
  const first = new Date(lastSunday)
  first.setDate(lastSunday.getDate() - (totalDays - 1))

  const columns: HeatmapColumn[] = []
  for (let w = 0; w < weekCount; w++) {
    const cells: HeatmapCell[] = []
    let monthLabel: string | null = null
    for (let i = 0; i < 7; i++) {
      const d = new Date(first)
      d.setDate(first.getDate() + w * 7 + i)
      const date = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate())
      const future = date > today
      cells.push({
        date,
        filled: !future && filledDates.has(date),
        inRange: !future,
      })
      // Label when this cell is the 1st of a month
      if (d.getDate() === 1) {
        monthLabel = badgeMonthRu(date)
      }
    }
    // If week contains the 1st later in the week, still label column
    if (!monthLabel) {
      for (const c of cells) {
        if (dayNumberFromDate(c.date) === 1) {
          monthLabel = badgeMonthRu(c.date)
          break
        }
      }
    }
    columns.push({ cells, monthLabel })
  }
  return columns
}

const WEEKDAY_SHORT_RU = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'] as const

/** «ВС 19 ИЮЛ» */
export function formatHistoryDayRu(date: string): string {
  const d = parseDate(date)
  const wd = WEEKDAY_SHORT_RU[d.getDay()]
  const day = String(dayNumberFromDate(date)).padStart(2, '0')
  return `${wd} ${day} ${badgeMonthRu(date)}`
}

/** «19 ИЮЛ, 2026» */
export function formatCreatedRu(iso: string): string {
  const date = iso.slice(0, 10)
  const day = String(dayNumberFromDate(date)).padStart(2, '0')
  const year = date.slice(0, 4)
  return `${day} ${badgeMonthRu(date)}, ${year}`
}

const MONTHS_SECTION = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const

export function monthSectionTitle(date: string): string {
  const monthIndex = Number(date.slice(5, 7)) - 1
  return MONTHS_SECTION[monthIndex]
}
