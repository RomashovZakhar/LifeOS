<script setup lang="ts">
import { inject } from 'vue'
import { RouterLink } from 'vue-router'

defineProps<{
  to?: string
}>()

const emit = defineEmits<{
  click: []
}>()

const sheetClose = inject<(() => void) | undefined>('sheetClose', undefined)

function onClick() {
  if (sheetClose) {
    sheetClose()
    return
  }
  emit('click')
}
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    class="close"
    aria-label="Закрыть"
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 2L12 12M12 2L2 12"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  </RouterLink>
  <button
    v-else
    type="button"
    class="close"
    aria-label="Закрыть"
    @click="onClick"
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 2L12 12M12 2L2 12"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.close {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
}

.close:active {
  opacity: 0.75;
}
</style>
