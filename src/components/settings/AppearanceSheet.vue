<script setup lang="ts">
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { useSettingsStore } from '@/stores/settings'

defineEmits<{
  close: []
}>()

const settings = useSettingsStore()
</script>

<template>
  <BottomSheet
    size="auto"
    title="Оформление"
    :layer="50"
    @close="$emit('close')"
  >
    <section class="page-group" aria-label="Тема">
      <button
        type="button"
        class="page-row"
        @click="settings.setTheme('dark')"
      >
        <span class="radio" :class="{ on: settings.theme === 'dark' }" />
        Тёмная
      </button>
      <button
        type="button"
        class="page-row"
        @click="settings.setTheme('light')"
      >
        <span class="radio" :class="{ on: settings.theme === 'light' }" />
        Светлая
      </button>
    </section>
  </BottomSheet>
</template>

<style scoped>
.radio {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1.5px var(--color-text-secondary);
  position: relative;
}

.radio.on {
  box-shadow: inset 0 0 0 1.5px var(--color-text-primary);
}

.radio.on::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 999px;
  background: var(--color-text-primary);
}
</style>
