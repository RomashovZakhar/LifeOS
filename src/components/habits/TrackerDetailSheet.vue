<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CompletionEntrySheet from '@/components/habits/CompletionEntrySheet.vue'
import ConfirmDeleteSheet from '@/components/habits/ConfirmDeleteSheet.vue'
import HistoryHeatmap from '@/components/habits/HistoryHeatmap.vue'
import NewTrackerSheet from '@/components/habits/NewTrackerSheet.vue'
import NumericEntrySheet from '@/components/habits/NumericEntrySheet.vue'
import TimeEntrySheet from '@/components/habits/TimeEntrySheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import ChipSelect from '@/components/ui/ChipSelect.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import {
  db,
  deleteTrackerCascade,
  filterEntriesInRange,
  todayDate,
  type Entry,
  type Tracker,
} from '@/db'
import { cellTextForTracker } from '@/lib/cellDisplay'
import {
  boundsForRange,
  formatCreatedRu,
  formatHistoryDayRu,
  monthSectionTitle,
  type DetailRange,
} from '@/lib/detailRange'
import {
  isOrdinaryTrackerType,
  trackerTypeBadge,
} from '@/lib/trackerLabels'

const props = defineProps<{ trackerId: string }>()

const emit = defineEmits<{
  close: []
  deleted: []
}>()

const range = ref<DetailRange>('week')
const showEdit = ref(false)
const showDelete = ref(false)
const entryTarget = ref<{ tracker: Tracker; date: string } | null>(null)

const RANGE_OPTIONS: { value: DetailRange; label: string }[] = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
  { value: 'all', label: 'Всё время' },
]

const tracker = useLiveQuery(
  async () => (await db.trackers.get(props.trackerId)) ?? null,
  undefined as Tracker | null | undefined,
  () => props.trackerId,
)

const allEntries = useLiveQuery(
  () => db.entries.where('trackerId').equals(props.trackerId).toArray(),
  [] as Entry[],
  () => props.trackerId,
)

watch(
  tracker,
  (t) => {
    if (t === undefined) return
    if (t === null || !isOrdinaryTrackerType(t.type)) {
      emit('close')
    }
  },
  { immediate: true },
)

const today = todayDate()

const bounds = computed(() =>
  boundsForRange(range.value, today, tracker.value?.createdAt),
)

const rangedEntries = computed(() =>
  filterEntriesInRange(allEntries.value, bounds.value.from, bounds.value.to),
)

const entryCount = computed(() => rangedEntries.value.length)

const filledDates = computed(() => {
  const s = new Set<string>()
  for (const e of allEntries.value) s.add(e.date)
  return s
})

interface HistoryGroup {
  title: string
  countLabel: string
  rows: { entry: Entry; label: string; value: string }[]
}

const historyGroups = computed((): HistoryGroup[] => {
  const t = tracker.value
  if (!t || !isOrdinaryTrackerType(t.type)) return []
  const groups = new Map<string, Entry[]>()
  for (const e of rangedEntries.value) {
    const key = e.date.slice(0, 7)
    const list = groups.get(key) ?? []
    list.push(e)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([, entries]) => {
    const title = monthSectionTitle(entries[0].date)
    const n = entries.length
    return {
      title,
      countLabel: entriesCountLabel(n),
      rows: entries.map((entry) => ({
        entry,
        label: formatHistoryDayRu(entry.date),
        value: cellTextForTracker(t, entry.date, entry, undefined, undefined),
      })),
    }
  })
})

function entriesCountLabel(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} ЗАПИСЬ`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} ЗАПИСИ`
  }
  return `${n} ЗАПИСЕЙ`
}

function openEntry(date: string) {
  const t = tracker.value
  if (!t || !isOrdinaryTrackerType(t.type)) return
  if (date > today) return
  entryTarget.value = { tracker: t, date }
}

function closeEntry() {
  entryTarget.value = null
}

async function onDeleteConfirm() {
  await deleteTrackerCascade(props.trackerId)
  showDelete.value = false
  emit('deleted')
}

const entryType = computed(() => entryTarget.value?.tracker.type)
</script>

<template>
  <BottomSheet
    v-if="tracker && isOrdinaryTrackerType(tracker.type)"
    size="tall"
    :aria-label="tracker.name"
    @close="emit('close')"
  >
    <template #header>
      <header class="head">
        <h1 class="title">{{ tracker.name }}</h1>
        <CloseButton />
      </header>
    </template>

    <dl class="meta">
      <div class="meta-row">
        <dt>Symbol</dt>
        <dd class="mono">{{ tracker.symbol }}</dd>
      </div>
      <div class="meta-row">
        <dt>Тип</dt>
        <dd>
          <span class="badge">{{ trackerTypeBadge(tracker.type) }}</span>
        </dd>
      </div>
      <div class="meta-row">
        <dt>Создано</dt>
        <dd>{{ formatCreatedRu(tracker.createdAt) }}</dd>
      </div>
    </dl>

    <div class="ranges-wrap">
      <ChipSelect
        v-model="range"
        variant="fill"
        :options="RANGE_OPTIONS"
      />
    </div>

    <section class="stat" aria-label="Записи">
      <p class="stat-label">ЗАПИСИ</p>
      <p class="stat-value mono">{{ entryCount }}</p>
    </section>

    <section class="history">
      <h2 class="section-title">История</h2>
      <HistoryHeatmap
        :filled-dates="filledDates"
        :today="today"
        @select-date="openEntry"
      />

      <div v-for="g in historyGroups" :key="g.title" class="group">
        <div class="group-head">
          <span class="group-title">{{ g.title }}</span>
          <span class="group-count">{{ g.countLabel }}</span>
        </div>
        <ul class="rows">
          <li v-for="row in g.rows" :key="row.entry.id">
            <button type="button" class="row" @click="openEntry(row.entry.date)">
              <span class="check" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7.2L5.6 10.2L11.5 3.8"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="row-date">{{ row.label }}</span>
              <span
                v-if="tracker.type !== 'completion'"
                class="row-value mono"
              >{{ row.value }}</span>
            </button>
          </li>
        </ul>
      </div>
    </section>

    <template #footer>
      <div class="actions">
        <button type="button" class="edit" @click="showEdit = true">
          ИЗМЕНИТЬ
        </button>
        <button type="button" class="delete" @click="showDelete = true">
          УДАЛИТЬ
        </button>
      </div>
    </template>
  </BottomSheet>

  <NewTrackerSheet
    v-if="showEdit && tracker"
    :tracker="tracker"
    @close="showEdit = false"
    @saved="showEdit = false"
  />

  <ConfirmDeleteSheet
    v-if="showDelete"
    @close="showDelete = false"
    @confirm="onDeleteConfirm"
  />

  <CompletionEntrySheet
    v-if="entryTarget && entryType === 'completion'"
    :tracker="entryTarget.tracker"
    :date="entryTarget.date"
    @close="closeEntry"
    @saved="closeEntry"
  />
  <TimeEntrySheet
    v-else-if="entryTarget && entryType === 'time'"
    :tracker="entryTarget.tracker"
    :date="entryTarget.date"
    @close="closeEntry"
    @saved="closeEntry"
  />
  <NumericEntrySheet
    v-else-if="
      entryTarget &&
      (entryType === 'count' ||
        entryType === 'distance' ||
        entryType === 'weight')
    "
    :tracker="entryTarget.tracker"
    :date="entryTarget.date"
    @close="closeEntry"
    @saved="closeEntry"
  />
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: clamp(1.75rem, 7vw, 2.25rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--color-text-primary);
}

.meta {
  margin: 16px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
}

.meta-row dt {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.meta-row dd {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
}

.badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--color-surface-3);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.ranges-wrap {
  margin-top: 20px;
  flex-shrink: 0;
}

.stat {
  margin-top: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  background: var(--color-surface-3);
}

.stat-label {
  margin: 0 0 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

.stat-value {
  margin: 0;
  font-size: 3rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--color-text-primary);
}

.history {
  margin-top: 22px;
  padding-bottom: 8px;
}

.section-title {
  margin: 0 0 14px;
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--color-text-primary);
}

.group {
  margin-top: 22px;
}

.group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.group-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.group-count {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-surface-3);
  text-align: left;
  color: var(--color-text-primary);
}

.row:active {
  opacity: 0.9;
}

.check {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  color: var(--color-text-secondary);
}

.row-date {
  flex: 1 1 auto;
  font-size: 0.9375rem;
}

.row-value {
  flex: 0 0 auto;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.actions {
  display: flex;
  gap: 10px;
}

.edit,
.delete {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-md);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.edit {
  background: var(--color-surface-3);
  color: var(--color-text-primary);
}

.delete {
  background: var(--color-danger-bg);
  color: var(--color-danger-fg);
}

.edit:active,
.delete:active {
  opacity: 0.88;
}
</style>
