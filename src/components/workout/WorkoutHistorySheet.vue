<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ConfirmDeleteSheet from "@/components/habits/ConfirmDeleteSheet.vue";
import HistoryHeatmap from "@/components/habits/HistoryHeatmap.vue";
import NewTrackerSheet from "@/components/habits/NewTrackerSheet.vue";
import BottomSheet from "@/components/ui/BottomSheet.vue";
import ChipSelect from "@/components/ui/ChipSelect.vue";
import CloseButton from "@/components/ui/CloseButton.vue";
import WorkoutExerciseCatalogSheet from "@/components/workout/WorkoutExerciseCatalogSheet.vue";
import WorkoutTemplatesSheet from "@/components/workout/WorkoutTemplatesSheet.vue";
import { useLiveQuery } from "@/composables/useLiveQuery";
import {
  db,
  deleteTrackerCascade,
  todayDate,
  type Tracker,
  type WorkoutSession,
} from "@/db";
import {
  boundsForRange,
  formatCreatedRu,
  formatHistoryDayRu,
  monthSectionTitle,
  type DetailRange,
} from "@/lib/detailRange";
import { formatDurationMinSec } from "@/lib/workoutFormat";

const props = defineProps<{
  trackerId: string;
}>();

const emit = defineEmits<{
  close: [];
  deleted: [];
  openDay: [date: string];
}>();

const range = ref<DetailRange>("month");
const showEdit = ref(false);
const showDelete = ref(false);
const showPrograms = ref(false);
const showCatalog = ref(false);

const RANGE_OPTIONS: { value: DetailRange; label: string }[] = [
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
  { value: "all", label: "Всё время" },
];

const tracker = useLiveQuery(
  async () => (await db.trackers.get(props.trackerId)) ?? null,
  undefined as Tracker | null | undefined,
  () => props.trackerId,
);

const allSessions = useLiveQuery(
  () => db.workout_sessions.where("status").equals("completed").toArray(),
  [] as WorkoutSession[],
);

watch(
  tracker,
  (t) => {
    if (t === undefined) return;
    if (t === null || t.type !== "workout_portal") emit("close");
  },
  { immediate: true },
);

const today = todayDate();

const bounds = computed(() =>
  boundsForRange(range.value, today, tracker.value?.createdAt),
);

const rangedSessions = computed(() => {
  const { from, to } = bounds.value;
  return allSessions.value
    .filter((s) => s.date >= from && s.date <= to)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
});

const workoutCount = computed(() => rangedSessions.value.length);

const totalSeconds = computed(() =>
  rangedSessions.value.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0),
);

const filledDates = computed(() => {
  const s = new Set<string>();
  for (const sess of allSessions.value) s.add(sess.date);
  return s;
});

interface HistoryGroup {
  title: string;
  countLabel: string;
  rows: { date: string; label: string; value: string }[];
}

const historyGroups = computed((): HistoryGroup[] => {
  const groups = new Map<string, WorkoutSession[]>();
  for (const s of rangedSessions.value) {
    const key = s.date.slice(0, 7);
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([, sessions]) => {
    const title = monthSectionTitle(sessions[0].date);
    const n = sessions.length;
    return {
      title,
      countLabel: workoutsCountLabel(n),
      rows: sessions.map((s) => ({
        date: s.date,
        label: formatHistoryDayRu(s.date),
        value:
          s.durationSeconds != null
            ? formatDurationMinSec(s.durationSeconds)
            : "·",
      })),
    };
  });
});

function workoutsCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ТРЕНИРОВКА`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} ТРЕНИРОВКИ`;
  }
  return `${n} ТРЕНИРОВОК`;
}

function openDay(date: string) {
  if (date > today) return;
  emit("openDay", date);
}

async function onDeleteConfirm() {
  await deleteTrackerCascade(props.trackerId);
  showDelete.value = false;
  emit("deleted");
}
</script>

<template>
  <BottomSheet
    v-if="tracker && tracker.type === 'workout_portal'"
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
        <dd><span class="badge">ТРЕНИРОВКА</span></dd>
      </div>
      <div class="meta-row">
        <dt>Создано</dt>
        <dd>{{ formatCreatedRu(tracker.createdAt) }}</dd>
      </div>
    </dl>

    <div class="ranges-wrap">
      <ChipSelect v-model="range" variant="fill" :options="RANGE_OPTIONS" />
    </div>

    <section class="stat" aria-label="Тренировки">
      <p class="stat-label">ТРЕНИРОВКИ</p>
      <p class="stat-value mono">{{ workoutCount }}</p>
    </section>

    <section v-if="totalSeconds > 0" class="stat secondary" aria-label="Время">
      <p class="stat-label">ОБЩЕЕ ВРЕМЯ</p>
      <p class="stat-value sm mono">{{ formatDurationMinSec(totalSeconds) }}</p>
    </section>

    <section class="nav" aria-label="Программы и каталог">
      <button type="button" class="nav-row" @click="showPrograms = true">
        <span>Программы</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
      <button type="button" class="nav-row" @click="showCatalog = true">
        <span>Каталог упражнений</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
    </section>

    <section class="history">
      <h2 class="section-title">История</h2>
      <HistoryHeatmap
        :filled-dates="filledDates"
        :today="today"
        @select-date="openDay"
      />

      <p v-if="rangedSessions.length === 0" class="empty">
        Пока нет завершённых тренировок
      </p>

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
    :layer="80"
    @close="showEdit = false"
    @saved="showEdit = false"
  />

  <ConfirmDeleteSheet
    v-if="showDelete"
    title="Удалить колонку тренировки?"
    body="Удалятся все тренировки. Каталог упражнений и программы останутся."
    @close="showDelete = false"
    @confirm="onDeleteConfirm"
  />

  <WorkoutTemplatesSheet
    v-if="showPrograms"
    :date="today"
    mode="manage"
    @close="showPrograms = false"
  />

  <WorkoutExerciseCatalogSheet
    v-if="showCatalog"
    @close="showCatalog = false"
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
}

.stat {
  margin-top: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  background: var(--color-surface-3);
}

.stat.secondary {
  margin-top: 10px;
  padding: 14px 20px;
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

.stat-value.sm {
  font-size: 2rem;
}

.nav {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-surface-1);
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 14px 16px;
  text-align: left;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 0.9375rem;
}

.nav-row:active {
  opacity: 0.92;
}

.chev {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  line-height: 1;
}

.history {
  margin-top: 22px;
  padding-bottom: 8px;
}

.section-title {
  margin: 0 0 14px;
  font-size: 1.25rem;
  font-weight: 400;
}

.empty {
  margin: 16px 0 0;
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
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
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-surface-3);
  text-align: left;
  color: var(--color-text-primary);
}

.row-date {
  font-size: 0.9375rem;
}

.row-value {
  font-size: 0.9375rem;
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
</style>
