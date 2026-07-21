<script setup lang="ts">
import { ref } from "vue";
import ConfirmDeleteSheet from "@/components/habits/ConfirmDeleteSheet.vue";
import WorkoutTemplateEditSheet from "@/components/workout/WorkoutTemplateEditSheet.vue";
import BottomSheet from "@/components/ui/BottomSheet.vue";
import CloseButton from "@/components/ui/CloseButton.vue";
import { useLiveQuery } from "@/composables/useLiveQuery";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  startSessionFromTemplate,
  type WorkoutTemplate,
} from "@/db";

const props = defineProps<{
  date: string;
  mode: "select" | "manage";
}>();

const emit = defineEmits<{
  close: [];
}>();

const templates = useLiveQuery(() => listTemplates(), [] as WorkoutTemplate[]);

const showCreate = ref(false);
const newName = ref("");
const deleteTarget = ref<WorkoutTemplate | null>(null);
const editId = ref<string | null>(null);

async function onSelect(t: WorkoutTemplate) {
  if (props.mode === "select") {
    await startSessionFromTemplate(props.date, t.id);
    emit("close");
    return;
  }
  editId.value = t.id;
}

function openCreate() {
  newName.value = "";
  showCreate.value = true;
}

async function submitCreate() {
  const t = await createTemplate(newName.value.trim() || "Программа");
  showCreate.value = false;
  editId.value = t.id;
}

async function onDeleteConfirm() {
  const t = deleteTarget.value;
  if (!t) return;
  await deleteTemplate(t.id);
  deleteTarget.value = null;
}
</script>

<template>
  <BottomSheet
    size="auto"
    aria-label="Программы"
    :layer="50"
    @close="emit('close')"
  >
    <template #header>
      <header class="head">
        <h1 class="title">
          {{ mode === "select" ? "Выбрать программу" : "Программы" }}
        </h1>
        <CloseButton />
      </header>
    </template>

    <p v-if="templates.length === 0" class="empty">Нет программ</p>

    <ul v-else class="list">
      <li v-for="t in templates" :key="t.id" class="item">
        <button type="button" class="row" @click="onSelect(t)">
          <span class="name">{{ t.name }}</span>
          <span class="meta">{{ t.exerciseIds.length }} упр.</span>
          <span class="chev" aria-hidden="true">›</span>
        </button>
        <button
          v-if="mode === 'manage'"
          type="button"
          class="del"
          aria-label="Удалить"
          @click="deleteTarget = t"
        >
          ✕
        </button>
      </li>
    </ul>

    <button
      v-if="mode === 'manage'"
      type="button"
      class="create"
      @click="openCreate"
    >
      + Новая программа
    </button>
  </BottomSheet>

  <BottomSheet
    v-if="showCreate"
    size="auto"
    title="Новая программа"
    :layer="60"
    @close="showCreate = false"
  >
    <label class="field">
      <span class="label">Название</span>
      <input v-model="newName" class="input" type="text" maxlength="60" />
    </label>
    <template #footer>
      <button type="button" class="cta" @click="submitCreate">СОЗДАТЬ</button>
    </template>
  </BottomSheet>

  <ConfirmDeleteSheet
    v-if="deleteTarget"
    title="Удалить программу?"
    body="Тренировки не изменятся."
    @close="deleteTarget = null"
    @confirm="onDeleteConfirm"
  />

  <WorkoutTemplateEditSheet
    v-if="editId"
    :template-id="editId"
    @close="editId = null"
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

.empty {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: flex;
  gap: 8px;
}

.row {
  flex: 1 1 auto;
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

.meta {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.chev {
  color: var(--color-text-secondary);
  font-size: 1.25rem;
  line-height: 1;
}

.del {
  flex: 0 0 56px;
  border-radius: 14px;
  background: var(--color-surface-3);
  color: var(--color-text-secondary);
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
</style>
