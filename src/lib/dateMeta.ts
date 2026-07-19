import { badgeMonthRu, dayNumberFromDate } from '@/lib/calendar'
import { todayDate } from '@/db/dates'

/** «СЕГОДНЯ • 19 ИЮЛ» / «19 ИЮЛ» */
export function entrySheetDateMeta(date: string, today = todayDate()): string {
  const day = String(dayNumberFromDate(date)).padStart(2, '0')
  const mon = badgeMonthRu(date)
  const stamp = `${day} ${mon}`
  if (date === today) return `СЕГОДНЯ • ${stamp}`
  return stamp
}
