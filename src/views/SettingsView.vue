<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import CloseButton from '@/components/ui/CloseButton.vue'
import { downloadExportJson } from '@/db'

const toast = ref<string | null>(null)
let toastTimer: number | undefined

async function onExport() {
  try {
    await downloadExportJson()
    flash('Файл готов')
  } catch {
    flash('Не удалось экспортировать')
  }
}

function flash(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = null
  }, 1800)
}
</script>

<template>
  <main class="page-shell">
    <header class="page-shell-head">
      <h1 class="page-shell-title">Настройки</h1>
      <CloseButton to="/" />
    </header>

    <section class="page-group">
      <RouterLink class="page-row between" to="/settings/trackers">
        <span>Трекеры</span>
        <span class="chev" aria-hidden="true">›</span>
      </RouterLink>
      <RouterLink class="page-row between" to="/settings/appearance">
        <span>Оформление</span>
        <span class="chev" aria-hidden="true">›</span>
      </RouterLink>
    </section>

    <section class="page-group block">
      <button type="button" class="page-row" @click="onExport">
        Экспорт данных
      </button>
    </section>

    <p v-if="toast" class="toast">{{ toast }}</p>
  </main>
</template>

<style scoped>
.between {
  justify-content: space-between;
}

.block {
  margin-top: 12px;
}

.chev {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  line-height: 1;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(28px + var(--safe-bottom));
  transform: translateX(-50%);
  margin: 0;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--color-surface-3);
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
  z-index: 30;
  white-space: nowrap;
}
</style>
