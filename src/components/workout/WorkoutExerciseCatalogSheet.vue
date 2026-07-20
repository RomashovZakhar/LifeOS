<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmDeleteSheet from '@/components/habits/ConfirmDeleteSheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import ChipSelect from '@/components/ui/ChipSelect.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import {
  archiveExercise,
  createExercise,
  listActiveExercises,
  renameExercise,
  type Exercise,
  type TrackingMode,
} from '@/db'
import { TRACKING_MODE_BADGE } from '@/lib/workoutFormat'

const emit = defineEmits<{
  close: []
}>()

const catalog = useLiveQuery(() => listActiveExercises(), [] as Exercise[])

const query = ref('')
const deleteTarget = ref<Exercise | null>(null)
const renameTarget = ref<Exercise | null>(null)
const renameDraft = ref('')
const showCreate = ref(false)
const newName = ref('')
const newMode = ref<TrackingMode>('weight_reps')

const MODE_OPTIONS = [
  { value: 'weight_reps' as const, label: 'Вес и повторы' },
  { value: 'reps_only' as const, label: 'Повторы' },
  { value: 'duration' as const, label: 'Время' },
]

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return catalog.value
  return catalog.value.filter((e) => e.name.toLowerCase().includes(q))
})

function openRename(e: Exercise) {
  renameTarget.value = e
  renameDraft.value = e.name
}

async function submitRename() {
  const e = renameTarget.value
  if (!e) return
  await renameExercise(e.id, renameDraft.value)
  renameTarget.value = null
}

async function onArchiveConfirm() {
  const e = deleteTarget.value
  if (!e) return
  await archiveExercise(e.id)
  deleteTarget.value = null
}

function openCreate() {
  newName.value = query.value.trim()
  newMode.value = 'weight_reps'
  showCreate.value = true
}

async function submitCreate() {
  const name = newName.value.trim()
  if (!name) return
  await createExercise({ name, trackingMode: newMode.value })
  showCreate.value = false
  query.value = ''
}
</script>

<template>
  <BottomSheet
    size="tall"
    aria-label="Каталог упражнений"
    :layer="50"
    @close="emit('close')"
  >
    <template #header>
      <header class="head">
        <h1 class="title">Каталог</h1>
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

    <p v-if="filtered.length === 0" class="empty">
      {{ catalog.length === 0 ? 'Нет упражнений' : 'Ничего не найдено' }}
    </p>

    <ul v-else class="list">
      <li v-for="e in filtered" :key="e.id" class="item">
        <button type="button" class="row" @click="openRename(e)">
          <span class="name">{{ e.name }}</span>
          <span class="mode">{{ TRACKING_MODE_BADGE[e.trackingMode] }}</span>
        </button>
        <button
          type="button"
          class="del"
          aria-label="Убрать из каталога"
          @click="deleteTarget = e"
        >
          ✕
        </button>
      </li>
    </ul>

    <button type="button" class="create" @click="openCreate">
      + Новое упражнение
    </button>
  </BottomSheet>

  <BottomSheet
    v-if="renameTarget"
    size="auto"
    title="Название"
    :layer="60"
    @close="renameTarget = null"
  >
    <label class="field">
      <span class="label">Название</span>
      <input
        v-model="renameDraft"
        class="input"
        type="text"
        maxlength="80"
        @keydown.enter.prevent="submitRename"
      />
    </label>
    <p class="helper">Способ учёта нельзя изменить</p>
    <template #footer>
      <button
        type="button"
        class="cta"
        :disabled="!renameDraft.trim()"
        @click="submitRename"
      >
        СОХРАНИТЬ
      </button>
    </template>
  </BottomSheet>

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
    v-if="deleteTarget"
    title="Убрать из каталога?"
    body="Упражнение исчезнет из списка. Прошлые тренировки сохранятся."
    confirm-label="УБРАТЬ"
    @close="deleteTarget = null"
    @confirm="onArchiveConfirm"
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

.empty {
  margin: 16px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
}

.list {
  list-style: none;
  margin: 16px 0 0;
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

.mode {
  flex: 0 0 auto;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
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

.helper {
  margin: 0 0 8px;
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
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
