<script setup lang="ts">
import Sortable from "sortablejs";
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import ConfirmDeleteSheet from "@/components/habits/ConfirmDeleteSheet.vue";
import DurationEditSheet from "@/components/workout/DurationEditSheet.vue";
import SetDurationWheelSheet from "@/components/workout/SetDurationWheelSheet.vue";
import WorkoutAddExerciseSheet from "@/components/workout/WorkoutAddExerciseSheet.vue";
import WorkoutExerciseSheet from "@/components/workout/WorkoutExerciseSheet.vue";
import BottomSheet from "@/components/ui/BottomSheet.vue";
import CloseButton from "@/components/ui/CloseButton.vue";
import { useLiveQuery } from "@/composables/useLiveQuery";
import { SHEET_DISMISS_LOCK_KEY } from "@/composables/sheetDismissLock";
import {
  db,
  deleteSession,
  elapsedSeconds,
  finishSession,
  finishSessionWithDuration,
  getPortalTracker,
  getRestSeconds,
  pauseSession,
  reorderSessionExercises,
  getSession,
  resumeSession,
  sessionDiffersFromTemplate,
  sessionHasValidFinish,
  setSummaryLine,
  setRestSeconds,
  syncTemplateFromSession,
  todayDate,
  updateSessionDuration,
  type Exercise,
  type Tracker,
  type WorkoutSession,
} from "@/db";
import { formatDateFullRu, isFutureDate } from "@/lib/calendar";
import { formatElapsedHms, formatDurationMinSec } from "@/lib/workoutFormat";

const props = defineProps<{
  sessionId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const dismissLock = inject(SHEET_DISMISS_LOCK_KEY, null);

const today = todayDate();

const portal = useLiveQuery(
  async () => (await getPortalTracker()) ?? null,
  undefined as Tracker | null | undefined,
);

const session = useLiveQuery(
  async () => (await getSession(props.sessionId)) ?? null,
  undefined as WorkoutSession | null | undefined,
  () => props.sessionId,
);

const sessionDate = computed(() => session.value?.date ?? "");
const isFuture = computed(() =>
  sessionDate.value ? isFutureDate(sessionDate.value, today) : false,
);

const exercises = useLiveQuery(() => db.exercises.toArray(), [] as Exercise[]);

const exerciseById = computed(() => {
  const m = new Map<string, Exercise>();
  for (const e of exercises.value) m.set(e.id, e);
  return m;
});

const modeById = computed(() => {
  const m = new Map<string, Exercise["trackingMode"]>();
  for (const e of exercises.value) m.set(e.id, e.trackingMode);
  return m;
});

const state = computed(() =>
  session.value?.status === "completed" ? ("C" as const) : ("B" as const),
);

const canFinish = computed(() => {
  const s = session.value;
  if (!s || s.status !== "in_progress") return false;
  return sessionHasValidFinish(s, modeById.value);
});

const nowTick = ref(Date.now());
let tickTimer: number | undefined;

watch(
  () =>
    [
      session.value?.status,
      session.value?.pausedAt,
      session.value?.id,
    ] as const,
  ([status, pausedAt]) => {
    window.clearInterval(tickTimer);
    if (status === "in_progress" && !pausedAt) {
      tickTimer = window.setInterval(() => {
        nowTick.value = Date.now();
      }, 1000);
    }
  },
  { immediate: true },
);

const timerLabel = computed(() => {
  const s = session.value;
  if (!s) return null;
  if (s.status === "completed" && s.durationSeconds != null) {
    return formatDurationMinSec(s.durationSeconds);
  }
  if (s.status === "in_progress") {
    return formatElapsedHms(elapsedSeconds(s, nowTick.value));
  }
  return null;
});

const dateLabel = computed(() =>
  sessionDate.value === today ? "Сегодня" : formatDateFullRu(sessionDate.value),
);

const portalName = computed(() => portal.value?.name ?? "Тренировка");

const orderedExercises = computed(() => {
  const s = session.value;
  if (!s) return [];
  return [...s.exercises].sort((a, b) => a.sortOrder - b.sortOrder);
});

const showDeleteSession = ref(false);
const showDuration = ref(false);
const showRestWheel = ref(false);
const restPreset = ref(60);
const restEndsAt = ref<number | null>(null);
const restNow = ref(Date.now());
let restTimer: number | undefined;

const restRunning = computed(() => restEndsAt.value != null);

const restRemaining = computed(() => {
  const ends = restEndsAt.value;
  if (ends == null) return 0;
  return Math.max(0, Math.ceil((ends - restNow.value) / 1000));
});

function clearRestTimer() {
  window.clearInterval(restTimer);
  restTimer = undefined;
}

function pulseRestDone() {
  navigator.vibrate?.(80);
}

function checkRest() {
  const ends = restEndsAt.value;
  if (ends == null) return;
  const now = Date.now();
  if (now >= ends) {
    restEndsAt.value = null;
    clearRestTimer();
    pulseRestDone();
    return;
  }
  restNow.value = now;
}

function armRestTimer() {
  clearRestTimer();
  restTimer = window.setInterval(checkRest, 200);
}

function startRest() {
  if (restEndsAt.value != null || restPreset.value < 1) return;
  restEndsAt.value = Date.now() + restPreset.value * 1000;
  restNow.value = Date.now();
  armRestTimer();
}

function stopRest() {
  restEndsAt.value = null;
  clearRestTimer();
}

function onRestVisibility() {
  if (document.visibilityState === "visible") checkRest();
}

async function onSaveRest(seconds: number) {
  showRestWheel.value = false;
  const next = Math.floor(seconds);
  if (next < 1 || next > 15 * 60) return;
  restPreset.value = next;
  await setRestSeconds(next);
}
const showUpdateTemplate = ref(false);
const showAdd = ref(false);
const exerciseId = ref<string | null>(null);

const toast = ref("");
let toastTimer: number | undefined;

function flash(msg: string) {
  toast.value = msg;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value = "";
  }, 1800);
}

async function onPauseResume() {
  const s = session.value;
  if (!s || s.status !== "in_progress") return;
  if (s.pausedAt) await resumeSession(s.id);
  else await pauseSession(s.id);
}

async function maybeAskUpdateTemplate(finished: WorkoutSession | null) {
  if (!finished?.templateId) return;
  const t = await db.workout_templates.get(finished.templateId);
  if (t && sessionDiffersFromTemplate(t, finished)) {
    showUpdateTemplate.value = true;
  }
}

async function onFinish() {
  const s = session.value;
  if (!s || !canFinish.value) return;
  try {
    const finished = await finishSession(s.id);
    await maybeAskUpdateTemplate(finished);
  } catch {
    flash("Добавьте хотя бы один подход");
  }
}

async function onUpdateTemplate(yes: boolean) {
  showUpdateTemplate.value = false;
  const s = session.value;
  if (!yes || !s?.templateId) return;
  await syncTemplateFromSession(s.templateId, s);
}

function openExercise(sessionExerciseId: string) {
  exerciseId.value = sessionExerciseId;
}

function openAdd() {
  if (isFuture.value || !session.value) return;
  showAdd.value = true;
}

const durationSheetSeconds = computed(() => {
  const s = session.value;
  if (!s) return 0;
  if (s.status === "completed" && s.durationSeconds != null) {
    return s.durationSeconds;
  }
  if (s.status === "in_progress") {
    return elapsedSeconds(s, nowTick.value);
  }
  return 0;
});

async function onSaveDuration(seconds: number) {
  const s = session.value;
  if (!s) return;
  if (s.status === "completed") {
    await updateSessionDuration(s.id, seconds);
    showDuration.value = false;
    return;
  }
  if (s.status === "in_progress") {
    try {
      const finished = await finishSessionWithDuration(s.id, seconds);
      showDuration.value = false;
      await maybeAskUpdateTemplate(finished);
    } catch {
      flash("Добавьте хотя бы один подход");
    }
  }
}

async function onDeleteSessionConfirm() {
  const s = session.value;
  showDeleteSession.value = false;
  if (!s) return;
  await deleteSession(s.id);
  emit("close");
}

const deleteSessionTitle = computed(() =>
  state.value === "B" && !canFinish.value
    ? "Отменить тренировку?"
    : "Удалить тренировку?",
);

const deleteSessionBody = computed(() =>
  state.value === "B" && !canFinish.value
    ? "Сессия будет удалена. Можно начать заново."
    : "Эта тренировка будет удалена.",
);

const listEl = ref<HTMLElement | null>(null);
let sortable: Sortable | null = null;

function destroySortable() {
  sortable?.destroy();
  sortable = null;
}

function createSortable(el: HTMLElement) {
  destroySortable();
  sortable = Sortable.create(el, {
    animation: 200,
    handle: ".handle",
    ghostClass: "row-ghost",
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 4,
    onStart: () => dismissLock?.lock(),
    onEnd: async (evt) => {
      dismissLock?.unlock();
      const s = session.value;
      if (!s || evt.oldIndex == null || evt.newIndex == null) return;
      if (evt.oldIndex === evt.newIndex) return;
      const ids = [...orderedExercises.value.map((e) => e.id)];
      const [moved] = ids.splice(evt.oldIndex, 1);
      ids.splice(evt.newIndex, 0, moved);
      await reorderSessionExercises(s.id, ids);
    },
  });
}

watch(
  listEl,
  async (el) => {
    await nextTick();
    if (el && orderedExercises.value.length > 0) createSortable(el);
    else destroySortable();
  },
  { flush: "post" },
);

watch(
  () => orderedExercises.value.length,
  async () => {
    await nextTick();
    if (listEl.value && orderedExercises.value.length > 0) {
      createSortable(listEl.value);
    }
  },
);

watch(
  portal,
  (p) => {
    if (p === undefined) return;
    if (p === null) emit("close");
  },
  { immediate: true },
);

watch(session, (s) => {
  if (s === undefined) return;
  if (s === null) emit("close");
});

watch(state, (s) => {
  if (s !== "B") stopRest();
});

onMounted(() => {
  document.addEventListener("visibilitychange", onRestVisibility);
  void getRestSeconds().then((n) => {
    restPreset.value = n;
  });
});

onUnmounted(() => {
  window.clearInterval(tickTimer);
  document.removeEventListener("visibilitychange", onRestVisibility);
  stopRest();
  dismissLock?.unlock();
  destroySortable();
  window.clearTimeout(toastTimer);
});
</script>

<template>
  <BottomSheet
    v-if="session"
    size="tall"
    :aria-label="portalName"
    :layer="45"
    @close="emit('close')"
  >
    <template #header>
      <header class="head">
        <CloseButton />
      </header>
    </template>

    <div class="hero">
      <p class="eyebrow">{{ dateLabel }}</p>
      <h1 class="title">{{ portalName }}</h1>

      <div v-if="timerLabel" class="timer-block">
        <button
          v-if="state === 'B' || state === 'C'"
          type="button"
          class="timer mono"
          @click="showDuration = true"
        >
          {{ timerLabel }}
        </button>
        <p v-else class="timer mono">{{ timerLabel }}</p>
        <div v-if="state === 'B'" class="timer-actions">
          <button type="button" class="pause" @click="onPauseResume">
            {{ session?.pausedAt ? "Продолжить" : "Пауза" }}
          </button>
          <span v-if="session?.pausedAt" class="pause-cap">на паузе</span>
          <button type="button" class="pause" @click="restRunning ? stopRest() : startRest()">
            {{ restRunning ? "Завершить отдых" : "Отдых" }}
          </button>
          <button
            v-if="!restRunning"
            type="button"
            class="rest-preset mono"
            aria-label="Время отдыха"
            @click="showRestWheel = true"
          >
            {{ formatDurationMinSec(restPreset) }}
          </button>
          <span v-else class="rest-remaining mono">{{
            formatDurationMinSec(restRemaining)
          }}</span>
        </div>
      </div>
    </div>

    <section v-if="session" class="list-wrap">
      <ul v-if="orderedExercises.length" ref="listEl" class="list">
        <li
          v-for="se in orderedExercises"
          :key="se.id"
          class="row"
          :data-id="se.id"
        >
          <button type="button" class="handle" aria-label="Перетащить">
            ≡
          </button>
          <button type="button" class="row-main" @click="openExercise(se.id)">
            <span class="name">{{
              exerciseById.get(se.exerciseId)?.name ?? "Удалено"
            }}</span>
            <span class="meta mono">{{
              setSummaryLine(
                exerciseById.get(se.exerciseId)?.trackingMode ?? "weight_reps",
                se.sets,
              )
            }}</span>
            <span class="chev" aria-hidden="true">›</span>
          </button>
        </li>
      </ul>
      <p v-else class="empty">Добавьте упражнение</p>

      <button v-if="state === 'B'" type="button" class="add" @click="openAdd">
        + Упражнение
      </button>
    </section>

    <template #footer>
      <div class="footer">
        <template v-if="state === 'B'">
          <button
            v-if="!canFinish"
            type="button"
            class="ghost"
            @click="showDeleteSession = true"
          >
            ОТМЕНИТЬ
          </button>
          <button
            v-else
            type="button"
            class="cta"
            @click="onFinish"
          >
            ЗАКОНЧИТЬ
          </button>
        </template>
        <button
          v-else-if="state === 'C'"
          type="button"
          class="danger"
          @click="showDeleteSession = true"
        >
          УДАЛИТЬ ТРЕНИРОВКУ
        </button>
      </div>
    </template>
  </BottomSheet>

  <p v-if="toast" class="toast">{{ toast }}</p>

  <ConfirmDeleteSheet
    v-if="showDeleteSession"
    :title="deleteSessionTitle"
    :body="deleteSessionBody"
    @close="showDeleteSession = false"
    @confirm="onDeleteSessionConfirm"
  />

  <DurationEditSheet
    v-if="showDuration && session && (state === 'B' || state === 'C')"
    :duration-seconds="durationSheetSeconds"
    @close="showDuration = false"
    @save="onSaveDuration"
  />

  <SetDurationWheelSheet
    v-if="showRestWheel"
    title="Отдых"
    :max-minutes="15"
    :duration-seconds="restPreset"
    @close="showRestWheel = false"
    @save="onSaveRest"
  />

  <BottomSheet
    v-if="showUpdateTemplate"
    size="auto"
    title="Обновить программу?"
    :layer="50"
    @close="onUpdateTemplate(false)"
  >
    <p class="body-text">
      Заменить состав программы упражнениями этой тренировки?
    </p>
    <template #footer>
      <div class="actions">
        <button type="button" class="ghost" @click="onUpdateTemplate(false)">
          НЕТ
        </button>
        <button type="button" class="cta" @click="onUpdateTemplate(true)">
          ДА
        </button>
      </div>
    </template>
  </BottomSheet>

  <WorkoutExerciseSheet
    v-if="exerciseId && session"
    :session-id="session.id"
    :session-exercise-id="exerciseId"
    @close="exerciseId = null"
  />

  <WorkoutAddExerciseSheet
    v-if="showAdd && session"
    :session-id="session.id"
    @close="showAdd = false"
  />
</template>

<style scoped>
.head {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.hero {
  margin-top: 4px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.title {
  margin: 0;
  font-size: clamp(1.75rem, 7vw, 2.25rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--color-text-primary);
}

.timer-block {
  margin-top: 16px;
}

.timer {
  margin: 0;
  padding: 0;
  background: transparent;
  font-size: clamp(2.5rem, 10vw, 3rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--color-text-primary);
}

.timer-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.pause {
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  font-weight: 600;
}

.rest-preset {
  margin: 0;
  padding: 8px 0;
  background: transparent;
  font-size: var(--type-helper);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.rest-remaining {
  font-size: var(--type-helper);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.pause-cap,
.hint,
.helper,
.empty {
  margin: 8px 0 0;
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
}

.list-wrap {
  margin-top: 20px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: stretch;
  border-radius: 14px;
  background: var(--color-surface-3);
  overflow: hidden;
}

.row-ghost {
  opacity: 0.35;
}

.handle {
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  color: var(--color-text-secondary);
  touch-action: none;
  cursor: grab;
  font-size: 1.125rem;
}

.row-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 12px 16px 12px 4px;
  text-align: left;
  color: var(--color-text-primary);
}

.row-main:active {
  opacity: 0.9;
}

.name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.0625rem;
}

.meta {
  flex: 0 0 auto;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.chev {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-size: 1.25rem;
}

.add {
  width: 100%;
  margin-top: 12px;
  min-height: 52px;
  border-radius: 14px;
  border: 1px dashed
    color-mix(in srgb, var(--color-text-secondary) 40%, transparent);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-weight: 600;
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cta,
.danger,
.ghost {
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.cta {
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
}

.cta:disabled {
  opacity: 0.35;
}

.danger {
  background: var(--color-danger-bg);
  color: var(--color-danger-fg);
}

.ghost {
  background: var(--color-surface-3);
  color: var(--color-text-primary);
}

.actions {
  display: flex;
  gap: 10px;
}

.actions .cta,
.actions .ghost {
  flex: 1;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(24px + var(--safe-bottom));
  transform: translateX(-50%);
  margin: 0;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--color-surface-3);
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
  z-index: 80;
  white-space: nowrap;
}

.row-ghost {
  opacity: 0.4;
}

.body-text {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}
</style>
