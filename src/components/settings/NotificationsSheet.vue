<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ReminderEditSheet from '@/components/settings/ReminderEditSheet.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { listReminders, type Reminder } from '@/db'
import {
  createReminder,
  formatReminderDays,
  REMINDER_MAX_COUNT,
} from '@/lib/reminders'
import {
  disablePush,
  enablePush,
  persistReminders,
  pushAvailability,
  sendTestPush,
  type PushAvailability,
} from '@/lib/pushClient'

defineEmits<{
  close: []
}>()

const reminders = ref<Reminder[]>([])
const editingId = ref<string | null>(null)
const availability = ref<PushAvailability>('needs-permission')
const busy = ref(false)
const toast = ref<string | null>(null)
let toastTimer: number | undefined

const editing = computed(
  () => reminders.value.find((item) => item.id === editingId.value) ?? null,
)

const statusText = computed(() => {
  switch (availability.value) {
    case 'needs-install':
      return 'На iPhone уведомления приходят, только если открыть LifeOS с иконки на экране Домой.'
    case 'denied':
      return 'Разрешение выключено в настройках системы.'
    case 'unsupported':
      return 'Этот браузер не умеет уведомления.'
    case 'unconfigured':
      return 'Сервер уведомлений ещё не подключён к этой сборке.'
    case 'ready':
      return 'Включены на этом устройстве. Телефон должен быть в сети.'
    default:
      return 'Текст, время и дни. Приходит, даже если LifeOS закрыт.'
  }
})

onMounted(async () => {
  reminders.value = await listReminders()
  availability.value = pushAvailability()
})

function flash(message: string) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = null
  }, 2200)
}

async function refreshAvailability() {
  availability.value = pushAvailability()
}

async function onAllow() {
  if (busy.value) return
  busy.value = true
  try {
    availability.value = await enablePush()
    if (availability.value === 'ready') flash('Уведомления включены')
    else if (availability.value === 'denied') flash('Разрешение не выдано')
  } catch {
    flash('Не удалось включить')
  } finally {
    busy.value = false
  }
}

async function onDisable() {
  if (busy.value) return
  busy.value = true
  try {
    await disablePush()
    await refreshAvailability()
    flash('Уведомления выключены')
  } catch {
    flash('Не удалось выключить')
  } finally {
    busy.value = false
  }
}

async function onTest() {
  if (busy.value) return
  busy.value = true
  try {
    await sendTestPush()
    flash('Пробное отправлено')
  } catch {
    flash('Не удалось отправить')
  } finally {
    busy.value = false
  }
}

async function onAdd() {
  if (reminders.value.length >= REMINDER_MAX_COUNT) return
  const next = createReminder()
  reminders.value = await persistReminders([...reminders.value, next])
  editingId.value = next.id
}

async function onUpdate(reminder: Reminder) {
  reminders.value = await persistReminders(
    reminders.value.map((item) => (item.id === reminder.id ? reminder : item)),
  )
}

async function onDelete() {
  const id = editingId.value
  editingId.value = null
  if (!id) return
  reminders.value = await persistReminders(
    reminders.value.filter((item) => item.id !== id),
  )
}

function rowTitle(reminder: Reminder): string {
  return reminder.text.trim() || 'Без текста'
}

function rowMeta(reminder: Reminder): string {
  if (!reminder.enabled) return 'выкл'
  return `${reminder.time} · ${formatReminderDays(reminder.days)}`
}
</script>

<template>
  <BottomSheet size="tall" title="Уведомления" :layer="50" @close="$emit('close')">
    <p class="helper lead">{{ statusText }}</p>

    <section v-if="availability === 'needs-permission'" class="page-group">
      <button type="button" class="page-row" :disabled="busy" @click="onAllow">
        Разрешить уведомления
      </button>
    </section>

    <section v-else-if="availability === 'ready'" class="page-group">
      <button type="button" class="page-row" :disabled="busy" @click="onTest">
        Прислать пробное
      </button>
      <button type="button" class="page-row" :disabled="busy" @click="onDisable">
        Выключить на этом устройстве
      </button>
    </section>

    <section class="page-group" :class="{ block: availability === 'needs-permission' || availability === 'ready' }">
      <button
        v-for="reminder in reminders"
        :key="reminder.id"
        type="button"
        class="page-row item"
        :class="{ off: !reminder.enabled }"
        @click="editingId = reminder.id"
      >
        <span class="stack">
          <span class="name">{{ rowTitle(reminder) }}</span>
          <span class="meta mono">{{ rowMeta(reminder) }}</span>
        </span>
      </button>
      <button
        v-if="reminders.length < REMINDER_MAX_COUNT"
        type="button"
        class="page-row"
        @click="onAdd"
      >
        Добавить
      </button>
    </section>

    <p v-if="toast" class="toast">{{ toast }}</p>
  </BottomSheet>

  <ReminderEditSheet
    v-if="editing"
    :reminder="editing"
    @close="editingId = null"
    @update="onUpdate"
    @delete="onDelete"
  />
</template>

<style scoped>
.lead {
  margin: 0 4px 16px;
}

.block {
  margin-top: 12px;
}

.item {
  align-items: flex-start;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  color: var(--color-text-secondary);
  font-size: var(--type-helper);
}

.off {
  opacity: 0.55;
}

.page-row:disabled {
  opacity: 0.45;
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
  z-index: 70;
  white-space: nowrap;
  max-width: calc(100vw - 32px);
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
