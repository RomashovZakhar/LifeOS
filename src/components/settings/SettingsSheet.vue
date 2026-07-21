<script setup lang="ts">
import { ref } from 'vue'
import AppearanceSheet from '@/components/settings/AppearanceSheet.vue'
import TrackersOrderSheet from '@/components/settings/TrackersOrderSheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { downloadExportJson } from '@/db'

defineProps<{
  /** Nested panel: root list, or child sheet open. */
  panel: 'root' | 'appearance' | 'trackers'
}>()

const emit = defineEmits<{
  close: []
  navigate: [panel: 'root' | 'appearance' | 'trackers']
}>()

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
  <BottomSheet
    size="tall"
    title="Настройки"
    :layer="40"
    @close="emit('close')"
  >
    <section class="page-group">
      <button
        type="button"
        class="page-row between"
        @click="emit('navigate', 'trackers')"
      >
        <span>Трекеры</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
      <button
        type="button"
        class="page-row between"
        @click="emit('navigate', 'appearance')"
      >
        <span>Оформление</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
    </section>

    <section class="page-group block">
      <button type="button" class="page-row" @click="onExport">
        Экспорт данных
      </button>
    </section>

    <p v-if="toast" class="toast">{{ toast }}</p>
  </BottomSheet>

  <AppearanceSheet
    v-if="panel === 'appearance'"
    @close="emit('navigate', 'root')"
  />
  <TrackersOrderSheet
    v-if="panel === 'trackers'"
    @close="emit('navigate', 'root')"
  />
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
  z-index: 60;
  white-space: nowrap;
}
</style>
