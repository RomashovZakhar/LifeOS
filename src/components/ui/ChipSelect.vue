<script setup lang="ts" generic="T extends string">
withDefaults(
  defineProps<{
    modelValue: T
    options: { value: T; label: string; disabled?: boolean }[]
    /** ring = type chips; fill = range chips (03) */
    variant?: 'ring' | 'fill'
  }>(),
  { variant: 'ring' },
)

defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <div class="chips" role="listbox" :class="variant">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="option"
      class="chip"
      :class="{
        selected: modelValue === opt.value,
        disabled: opt.disabled,
      }"
      :aria-selected="modelValue === opt.value"
      :disabled="opt.disabled"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chips.fill {
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex-shrink: 0;
}

.chips.fill::-webkit-scrollbar {
  display: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 12px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px transparent;
  transition:
    box-shadow 0.12s ease,
    opacity 0.12s ease,
    background 0.12s ease,
    color 0.12s ease;
  white-space: nowrap;
}

.chips.fill .chip {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  flex: 0 0 auto;
  font-weight: 500;
}

.chips.ring .chip.selected {
  box-shadow: inset 0 0 0 1.5px var(--color-border-selected);
}

.chips.fill .chip.selected {
  background: var(--color-text-primary);
  color: var(--color-cta-fg);
  box-shadow: none;
  font-weight: 500;
}

.chip.disabled,
.chip:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.chip:not(:disabled):active {
  opacity: 0.85;
}
</style>
