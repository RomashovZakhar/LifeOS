<script setup lang="ts">
import { markRaw, ref, shallowRef } from "vue";
import ConfirmDeleteSheet from "@/components/habits/ConfirmDeleteSheet.vue";
import AppearanceSheet from "@/components/settings/AppearanceSheet.vue";
import TrackersOrderSheet from "@/components/settings/TrackersOrderSheet.vue";
import BottomSheet from "@/components/ui/BottomSheet.vue";
import {
  downloadExportJson,
  ImportError,
  parseExportFile,
  replaceFromExport,
  type LifeOsExport,
} from "@/db";

defineProps<{
  /** Nested panel: root list, or child sheet open. */
  panel: "root" | "appearance" | "trackers";
}>();

const emit = defineEmits<{
  close: [];
  navigate: [panel: "root" | "appearance" | "trackers"];
}>();

const toast = ref<string | null>(null);
let toastTimer: number | undefined;

const fileInput = ref<HTMLInputElement | null>(null);
const pendingImport = shallowRef<LifeOsExport | null>(null);
const importing = ref(false);

async function onExport() {
  try {
    await downloadExportJson();
    flash("Файл готов");
  } catch {
    flash("Не удалось экспортировать");
  }
}

function onImportTap() {
  fileInput.value?.click();
}

async function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  try {
    pendingImport.value = markRaw(await parseExportFile(file));
  } catch (e) {
    const msg =
      e instanceof ImportError ? e.message : "Не удалось прочитать файл";
    flash(msg);
  }
}

async function onImportConfirm() {
  const doc = pendingImport.value;
  pendingImport.value = null;
  if (!doc || importing.value) return;
  importing.value = true;
  try {
    await replaceFromExport(doc);
    flash("Данные импортированы");
  } catch {
    flash("Не удалось импортировать");
  } finally {
    importing.value = false;
  }
}

function flash(msg: string) {
  toast.value = msg;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value = null;
  }, 2200);
}
</script>

<template>
  <BottomSheet size="tall" title="Настройки" :layer="40" @close="emit('close')">
    <section class="page-group">
      <button
        type="button"
        class="page-row between"
        @click="emit('navigate', 'trackers')"
      >
        <span>Трекеры</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
      <button
        type="button"
        class="page-row between"
        @click="emit('navigate', 'appearance')"
      >
        <span>Оформление</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
    </section>

    <section class="page-group block">
      <button type="button" class="page-row" @click="onExport">
        Экспорт данных
      </button>
      <button
        type="button"
        class="page-row"
        :disabled="importing"
        @click="onImportTap"
      >
        Импорт данных
      </button>
    </section>

    <input
      ref="fileInput"
      class="file"
      type="file"
      accept="application/json,.json"
      @change="onFileChange"
    />

    <p v-if="toast" class="toast">{{ toast }}</p>
  </BottomSheet>

  <AppearanceSheet
    v-if="panel === 'appearance'"
    @close="emit('navigate', 'root')"
  />
  <TrackersOrderSheet
    v-if="panel === 'trackers'"
    @close="emit('navigate', 'root')"
  />

  <ConfirmDeleteSheet
    v-if="pendingImport"
    title="Импортировать данные?"
    body="Текущие данные на этом устройстве будут полностью заменены содержимым файла. Это нельзя отменить."
    confirm-label="ИМПОРТИРОВАТЬ"
    @close="pendingImport = null"
    @confirm="onImportConfirm"
  />
</template>

<style scoped>
.between {
  justify-content: space-between;
}

.block {
  margin-top: 12px;
}

.chev {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  line-height: 1;
}

.file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
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
  z-index: 60;
  white-space: nowrap;
  max-width: calc(100vw - 32px);
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
