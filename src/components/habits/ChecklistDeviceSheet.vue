<script setup lang="ts">
import Sortable from 'sortablejs'
import { computed, inject, onUnmounted, ref, watch } from 'vue'
import ChecklistDaySheet from '@/components/habits/ChecklistDaySheet.vue'
import ConfirmDeleteSheet from '@/components/habits/ConfirmDeleteSheet.vue'
import HistoryHeatmap from '@/components/habits/HistoryHeatmap.vue'
import NewTrackerSheet from '@/components/habits/NewTrackerSheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import ChipSelect from '@/components/ui/ChipSelect.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import { SHEET_DISMISS_LOCK_KEY } from '@/composables/sheetDismissLock'
import { useLiveQuery } from '@/composables/useLiveQuery'
import {
  checklistDayPercent,
  createChecklistItem,
  daysWithProgress,
  deleteChecklistItem,
  deleteTrackerCascade,
  filterDaysInRange,
  renameChecklistItem,
  reorderChecklistItems,
  todayDate,
  type ChecklistDay,
  type ChecklistItem,
  type Tracker,
  db,
} from '@/db'
import { badgeMonthRu, dayNumberFromDate } from '@/lib/calendar'
import {
  boundsForRange,
  formatCreatedRu,
  monthSectionTitle,
  type DetailRange,
} from '@/lib/detailRange'

const props = defineProps<{ trackerId: string }>()

const emit = defineEmits<{
  close: []
  deleted: []
}>()

const range = ref<DetailRange>('week')
const showEdit = ref(false)
const showDelete = ref(false)
const showAddItem = ref(false)
const renameTarget = ref<ChecklistItem | null>(null)
const deleteItemTarget = ref<ChecklistItem | null>(null)
const dayTarget = ref<string | null>(null)
const itemDraft = ref('')

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

const items = useLiveQuery(
  () =>
    db.checklist_items
      .where('trackerId')
      .equals(props.trackerId)
      .sortBy('sortOrder'),
  [] as ChecklistItem[],
  () => props.trackerId,
)

const allDays = useLiveQuery(
  () => db.checklist_days.where('trackerId').equals(props.trackerId).toArray(),
  [] as ChecklistDay[],
  () => props.trackerId,
)

watch(
  tracker,
  (t) => {
    if (t === undefined) return
    if (t === null || t.type !== 'checklist') {
      emit('close')
    }
  },
  { immediate: true },
)

const today = todayDate()

const bounds = computed(() =>
  boundsForRange(range.value, today, tracker.value?.createdAt),
)

const progressDays = computed(() =>
  daysWithProgress(
    filterDaysInRange(allDays.value, bounds.value.from, bounds.value.to),
  ),
)

const dayCount = computed(() => progressDays.value.length)

const filledDates = computed(() => {
  const s = new Set<string>()
  for (const d of daysWithProgress(allDays.value)) s.add(d.date)
  return s
})

interface HistoryGroup {
  title: string
  countLabel: string
  rows: { date: string; label: string; value: string }[]
}

function formatDayShort(date: string): string {
  const day = dayNumberFromDate(date)
  return `${day} ${badgeMonthRu(date).toLowerCase()}`
}

function daysCountLabel(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} ДЕНЬ`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} ДНЯ`
  }
  return `${n} ДНЕЙ`
}

const historyGroups = computed((): HistoryGroup[] => {
  const groups = new Map<string, ChecklistDay[]>()
  for (const d of progressDays.value) {
    const key = d.date.slice(0, 7)
    const list = groups.get(key) ?? []
    list.push(d)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([, days]) => {
    const title = monthSectionTitle(days[0].date)
    return {
      title,
      countLabel: daysCountLabel(days.length),
      rows: days.map((d) => {
        const pct = checklistDayPercent(d)
        return {
          date: d.date,
          label: formatDayShort(d.date),
          value: pct != null ? `${pct}%` : '·',
        }
      }),
    }
  })
})

function openDay(date: string) {
  if (date > today) return
  dayTarget.value = date
}

function closeDay() {
  dayTarget.value = null
}

async function onDeleteConfirm() {
  await deleteTrackerCascade(props.trackerId)
  showDelete.value = false
  emit('deleted')
}

function openAddItem() {
  itemDraft.value = ''
  showAddItem.value = true
}

function openRename(item: ChecklistItem) {
  itemDraft.value = item.title
  renameTarget.value = item
}

async function submitAddItem() {
  const title = itemDraft.value.trim()
  if (!title) return
  await createChecklistItem(props.trackerId, title)
  showAddItem.value = false
  itemDraft.value = ''
}

async function submitRename() {
  const target = renameTarget.value
  const title = itemDraft.value.trim()
  if (!target || !title) return
  await renameChecklistItem(target.id, title)
  renameTarget.value = null
  itemDraft.value = ''
}

async function confirmDeleteItem() {
  const target = deleteItemTarget.value
  if (!target) return
  await deleteChecklistItem(target.id)
  deleteItemTarget.value = null
}

/* ── SortableJS reorder (touch/PWA) ── */
const dismissLock = inject(SHEET_DISMISS_LOCK_KEY, null)
const listEl = ref<HTMLElement | null>(null)
const localItems = ref<ChecklistItem[]>([])
const sorting = ref(false)
let sortable: Sortable | null = null

watch(
  items,
  (list) => {
    if (sorting.value) return
    localItems.value = list.map((i) => ({ ...i }))
  },
  { immediate: true },
)

function destroySortable() {
  sortable?.destroy()
  sortable = null
}

function createSortable(el: HTMLElement) {
  destroySortable()
  sortable = Sortable.create(el, {
    animation: 200,
    handle: '.handle',
    ghostClass: 'item-ghost',
    chosenClass: 'item-chosen',
    dragClass: 'item-drag',
    forceFallback: true,
    fallbackOnBody: true,
    fallbackClass: 'item-fallback',
    fallbackTolerance: 4,
    touchStartThreshold: 5,
    direction: 'vertical',
    onStart: () => {
      sorting.value = true
      dismissLock?.lock()
    },
    onEnd: async (evt) => {
      dismissLock?.unlock()
      const { oldIndex, newIndex } = evt
      if (
        oldIndex == null ||
        newIndex == null ||
        oldIndex === newIndex
      ) {
        sorting.value = false
        return
      }
      const next = [...localItems.value]
      const [moved] = next.splice(oldIndex, 1)
      if (!moved) {
        sorting.value = false
        return
      }
      next.splice(newIndex, 0, moved)
      localItems.value = next
      try {
        await reorderChecklistItems(
          props.trackerId,
          next.map((i) => i.id),
        )
      } finally {
        sorting.value = false
      }
    },
  })
}

watch(
  listEl,
  (el) => {
    if (el) createSortable(el)
    else destroySortable()
  },
  { flush: 'post' },
)

onUnmounted(() => {
  dismissLock?.unlock()
  destroySortable()
})
</script>

<template>
  <BottomSheet
    v-if="tracker && tracker.type === 'checklist'"
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
          <span class="badge">ЧЕКЛИСТ</span>
        </dd>
      </div>
      <div class="meta-row">
        <dt>Создано</dt>
        <dd>{{ formatCreatedRu(tracker.createdAt) }}</dd>
      </div>
    </dl>

    <section class="items">
      <h2 class="section-title">Пункты</h2>
      <p v-if="localItems.length === 0" class="empty-items">
        Добавьте пункты
      </p>
      <ul v-else ref="listEl" class="item-list">
        <li
          v-for="item in localItems"
          :key="item.id"
          class="item"
          :data-id="item.id"
        >
          <button type="button" class="handle" aria-label="Перетащить">
            ≡
          </button>
          <button type="button" class="item-title" @click="openRename(item)">
            {{ item.title }}
          </button>
          <button
            type="button"
            class="item-del"
            aria-label="Удалить пункт"
            @click="deleteItemTarget = item"
          >
            ✕
          </button>
        </li>
      </ul>
      <button type="button" class="add-item" @click="openAddItem">
        + Пункт
      </button>
    </section>

    <div class="ranges-wrap">
      <ChipSelect v-model="range" variant="fill" :options="RANGE_OPTIONS" />
    </div>

    <section class="stat" aria-label="Дни">
      <p class="stat-label">ДНИ</p>
      <p class="stat-value mono">{{ dayCount }}</p>
    </section>

    <section class="history">
      <h2 class="section-title">История</h2>
      <HistoryHeatmap
        :filled-dates="filledDates"
        :today="today"
        @select-date="openDay"
      />

      <div v-for="g in historyGroups" :key="g.title" class="group">
        <div class="group-head">
          <span class="group-title">{{ g.title }}</span>
          <span class="group-count">{{ g.countLabel }}</span>
        </div>
        <ul class="rows">
          <li v-for="row in g.rows" :key="row.date">
            <button type="button" class="row" @click="openDay(row.date)">
              <span class="row-date">{{ row.label }}</span>
              <span class="row-value mono">{{ row.value }}</span>
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
    title="Удалить чеклист и историю?"
    body="Чеклист, пункты и дни будут удалены. Это нельзя отменить."
    @close="showDelete = false"
    @confirm="onDeleteConfirm"
  />

  <ConfirmDeleteSheet
    v-if="deleteItemTarget"
    title="Удалить пункт?"
    body="Пункт исчезнет из определения. Прошлые дни со снимками сохранятся."
    confirm-label="УДАЛИТЬ ПУНКТ"
    @close="deleteItemTarget = null"
    @confirm="confirmDeleteItem"
  />

  <BottomSheet
    v-if="showAddItem"
    size="auto"
    title="Пункт"
    @close="showAddItem = false"
  >
    <label class="field">
      <span class="field-label">Название</span>
      <input
        v-model="itemDraft"
        class="field-input"
        type="text"
        maxlength="80"
        placeholder="Вода"
        enterkeyhint="done"
        @keydown.enter.prevent="submitAddItem"
      />
    </label>
    <template #footer>
      <button
        type="button"
        class="save"
        :disabled="!itemDraft.trim()"
        @click="submitAddItem"
      >
        ДОБАВИТЬ
      </button>
    </template>
  </BottomSheet>

  <BottomSheet
    v-if="renameTarget"
    size="auto"
    title="Пункт"
    @close="renameTarget = null"
  >
    <label class="field">
      <span class="field-label">Название</span>
      <input
        v-model="itemDraft"
        class="field-input"
        type="text"
        maxlength="80"
        enterkeyhint="done"
        @keydown.enter.prevent="submitRename"
      />
    </label>
    <template #footer>
      <button
        type="button"
        class="save"
        :disabled="!itemDraft.trim()"
        @click="submitRename"
      >
        СОХРАНИТЬ
      </button>
    </template>
  </BottomSheet>

  <ChecklistDaySheet
    v-if="dayTarget"
    :tracker-id="trackerId"
    :date="dayTarget"
    @close="closeDay"
    @open-device="closeDay"
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

.items {
  margin-top: 22px;
  padding-bottom: 4px;
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

.row-date {
  flex: 1 1 auto;
  font-size: 0.9375rem;
}

.row-value {
  flex: 0 0 auto;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.empty-items {
  margin: 0 0 12px;
  font-size: var(--type-body);
  color: var(--color-text-secondary);
}

.item-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 48px;
  padding: 4px 6px 4px 4px;
  border-radius: 12px;
  background: var(--color-surface-3);
  position: relative;
}

.item-ghost {
  opacity: 0.35;
}

.item-chosen {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

.item-drag,
.item-fallback {
  opacity: 1;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  outline: 1px solid
    color-mix(in srgb, var(--color-text-secondary) 40%, transparent);
}

.handle {
  flex: 0 0 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-size: 1.125rem;
  line-height: 1;
  color: var(--color-text-secondary);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.item-title {
  flex: 1 1 auto;
  min-width: 0;
  padding: 10px 8px;
  text-align: left;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.item-del {
  flex: 0 0 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.add-item {
  width: 100%;
  min-height: 48px;
  border-radius: 12px;
  border: 1px dashed color-mix(in srgb, var(--color-text-secondary) 45%, transparent);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-weight: 600;
}

.add-item:active {
  opacity: 0.85;
}

.actions {
  display: flex;
  gap: 10px;
}

.edit,
.delete,
.save {
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

.save {
  width: 100%;
  background: var(--color-text-primary);
  color: var(--color-bg);
}

.save:disabled {
  opacity: 0.4;
}

.edit:active,
.delete:active,
.save:active {
  opacity: 0.88;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.field-input {
  height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.0625rem;
  border: none;
  outline: none;
}
</style>
