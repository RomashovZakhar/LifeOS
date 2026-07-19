<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import EntrySheetShell from '@/components/habits/EntrySheetShell.vue'
import {
  deleteEntryById,
  getEntry,
  upsertEntry,
  type Tracker,
} from '@/db'

const props = defineProps<{
  tracker: Tracker
  date: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 }, (_, i) => i)

const hour = ref(7)
const minute = ref(40)
const nextDay = ref(false)
const entryId = ref<string | null>(null)
const isEdit = computed(() => entryId.value != null)

const hourList = ref<HTMLElement | null>(null)
const minuteList = ref<HTMLElement | null>(null)
const ITEM = 40

onMounted(async () => {
  const e = await getEntry(props.tracker.id, props.date)
  if (e?.value.kind === 'time') {
    hour.value = Math.floor(e.value.minutesOfDay / 60)
    minute.value = e.value.minutesOfDay % 60
    nextDay.value = e.value.nextDay
    entryId.value = e.id
  }
  await nextTick()
  scrollToValue(hourList.value, hour.value)
  scrollToValue(minuteList.value, minute.value)
})

function scrollToValue(el: HTMLElement | null, value: number) {
  if (!el) return
  el.scrollTop = value * ITEM
}

function onHourScroll() {
  if (!hourList.value) return
  hour.value = Math.min(
    23,
    Math.max(0, Math.round(hourList.value.scrollTop / ITEM)),
  )
}

function onMinuteScroll() {
  if (!minuteList.value) return
  minute.value = Math.min(
    59,
    Math.max(0, Math.round(minuteList.value.scrollTop / ITEM)),
  )
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

async function onSave() {
  await upsertEntry(props.tracker.id, props.date, {
    kind: 'time',
    minutesOfDay: hour.value * 60 + minute.value,
    nextDay: nextDay.value,
  })
  emit('saved')
  emit('close')
}

async function onDelete() {
  if (entryId.value) await deleteEntryById(entryId.value)
  emit('saved')
  emit('close')
}
</script>

<template>
  <EntrySheetShell
    :date="date"
    :habit-name="tracker.name"
    @close="emit('close')"
  >
    <div class="wheel-wrap">
      <div class="wheel">
        <div class="highlight" aria-hidden="true" />
        <div
          ref="hourList"
          class="col mono"
          @scroll.passive="onHourScroll"
        >
          <div class="pad" />
          <div v-for="h in hours" :key="h" class="item">{{ pad(h) }}</div>
          <div class="pad" />
        </div>
        <div
          ref="minuteList"
          class="col mono"
          @scroll.passive="onMinuteScroll"
        >
          <div class="pad" />
          <div v-for="m in minutes" :key="m" class="item">{{ pad(m) }}</div>
          <div class="pad" />
        </div>
      </div>
    </div>

    <label class="nextday">
      <span>Следующий день</span>
      <input v-model="nextDay" type="checkbox" class="toggle" />
    </label>

    <template #footer>
      <div class="actions">
        <button
          v-if="isEdit"
          type="button"
          class="trash"
          aria-label="Удалить запись"
          @click="onDelete"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 7H19M10 7V5H14V7M9 7V19H15V7"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button type="button" class="primary" @click="onSave">
          {{ isEdit ? 'ОБНОВИТЬ' : 'ОТСЛЕДИТЬ' }}
        </button>
      </div>
    </template>
  </EntrySheetShell>
</template>

<style scoped>
.wheel-wrap {
  border-radius: 16px;
  background: var(--color-surface-3);
  padding: 8px 0;
  margin-bottom: 16px;
}

.wheel {
  position: relative;
  display: flex;
  height: 200px;
  overflow: hidden;
}

.highlight {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 50%;
  height: 40px;
  margin-top: -20px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-text-secondary) 18%, transparent);
  pointer-events: none;
  z-index: 0;
}

.col {
  flex: 1;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  text-align: center;
  position: relative;
  z-index: 1;
  scrollbar-width: none;
}

.col::-webkit-scrollbar {
  display: none;
}

.item {
  height: 40px;
  line-height: 40px;
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  scroll-snap-align: center;
}

.pad {
  height: 80px;
}

.nextday {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px 8px;
  font-size: 1.0625rem;
  color: var(--color-text-primary);
}

.toggle {
  width: 48px;
  height: 30px;
  appearance: none;
  border-radius: 999px;
  background: var(--color-surface-3);
  position: relative;
  cursor: pointer;
}

.toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.18s ease;
}

.toggle:checked {
  background: var(--color-accent);
}

.toggle:checked::after {
  transform: translateX(18px);
}

.actions {
  display: flex;
  gap: 10px;
}

.primary {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.trash {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-fg);
}
</style>
