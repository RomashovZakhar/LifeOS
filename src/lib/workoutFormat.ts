/** Timer / duration display helpers for Workouts. */

export function formatElapsedHms(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Habits grid + completed duration: total minutes:seconds.
 * `21:34` = 21 min 34 sec; `120:00` = 2 hours.
 */
export function formatDurationMinSec(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Parse `M:SS` / `MM:SS` / `120:00` → seconds. */
export function parseDurationMinSec(text: string): number | null {
  const t = text.trim()
  const m = /^(\d+):([0-5]?\d)$/.exec(t)
  if (!m) return null
  const mins = Number(m[1])
  const secs = Number(m[2])
  if (!Number.isFinite(mins) || !Number.isFinite(secs) || secs > 59) return null
  return mins * 60 + secs
}

/** @deprecated use formatDurationMinSec */
export const formatDurationHm = formatDurationMinSec
/** @deprecated use parseDurationMinSec */
export const parseDurationHm = parseDurationMinSec

export const TRACKING_MODE_LABEL: Record<
  'weight_reps' | 'reps_only' | 'duration',
  string
> = {
  weight_reps: 'Вес и повторы',
  reps_only: 'Повторы',
  duration: 'Время',
}

export const TRACKING_MODE_BADGE: Record<
  'weight_reps' | 'reps_only' | 'duration',
  string
> = {
  weight_reps: 'вес×повт',
  reps_only: 'повторы',
  duration: 'время',
}
