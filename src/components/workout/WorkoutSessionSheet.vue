<script setup lang="ts">
import Sortable from 'sortablejs'
import {
  computed,
  inject,
  nextTick,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import ConfirmDeleteSheet from '@/components/habits/ConfirmDeleteSheet.vue'
import NewTrackerSheet from '@/components/habits/NewTrackerSheet.vue'
import DurationEditSheet from '@/components/workout/DurationEditSheet.vue'
import WorkoutAddExerciseSheet from '@/components/workout/WorkoutAddExerciseSheet.vue'
import WorkoutExerciseCatalogSheet from '@/components/workout/WorkoutExerciseCatalogSheet.vue'
import WorkoutExerciseSheet from '@/components/workout/WorkoutExerciseSheet.vue'
import WorkoutTemplatesSheet from '@/components/workout/WorkoutTemplatesSheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { SHEET_DISMISS_LOCK_KEY } from '@/composables/sheetDismissLock'
import {
  db,
  deleteSession,
  deleteTrackerCascade,
  elapsedSeconds,
  finishSession,
  getPortalTracker,
  listTemplates,
  pauseSession,
  reorderSessionExercises,
  resumeSession,
  sessionHasValidFinish,
  setSummaryLine,
  startEmptySession,
  syncTemplateFromSession,
  todayDate,
  updateSessionDuration,
  type Exercise,
  type Tracker,
  type WorkoutSession,
  type WorkoutTemplate,
} from '@/db'
import { formatDateFullRu, isFutureDate } from '@/lib/calendar'
import { formatElapsedHms, formatDurationMinSec } from '@/lib/workoutFormat'

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dismissLock = inject(SHEET_DISMISS_LOCK_KEY, null)

const today = todayDate()
const isFuture = computed(() => isFutureDate(props.date, today))

const portal = useLiveQuery(
  async () => (await getPortalTracker()) ?? null,
  undefined as Tracker | null | undefined,
)

const session = useLiveQuery(
  async () =>
    (await db.workout_sessions.where('date').equals(props.date).first()) ??
    null,
  null as WorkoutSession | null,
  () => props.date,
)

const exercises = useLiveQuery(() => db.exercises.toArray(), [] as Exercise[])

const templates = useLiveQuery(() => listTemplates(), [] as WorkoutTemplate[])

const exerciseById = computed(() => {
  const m = new Map<string, Exercise>()
  for (const e of exercises.value) m.set(e.id, e)
  return m
})

const modeById = computed(() => {
  const m = new Map<string, Exercise['trackingMode']>()
  for (const e of exercises.value) m.set(e.id, e.trackingMode)
  return m
})

const state = computed(() => {
  if (isFuture.value && !session.value) return 'A1' as const
  if (!session.value) return 'A0' as const
  if (session.value.status === 'in_progress') return 'B' as const
  return 'C' as const
})

const canFinish = computed(() => {
  const s = session.value
  if (!s || s.status !== 'in_progress') return false
  return sessionHasValidFinish(s, modeById.value)
})

const nowTick = ref(Date.now())
let tickTimer: number | undefined

watch(
  () =>
    [session.value?.status, session.value?.pausedAt, session.value?.id] as const,
  ([status, pausedAt]) => {
    window.clearInterval(tickTimer)
    if (status === 'in_progress' && !pausedAt) {
      tickTimer = window.setInterval(() => {
        nowTick.value = Date.now()
      }, 1000)
    }
  },
  { immediate: true },
)

const timerLabel = computed(() => {
  const s = session.value
  if (!s) return null
  if (s.status === 'completed' && s.durationSeconds != null) {
    return formatDurationMinSec(s.durationSeconds)
  }
  if (s.status === 'in_progress') {
    return formatElapsedHms(elapsedSeconds(s, nowTick.value))
  }
  return null
})

const dateLabel = computed(() =>
  props.date === today ? 'Сегодня' : formatDateFullRu(props.date),
)

const portalName = computed(() => portal.value?.name ?? 'Тренировка')

const orderedExercises = computed(() => {
  const s = session.value
  if (!s) return []
  return [...s.exercises].sort((a, b) => a.sortOrder - b.sortOrder)
})

const showMenu = ref(false)
const showEditPortal = ref(false)
const showDeletePortal = ref(false)
const showDeleteSession = ref(false)
const showDuration = ref(false)
const showUpdateTemplate = ref(false)
const showAdd = ref(false)
const exerciseId = ref<string | null>(null)
const templatesMode = ref<'select' | 'manage' | null>(null)
const showCatalog = ref(false)

const toast = ref('')
let toastTimer: number | undefined

function flash(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = ''
  }, 1800)
}

async function onStart() {
  if (isFuture.value) return
  await startEmptySession(props.date)
}

function onFromTemplate() {
  templatesMode.value = 'select'
}

async function onPauseResume() {
  const s = session.value
  if (!s || s.status !== 'in_progress') return
  if (s.pausedAt) await resumeSession(s.id)
  else await pauseSession(s.id)
}

async function onFinish() {
  const s = session.value
  if (!s || !canFinish.value) return
  try {
    const finished = await finishSession(s.id)
    if (finished?.templateId) {
      const t = await db.workout_templates.get(finished.templateId)
      if (t) showUpdateTemplate.value = true
    }
  } catch {
    flash('Добавьте хотя бы один подход')
  }
}

async function onUpdateTemplate(yes: boolean) {
  showUpdateTemplate.value = false
  const s = session.value
  if (!yes || !s?.templateId) return
  await syncTemplateFromSession(s.templateId, s)
}

function openExercise(sessionExerciseId: string) {
  exerciseId.value = sessionExerciseId
}

function openAdd() {
  if (isFuture.value || !session.value) return
  showAdd.value = true
}

async function onSaveDuration(seconds: number) {
  const s = session.value
  if (!s) return
  await updateSessionDuration(s.id, seconds)
  showDuration.value = false
}

async function onDeleteSessionConfirm() {
  const s = session.value
  showDeleteSession.value = false
  showMenu.value = false
  if (!s) return
  await deleteSession(s.id)
}

const deleteSessionTitle = computed(() =>
  state.value === 'B' && orderedExercises.value.length === 0
    ? 'Отменить тренировку?'
    : 'Удалить тренировку?',
)

const deleteSessionBody = computed(() =>
  state.value === 'B' && orderedExercises.value.length === 0
    ? 'Сессия будет удалена. Можно начать заново.'
    : 'Сессия этого дня будет удалена.',
)

async function onDeletePortalConfirm() {
  const p = portal.value
  showDeletePortal.value = false
  if (!p) return
  await deleteTrackerCascade(p.id)
  emit('close')
}

const listEl = ref<HTMLElement | null>(null)
let sortable: Sortable | null = null

function destroySortable() {
  sortable?.destroy()
  sortable = null
}

function createSortable(el: HTMLElement) {
  destroySortable()
  sortable = Sortable.create(el, {
    animation: 200,
    handle: '.handle',
    ghostClass: 'row-ghost',
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 4,
    onStart: () => dismissLock?.lock(),
    onEnd: async (evt) => {
      dismissLock?.unlock()
      const s = session.value
      if (!s || evt.oldIndex == null || evt.newIndex == null) return
      if (evt.oldIndex === evt.newIndex) return
      const ids = [...orderedExercises.value.map((e) => e.id)]
      const [moved] = ids.splice(evt.oldIndex, 1)
      ids.splice(evt.newIndex, 0, moved)
      await reorderSessionExercises(s.id, ids)
    },
  })
}

watch(
  listEl,
  async (el) => {
    await nextTick()
    if (el && orderedExercises.value.length > 0) createSortable(el)
    else destroySortable()
  },
  { flush: 'post' },
)

watch(
  () => orderedExercises.value.length,
  async () => {
    await nextTick()
    if (listEl.value && orderedExercises.value.length > 0) {
      createSortable(listEl.value)
    }
  },
)

watch(
  portal,
  (p) => {
    if (p === undefined) return
    if (p === null) emit('close')
  },
  { immediate: true },
)

onUnmounted(() => {
  window.clearInterval(tickTimer)
  dismissLock?.unlock()
  destroySortable()
  window.clearTimeout(toastTimer)
})
</script>

<template>
  <BottomSheet
    size="tall"
    :aria-label="portalName"
    :layer="40"
    @close="emit('close')"
  >
    <template #header>
      <header class="head">
        <CloseButton />
        <button
          type="button"
          class="more"
          aria-label="Ещё"
          @click="showMenu = true"
        >
          ⋯
        </button>
      </header>
    </template>

    <div class="hero">
      <p class="eyebrow">{{ dateLabel }}</p>
      <h1 class="title">{{ portalName }}</h1>

      <div v-if="timerLabel" class="timer-block">
        <button
          v-if="state === 'C'"
          type="button"
          class="timer mono"
          @click="showDuration = true"
        >
          {{ timerLabel }}
        </button>
        <p v-else class="timer mono">{{ timerLabel }}</p>
        <div v-if="state === 'B'" class="timer-actions">
          <button type="button" class="pause" @click="onPauseResume">
            {{ session?.pausedAt ? 'Продолжить' : 'Пауза' }}
          </button>
          <span v-if="session?.pausedAt" class="pause-cap">на паузе</span>
        </div>
      </div>

      <p v-if="state === 'A1'" class="hint">Нельзя начать в будущем</p>
      <p v-else-if="state === 'A0'" class="empty-day">
        Нет тренировки в этот день
      </p>
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
              exerciseById.get(se.exerciseId)?.name ?? 'Удалено'
            }}</span>
            <span class="meta mono">{{
              setSummaryLine(
                exerciseById.get(se.exerciseId)?.trackingMode ?? 'weight_reps',
                se.sets,
              )
            }}</span>
            <span class="chev" aria-hidden="true">›</span>
          </button>
        </li>
      </ul>
      <p v-else class="empty">Добавьте упражнение</p>

      <button
        v-if="state === 'B'"
        type="button"
        class="add"
        @click="openAdd"
      >
        + Упражнение
      </button>
    </section>

    <template #footer>
      <div class="footer">
        <template v-if="state === 'A0'">
          <button type="button" class="cta" @click="onStart">
            НАЧАТЬ ТРЕНИРОВКУ
          </button>
          <button
            v-if="templates.length > 0"
            type="button"
            class="link"
            @click="onFromTemplate"
          >
            Из шаблона
          </button>
        </template>
        <template v-else-if="state === 'B'">
          <button
            type="button"
            class="cta"
            :disabled="!canFinish"
            @click="onFinish"
          >
            ЗАКОНЧИТЬ
          </button>
          <p v-if="!canFinish" class="helper">Нужен хотя бы один подход</p>
          <button
            v-if="orderedExercises.length === 0"
            type="button"
            class="link"
            @click="showDeleteSession = true"
          >
            Отменить
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

  <BottomSheet
    v-if="showMenu"
    size="auto"
    title="Ещё"
    :layer="50"
    @close="showMenu = false"
  >
    <div class="menu">
      <button
        type="button"
        class="menu-row"
        @click="
          showEditPortal = true;
          showMenu = false;
        "
      >
        Изменить название / символ
      </button>
      <button
        type="button"
        class="menu-row"
        @click="
          showMenu = false;
          templatesMode = 'manage';
        "
      >
        Шаблоны
      </button>
      <button
        type="button"
        class="menu-row"
        @click="
          showMenu = false;
          showCatalog = true;
        "
      >
        Каталог упражнений
      </button>
      <button
        v-if="state === 'C'"
        type="button"
        class="menu-row"
        @click="
          showMenu = false;
          openAdd();
        "
      >
        Добавить упражнение
      </button>
      <button
        v-if="session"
        type="button"
        class="menu-row danger-text"
        @click="
          showDeleteSession = true;
          showMenu = false;
        "
      >
        Удалить тренировку
      </button>
      <button
        type="button"
        class="menu-row danger-text"
        @click="
          showDeletePortal = true;
          showMenu = false;
        "
      >
        Удалить колонку тренировки
      </button>
    </div>
  </BottomSheet>

  <NewTrackerSheet
    v-if="showEditPortal && portal"
    :tracker="portal"
    :layer="80"
    @close="showEditPortal = false"
    @saved="showEditPortal = false"
  />

  <ConfirmDeleteSheet
    v-if="showDeleteSession"
    :title="deleteSessionTitle"
    :body="deleteSessionBody"
    @close="showDeleteSession = false"
    @confirm="onDeleteSessionConfirm"
  />

  <ConfirmDeleteSheet
    v-if="showDeletePortal"
    title="Удалить колонку тренировки?"
    body="Удалятся все тренировки. Каталог упражнений и шаблоны останутся."
    @close="showDeletePortal = false"
    @confirm="onDeletePortalConfirm"
  />

  <DurationEditSheet
    v-if="showDuration && session?.durationSeconds != null"
    :duration-seconds="session.durationSeconds"
    @close="showDuration = false"
    @save="onSaveDuration"
  />

  <BottomSheet
    v-if="showUpdateTemplate"
    size="auto"
    title="Обновить шаблон?"
    :layer="50"
    @close="onUpdateTemplate(false)"
  >
    <p class="body-text">
      Заменить состав шаблона упражнениями этой тренировки?
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
    v-if="exerciseId"
    :date="date"
    :session-exercise-id="exerciseId"
    @close="exerciseId = null"
  />

  <WorkoutAddExerciseSheet
    v-if="showAdd"
    :date="date"
    @close="showAdd = false"
  />

  <WorkoutTemplatesSheet
    v-if="templatesMode"
    :date="date"
    :mode="templatesMode"
    @close="templatesMode = null"
  />

  <WorkoutExerciseCatalogSheet
    v-if="showCatalog"
    @close="showCatalog = false"
  />
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.more {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.25rem;
  line-height: 1;
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

.pause-cap,
.hint,
.helper,
.empty,
.empty-day {
  margin: 8px 0 0;
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
}

.empty-day {
  margin-top: 20px;
  font-size: 0.9375rem;
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

.link {
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  padding: 4px 0;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions .cta,
.actions .ghost {
  flex: 1;
}

.menu {
  display: flex;
  flex-direction: column;
}

.menu-row {
  width: 100%;
  min-height: 52px;
  padding: 14px 4px;
  text-align: left;
  font-size: 1.0625rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-text-secondary) 18%, transparent);
}

.menu-row:last-child {
  border-bottom: 0;
}

.danger-text {
  color: var(--color-danger-fg);
}

.body-text {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.4;
  font-size: var(--type-body);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(24px + var(--safe-bottom));
  transform: translateX(-50%);
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--color-surface-3);
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
  z-index: 80;
}
</style>
