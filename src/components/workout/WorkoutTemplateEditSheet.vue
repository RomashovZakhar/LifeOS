<script setup lang="ts">
import Sortable from "sortablejs";
import { computed, inject, nextTick, onUnmounted, ref, watch } from "vue";
import ConfirmDeleteSheet from "@/components/habits/ConfirmDeleteSheet.vue";
import BottomSheet from "@/components/ui/BottomSheet.vue";
import ChipSelect from "@/components/ui/ChipSelect.vue";
import CloseButton from "@/components/ui/CloseButton.vue";
import { SHEET_DISMISS_LOCK_KEY } from "@/composables/sheetDismissLock";
import { useLiveQuery } from "@/composables/useLiveQuery";
import {
  createExercise,
  deleteTemplate,
  getTemplate,
  listActiveExercises,
  putTemplate,
  type Exercise,
  type TrackingMode,
  type WorkoutTemplate,
} from "@/db";
import { TRACKING_MODE_BADGE } from "@/lib/workoutFormat";

const props = defineProps<{
  templateId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const dismissLock = inject(SHEET_DISMISS_LOCK_KEY, null);

const template = useLiveQuery(
  async () => (await getTemplate(props.templateId)) ?? null,
  null as WorkoutTemplate | null,
  () => props.templateId,
);

const catalog = useLiveQuery(() => listActiveExercises(), [] as Exercise[]);

const exerciseById = computed(() => {
  const m = new Map<string, Exercise>();
  for (const e of catalog.value) m.set(e.id, e);
  return m;
});

const name = ref("");
watch(
  template,
  (t) => {
    if (t) name.value = t.name;
  },
  { immediate: true },
);

const orderedIds = computed(() => template.value?.exerciseIds ?? []);

const showAdd = ref(false);
const showCreate = ref(false);
const showDelete = ref(false);
const newName = ref("");
const newMode = ref<TrackingMode>("weight_reps");
const search = ref("");

const MODE_OPTIONS = [
  { value: "weight_reps" as const, label: "Вес и повторы" },
  { value: "reps_only" as const, label: "Повторы" },
  { value: "duration" as const, label: "Время" },
];

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  const all = catalog.value;
  if (!q) return all;
  return all.filter((e) => e.name.toLowerCase().includes(q));
});

async function saveName() {
  const t = template.value;
  if (!t) return;
  const next = name.value.trim();
  if (!next || next === t.name) return;
  await putTemplate({ ...t, name: next });
}

async function setIds(ids: string[]) {
  const t = template.value;
  if (!t) return;
  await putTemplate({ ...t, exerciseIds: ids });
}

async function addExercise(id: string) {
  const t = template.value;
  if (!t) return;
  if (t.exerciseIds.includes(id)) {
    showAdd.value = false;
    return;
  }
  await setIds([...t.exerciseIds, id]);
  showAdd.value = false;
}

async function removeExercise(id: string) {
  const t = template.value;
  if (!t) return;
  await setIds(t.exerciseIds.filter((x) => x !== id));
}

async function submitCreate() {
  const n = newName.value.trim();
  if (!n) return;
  const ex = await createExercise({ name: n, trackingMode: newMode.value });
  showCreate.value = false;
  await addExercise(ex.id);
}

async function onDelete() {
  await deleteTemplate(props.templateId);
  showDelete.value = false;
  emit("close");
}

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
    onStart: () => dismissLock?.lock(),
    onEnd: async (evt) => {
      dismissLock?.unlock();
      if (evt.oldIndex == null || evt.newIndex == null) return;
      if (evt.oldIndex === evt.newIndex) return;
      const ids = [...orderedIds.value];
      const [moved] = ids.splice(evt.oldIndex, 1);
      ids.splice(evt.newIndex, 0, moved);
      await setIds(ids);
    },
  });
}

watch(
  listEl,
  async (el) => {
    await nextTick();
    if (el && orderedIds.value.length) createSortable(el);
    else destroySortable();
  },
  { flush: "post" },
);

watch(
  () => orderedIds.value.length,
  async () => {
    await nextTick();
    if (listEl.value && orderedIds.value.length) createSortable(listEl.value);
  },
);

watch(template, (t) => {
  if (t === null) emit("close");
});

onUnmounted(() => {
  dismissLock?.unlock();
  destroySortable();
});
</script>

<template>
  <BottomSheet
    v-if="template"
    size="tall"
    aria-label="Программа"
    :layer="60"
    @close="emit('close')"
  >
    <template #header>
      <header class="head">
        <h1 class="title">Программа</h1>
        <CloseButton />
      </header>
    </template>

    <label class="field">
      <span class="label">Название</span>
      <input
        v-model="name"
        class="input"
        type="text"
        maxlength="60"
        @change="saveName"
        @blur="saveName"
      />
    </label>

    <h2 class="section">Упражнения</h2>
    <ul v-if="orderedIds.length" ref="listEl" class="list">
      <li v-for="id in orderedIds" :key="id" class="row" :data-id="id">
        <button type="button" class="handle" aria-label="Перетащить">≡</button>
        <span class="name">{{ exerciseById.get(id)?.name ?? "Удалено" }}</span>
        <button
          type="button"
          class="del"
          aria-label="Убрать"
          @click="removeExercise(id)"
        >
          ✕
        </button>
      </li>
    </ul>
    <p v-else class="empty">Добавьте упражнения</p>

    <button type="button" class="add" @click="showAdd = true">
      + Упражнение
    </button>

    <button type="button" class="danger" @click="showDelete = true">
      УДАЛИТЬ ПРОГРАММУ
    </button>
  </BottomSheet>

  <BottomSheet
    v-if="showAdd"
    size="tall"
    title="Упражнение"
    :layer="70"
    @close="showAdd = false"
  >
    <input v-model="search" class="search" type="search" placeholder="Поиск" />
    <ul class="pick">
      <li v-for="e in filtered" :key="e.id">
        <button type="button" class="pick-row" @click="addExercise(e.id)">
          <span>{{ e.name }}</span>
          <span class="mode">{{ TRACKING_MODE_BADGE[e.trackingMode] }}</span>
        </button>
      </li>
    </ul>
    <button
      type="button"
      class="add"
      @click="
        showAdd = false;
        showCreate = true;
        newName = search.trim();
      "
    >
      + Новое упражнение
    </button>
  </BottomSheet>

  <BottomSheet
    v-if="showCreate"
    size="auto"
    title="Новое упражнение"
    :layer="70"
    @close="showCreate = false"
  >
    <label class="field">
      <span class="label">Название</span>
      <input v-model="newName" class="input" type="text" maxlength="80" />
    </label>
    <div class="field">
      <span class="label">Способ учёта</span>
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

  <ConfirmDeleteSheet
    v-if="showDelete"
    title="Удалить программу?"
    body="Тренировки не изменятся."
    @close="showDelete = false"
    @confirm="onDelete"
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

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-text-primary);
}

.input,
.search {
  height: 52px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.0625rem;
  box-sizing: border-box;
}

.search {
  width: 100%;
  margin-bottom: 12px;
}

.section {
  margin: 22px 0 12px;
  font-size: 1.25rem;
  font-weight: 400;
}

.list,
.pick {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 56px;
  border-radius: 14px;
  background: var(--color-surface-3);
  overflow: hidden;
}

.row-ghost {
  opacity: 0.35;
}

.handle {
  flex: 0 0 44px;
  height: 56px;
  color: var(--color-text-secondary);
  touch-action: none;
  font-size: 1.125rem;
}

.name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.0625rem;
}

.del {
  flex: 0 0 48px;
  height: 56px;
  color: var(--color-text-secondary);
}

.empty {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
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

.danger {
  width: 100%;
  margin-top: 28px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-fg);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.pick-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-height: 56px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--color-surface-3);
  text-align: left;
  color: var(--color-text-primary);
  font-size: 1.0625rem;
}

.mode {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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
</style>
