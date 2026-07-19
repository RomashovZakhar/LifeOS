<script setup lang="ts">
import CloseButton from '@/components/ui/CloseButton.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <main class="page">
    <header class="head">
      <h1 class="title">Оформление</h1>
      <CloseButton to="/settings" />
    </header>

    <section class="group" aria-label="Тема">
      <button
        type="button"
        class="row"
        :class="{ selected: settings.theme === 'dark' }"
        @click="settings.setTheme('dark')"
      >
        <span class="radio" :class="{ on: settings.theme === 'dark' }" />
        Тёмная
      </button>
      <button
        type="button"
        class="row"
        :class="{ selected: settings.theme === 'light' }"
        @click="settings.setTheme('light')"
      >
        <span class="radio" :class="{ on: settings.theme === 'light' }" />
        Светлая
      </button>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: 12px 16px;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
  padding-top: 4px;
}

.title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--color-surface-1);
}

.row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  text-align: left;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.0625rem;
}

.radio {
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
