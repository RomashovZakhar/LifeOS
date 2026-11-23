<script setup lang="ts">
import { Dumbbell } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import WorkoutTemplatesSheet from "@/components/workout/WorkoutTemplatesSheet.vue";
import BottomSheet from "@/components/ui/BottomSheet.vue";
import CloseButton from "@/components/ui/CloseButton.vue";
import { useLiveQuery } from "@/composables/useLiveQuery";
import {
  getPortalTracker,
  listSessionsByDate,
  listTemplates,
  startEmptySession,
  todayDate,
  type Tracker,
  type WorkoutSession,
  type WorkoutTemplate,
} from "@/db";
import { formatDateFullRu, isFutureDate } from "@/lib/calendar";
import { formatDurationMinSec, formatStartedClock } from "@/lib/workoutFormat";

const props = defineProps<{
  date: string;
}>();

const emit = defineEmits<{
  close: [];
  openSession: [sessionId: string];
}>();

const today = todayDate();
const isFuture = computed(() => isFutureDate(props.date, today));
const showStart = ref(false);
const showPrograms = ref(false);
const creating = ref(false);

const portal = useLiveQuery(
  async () => (await getPortalTracker()) ?? null,
  undefined as Tracker | null | undefined,
);

const sessions = useLiveQuery(
  () => listSessionsByDate(props.date),
  [] as WorkoutSession[],
  () => props.date,
);

const templates = useLiveQuery(() => listTemplates(), [] as WorkoutTemplate[]);

const sessionsReady = ref(false);
const templatesReady = ref(false);
watch(sessions, () => {
  sessionsReady.value = true;
});
watch(templates, () => {
  templatesReady.value = true;
});
const showEmptyStart = computed(
  () =>
    sessionsReady.value &&
    templatesReady.value &&
    !isFuture.value &&
    sessions.value.length === 0,
);

const templateById = computed(() => {
  const m = new Map<string, WorkoutTemplate>();
  for (const t of templates.value) m.set(t.id, t);
  return m;
});

const dateLabel = computed(() =>
  props.date === today ? "Сегодня" : formatDateFullRu(props.date),
);

const portalName = computed(() => portal.value?.name ?? "Тренировка");

watch(portal, (p) => {
  if (p === undefined) return;
  if (p === null) emit("close");
});

function programName(session: WorkoutSession): string {
  if (!session.templateId) return "Свободная тренировка";
  return (
    templateById.value.get(session.templateId)?.name ?? "Свободная тренировка"
  );
}

function exerciseCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} упражнение`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} упражнения`;
  }
  return `${n} упражнений`;
}

function statusLabel(session: WorkoutSession): string {
  if (session.status === "completed") return "завершена";
  if (session.pausedAt) return "на паузе";
  return "идёт";
}

function durationLabel(session: WorkoutSession): string | null {
  if (session.status !== "completed" || session.durationSeconds == null) {
    return null;
  }
  return formatDurationMinSec(session.durationSeconds);
}

async function beginEmpty() {
  if (creating.value || isFuture.value) return;
  creating.value = true;
  try {
    const session = await startEmptySession(props.date);
    showStart.value = false;
    emit("openSession", session.id);
  } finally {
    creating.value = false;
  }
}

function onNew() {
  if (isFuture.value || creating.value) return;
  if (templates.value.length === 0) {
    void beginEmpty();
    return;
  }
  showStart.value = true;
}

function onProgramStarted(sessionId: string) {
  showPrograms.value = false;
  showStart.value = false;
  emit("openSession", sessionId);
}
</script>

<template>
  <BottomSheet
    size="tall"
    :aria-label="portalName"
    :layer="30"
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
    </div>

    <p v-if="isFuture" class="hint">Нельзя начать в будущем</p>

    <ul v-if="sessions.length" class="list">
      <li v-for="s in sessions" :key="s.id">
        <button type="button" class="row" @click="emit('openSession', s.id)">
          <span class="mark" aria-hidden="true">
            <Dumbbell :size="22" :stroke-width="1.75" />
          </span>
          <span class="copy">
            <span class="program">{{ programName(s) }}</span>
            <span class="sub">
              <span class="mono">{{ formatStartedClock(s.startedAt) }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ exerciseCountLabel(s.exercises.length) }}</span>
              <template v-if="durationLabel(s)">
                <span aria-hidden="true">·</span>
                <span class="mono">{{ durationLabel(s) }}</span>
              </template>
              <span aria-hidden="true">·</span>
              <span>{{ statusLabel(s) }}</span>
            </span>
          </span>
        </button>
      </li>
    </ul>

    <template v-if="!isFuture && (showEmptyStart || sessions.length)" #footer>
      <div v-if="showEmptyStart" class="footer">
        <button
          v-if="templates.length"
          type="button"
          class="cta"
          @click="showPrograms = true"
        >
          ВЫБРАТЬ ПРОГРАММУ
        </button>
        <button
          type="button"
          :class="templates.length ? 'secondary' : 'cta'"
          :disabled="creating"
          @click="beginEmpty"
        >
          {{ templates.length ? "Пустая тренировка" : "НАЧАТЬ ТРЕНИРОВКУ" }}
        </button>
      </div>
      <button
        v-else
        type="button"
        class="cta"
        :disabled="creating"
        @click="onNew"
      >
        НОВАЯ ТРЕНИРОВКА
      </button>
    </template>
  </BottomSheet>

  <BottomSheet
    v-if="showStart"
    size="tall"
    aria-label="Новая тренировка"
    :layer="35"
    @close="showStart = false"
  >
    <template #header>
      <header class="head">
        <CloseButton />
      </header>
    </template>

    <div class="hero">
      <p class="eyebrow">{{ dateLabel }}</p>
      <h1 class="title">{{ portalName }}</h1>
    </div>

    <template #footer>
      <div class="footer">
        <button type="button" class="cta" @click="showPrograms = true">
          ВЫБРАТЬ ПРОГРАММУ
        </button>
        <button
          type="button"
          class="secondary"
          :disabled="creating"
          @click="beginEmpty"
        >
          Пустая тренировка
        </button>
      </div>
    </template>
  </BottomSheet>

  <WorkoutTemplatesSheet
    v-if="showPrograms"
    :date="date"
    mode="select"
    @close="showPrograms = false"
    @started="onProgramStarted"
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

.hint {
  margin: 20px 0 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.list {
  list-style: none;
  margin: 20px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 72px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--color-surface-3);
  text-align: left;
  color: var(--color-text-primary);
}

.row:active {
  opacity: 0.9;
}

.copy {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.program {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.0625rem;
  line-height: 1.25;
  color: var(--color-text-primary);
}

.sub {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  font-size: 0.8125rem;
  line-height: 1.3;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.mark {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, #fff 18%, var(--color-surface-3));
  color: var(--color-text-secondary);
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.secondary {
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: var(--type-cta);
  font-weight: 600;
}

.cta:disabled,
.secondary:disabled {
  opacity: 0.35;
}
</style>
