<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import ConfirmDeleteSheet from '@/components/habits/ConfirmDeleteSheet.vue'
import SetDurationWheelSheet from '@/components/workout/SetDurationWheelSheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import {
  db,
  EXERCISE_NOTE_MAX,
  getExercise,
  lastCompletedSetsForExercise,
  removeSessionExercise,
  updateSessionExerciseNote,
  updateSessionExerciseSets,
  type SessionSet,
  type TrackingMode,
  type WorkoutSession,
} from '@/db'
import {
  formatDurationMinSec,
  TRACKING_MODE_LABEL,
} from '@/lib/workoutFormat'

const props = defineProps<{
  sessionId: string
  sessionExerciseId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const session = useLiveQuery(
  async () => (await db.workout_sessions.get(props.sessionId)) ?? null,
  null as WorkoutSession | null,
  () => props.sessionId,
)

const sessionExercise = computed(() =>
  session.value?.exercises.find((e) => e.id === props.sessionExerciseId) ??
  null,
)

const exercise = useLiveQuery(
  async () => {
    const se = sessionExercise.value
    if (!se) return null
    return (await getExercise(se.exerciseId)) ?? null
  },
  null as Awaited<ReturnType<typeof getExercise>> | null,
  () => sessionExercise.value?.exerciseId,
)

const mode = computed<TrackingMode>(
  () => exercise.value?.trackingMode ?? 'weight_reps',
)

const lastSets = ref<SessionSet[] | null>(null)
const lastNote = ref<string | null>(null)

watch(
  () =>
    [sessionExercise.value?.exerciseId, session.value?.startedAt] as const,
  async ([exerciseId, startedAt]) => {
    if (!exerciseId || !startedAt) {
      lastSets.value = null
      lastNote.value = null
      return
    }
    const last = await lastCompletedSetsForExercise(exerciseId, startedAt)
    lastSets.value = last?.sets ?? null
    lastNote.value = last?.note ?? null
  },
  { immediate: true },
)

const sets = ref<SessionSet[]>([])
const note = ref('')
const noteOpen = ref(false)
const noteField = ref<HTMLTextAreaElement | null>(null)

watch(
  sessionExercise,
  (se) => {
    if (!se) return
    sets.value = se.sets.map((s) => ({ ...s }))
    note.value = se.note ?? ''
    if (se.note?.trim()) noteOpen.value = true
  },
  { immediate: true },
)

const lastLine = computed(() => {
  if (!lastSets.value?.length) return 'Нет данных'
  return lastSets.value
    .map((s) => formatSet(mode.value, s))
    .filter(Boolean)
    .join(' · ')
})

function formatSet(m: TrackingMode, s: SessionSet): string {
  if (m === 'weight_reps') {
    if (s.weightKg == null && s.reps == null) return ''
    return `${s.weightKg ?? '—'}×${s.reps ?? '—'}`
  }
  if (m === 'reps_only') return s.reps != null ? String(s.reps) : ''
  if (s.durationSeconds == null) return ''
  return formatDurationMinSec(s.durationSeconds)
}

async function persist() {
  const s = session.value
  if (!s) return
  await updateSessionExerciseSets(s.id, props.sessionExerciseId, sets.value)
}

async function persistNote() {
  const s = session.value
  if (!s) return
  await updateSessionExerciseNote(s.id, props.sessionExerciseId, note.value)
}

async function openNote() {
  noteOpen.value = true
  await nextTick()
  noteField.value?.focus()
}

function onNoteInput(raw: string) {
  note.value = raw.slice(0, EXERCISE_NOTE_MAX)
  void persistNote()
}

function onNoteBlur() {
  note.value = note.value.trim().slice(0, EXERCISE_NOTE_MAX)
  if (!note.value) noteOpen.value = false
  void persistNote()
}

function addSet() {
  const last = sets.value[sets.value.length - 1]
  const fromLast = lastSets.value?.[0]
  const next: SessionSet = {
    id: crypto.randomUUID(),
    sortOrder: sets.value.length,
  }
  if (mode.value === 'weight_reps') {
    next.weightKg = last?.weightKg ?? fromLast?.weightKg
    next.reps = last?.reps ?? fromLast?.reps
  } else if (mode.value === 'reps_only') {
    next.reps = last?.reps ?? fromLast?.reps
  } else {
    next.durationSeconds =
      last?.durationSeconds ?? fromLast?.durationSeconds ?? 60
  }
  sets.value = [...sets.value, next]
  void persist()
}

function removeSet(id: string) {
  sets.value = sets.value.filter((s) => s.id !== id)
  void persist()
}

function onWeightInput(id: string, raw: string) {
  const n = Number(raw)
  sets.value = sets.value.map((s) =>
    s.id === id
      ? { ...s, weightKg: Number.isFinite(n) ? Math.max(0, n) : undefined }
      : s,
  )
  void persist()
}

function onRepsInput(id: string, raw: string) {
  const n = Number(raw)
  sets.value = sets.value.map((s) =>
    s.id === id
      ? {
          ...s,
          reps: Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined,
        }
      : s,
  )
  void persist()
}

const durationEditId = ref<string | null>(null)

const durationEditSeconds = computed(() => {
  const id = durationEditId.value
  if (!id) return 0
  return sets.value.find((s) => s.id === id)?.durationSeconds ?? 0
})

function openDurationEdit(id: string) {
  durationEditId.value = id
}

function onDurationSave(seconds: number) {
  const id = durationEditId.value
  if (!id) return
  sets.value = sets.value.map((s) =>
    s.id === id ? { ...s, durationSeconds: Math.max(0, seconds) } : s,
  )
  durationEditId.value = null
  void persist()
}

const showDelete = ref(false)

async function onDeleteExercise() {
  const s = session.value
  if (!s) return
  await removeSessionExercise(s.id, props.sessionExerciseId)
  showDelete.value = false
  emit('close')
}

watch(sessionExercise, (se) => {
  if (session.value && !se) emit('close')
})
</script>

<template>
  <BottomSheet
    size="tall"
    :aria-label="exercise?.name ?? 'Упражнение'"
    :layer="50"
    @close="emit('close')"
  >
    <template #header>
      <header class="head">
        <h1 class="title">{{ exercise?.name ?? 'Упражнение' }}</h1>
        <CloseButton />
      </header>
    </template>

    <p class="badge">{{ TRACKING_MODE_LABEL[mode] }}</p>

    <section class="last">
      <h2 class="section">Прошлый раз</h2>
      <div class="card">
        <p class="last-line mono">{{ lastLine }}</p>
        <p v-if="lastNote" class="last-note">{{ lastNote }}</p>
      </div>
    </section>

    <section class="sets">
      <h2 class="section">Подходы</h2>
      <ul class="set-list">
        <li v-for="(set, i) in sets" :key="set.id" class="set-row">
          <span class="idx mono">{{ i + 1 }}</span>

          <template v-if="mode === 'weight_reps'">
            <div class="field">
              <input
                class="num mono"
                type="number"
                inputmode="decimal"
                :value="set.weightKg ?? ''"
                placeholder="0"
                @change="onWeightInput(set.id, ($event.target as HTMLInputElement).value)"
              />
              <span class="unit">кг</span>
            </div>
            <div class="field">
              <input
                class="num mono"
                type="number"
                inputmode="numeric"
                :value="set.reps ?? ''"
                placeholder="0"
                @change="onRepsInput(set.id, ($event.target as HTMLInputElement).value)"
              />
              <span class="unit">повт</span>
            </div>
          </template>

          <template v-else-if="mode === 'reps_only'">
            <div class="field wide">
              <input
                class="num mono"
                type="number"
                inputmode="numeric"
                :value="set.reps ?? ''"
                placeholder="0"
                @change="onRepsInput(set.id, ($event.target as HTMLInputElement).value)"
              />
              <span class="unit">повт</span>
            </div>
          </template>

          <template v-else>
            <button
              type="button"
              class="duration mono"
              @click="openDurationEdit(set.id)"
            >
              {{
                set.durationSeconds != null
                  ? formatDurationMinSec(set.durationSeconds)
                  : '0:00'
              }}
            </button>
          </template>

          <button
            type="button"
            class="del"
            aria-label="Удалить подход"
            @click="removeSet(set.id)"
          >
            ✕
          </button>
        </li>
      </ul>
      <button type="button" class="add" @click="addSet">+ Подход</button>
    </section>

    <section class="note">
      <h2 class="section">Заметка</h2>
      <button v-if="!noteOpen" type="button" class="add" @click="openNote">
        + Заметка
      </button>
      <div v-else class="card note-card">
        <textarea
          ref="noteField"
          class="note-input"
          rows="2"
          :maxlength="EXERCISE_NOTE_MAX"
          :value="note"
          placeholder="Себе на следующий раз"
          @input="onNoteInput(($event.target as HTMLTextAreaElement).value)"
          @blur="onNoteBlur"
        />
      </div>
    </section>

    <button type="button" class="danger-link" @click="showDelete = true">
      УДАЛИТЬ УПРАЖНЕНИЕ
    </button>
  </BottomSheet>

  <SetDurationWheelSheet
    v-if="durationEditId"
    :duration-seconds="durationEditSeconds"
    @close="durationEditId = null"
    @save="onDurationSave"
  />

  <ConfirmDeleteSheet
    v-if="showDelete"
    title="Удалить упражнение?"
    body="Упражнение исчезнет из этой тренировки. Каталог не изменится."
    confirm-label="УДАЛИТЬ"
    @close="showDelete = false"
    @confirm="onDeleteExercise"
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
}

.badge {
  display: inline-block;
  margin: 0 0 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--color-surface-3);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.section {
  margin: 0 0 10px;
  font-size: 1.25rem;
  font-weight: 400;
}

.last {
  margin-top: 8px;
}

.note {
  margin-top: 22px;
}

.card {
  padding: 16px;
  border-radius: 14px;
  background: var(--color-surface-3);
}

.last-line {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.last-note {
  margin: 10px 0 0;
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  line-height: 1.4;
}

.note-card {
  padding: 12px 14px;
}

.note-input {
  display: block;
  width: 100%;
  min-height: 52px;
  resize: none;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.4;
}

.note-input::placeholder {
  color: var(--color-text-secondary);
}

.sets {
  margin-top: 22px;
}

.set-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.set-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 8px 10px 8px 14px;
  border-radius: 14px;
  background: var(--color-surface-3);
}

.idx {
  flex: 0 0 20px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.field {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 48px;
  padding: 0 12px;
  border-radius: 12px;
  background: var(--color-surface-2);
}

.field.wide {
  flex: 1 1 auto;
}

.num {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  text-align: center;
  font-size: 1.125rem;
}

.unit {
  flex: 0 0 auto;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.duration {
  flex: 1 1 auto;
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  background: var(--color-surface-2);
  color: var(--color-text-primary);
  font-size: 1.25rem;
  font-weight: 500;
  text-align: center;
}

.del {
  flex: 0 0 40px;
  height: 40px;
  color: var(--color-text-secondary);
}

.add {
  width: 100%;
  margin-top: 12px;
  min-height: 52px;
  border-radius: 14px;
  border: 1px dashed
    color-mix(in srgb, var(--color-text-secondary) 40%, transparent);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.danger-link {
  display: block;
  width: 100%;
  margin-top: 28px;
  padding: 16px;
  color: var(--color-danger-fg);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}
</style>
