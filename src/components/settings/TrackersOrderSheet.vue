<script setup lang="ts">
import Sortable from 'sortablejs'
import { inject, nextTick, onUnmounted, ref, watch } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { SHEET_DISMISS_LOCK_KEY } from '@/composables/sheetDismissLock'
import { db, reorderTrackers, type Tracker } from '@/db'
import { trackerTypeLabel } from '@/lib/trackerLabels'

defineEmits<{
  close: []
}>()

const dismissLock = inject(SHEET_DISMISS_LOCK_KEY, null)

const trackers = useLiveQuery(
  () => db.trackers.orderBy('sortOrder').toArray(),
  [] as Tracker[],
)

const listEl = ref<HTMLElement | null>(null)
const local = ref<Tracker[]>([])
const sorting = ref(false)
let sortable: Sortable | null = null

watch(
  trackers,
  (list) => {
    if (sorting.value) return
    local.value = list.map((t) => ({ ...t }))
  },
  { immediate: true },
)

function destroySortable() {
  sortable?.destroy()
  sortable = null
}

function createSortable(el: HTMLElement) {
  destroySortable()
  sortable = Sortable.create(el, {
    animation: 200,
    handle: '.handle',
    ghostClass: 'row-ghost',
    chosenClass: 'row-chosen',
    dragClass: 'row-drag',
    forceFallback: true,
    fallbackOnBody: true,
    fallbackClass: 'row-fallback',
    fallbackTolerance: 4,
    touchStartThreshold: 5,
    direction: 'vertical',
    onStart: () => {
      sorting.value = true
      dismissLock?.lock()
    },
    onEnd: async (evt) => {
      dismissLock?.unlock()
      const { oldIndex, newIndex } = evt
      if (
        oldIndex == null ||
        newIndex == null ||
        oldIndex === newIndex
      ) {
        sorting.value = false
        return
      }
      const next = [...local.value]
      const [moved] = next.splice(oldIndex, 1)
      if (!moved) {
        sorting.value = false
        return
      }
      next.splice(newIndex, 0, moved)
      local.value = next
      try {
        await reorderTrackers(next.map((t) => t.id))
      } finally {
        sorting.value = false
      }
    },
  })
}

watch(
  listEl,
  async (el) => {
    if (el) {
      await nextTick()
      createSortable(el)
    } else destroySortable()
  },
  { flush: 'post' },
)

onUnmounted(() => {
  dismissLock?.unlock()
  destroySortable()
})
</script>

<template>
  <BottomSheet
    size="tall"
    title="Трекеры"
    :layer="50"
    @close="$emit('close')"
  >
    <p class="hint">Перетащи ≡ — порядок колонок в сетке слева направо.</p>

    <ul v-if="local.length" ref="listEl" class="list">
      <li v-for="t in local" :key="t.id" class="row" :data-id="t.id">
        <button type="button" class="handle" aria-label="Перетащить">
          ≡
        </button>
        <div class="meta">
          <span class="name">{{ t.name }}</span>
          <span class="sub mono"
            >{{ t.symbol }} · {{ trackerTypeLabel(t.type) }}</span
          >
        </div>
      </li>
    </ul>
    <p v-else class="empty">Нет трекеров</p>
  </BottomSheet>
</template>

<style scoped>
.hint {
  margin: 0 0 12px;
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
}

.empty {
  margin: 24px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 8px;
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
}

.handle {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  touch-action: none;
}

.meta {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-size: var(--type-body);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub {
  font-size: var(--type-helper);
  color: var(--color-text-secondary);
}

.row-ghost {
  opacity: 0.35;
}

.row-chosen {
  background: var(--color-surface-3);
}

.row-fallback {
  opacity: 0.95;
  box-shadow: 0 8px 24px rgb(0 0 0 / 35%);
}
</style>
