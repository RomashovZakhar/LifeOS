<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import {
  checklistDayPercent,
  ensureChecklistDay,
  toggleChecklistLine,
  todayDate,
  type ChecklistDay,
  type Tracker,
  db,
} from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { formatDateFullRu, isFutureDate } from '@/lib/calendar'

const props = defineProps<{
  trackerId: string
  date: string
}>()

const emit = defineEmits<{
  close: []
  /** Open C1 device to manage items. */
  openDevice: []
}>()

const today = todayDate()
const futureHint = ref(false)

const tracker = useLiveQuery(
  async () => (await db.trackers.get(props.trackerId)) ?? null,
  undefined as Tracker | null | undefined,
  () => props.trackerId,
)

const day = useLiveQuery(
  async () =>
    (await db.checklist_days
      .where('[trackerId+date]')
      .equals([props.trackerId, props.date])
      .first()) ?? null,
  null as ChecklistDay | null,
  () => `${props.trackerId}|${props.date}`,
)

const isFuture = computed(() => isFutureDate(props.date, today))

const percent = computed(() => (day.value ? checklistDayPercent(day.value) : null))

const subtitle = computed(() => {
  const dateLabel = formatDateFullRu(props.date)
  if (percent.value != null) return `${dateLabel} · ${percent.value}%`
  return dateLabel
})

const showEmptyItems = computed(
  () =>
    !isFuture.value &&
    !futureHint.value &&
    !(day.value && day.value.lines.length > 0),
)

watch(
  () => [props.trackerId, props.date, tracker.value] as const,
  async ([, , t]) => {
    if (!t || t.type !== 'checklist') {
      if (t !== undefined && t !== null) emit('close')
      return
    }
    if (isFutureDate(props.date, today)) return
    await ensureChecklistDay(props.trackerId, props.date, today)
  },
  { immediate: true },
)

async function onToggle(itemId: string) {
  if (isFuture.value) {
    futureHint.value = true
    window.setTimeout(() => {
      futureHint.value = false
    }, 1600)
    return
  }
  await toggleChecklistLine(props.trackerId, props.date, itemId, today)
}

function goAddItems() {
  emit('openDevice')
}
</script>

<template>
  <BottomSheet
    v-if="tracker && tracker.type === 'checklist'"
    size="auto"
    :aria-label="tracker.name"
    @close="emit('close')"
  >
    <header class="head">
      <div class="titles">
        <h2 class="name">{{ tracker.name }}</h2>
        <p class="sub">{{ subtitle }}</p>
      </div>
      <CloseButton />
    </header>

    <p v-if="isFuture || futureHint" class="hint">
      Нельзя отметить будущий день
    </p>

    <div v-else-if="showEmptyItems" class="empty-block">
      <p class="empty">Сначала добавьте пункты</p>
      <button type="button" class="add-cta" @click="goAddItems">
        Добавить пункты
      </button>
    </div>

    <ul v-else-if="day && day.lines.length" class="list">
      <li v-for="line in day.lines" :key="line.itemId">
        <button
          type="button"
          class="row"
          :class="{ done: line.checked, locked: isFuture }"
          :disabled="isFuture"
          @click="onToggle(line.itemId)"
        >
          <span class="check" :class="{ on: line.checked }" aria-hidden="true">
            <svg
              v-if="line.checked"
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
          <span class="title">{{ line.title }}</span>
        </button>
      </li>
    </ul>
  </BottomSheet>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.titles {
  min-width: 0;
}

.name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--color-text-primary);
}

.sub {
  margin: 6px 0 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.hint,
.empty {
  margin: 0;
  font-size: var(--type-body);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.empty-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding-bottom: 4px;
}

.add-cta {
  height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  font-weight: 600;
}

.add-cta:active {
  opacity: 0.88;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0 0 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-surface-3);
  text-align: left;
  color: var(--color-text-primary);
}

.row:not(:disabled):active {
  opacity: 0.9;
}

.row.locked {
  opacity: 0.72;
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
}

.title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.0625rem;
}

.row.done .title {
  color: var(--color-text-disabled);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}
</style>
