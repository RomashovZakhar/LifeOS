<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()

onMounted(() => {
  void settings.hydrate()
})
</script>

<template>
  <div class="app-shell">
    <RouterView v-if="settings.ready" />
    <div v-else class="boot helper">LifeOS</div>
  </div>
</template>

<style scoped>
.boot {
  display: grid;
  place-items: center;
  font-family: var(--font-sans);
  color: var(--color-text-secondary);
}
</style>
