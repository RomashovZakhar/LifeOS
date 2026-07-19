<script setup lang="ts">
import { computed } from 'vue'
import MiniCalendarBadge from '@/components/habits/MiniCalendarBadge.vue'
import { useSwipeDismiss } from '@/composables/useSwipeDismiss'
import type { ChecklistDay, Entry, Tracker, WorkoutSession } from '@/db'
import {
  badgeMonthRu,
  dayNumberFromDate,
  formatDateFullRu,
  isFutureDate,
} from '@/lib/calendar'
import { cellTextForTracker } from '@/lib/cellDisplay'

const props = defineProps<{
  date: string
  todayDate: string
  trackers: Tracker[]
  entryMap: Map<string, Entry>
  sessionByDate: Map<string, WorkoutSession>
  checklistMap: Map<string, ChecklistDay>
}>()

const emit = defineEmits<{
  close: []
  toggleCompletion: [tracker: Tracker]
  openTracker: [tracker: Tracker]
  futureHint: []
}>()

const { dragY, dragging, onTouchStart, onTouchMove, onTouchEnd } =
  useSwipeDismiss(() => emit('close'), 88)

const isToday = computed(() => props.date === props.todayDate)
const isFuture = computed(() => isFutureDate(props.date, props.todayDate))

const title = computed(() =>
  isToday.value ? 'Сегодня' : formatDateFullRu(props.date),
)

const dayLabel = computed(() =>
  String(dayNumberFromDate(props.date)).padStart(2, '0'),
)
const monthLabel = computed(() => badgeMonthRu(props.date))

const panelStyle = computed(() => {
  if (!dragging.value && dragY.value === 0) return undefined
  return {
    transform: `translateY(${dragY.value}px)`,
    transition: dragging.value
      ? 'none'
      : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
  }
})

function entryFor(t: Tracker) {
  return props.entryMap.get(`${t.id}|${props.date}`)
}

function trailing(t: Tracker): string {
  if (t.type === 'completion') return ''
  const text = cellTextForTracker(
    t,
    props.date,
    entryFor(t),
    props.sessionByDate.get(props.date),
    props.checklistMap.get(`${t.id}|${props.date}`),
  )
  return text === '·' ? '' : text
}

function isDoneOrdinary(t: Tracker): boolean {
  const e = entryFor(t)
  if (!e) return false
  if (t.type === 'completion') return e.value.kind === 'completion'
  return true
}

function onRowTap(t: Tracker) {
  if (isFuture.value) {
    emit('futureHint')
    return
  }
  if (t.type === 'completion') {
    emit('toggleCompletion', t)
    return
  }
  emit('openTracker', t)
}
</script>

<template>
  <section
    class="today"
    :class="{ dragging }"
    :style="panelStyle"
  >
    <div
      class="chrome"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <div class="grab" aria-hidden="true" />
      <header class="head">
        <h2 class="title">{{ title }}</h2>
        <MiniCalendarBadge :day-label="dayLabel" :month-label="monthLabel" />
      </header>
    </div>

    <p v-if="isFuture" class="hint">Нельзя отметить будущий день</p>

    <div v-if="trackers.length === 0" class="empty" />

    <ul v-else class="list">
      <li v-for="t in trackers" :key="t.id">
        <button
          type="button"
          class="row"
          :class="{
            done:
              isDoneOrdinary(t) &&
              t.type !== 'workout_portal' &&
              t.type !== 'checklist',
            portal: t.type === 'workout_portal' || t.type === 'checklist',
          }"
          @click="onRowTap(t)"
        >
          <span
            v-if="t.type !== 'workout_portal' && t.type !== 'checklist'"
            class="check"
            :class="{ on: isDoneOrdinary(t) }"
            aria-hidden="true"
          >
            <svg
              v-if="isDoneOrdinary(t)"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M2.5 7.2L5.6 10.2L11.5 3.8"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="name">{{ t.name }}</span>
          <span v-if="trailing(t)" class="trail mono">{{ trailing(t) }}</span>
          <span
            v-else-if="t.type === 'workout_portal' || t.type === 'checklist'"
            class="chev"
            aria-hidden="true"
          >›</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.today {
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* Sheet gray — not OLED black bg; rows use surface-3 on top */
  background: var(--color-surface-2);
  border-radius: 20px 20px 0 0;
  padding: 4px 12px 0;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.35);
  touch-action: pan-y;
  animation: today-up 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.today.dragging {
  animation: none;
}

.chrome {
  flex: 0 0 auto;
  touch-action: none;
}

.grab {
  width: 36px;
  height: 4px;
  margin: 6px auto 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-text-secondary) 45%, transparent);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 2px 14px;
}

.title {
  margin: 0;
  font-size: clamp(2rem, 8vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--color-text-primary);
}

.hint {
  margin: 0 0 10px;
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
}

.empty {
  flex: 1;
  min-height: 48px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(12px + var(--safe-bottom));
  min-height: 0;
  flex: 1 1 auto;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--color-surface-3);
  text-align: left;
}

.row:active {
  opacity: 0.9;
}

.check {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1.5px var(--color-text-secondary);
  color: var(--color-text-secondary);
}

.check.on {
  box-shadow: none;
  background: transparent;
  color: var(--color-text-secondary);
}

.name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.0625rem;
  font-weight: 400;
  color: var(--color-text-primary);
}

.trail {
  flex: 0 0 auto;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.chev {
  flex: 0 0 auto;
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  line-height: 1;
}

.row.done .name {
  color: var(--color-text-disabled);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

.row.portal .name {
  text-decoration: none;
  color: var(--color-text-primary);
}

@keyframes today-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
