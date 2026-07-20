<script setup lang="ts">
import BottomSheet from '@/components/ui/BottomSheet.vue'

defineProps<{
  title?: string
  body?: string
  confirmLabel?: string
}>()

defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BottomSheet
    size="auto"
    :title="title || 'Удалить трекер?'"
    :layer="100"
    @close="$emit('close')"
  >
    <p class="body">
      {{ body || 'Записи этого трекера будут удалены. Это нельзя отменить.' }}
    </p>
    <template #footer>
      <div class="actions">
        <button type="button" class="cancel" @click="$emit('close')">
          ОТМЕНА
        </button>
        <button type="button" class="danger" @click="$emit('confirm'); $emit('close')">
          {{ confirmLabel || 'УДАЛИТЬ' }}
        </button>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
.body {
  margin: 0 0 8px;
  font-size: var(--type-body);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 10px;
}

.cancel,
.danger {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-md);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.cancel {
  background: var(--color-surface-3);
  color: var(--color-text-primary);
}

.danger {
  background: var(--color-danger-solid);
  color: #fff;
}

.cancel:active,
.danger:active {
  opacity: 0.88;
}
</style>
