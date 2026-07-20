<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ConfirmDeleteSheet from '@/components/habits/ConfirmDeleteSheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import {
  db,
  getExercise,
  lastCompletedSetsForExercise,
  removeSessionExercise,
  updateSessionExerciseSets,
  type SessionSet,
  type TrackingMode,
  type WorkoutSession,
} from '@/db'
import { TRACKING_MODE_LABEL } from '@/lib/workoutFormat'

const props = defineProps<{
  date: string
  sessionExerciseId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const session = useLiveQuery(
  async () =>
    (await db.workout_sessions.where('date').equals(props.date).first()) ??
    null,
  null as WorkoutSession | null,
  () => props.date,
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

watch(
  () => [sessionExercise.value?.exerciseId, props.date] as const,
  async ([exerciseId]) => {
    if (!exerciseId) {
      lastSets.value = null
      return
    }
    lastSets.value = await lastCompletedSetsForExercise(exerciseId, props.date)
  },
  { immediate: true },
)

const sets = ref<SessionSet[]>([])

watch(
  sessionExercise,
  (se) => {
    if (!se) return
    sets.value = se.sets.map((s) => ({ ...s }))
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
  const min = Math.floor(s.durationSeconds / 60)
  const sec = s.durationSeconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

async function persist() {
  const s = session.value
  if (!s) return
  await updateSessionExerciseSets(s.id, props.sessionExerciseId, sets.value)
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
    next.durationSeconds = last?.durationSeconds ?? fromLast?.durationSeconds
  }
  sets.value = [...sets.value, next]
  void persist()
}

function removeSet(id: string) {
  sets.value = sets.value.filter((s) => s.id !== id)
  void persist()
}

function bumpWeight(id: string, delta: number) {
  sets.value = sets.value.map((s) => {
    if (s.id !== id) return s
    const cur = s.weightKg ?? 0
    return { ...s, weightKg: Math.max(0, Math.round((cur + delta) * 10) / 10) }
  })
  void persist()
}

function bumpReps(id: string, delta: number) {
  sets.value = sets.value.map((s) => {
    if (s.id !== id) return s
    const cur = s.reps ?? 0
    return { ...s, reps: Math.max(0, cur + delta) }
  })
  void persist()
}

function bumpDuration(id: string, delta: number) {
  sets.value = sets.value.map((s) => {
    if (s.id !== id) return s
    const cur = s.durationSeconds ?? 0
    return { ...s, durationSeconds: Math.max(0, cur + delta) }
  })
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

function onDurationInput(id: string, raw: string) {
  const n = Number(raw)
  sets.value = sets.value.map((s) =>
    s.id === id
      ? {
          ...s,
          durationSeconds: Number.isFinite(n)
            ? Math.max(0, Math.round(n))
            : undefined,
        }
      : s,
  )
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

watch(
  sessionExercise,
  (se) => {
    if (session.value && !se) emit('close')
  },
)
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
      <p class="last-line mono">{{ lastLine }}</p>
    </section>

    <section class="sets">
      <h2 class="section">Подходы</h2>
      <ul class="set-list">
        <li v-for="(set, i) in sets" :key="set.id" class="set-row">
          <span class="idx mono">{{ i + 1 }}</span>

          <template v-if="mode === 'weight_reps'">
            <div class="field">
              <button type="button" class="step" @click="bumpWeight(set.id, -2.5)">−</button>
              <input
                class="num mono"
                type="number"
                inputmode="decimal"
                :value="set.weightKg ?? ''"
                placeholder="кг"
                @change="onWeightInput(set.id, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="step" @click="bumpWeight(set.id, 2.5)">+</button>
            </div>
            <div class="field">
              <button type="button" class="step" @click="bumpReps(set.id, -1)">−</button>
              <input
                class="num mono"
                type="number"
                inputmode="numeric"
                :value="set.reps ?? ''"
                placeholder="повт"
                @change="onRepsInput(set.id, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="step" @click="bumpReps(set.id, 1)">+</button>
            </div>
          </template>

          <template v-else-if="mode === 'reps_only'">
            <div class="field wide">
              <button type="button" class="step" @click="bumpReps(set.id, -1)">−</button>
              <input
                class="num mono"
                type="number"
                inputmode="numeric"
                :value="set.reps ?? ''"
                placeholder="повт"
                @change="onRepsInput(set.id, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="step" @click="bumpReps(set.id, 1)">+</button>
            </div>
          </template>

          <template v-else>
            <div class="field wide">
              <button type="button" class="step" @click="bumpDuration(set.id, -15)">−</button>
              <input
                class="num mono"
                type="number"
                inputmode="numeric"
                :value="set.durationSeconds ?? ''"
                placeholder="сек"
                @change="onDurationInput(set.id, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="step" @click="bumpDuration(set.id, 15)">+</button>
            </div>
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

    <button type="button" class="danger-link" @click="showDelete = true">
      УДАЛИТЬ УПРАЖНЕНИЕ
    </button>
  </BottomSheet>

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

.last-line {
  margin: 0;
  padding: 16px;
  border-radius: 14px;
  background: var(--color-surface-3);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
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
  gap: 8px;
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
  gap: 4px;
  min-width: 0;
}

.field.wide {
  flex: 1 1 auto;
}

.step {
  flex: 0 0 36px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-surface-2);
  color: var(--color-text-primary);
  font-size: 1.125rem;
}

.num {
  flex: 1 1 auto;
  min-width: 0;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: var(--color-surface-2);
  color: var(--color-text-primary);
  text-align: center;
  font-size: 1.0625rem;
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
