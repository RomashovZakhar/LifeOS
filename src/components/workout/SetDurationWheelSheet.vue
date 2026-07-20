<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { formatDurationMinSec } from '@/lib/workoutFormat'

const props = defineProps<{
  durationSeconds: number
}>()

const emit = defineEmits<{
  close: []
  save: [seconds: number]
}>()

const MAX_MIN = 180
const minutes = Array.from({ length: MAX_MIN + 1 }, (_, i) => i)
const seconds = Array.from({ length: 60 }, (_, i) => i)

const minute = ref(0)
const second = ref(0)
const minuteList = ref<HTMLElement | null>(null)
const secondList = ref<HTMLElement | null>(null)
const ITEM = 40

function applyFromProps(total: number) {
  const sec = Math.max(0, Math.floor(total))
  minute.value = Math.min(MAX_MIN, Math.floor(sec / 60))
  second.value = sec % 60
}

watch(
  () => props.durationSeconds,
  (s) => applyFromProps(s),
  { immediate: true },
)

onMounted(async () => {
  await nextTick()
  scrollToValue(minuteList.value, minute.value)
  scrollToValue(secondList.value, second.value)
})

function scrollToValue(el: HTMLElement | null, value: number) {
  if (!el) return
  el.scrollTop = value * ITEM
}

function onMinuteScroll() {
  if (!minuteList.value) return
  minute.value = Math.min(
    MAX_MIN,
    Math.max(0, Math.round(minuteList.value.scrollTop / ITEM)),
  )
}

function onSecondScroll() {
  if (!secondList.value) return
  second.value = Math.min(
    59,
    Math.max(0, Math.round(secondList.value.scrollTop / ITEM)),
  )
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function onSave() {
  emit('save', minute.value * 60 + second.value)
  emit('close')
}
</script>

<template>
  <BottomSheet
    size="auto"
    title="Время подхода"
    :layer="70"
    @close="emit('close')"
  >
    <p class="preview mono">{{ formatDurationMinSec(minute * 60 + second) }}</p>
    <div class="wheel-wrap">
      <div class="wheel">
        <div class="highlight" aria-hidden="true" />
        <div
          ref="minuteList"
          class="col mins"
          @scroll.passive="onMinuteScroll"
        >
          <div class="pad" />
          <div v-for="m in minutes" :key="m" class="item">{{ pad(m) }}</div>
          <div class="pad" />
        </div>
        <div
          ref="secondList"
          class="col secs"
          @scroll.passive="onSecondScroll"
        >
          <div class="pad" />
          <div v-for="s in seconds" :key="s" class="item">{{ pad(s) }}</div>
          <div class="pad" />
        </div>
      </div>
      <div class="labels" aria-hidden="true">
        <span>мин</span>
        <span>сек</span>
      </div>
    </div>
    <template #footer>
      <button type="button" class="save" @click="onSave">СОХРАНИТЬ</button>
    </template>
  </BottomSheet>
</template>

<style scoped>
.preview {
  margin: 0 0 12px;
  text-align: center;
  font-size: 1.75rem;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.wheel-wrap {
  border-radius: 16px;
  background: var(--color-surface-3);
  padding: 8px 0 4px;
}

.wheel {
  position: relative;
  display: flex;
  height: 200px;
  overflow: hidden;
}

.highlight {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 50%;
  height: 40px;
  margin-top: -20px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-text-secondary) 18%, transparent);
  pointer-events: none;
  z-index: 0;
}

.col {
  flex: 1;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  position: relative;
  z-index: 1;
  scrollbar-width: none;
}

.col::-webkit-scrollbar {
  display: none;
}

.col.mins .item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 28px;
  box-sizing: border-box;
}

.col.secs .item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 28px;
  box-sizing: border-box;
}

.item {
  height: 40px;
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  scroll-snap-align: center;
}

.pad {
  height: 80px;
}

.labels {
  display: flex;
  justify-content: space-around;
  padding: 4px 0 8px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.save {
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
  font-size: var(--type-cta);
  font-weight: 700;
  letter-spacing: 0.04em;
}
</style>
