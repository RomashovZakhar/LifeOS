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
  <main class="page">
    <header class="head">
      <h1 class="title">Настройки</h1>
      <CloseButton to="/" />
    </header>

    <section class="group">
      <RouterLink class="row" to="/settings/appearance">
        <span>Оформление</span>
        <span class="chev" aria-hidden="true">›</span>
      </RouterLink>
    </section>

    <section class="group">
      <button type="button" class="row action" @click="onExport">
        Экспорт данных
      </button>
    </section>

    <p v-if="toast" class="toast">{{ toast }}</p>
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
  margin-bottom: 16px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--color-surface-1);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 16px;
  text-align: left;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-size: 1.0625rem;
  text-decoration: none;
}

.row.action {
  justify-content: flex-start;
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
