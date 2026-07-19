/** Local calendar helpers for MonthGrid (RU weekday letters). */

const MONTHS_RU = [
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

const MONTHS_RU_BADGE = [
  'ЯНВ',
  'ФЕВ',
  'МАР',
  'АПР',
  'МАЙ',
  'ИЮН',
  'ИЮЛ',
  'АВГ',
  'СЕН',
  'ОКТ',
  'НОЯ',
  'ДЕК',
] as const

/** JS getDay(): 0=Sun … 6=Sat → однобуквенные RU (Пн=П … Вс=В) */
const WEEKDAY_LETTER_RU = ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'] as const

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function parseMonth(month: string): { year: number; monthIndex: number } {
  const [y, m] = month.split('-').map(Number)
  return { year: y, monthIndex: m - 1 }
}

export function formatMonthKey(year: number, monthIndex: number): string {
  return `${year}-${pad(monthIndex + 1)}`
}

export function formatDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

export function monthTitleParts(month: string): { name: string; year: string } {
  const { year, monthIndex } = parseMonth(month)
  return { name: MONTHS_RU[monthIndex], year: String(year) }
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export interface GridDay {
  date: string
  day: number
  dayLabel: string
  weekdayLetter: string
  weekday: number
  isWeekend: boolean
}

export function buildMonthDays(month: string): GridDay[] {
  const { year, monthIndex } = parseMonth(month)
  const count = daysInMonth(year, monthIndex)
  const days: GridDay[] = []
  for (let day = 1; day <= count; day++) {
    const weekday = new Date(year, monthIndex, day).getDay()
    days.push({
      date: formatDateKey(year, monthIndex, day),
      day,
      dayLabel: pad(day),
      weekdayLetter: WEEKDAY_LETTER_RU[weekday],
      weekday,
      isWeekend: weekday === 0 || weekday === 6,
    })
  }
  return days
}

export function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = parseMonth(month)
  const d = new Date(year, monthIndex + delta, 1)
  return formatMonthKey(d.getFullYear(), d.getMonth())
}

export function clampDayInMonth(month: string, dayNumber: number): string {
  const { year, monthIndex } = parseMonth(month)
  const max = daysInMonth(year, monthIndex)
  return formatDateKey(year, monthIndex, Math.min(Math.max(1, dayNumber), max))
}

export function dayNumberFromDate(date: string): number {
  return Number(date.slice(8, 10))
}

export function isDateInMonth(date: string, month: string): boolean {
  return date.startsWith(month)
}

/** «19 июля» */
export function formatDateFullRu(date: string): string {
  const monthIndex = Number(date.slice(5, 7)) - 1
  const day = dayNumberFromDate(date)
  const genitive = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ] as const
  return `${day} ${genitive[monthIndex]}`
}

export function badgeMonthRu(date: string): string {
  const monthIndex = Number(date.slice(5, 7)) - 1
  return MONTHS_RU_BADGE[monthIndex]
}

export function isFutureDate(date: string, today: string): boolean {
  return date > today
}
