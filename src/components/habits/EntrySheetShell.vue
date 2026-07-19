<script setup lang="ts">
import { computed } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { entrySheetDateMeta } from '@/lib/dateMeta'

const props = defineProps<{
  date: string
  habitName: string
}>()

defineEmits<{
  close: []
}>()

const meta = computed(() => entrySheetDateMeta(props.date))
</script>

<template>
  <BottomSheet size="auto" :aria-label="habitName" @close="$emit('close')">
    <div class="entry-head">
      <div class="meta-block">
        <p class="meta">{{ meta }}</p>
        <h2 class="name">{{ habitName }}</h2>
      </div>
      <button
        type="button"
        class="close"
        aria-label="Закрыть"
        @click="$emit('close')"
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
    </div>

    <div class="entry-body">
      <slot />
    </div>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </BottomSheet>
</template>

<style scoped>
.entry-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.meta-block {
  min-width: 0;
}

.meta {
  margin: 0 0 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--color-text-primary);
}

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

.entry-body {
  min-height: 0;
}
</style>
