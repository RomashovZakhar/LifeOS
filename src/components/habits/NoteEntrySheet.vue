<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import EntrySheetShell from "@/components/habits/EntrySheetShell.vue";
import {
  deleteEntryById,
  getEntry,
  NOTE_TEXT_MAX,
  normalizeNoteText,
  upsertEntry,
  type Tracker,
} from "@/db";

const props = defineProps<{
  tracker: Tracker;
  date: string;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const text = ref("");
const entryId = ref<string | null>(null);
const field = ref<HTMLTextAreaElement | null>(null);
const isEdit = computed(() => entryId.value != null);
const canSave = computed(() => normalizeNoteText(text.value).length > 0);

onMounted(async () => {
  const e = await getEntry(props.tracker.id, props.date);
  if (e?.value.kind === "note") {
    text.value = e.value.text;
    entryId.value = e.id;
  }
  await nextTick();
  field.value?.focus();
});

function onInput(value: string) {
  text.value = value.slice(0, NOTE_TEXT_MAX);
}

async function onSave() {
  const next = normalizeNoteText(text.value);
  if (!next) return;
  await upsertEntry(props.tracker.id, props.date, {
    kind: "note",
    text: next,
  });
  emit("saved");
  emit("close");
}

async function onDelete() {
  if (entryId.value) await deleteEntryById(entryId.value);
  emit("saved");
  emit("close");
}
</script>

<template>
  <EntrySheetShell
    :date="date"
    :habit-name="tracker.name"
    size="tall"
    @close="emit('close')"
  >
    <textarea
      ref="field"
      class="note-input"
      :value="text"
      :maxlength="NOTE_TEXT_MAX"
      placeholder="Текст за день"
      enterkeyhint="enter"
      autocomplete="off"
      autocorrect="on"
      autocapitalize="sentences"
      spellcheck="true"
      @input="onInput(($event.target as HTMLTextAreaElement).value)"
    />

    <template #footer>
      <div class="actions">
        <button
          v-if="isEdit"
          type="button"
          class="trash"
          aria-label="Удалить запись"
          @click="onDelete"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 7H19M10 7V5H14V7M9 7V19H15V7"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="primary"
          :disabled="!canSave"
          @click="onSave"
        >
          {{ isEdit ? "ОБНОВИТЬ" : "ОТСЛЕДИТЬ" }}
        </button>
      </div>
    </template>
  </EntrySheetShell>
</template>

<style scoped>
.note-input {
  display: block;
  width: 100%;
  min-height: 240px;
  height: calc(90dvh - 240px);
  overflow-y: auto;
  resize: none;
  border: 0;
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: 1.0625rem;
  font-weight: 400;
  line-height: 1.4;
  caret-color: var(--color-accent);
  outline: none;
}

.note-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.85;
}

.note-input:focus {
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--color-text-secondary) 35%, transparent);
}

.actions {
  display: flex;
  gap: 10px;
}

.primary {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
  font-family: var(--font-mono);
  font-size: var(--type-cta);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.primary:not(:disabled):active {
  opacity: 0.88;
}

.trash {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-fg);
}
</style>
