import type { TrackerType } from '@/db'

const TYPE_LABEL_RU: Record<TrackerType, string> = {
  completion: 'Завершение',
  time: 'Время',
  count: 'Число',
  distance: 'Дистанция',
  weight: 'Вес',
  workout_portal: 'Тренировка',
  checklist: 'Чеклист',
}

export function trackerTypeLabel(type: TrackerType): string {
  return TYPE_LABEL_RU[type]
}

export function trackerTypeBadge(type: TrackerType): string {
  return TYPE_LABEL_RU[type].toUpperCase()
}

export function isOrdinaryTrackerType(type: TrackerType): boolean {
  return (
    type === 'completion' ||
    type === 'time' ||
    type === 'count' ||
    type === 'distance' ||
    type === 'weight'
  )
}
