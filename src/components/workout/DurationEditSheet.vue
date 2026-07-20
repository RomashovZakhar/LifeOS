<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import {
  formatDurationMinSec,
  parseDurationMinSec,
} from '@/lib/workoutFormat'

const props = defineProps<{
  durationSeconds: number
}>()

const emit = defineEmits<{
  close: []
  save: [seconds: number]
}>()

const draft = ref('')

watch(
  () => props.durationSeconds,
  (s) => {
    draft.value = formatDurationMinSec(s)
  },
  { immediate: true },
)

const parsed = computed(() => parseDurationMinSec(draft.value))
const canSave = computed(() => parsed.value != null)

function onSave() {
  if (parsed.value == null) return
  emit('save', parsed.value)
  emit('close')
}
</script>

<template>
  <BottomSheet
    size="auto"
    title="Длительность"
    :layer="90"
    @close="emit('close')"
  >
    <label class="field">
      <span class="field-label">Минуты:секунды</span>
      <input
        v-model="draft"
        class="field-input mono"
        type="text"
        inputmode="numeric"
        placeholder="21:34"
        enterkeyhint="done"
        @keydown.enter.prevent="onSave"
      />
    </label>
    <p class="hint">Например 21:34 или 120:00 (два часа)</p>
    <template #footer>
      <button
        type="button"
        class="save"
        :disabled="!canSave"
        @click="onSave"
      >
        СОХРАНИТЬ
      </button>
    </template>
  </BottomSheet>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.field-input {
  height: 52px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.5rem;
  border: none;
  outline: none;
}

.hint {
  margin: 10px 0 0;
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
}

.save {
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
  background: var(--color-text-primary);
  color: var(--color-bg);
}

.save:disabled {
  opacity: 0.4;
}
</style>
