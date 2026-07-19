<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EntrySheetShell from '@/components/habits/EntrySheetShell.vue'
import {
  deleteEntryById,
  getEntry,
  setCompletionEntry,
  type Tracker,
} from '@/db'

const props = defineProps<{
  tracker: Tracker
  date: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const hasEntry = ref(false)
const entryId = ref<string | null>(null)

onMounted(async () => {
  const e = await getEntry(props.tracker.id, props.date)
  hasEntry.value = !!e
  entryId.value = e?.id ?? null
})

async function onTrack() {
  await setCompletionEntry(props.tracker.id, props.date)
  emit('saved')
  emit('close')
}

async function onDelete() {
  if (entryId.value) await deleteEntryById(entryId.value)
  emit('saved')
  emit('close')
}
</script>

<template>
  <EntrySheetShell
    :date="date"
    :habit-name="tracker.name"
    @close="emit('close')"
  >
    <template #footer>
      <div class="actions">
        <button
          v-if="!hasEntry"
          type="button"
          class="primary"
          @click="onTrack"
        >
          ОТСЛЕДИТЬ
        </button>
        <button
          v-else
          type="button"
          class="danger"
          @click="onDelete"
        >
          УДАЛИТЬ ЗАПИСЬ
        </button>
      </div>
    </template>
  </EntrySheetShell>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.primary,
.danger {
  flex: 1 1 auto;
  height: 52px;
  border-radius: var(--radius-md);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.primary {
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
}

.danger {
  background: var(--color-danger-solid);
  color: #fff;
}

.primary:active,
.danger:active {
  opacity: 0.88;
}
</style>
