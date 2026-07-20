<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import ChipSelect from '@/components/ui/ChipSelect.vue'
import {
  createTracker,
  hasWorkoutPortal,
  isSymbolTaken,
  updateTracker,
  type Tracker,
  type TrackerConfig,
  type TrackerType,
} from '@/db'
import {
  normalizeSymbolInput,
  symbolFromNamePreferCyrillic,
} from '@/lib/symbol'

const props = defineProps<{
  /** Prefill + save mode (type locked). */
  tracker?: Tracker
  /** Sheet z-index layer when nested above another sheet. */
  layer?: number
}>()

const emit = defineEmits<{
  close: []
  created: []
  saved: []
}>()

const TYPE_OPTIONS: { value: TrackerType; label: string }[] = [
  { value: 'completion', label: 'Завершение' },
  { value: 'distance', label: 'Дистанция' },
  { value: 'weight', label: 'Вес' },
  { value: 'time', label: 'Время' },
  { value: 'count', label: 'Число' },
  { value: 'workout_portal', label: 'Тренировка' },
  { value: 'checklist', label: 'Чеклист' },
]

const PLACEHOLDERS: Record<TrackerType, { name: string; symbol: string }> = {
  completion: { name: 'Зарядка', symbol: 'ЗАР' },
  time: { name: 'Подъём', symbol: 'ПОД' },
  count: { name: 'Кофе', symbol: 'КОФЕ' },
  distance: { name: 'Бег', symbol: 'БЕГ' },
  weight: { name: 'Вес', symbol: 'ВЕС' },
  workout_portal: { name: 'Тренировка', symbol: 'ТРЕНИ' },
  checklist: { name: 'Ритуал', symbol: 'РИТ' },
}

const isEdit = computed(() => props.tracker != null)

const name = ref('')
const symbol = ref('')
const symbolDirty = ref(false)
const type = ref<TrackerType>('completion')
const timeFormat = ref<'24h' | 'ampm'>('24h')
const countUnit = ref('')
const distanceUnit = ref<'km' | 'mi'>('km')
const weightUnit = ref<'kg' | 'lb'>('kg')

const portalTaken = ref(false)
const symbolCollision = ref(false)
const saving = ref(false)

const typeOptions = computed(() =>
  TYPE_OPTIONS.map((o) => ({
    ...o,
    disabled:
      isEdit.value ||
      (o.value === 'workout_portal' && portalTaken.value),
  })),
)

const namePlaceholder = computed(() => PLACEHOLDERS[type.value].name)
const symbolPlaceholder = computed(() => {
  if (name.value.trim()) {
    return (
      symbolFromNamePreferCyrillic(name.value) ||
      PLACEHOLDERS[type.value].symbol
    )
  }
  return PLACEHOLDERS[type.value].symbol
})

const timeFormatHint = computed(() =>
  timeFormat.value === 'ampm' ? 'напр. 10:30 PM' : 'напр. 22:30',
)

const canSubmit = computed(() => {
  const n = name.value.trim()
  const s = (symbol.value.trim() || symbolPlaceholder.value).trim()
  if (!n || !s || s.length > 5) return false
  if (symbolCollision.value) return false
  if (
    !isEdit.value &&
    type.value === 'workout_portal' &&
    portalTaken.value
  ) {
    return false
  }
  if (saving.value) return false
  return true
})

function applyTracker(t: Tracker) {
  name.value = t.name
  symbol.value = t.symbol
  symbolDirty.value = true
  type.value = t.type
  const cfg = t.config
  if (t.type === 'time' && cfg && 'timeFormat' in cfg && cfg.timeFormat) {
    timeFormat.value = cfg.timeFormat
  }
  if (t.type === 'count') {
    countUnit.value =
      cfg && 'unit' in cfg && cfg.unit ? String(cfg.unit) : ''
  }
  if (t.type === 'distance' && cfg && 'unit' in cfg) {
    distanceUnit.value = cfg.unit === 'mi' ? 'mi' : 'km'
  }
  if (t.type === 'weight' && cfg && 'unit' in cfg) {
    weightUnit.value = cfg.unit === 'lb' ? 'lb' : 'kg'
  }
}

onMounted(async () => {
  portalTaken.value = await hasWorkoutPortal()
  if (props.tracker) applyTracker(props.tracker)
})

watch(
  () => props.tracker,
  (t) => {
    if (t) applyTracker(t)
  },
)

watch(name, (v) => {
  if (!symbolDirty.value && !isEdit.value) {
    symbol.value = symbolFromNamePreferCyrillic(v)
  }
})

watch([symbol, type], async () => {
  const s = effectiveSymbol()
  symbolCollision.value = s
    ? await isSymbolTaken(s, props.tracker?.id)
    : false
})

function effectiveSymbol(): string {
  const s = symbol.value.trim() || symbolPlaceholder.value
  return normalizeSymbolInput(s)
}

function onSymbolInput(e: Event) {
  symbolDirty.value = true
  const el = e.target as HTMLInputElement
  symbol.value = normalizeSymbolInput(el.value)
}

function buildConfig(): TrackerConfig {
  switch (type.value) {
    case 'time':
      return { timeFormat: timeFormat.value }
    case 'count': {
      const u = countUnit.value.trim()
      return u ? { unit: u } : {}
    }
    case 'distance':
      return { unit: distanceUnit.value }
    case 'weight':
      return { unit: weightUnit.value }
    default:
      return {}
  }
}

async function onSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const s = effectiveSymbol()
    if (await isSymbolTaken(s, props.tracker?.id)) {
      symbolCollision.value = true
      return
    }
    if (isEdit.value && props.tracker) {
      await updateTracker(props.tracker.id, {
        name: name.value.trim(),
        symbol: s,
        config: buildConfig(),
      })
      emit('saved')
      emit('close')
      return
    }
    await createTracker({
      name: name.value.trim(),
      symbol: s,
      type: type.value,
      config: buildConfig(),
    })
    emit('created')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BottomSheet
    :title="isEdit ? 'Изменить трекер' : 'Новый трекер'"
    size="tall"
    :layer="layer ?? 40"
    @close="emit('close')"
  >
    <div class="form">
      <label class="field">
        <span class="label">Имя</span>
        <input
          v-model="name"
          class="input"
          type="text"
          enterkeyhint="next"
          autocomplete="off"
          :placeholder="namePlaceholder"
        />
      </label>

      <label class="field">
        <span class="label">Symbol</span>
        <input
          class="input input-symbol mono"
          type="text"
          maxlength="5"
          enterkeyhint="done"
          autocomplete="off"
          :value="symbol"
          :placeholder="symbolPlaceholder"
          @input="onSymbolInput"
        />
        <span class="helper">Короткое имя для сетки. Макс. 5 символов.</span>
        <span v-if="symbolCollision" class="error">Такой символ уже есть</span>
      </label>

      <div class="field">
        <span class="label">Тип</span>
        <ChipSelect v-model="type" :options="typeOptions" />
        <span v-if="isEdit" class="helper">Тип нельзя изменить</span>
        <span v-else-if="portalTaken" class="helper">Уже добавлена</span>
      </div>

      <div v-if="type === 'time'" class="field">
        <span class="label">Формат времени</span>
        <ChipSelect
          v-model="timeFormat"
          :options="[
            { value: 'ampm', label: 'AM/PM' },
            { value: '24h', label: '24 часа' },
          ]"
        />
        <span class="helper">{{ timeFormatHint }}</span>
      </div>

      <label v-if="type === 'count'" class="field">
        <span class="label">Единица</span>
        <input
          v-model="countUnit"
          class="input"
          type="text"
          autocomplete="off"
          placeholder="чашки, разы…"
        />
        <span class="helper">Необязательно</span>
      </label>

      <div v-if="type === 'distance'" class="field">
        <span class="label">Единица</span>
        <ChipSelect
          v-model="distanceUnit"
          :options="[
            { value: 'km', label: 'Километры' },
            { value: 'mi', label: 'Мили' },
          ]"
        />
      </div>

      <div v-if="type === 'weight'" class="field">
        <span class="label">Единица</span>
        <ChipSelect
          v-model="weightUnit"
          :options="[
            { value: 'kg', label: 'Килограммы' },
            { value: 'lb', label: 'Фунты' },
          ]"
        />
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="create"
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        {{ isEdit ? 'СОХРАНИТЬ' : 'СОЗДАТЬ' }}
      </button>
    </template>
  </BottomSheet>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  width: 100%;
  box-sizing: border-box;
  min-height: 52px;
  padding: 14px 16px;
  border: 0;
  border-radius: 14px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.0625rem;
  font-weight: 400;
  caret-color: var(--color-accent);
  outline: none;
}

.input-symbol,
.input-symbol::placeholder {
  color: var(--color-text-secondary);
}

.input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.85;
}

.input:focus {
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--color-text-secondary) 35%, transparent);
}

.helper {
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
  line-height: 1.35;
}

.error {
  font-size: var(--type-helper);
  color: var(--color-danger-fg);
}

.create {
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.create:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.create:not(:disabled):active {
  opacity: 0.88;
}
</style>
