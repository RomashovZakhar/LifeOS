<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EntrySheetShell from '@/components/habits/EntrySheetShell.vue'
import {
  deleteEntryById,
  getEntry,
  upsertEntry,
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

const kind = computed(() => props.tracker.type as 'count' | 'distance' | 'weight')
const allowDecimal = computed(
  () => kind.value === 'distance' || kind.value === 'weight',
)

const unitLabel = computed(() => {
  const cfg = props.tracker.config
  if (cfg && 'unit' in cfg && cfg.unit) return String(cfg.unit).toLowerCase()
  if (kind.value === 'distance') return 'km'
  if (kind.value === 'weight') return 'kg'
  return ''
})

const display = ref('0')
const entryId = ref<string | null>(null)
const isEdit = computed(() => entryId.value != null)

onMounted(async () => {
  const e = await getEntry(props.tracker.id, props.date)
  if (!e) return
  entryId.value = e.id
  if (e.value.kind === 'count') display.value = String(e.value.value)
  if (e.value.kind === 'distance' || e.value.kind === 'weight') {
    display.value = e.value.value.toFixed(1)
  }
})

function bump(delta: number) {
  const n = Number(display.value) || 0
  if (allowDecimal.value) {
    const next = Math.max(0, Math.round((n + delta) * 10) / 10)
    display.value = next.toFixed(1)
    return
  }
  display.value = String(Math.max(0, Math.round(n + delta)))
}

function key(k: string) {
  if (k === 'back') {
    display.value = display.value.length <= 1 ? '0' : display.value.slice(0, -1)
    return
  }
  if (k === '.') {
    if (!allowDecimal.value) return
    if (display.value.includes('.')) return
    display.value = `${display.value}.`
    return
  }
  if (display.value === '0' && k !== '.') display.value = k
  else display.value += k
}

async function onSave() {
  const value = Number(display.value)
  if (Number.isNaN(value)) return
  const type = kind.value
  if (type === 'count') {
    await upsertEntry(props.tracker.id, props.date, {
      kind: 'count',
      value: Math.round(value),
    })
  } else {
    await upsertEntry(props.tracker.id, props.date, {
      kind: type,
      value,
    })
  }
  emit('saved')
  emit('close')
}

async function onDelete() {
  if (entryId.value) await deleteEntryById(entryId.value)
  emit('saved')
  emit('close')
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
</script>

<template>
  <EntrySheetShell
    :date="date"
    :habit-name="tracker.name"
    @close="emit('close')"
  >
    <div class="stepper-card">
      <p v-if="unitLabel" class="unit">{{ unitLabel }}</p>
      <div class="stepper">
        <button type="button" class="step" aria-label="Меньше" @click="bump(-1)">−</button>
        <span class="value mono">{{ display }}</span>
        <button type="button" class="step" aria-label="Больше" @click="bump(1)">+</button>
      </div>
    </div>

    <div class="keypad">
      <button
        v-for="k in keys"
        :key="k"
        type="button"
        class="key mono"
        @click="key(k)"
      >
        {{ k }}
      </button>
      <button
        v-if="allowDecimal"
        type="button"
        class="key mono"
        @click="key('.')"
      >
        .
      </button>
      <span v-else class="key spacer" />
      <button type="button" class="key mono" @click="key('0')">0</button>
      <button type="button" class="key" aria-label="Стереть" @click="key('back')">
        ⌫
      </button>
    </div>

    <template #footer>
      <div class="actions">
        <button
          v-if="isEdit"
          type="button"
          class="trash"
          aria-label="Удалить запись"
          @click="onDelete"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 7H19M10 7V5H14V7M9 7V19H15V7"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button type="button" class="primary" @click="onSave">
          {{ isEdit ? 'ОБНОВИТЬ' : 'ОТСЛЕДИТЬ' }}
        </button>
      </div>
    </template>
  </EntrySheetShell>
</template>

<style scoped>
.stepper-card {
  border-radius: 16px;
  background: var(--color-surface-3);
  padding: 16px;
  margin-bottom: 16px;
}

.unit {
  margin: 0 0 8px;
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.step {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-surface-2);
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

.value {
  min-width: 72px;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 500;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px 8px;
  margin-bottom: 4px;
}

.key {
  height: 48px;
  font-size: 1.375rem;
  font-weight: 400;
  color: var(--color-text-primary);
  border-radius: 10px;
}

.key:active {
  background: var(--color-surface-3);
}

.key.spacer {
  pointer-events: none;
}

.actions {
  display: flex;
  gap: 10px;
}

.primary {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.trash {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-fg);
}
</style>
