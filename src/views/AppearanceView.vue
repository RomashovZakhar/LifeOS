<script setup lang="ts">
import CloseButton from '@/components/ui/CloseButton.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <main class="page-shell">
    <header class="page-shell-head">
      <h1 class="page-shell-title">Оформление</h1>
      <CloseButton to="/settings" />
    </header>

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
  </main>
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
