<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { todayDate } from '@/db/dates'
import { buildHeatmapColumns } from '@/lib/detailRange'

const props = defineProps<{
  filledDates: Set<string>
  today?: string
}>()

defineEmits<{
  selectDate: [date: string]
}>()

const CELL = 14
const GAP = 4
const MIN_WEEKS = 12

const rootEl = ref<HTMLElement | null>(null)
const weekCount = ref(17)

function fitWeeks(width: number) {
  // n*CELL + (n-1)*GAP <= width  →  n <= (width + GAP) / (CELL + GAP)
  const n = Math.floor((width + GAP) / (CELL + GAP))
  weekCount.value = Math.max(MIN_WEEKS, n)
}

let ro: ResizeObserver | undefined

onMounted(() => {
  if (!rootEl.value) return
  fitWeeks(rootEl.value.clientWidth)
  ro = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width
    if (w != null) fitWeeks(w)
  })
  ro.observe(rootEl.value)
})

onUnmounted(() => {
  ro?.disconnect()
})

const columns = computed(() =>
  buildHeatmapColumns(
    props.filledDates,
    props.today ?? todayDate(),
    weekCount.value,
  ),
)
</script>

<template>
  <div ref="rootEl" class="heatmap">
    <div class="grid">
      <div v-for="(col, wi) in columns" :key="wi" class="week">
        <button
          v-for="cell in col.cells"
          :key="cell.date"
          type="button"
          class="cell"
          :class="{
            filled: cell.filled,
            muted: !cell.inRange,
          }"
          :disabled="!cell.inRange"
          :aria-label="cell.date"
          @click="$emit('selectDate', cell.date)"
        />
      </div>
    </div>
    <div class="months">
      <div v-for="(col, wi) in columns" :key="`m-${wi}`" class="month-slot">
        <span v-if="col.monthLabel" class="month">{{ col.monthLabel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap {
  width: 100%;
  padding-bottom: 2px;
}

.grid,
.months {
  display: flex;
  gap: 4px;
  width: 100%;
}

.week,
.month-slot {
  flex: 0 0 14px;
  width: 14px;
}

.week {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: var(--color-heatmap-empty);
  padding: 0;
}

.cell.filled {
  background: var(--color-heatmap-filled);
}

.cell.muted {
  opacity: 0.35;
}

.cell:not(:disabled):active {
  opacity: 0.7;
}

.months {
  position: relative;
  margin-top: 8px;
  min-height: 16px;
}

.month-slot {
  overflow: visible;
  position: relative;
}

.month {
  position: absolute;
  left: 0;
  top: 0;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
</style>
