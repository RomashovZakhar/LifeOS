<script setup lang="ts">
import { computed, ref } from "vue";
import BottomSheet from "@/components/ui/BottomSheet.vue";
import ChipSelect from "@/components/ui/ChipSelect.vue";
import CloseButton from "@/components/ui/CloseButton.vue";
import { useLiveQuery } from "@/composables/useLiveQuery";
import {
  appendExerciseToSession,
  createExercise,
  db,
  listActiveExercises,
  startEmptySession,
  type Exercise,
  type TrackingMode,
  type WorkoutSession,
} from "@/db";
import { TRACKING_MODE_BADGE } from "@/lib/workoutFormat";

const props = defineProps<{
  date: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const session = useLiveQuery(
  async () =>
    (await db.workout_sessions.where("date").equals(props.date).first()) ??
    null,
  null as WorkoutSession | null,
  () => props.date,
);

const catalog = useLiveQuery(() => listActiveExercises(), [] as Exercise[]);

const query = ref("");
const toast = ref("");
const showCreate = ref(false);
const newName = ref("");
const newMode = ref<TrackingMode>("weight_reps");

const MODE_OPTIONS = [
  { value: "weight_reps" as const, label: "Вес и повторы" },
  { value: "reps_only" as const, label: "Повторы" },
  { value: "duration" as const, label: "Время" },
];

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return catalog.value;
  return catalog.value.filter((e) => e.name.toLowerCase().includes(q));
});

async function ensureSession(): Promise<WorkoutSession> {
  if (session.value) return session.value;
  return startEmptySession(props.date);
}

async function pick(exercise: Exercise) {
  const s = await ensureSession();
  const { already } = await appendExerciseToSession(s.id, exercise.id);
  if (already) {
    toast.value = "Уже в тренировке";
    window.setTimeout(() => {
      toast.value = "";
    }, 1600);
    return;
  }
  emit("close");
}

function openCreate() {
  newName.value = query.value.trim();
  newMode.value = "weight_reps";
  showCreate.value = true;
}

async function submitCreate() {
  const name = newName.value.trim();
  if (!name) return;
  const ex = await createExercise({ name, trackingMode: newMode.value });
  showCreate.value = false;
  await pick(ex);
}
</script>

<template>
  <BottomSheet
    size="tall"
    aria-label="Добавить упражнение"
    :layer="50"
    @close="emit('close')"
  >
    <template #header>
      <header class="head">
        <h1 class="title">Добавить упражнение</h1>
        <CloseButton />
      </header>
    </template>

    <input
      v-model="query"
      class="search"
      type="search"
      placeholder="Поиск"
      enterkeyhint="search"
    />

    <ul class="list">
      <li v-for="e in filtered" :key="e.id">
        <button type="button" class="row" @click="pick(e)">
          <span class="name">{{ e.name }}</span>
          <span class="mode">{{ TRACKING_MODE_BADGE[e.trackingMode] }}</span>
        </button>
      </li>
    </ul>

    <p v-if="filtered.length === 0" class="empty">Ничего не найдено</p>

    <button type="button" class="create" @click="openCreate">
      + Новое упражнение
    </button>
  </BottomSheet>

  <p v-if="toast" class="toast">{{ toast }}</p>

  <BottomSheet
    v-if="showCreate"
    size="auto"
    title="Новое упражнение"
    :layer="60"
    @close="showCreate = false"
  >
    <label class="field">
      <span class="label">Название</span>
      <input v-model="newName" class="input" type="text" maxlength="80" />
    </label>
    <div class="modes">
      <p class="label">Способ учёта</p>
      <ChipSelect v-model="newMode" :options="MODE_OPTIONS" />
    </div>
    <template #footer>
      <button
        type="button"
        class="cta"
        :disabled="!newName.trim()"
        @click="submitCreate"
      >
        СОЗДАТЬ
      </button>
    </template>
  </BottomSheet>
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

.search {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.0625rem;
  box-sizing: border-box;
}

.list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--color-surface-3);
  text-align: left;
  color: var(--color-text-primary);
}

.row:active {
  opacity: 0.9;
}

.name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.0625rem;
}

.mode {
  flex: 0 0 auto;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.empty {
  margin: 16px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
}

.create {
  width: 100%;
  margin-top: 16px;
  min-height: 52px;
  border-radius: 14px;
  border: 1px dashed
    color-mix(in srgb, var(--color-text-secondary) 40%, transparent);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.field,
.modes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.label {
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-text-primary);
}

.input {
  height: 52px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.0625rem;
  box-sizing: border-box;
}

.cta {
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.cta:disabled {
  opacity: 0.4;
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
  z-index: 80;
}
</style>
