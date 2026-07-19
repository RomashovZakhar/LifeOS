/** Local calendar helpers — YYYY-MM-DD / YYYY-MM in device TZ */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function todayDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function monthFromDate(date: string): string {
  return date.slice(0, 7)
}
