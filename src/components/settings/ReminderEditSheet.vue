<script setup lang="ts">
import { ref, watch } from 'vue'
import ReminderTimeSheet from '@/components/settings/ReminderTimeSheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import type { Reminder } from '@/db'
import {
  REMINDER_TEXT_MAX,
  WEEKDAY_ORDER,
} from '@/lib/reminders'

const props = defineProps<{
  reminder: Reminder
}>()

const emit = defineEmits<{
  close: []
  update: [reminder: Reminder]
  delete: []
}>()

const text = ref(props.reminder.text)
const time = ref(props.reminder.time)
const days = ref<number[]>([...props.reminder.days])
const enabled = ref(props.reminder.enabled)
const timeOpen = ref(false)

const dayLabel = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

watch(
  () => props.reminder.id,
  () => {
    text.value = props.reminder.text
    time.value = props.reminder.time
    days.value = [...props.reminder.days]
    enabled.value = props.reminder.enabled
  },
)

function publish() {
  const nextTime = padTime(time.value)
  if (!nextTime) return
  emit('update', {
    ...props.reminder,
    text: text.value,
    time: nextTime,
    days: [...days.value],
    enabled: enabled.value,
  })
}

function padTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return ''
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return ''
  return `${String(hour).padStart(2, '0')}:${match[2]}`
}

function onTimeSave(next: string) {
  time.value = next
  publish()
}

function toggleDay(day: number) {
  const set = new Set(days.value)
  if (set.has(day)) set.delete(day)
  else set.add(day)
  days.value = [...set]
  publish()
}
</script>

<template>
  <BottomSheet size="auto" title="Напоминание" :layer="60" @close="emit('close')">
    <section class="page-group">
      <label class="page-row field">
        <span class="label">Текст</span>
        <input
          v-model="text"
          class="text"
          type="text"
          placeholder="Что напомнить"
          :maxlength="REMINDER_TEXT_MAX"
          @input="publish"
        />
      </label>
      <button type="button" class="page-row between" @click="timeOpen = true">
        <span class="label">Время</span>
        <span class="time mono">{{ time }}</span>
      </button>
      <label class="page-row between">
        <span>Включено</span>
        <input v-model="enabled" class="toggle" type="checkbox" @change="publish" />
      </label>
    </section>

    <div class="days" role="group" aria-label="Дни">
      <button
        v-for="day in WEEKDAY_ORDER"
        :key="day"
        type="button"
        class="day"
        :class="{ on: days.includes(day) }"
        :aria-pressed="days.includes(day)"
        @click="toggleDay(day)"
      >
        {{ dayLabel[day] }}
      </button>
    </div>

    <section class="page-group block">
      <button type="button" class="page-row danger" @click="emit('delete')">
        Удалить
      </button>
    </section>
  </BottomSheet>

  <ReminderTimeSheet
    v-if="timeOpen"
    :time="time"
    @close="timeOpen = false"
    @save="onTimeSave"
  />
</template>

<style scoped>
.between {
  justify-content: space-between;
}

.block {
  margin-top: 12px;
}

.field {
  gap: 16px;
}

.label {
  flex: 0 0 auto;
}

.text {
  flex: 1 1 auto;
  min-width: 0;
  background: transparent;
  border: 0;
  text-align: right;
  color: inherit;
}

.text::placeholder {
  color: var(--color-text-secondary);
}

.time {
  margin-left: auto;
}

.days {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.day {
  flex: 1 1 0;
  min-height: 40px;
  border-radius: 12px;
  background: var(--color-surface-3);
  color: var(--color-text-secondary);
  font-size: var(--type-caption);
}

.day.on {
  color: var(--color-text-primary);
  box-shadow: inset 0 0 0 1.5px var(--color-border-selected);
}

.toggle {
  flex: 0 0 48px;
  width: 48px;
  height: 30px;
  appearance: none;
  border-radius: 999px;
  background: var(--color-surface-2);
  position: relative;
  cursor: pointer;
}

.toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.18s ease;
}

.toggle:checked {
  background: var(--color-accent);
}

.toggle:checked::after {
  transform: translateX(18px);
}

.danger {
  color: var(--color-danger-fg);
}
</style>
