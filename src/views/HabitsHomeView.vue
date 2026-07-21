<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BottomDock from "@/components/habits/BottomDock.vue";
import ChecklistDaySheet from "@/components/habits/ChecklistDaySheet.vue";
import ChecklistDeviceSheet from "@/components/habits/ChecklistDeviceSheet.vue";
import CompletionEntrySheet from "@/components/habits/CompletionEntrySheet.vue";
import MonthGrid from "@/components/habits/MonthGrid.vue";
import MonthYearTitle from "@/components/habits/MonthYearTitle.vue";
import NewTrackerSheet from "@/components/habits/NewTrackerSheet.vue";
import NumericEntrySheet from "@/components/habits/NumericEntrySheet.vue";
import TimeEntrySheet from "@/components/habits/TimeEntrySheet.vue";
import TodayPanel from "@/components/habits/TodayPanel.vue";
import TrackerDetailSheet from "@/components/habits/TrackerDetailSheet.vue";
import WorkoutHistorySheet from "@/components/workout/WorkoutHistorySheet.vue";
import WorkoutSessionSheet from "@/components/workout/WorkoutSessionSheet.vue";
import { useLiveQuery } from "@/composables/useLiveQuery";
import {
  db,
  monthFromDate,
  setViewState,
  todayDate as todayDateFn,
  toggleCompletionEntry,
  type ChecklistDay,
  type Entry,
  type Tracker,
  type WorkoutSession,
} from "@/db";
import { useSettingsStore } from "@/stores/settings";
import {
  buildMonthDays,
  clampDayInMonth,
  dayNumberFromDate,
  isDateInMonth,
  isFutureDate,
  monthTitleParts,
  shiftMonth,
} from "@/lib/calendar";
import { cellTextForTracker } from "@/lib/cellDisplay";

const router = useRouter();
const route = useRoute();
const settings = useSettingsStore();

const showNewTracker = ref(false);
const todayOpen = ref(false);
const futureHintFlash = ref(false);
const entryTarget = ref<{ tracker: Tracker; date: string } | null>(null);
const checklistDayTarget = ref<{ trackerId: string; date: string } | null>(
  null,
);

const today = todayDateFn();
const viewedMonth = ref(settings.lastViewedMonth || monthFromDate(today));
const selectedDate = ref(
  settings.lastSelectedDate &&
    isDateInMonth(settings.lastSelectedDate, viewedMonth.value)
    ? settings.lastSelectedDate
    : isDateInMonth(today, viewedMonth.value)
      ? today
      : clampDayInMonth(viewedMonth.value, 1),
);

const title = computed(() => monthTitleParts(viewedMonth.value));
const days = computed(() => buildMonthDays(viewedMonth.value));

const trackers = useLiveQuery(
  () => db.trackers.orderBy("sortOrder").toArray(),
  [] as Tracker[],
);

const monthEntries = useLiveQuery(
  () =>
    db.entries
      .where("date")
      .between(`${viewedMonth.value}-01`, `${viewedMonth.value}-31`, true, true)
      .toArray(),
  [] as Entry[],
  () => viewedMonth.value,
);

const monthSessions = useLiveQuery(
  () =>
    db.workout_sessions
      .where("date")
      .between(`${viewedMonth.value}-01`, `${viewedMonth.value}-31`, true, true)
      .toArray(),
  [] as WorkoutSession[],
  () => viewedMonth.value,
);

const monthChecklistDays = useLiveQuery(
  () =>
    db.checklist_days
      .where("date")
      .between(`${viewedMonth.value}-01`, `${viewedMonth.value}-31`, true, true)
      .toArray(),
  [] as ChecklistDay[],
  () => viewedMonth.value,
);

const entryMap = computed(() => {
  const m = new Map<string, Entry>();
  for (const e of monthEntries.value) m.set(`${e.trackerId}|${e.date}`, e);
  return m;
});

const sessionByDate = computed(() => {
  const m = new Map<string, WorkoutSession>();
  for (const s of monthSessions.value) m.set(s.date, s);
  return m;
});

const checklistMap = computed(() => {
  const m = new Map<string, ChecklistDay>();
  for (const d of monthChecklistDays.value)
    m.set(`${d.trackerId}|${d.date}`, d);
  return m;
});

function cellText(trackerId: string, date: string): string {
  const tracker = trackers.value.find((t) => t.id === trackerId);
  if (!tracker) return "·";
  return cellTextForTracker(
    tracker,
    date,
    entryMap.value.get(`${trackerId}|${date}`),
    sessionByDate.value.get(date),
    checklistMap.value.get(`${trackerId}|${date}`),
  );
}

watch([viewedMonth, selectedDate], ([month, date]) => {
  settings.lastViewedMonth = month;
  settings.lastSelectedDate = date;
  void setViewState(month, date);
});

watch(
  () => route.query.new,
  (v) => {
    if (v != null && v !== "") showNewTracker.value = true;
  },
  { immediate: true },
);

function openNewTracker() {
  showNewTracker.value = true;
}

function closeNewTracker() {
  showNewTracker.value = false;
  if (route.query.new != null) {
    const q = { ...route.query };
    delete q.new;
    void router.replace({ path: "/", query: q });
  }
}

const detailTrackerId = computed(() => {
  const v = route.query.detail;
  return typeof v === "string" && v ? v : null;
});

/** Kind from already-loaded trackers — avoid stale liveQuery null closing the sheet. */
const detailKind = computed(() => {
  const id = detailTrackerId.value;
  if (!id) return null;
  const t = trackers.value.find((x) => x.id === id);
  if (!t) return "loading" as const;
  if (t.type === "checklist") return "checklist" as const;
  if (t.type === "workout_portal") return "portal" as const;
  return "ordinary" as const;
});

watch(detailTrackerId, async (id) => {
  if (!id) return;
  const t = await db.trackers.get(id);
  if (!t) closeDetail();
});

function openDetail(trackerId: string) {
  void router.push({
    path: "/",
    query: { ...route.query, detail: trackerId },
  });
}

function closeDetail() {
  const q = { ...route.query };
  delete q.detail;
  void router.replace({ path: "/", query: q });
}

const workoutDate = computed(() => {
  const v = route.query.workout;
  return typeof v === "string" && v ? v : null;
});

function openWorkout(date: string) {
  closeToday();
  const q = { ...route.query };
  delete q.detail;
  q.workout = date;
  void router.push({ path: "/", query: q });
}

function closeWorkout() {
  const q = { ...route.query };
  delete q.workout;
  void router.replace({ path: "/", query: q });
}

function openWorkoutFromHistory(date: string) {
  closeDetail();
  openWorkout(date);
}

function openToday() {
  todayOpen.value = true;
}

function closeToday() {
  todayOpen.value = false;
}

function goMonth(delta: number) {
  const next = shiftMonth(viewedMonth.value, delta);
  const dayNum = dayNumberFromDate(selectedDate.value);
  viewedMonth.value = next;
  selectedDate.value = clampDayInMonth(next, dayNum);
}

function goToday() {
  viewedMonth.value = monthFromDate(today);
  selectedDate.value = today;
  openToday();
}

function onSelectDate(date: string) {
  selectedDate.value = date;
  openToday();
}

function onOpenSymbol(tracker: Tracker) {
  openDetail(tracker.id);
}

function openChecklistDay(trackerId: string, date: string) {
  checklistDayTarget.value = { trackerId, date };
}

function closeChecklistDay() {
  checklistDayTarget.value = null;
}

function openDeviceFromDay() {
  const id = checklistDayTarget.value?.trackerId;
  closeChecklistDay();
  if (id) openDetail(id);
}

function openEntrySheet(tracker: Tracker, date: string) {
  entryTarget.value = { tracker, date };
}

function closeEntrySheet() {
  entryTarget.value = null;
}

function onOpenCell(payload: { tracker: Tracker; date: string }) {
  selectedDate.value = payload.date;

  if (isFutureDate(payload.date, today)) {
    openToday();
    flashFutureHint();
    return;
  }

  if (payload.tracker.type === "workout_portal") {
    openWorkout(payload.date);
    return;
  }
  if (payload.tracker.type === "checklist") {
    openChecklistDay(payload.tracker.id, payload.date);
    return;
  }

  openEntrySheet(payload.tracker, payload.date);
}

async function onToggleCompletion(tracker: Tracker) {
  if (isFutureDate(selectedDate.value, today)) {
    flashFutureHint();
    return;
  }
  await toggleCompletionEntry(tracker.id, selectedDate.value);
}

function onOpenFromToday(tracker: Tracker) {
  if (isFutureDate(selectedDate.value, today)) {
    flashFutureHint();
    return;
  }
  if (tracker.type === "workout_portal") {
    openWorkout(selectedDate.value);
    return;
  }
  if (tracker.type === "checklist") {
    openChecklistDay(tracker.id, selectedDate.value);
    return;
  }
  openEntrySheet(tracker, selectedDate.value);
}

function flashFutureHint() {
  futureHintFlash.value = true;
  window.setTimeout(() => {
    futureHintFlash.value = false;
  }, 1800);
}

const entryTracker = computed(() => entryTarget.value?.tracker ?? null);
const entryDate = computed(() => entryTarget.value?.date ?? "");
const entryType = computed(() => entryTracker.value?.type);

/** Real Today panel height → scroll content inset (viewport stays full). */
const todayWrap = ref<HTMLElement | null>(null);
const todayInsetPx = ref(0);
let todayRo: ResizeObserver | undefined;

watch(todayWrap, (el) => {
  todayRo?.disconnect();
  todayRo = undefined;
  if (!el) {
    todayInsetPx.value = 0;
    return;
  }
  const measure = () => {
    todayInsetPx.value = Math.round(el.getBoundingClientRect().height);
  };
  todayRo = new ResizeObserver(measure);
  todayRo.observe(el);
  measure();
});

onUnmounted(() => {
  todayRo?.disconnect();
});
</script>

<template>
  <div class="home">
    <header class="top">
      <MonthYearTitle :name="title.name" :year="title.year" />
    </header>

    <MonthGrid
      class="grid"
      :days="days"
      :trackers="trackers"
      :selected-date="selectedDate"
      :today-date="today"
      :cell-text="cellText"
      :highlight-selected="todayOpen"
      :bottom-inset="todayOpen ? todayInsetPx : 0"
      @select-date="onSelectDate"
      @open-symbol="onOpenSymbol"
      @open-cell="onOpenCell"
      @dismiss="closeToday"
    />

    <div v-if="todayOpen" ref="todayWrap" class="today-layer">
      <TodayPanel
        class="today"
        :date="selectedDate"
        :today-date="today"
        :trackers="trackers"
        :entry-map="entryMap"
        :session-by-date="sessionByDate"
        :checklist-map="checklistMap"
        @close="closeToday"
        @toggle-completion="onToggleCompletion"
        @open-tracker="onOpenFromToday"
        @future-hint="flashFutureHint"
      />
    </div>

    <p v-if="futureHintFlash && !todayOpen" class="toast">
      Нельзя отметить будущий день
    </p>

    <footer v-if="!todayOpen" class="bottom">
      <BottomDock
        @prev-month="goMonth(-1)"
        @next-month="goMonth(1)"
        @today="goToday"
        @add="openNewTracker"
        @more="router.push('/settings')"
      />
    </footer>

    <ChecklistDeviceSheet
      v-if="detailKind === 'checklist' && detailTrackerId"
      :tracker-id="detailTrackerId"
      @close="closeDetail"
      @deleted="closeDetail"
    />
    <WorkoutHistorySheet
      v-else-if="detailKind === 'portal' && detailTrackerId"
      :tracker-id="detailTrackerId"
      @close="closeDetail"
      @deleted="closeDetail"
      @open-day="openWorkoutFromHistory"
    />
    <TrackerDetailSheet
      v-else-if="detailKind === 'ordinary' && detailTrackerId"
      :tracker-id="detailTrackerId"
      @close="closeDetail"
      @deleted="closeDetail"
    />

    <NewTrackerSheet
      v-if="showNewTracker"
      @close="closeNewTracker"
      @created="closeNewTracker"
    />

    <ChecklistDaySheet
      v-if="checklistDayTarget"
      :tracker-id="checklistDayTarget.trackerId"
      :date="checklistDayTarget.date"
      @close="closeChecklistDay"
      @open-device="openDeviceFromDay"
    />

    <WorkoutSessionSheet
      v-if="workoutDate"
      :date="workoutDate"
      @close="closeWorkout"
    />

    <CompletionEntrySheet
      v-if="entryTracker && entryType === 'completion'"
      :tracker="entryTracker"
      :date="entryDate"
      @close="closeEntrySheet"
      @saved="closeEntrySheet"
    />
    <TimeEntrySheet
      v-else-if="entryTracker && entryType === 'time'"
      :tracker="entryTracker"
      :date="entryDate"
      @close="closeEntrySheet"
      @saved="closeEntrySheet"
    />
    <NumericEntrySheet
      v-else-if="
        entryTracker &&
        (entryType === 'count' ||
          entryType === 'distance' ||
          entryType === 'weight')
      "
      :tracker="entryTracker"
      :date="entryDate"
      @close="closeEntrySheet"
      @saved="closeEntrySheet"
    />
  </div>
</template>

<style scoped>
.home {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px var(--layout-gutter) 0;
  max-width: var(--layout-max);
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.top {
  flex: 0 0 auto;
  padding-top: 4px;
}

.grid {
  margin-top: 4px;
  flex: 1 1 auto;
  min-height: 0;
}

/* Overlay: не сжимает viewport сетки */
.today-layer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  pointer-events: none;
}

.today-layer :deep(.today) {
  pointer-events: auto;
  max-height: min(46vh, 380px);
}

.bottom {
  flex: 0 0 auto;
  padding: 14px 0 10px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(88px + var(--safe-bottom));
  transform: translateX(-50%);
  margin: 0;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--color-surface-3);
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
  z-index: 20;
  white-space: nowrap;
}
</style>
