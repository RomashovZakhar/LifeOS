<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'

const props = defineProps<{
  time: string
}>()

const emit = defineEmits<{
  close: []
  save: [time: string]
}>()

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 }, (_, i) => i)

const hour = ref(9)
const minute = ref(0)
const hourList = ref<HTMLElement | null>(null)
const minuteList = ref<HTMLElement | null>(null)
const ITEM = 40

function pad(n: number) {
  return String(n).padStart(2, '0')
}

onMounted(async () => {
  const match = /^(\d{2}):(\d{2})$/.exec(props.time)
  if (match) {
    hour.value = Number(match[1])
    minute.value = Number(match[2])
  }
  await nextTick()
  scrollToValue(hourList.value, hour.value)
  scrollToValue(minuteList.value, minute.value)
})

function scrollToValue(el: HTMLElement | null, value: number) {
  if (!el) return
  el.scrollTop = value * ITEM
}

function onHourScroll() {
  if (!hourList.value) return
  hour.value = Math.min(23, Math.max(0, Math.round(hourList.value.scrollTop / ITEM)))
}

function onMinuteScroll() {
  if (!minuteList.value) return
  minute.value = Math.min(59, Math.max(0, Math.round(minuteList.value.scrollTop / ITEM)))
}

function onSave() {
  emit('save', `${pad(hour.value)}:${pad(minute.value)}`)
  emit('close')
}
</script>

<template>
  <BottomSheet size="auto" title="Время" :layer="70" @close="emit('close')">
    <div class="wheel-wrap">
      <div class="wheel">
        <div class="highlight" aria-hidden="true" />
        <div ref="hourList" class="col hours" @scroll.passive="onHourScroll">
          <div class="pad" />
          <div v-for="h in hours" :key="h" class="item">{{ pad(h) }}</div>
          <div class="pad" />
        </div>
        <div ref="minuteList" class="col minutes" @scroll.passive="onMinuteScroll">
          <div class="pad" />
          <div v-for="m in minutes" :key="m" class="item">{{ pad(m) }}</div>
          <div class="pad" />
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" class="save" @click="onSave">СОХРАНИТЬ</button>
    </template>
  </BottomSheet>
</template>

<style scoped>
.wheel-wrap {
  border-radius: 16px;
  background: var(--color-surface-3);
  padding: 8px 0;
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

.col.hours .item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 24px;
  box-sizing: border-box;
}

.col.minutes .item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 24px;
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
