<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import ConfirmDeleteSheet from "@/components/habits/ConfirmDeleteSheet.vue";
import EntrySheetShell from "@/components/habits/EntrySheetShell.vue";
import {
  deleteEntryById,
  getEntry,
  NOTE_TEXT_MAX,
  normalizeNoteText,
  upsertEntry,
  type Tracker,
} from "@/db";

const PERSIST_MS = 400;

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
/** Normalized text last written (or loaded). Equal means no write. */
const savedText = ref("");
const field = ref<HTMLTextAreaElement | null>(null);
const showDelete = ref(false);
const isEdit = computed(() => entryId.value != null);

let timer: number | undefined;
let chain: Promise<void> = Promise.resolve();
/** Explicit delete: do not write the field again on close or unmount. */
let suppress = false;
let closing = false;

onMounted(async () => {
  const e = await getEntry(props.tracker.id, props.date);
  if (e?.value.kind === "note") {
    entryId.value = e.id;
    savedText.value = normalizeNoteText(e.value.text);
    if (!text.value) text.value = e.value.text;
  }
  await nextTick();
  field.value?.focus();
});

onUnmounted(() => {
  window.clearTimeout(timer);
  if (!suppress && !closing) void persist();
});

function schedule() {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    void persist();
  }, PERSIST_MS);
}

function onInput(value: string) {
  text.value = value.slice(0, NOTE_TEXT_MAX);
  schedule();
}

async function persist() {
  window.clearTimeout(timer);
  timer = undefined;
  const run = async () => {
    while (!suppress) {
      const next = normalizeNoteText(text.value);
      if (next === savedText.value) return;
      if (!next) {
        if (entryId.value) await deleteEntryById(entryId.value);
        if (suppress) return;
        entryId.value = null;
        savedText.value = "";
        continue;
      }
      const entry = await upsertEntry(props.tracker.id, props.date, {
        kind: "note",
        text: next,
      });
      entryId.value = entry.id;
      savedText.value = next;
    }
  };
  chain = chain.then(run, run);
  await chain;
}

async function onClose() {
  if (closing) return;
  closing = true;
  try {
    await persist();
  } finally {
    emit("close");
  }
}

async function onDelete() {
  if (closing) return;
  closing = true;
  suppress = true;
  window.clearTimeout(timer);
  const run = async () => {
    if (entryId.value) await deleteEntryById(entryId.value);
    entryId.value = null;
    savedText.value = "";
    text.value = "";
  };
  chain = chain.then(run, run);
  await chain;
  emit("saved");
  emit("close");
}
</script>

<template>
  <EntrySheetShell
    :date="date"
    :habit-name="tracker.name"
    size="tall"
    @close="onClose"
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

    <template v-if="isEdit" #footer>
      <button type="button" class="delete" @click="showDelete = true">
        УДАЛИТЬ ЗАПИСЬ
      </button>
    </template>
  </EntrySheetShell>

  <ConfirmDeleteSheet
    v-if="showDelete"
    title="Удалить запись?"
    body="Текст за этот день будет удалён. Это нельзя отменить."
    confirm-label="УДАЛИТЬ"
    @close="showDelete = false"
    @confirm="onDelete"
  />
</template>

<style scoped>
.note-input {
  display: block;
  width: 100%;
  flex: 1 1 0;
  height: 100%;
  min-height: 0;
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

.delete {
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-danger-solid);
  color: #fff;
  font-family: var(--font-mono);
  font-size: var(--type-cta);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.delete:active {
  opacity: 0.88;
}
</style>
